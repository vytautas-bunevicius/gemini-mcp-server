#!/usr/bin/env node

/**
 * Gemini MCP Server
 * A Model Context Protocol server for interacting with Google's Gemini AI models
 * 
 * This server implements the MCP specification to provide a standardized interface
 * for LLM clients like Claude to interact with Gemini models.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Check for API key
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Error: GEMINI_API_KEY environment variable is required");
  process.exit(1);
}

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Define the available Gemini models
 */
const GeminiModels = z.enum([
  // Gemini 2.0 models
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash-thinking-exp-01-21",
  "gemini-2.0-flash-exp-image-generation",
  // Gemini 2.5 models
  "gemini-2.5-pro-exp-03-25",
]);

/**
 * Create the MCP server instance
 */
const server = new McpServer({
  name: "gemini",
  version: "1.0.0",
  description: "MCP server for interacting with Google's Gemini AI models",
  capabilities: {
    resources: {},
    tools: {},
  },
});

/**
 * Helper class for interacting with Gemini API
 * This provides a clean abstraction over the Gemini API
 */
class GeminiAPI {
  private models: Map<string, GenerativeModel> = new Map();

  /**
   * Get or create a GenerativeModel instance
   */
  private getModel(modelName: string): GenerativeModel {
    if (!this.models.has(modelName)) {
      this.models.set(modelName, genAI.getGenerativeModel({ model: modelName }));
    }
    return this.models.get(modelName)!;
  }

  /**
   * Generate content from a Gemini model
   */
  async generateContent(
    modelName: string,
    prompt: string,
    options: any = {}
  ): Promise<string> {
    try {
      // Implement exponential backoff for API requests
      let retries = 0;
      const maxRetries = 3;
      const baseDelay = 1000; // 1 second

      while (retries < maxRetries) {
        try {
          const model = this.getModel(modelName);
          const safetySettings = options.safetySettings || undefined;
          const generationConfig = {
            temperature: options.temperature,
            maxOutputTokens: options.maxOutputTokens,
            topK: options.topK,
            topP: options.topP,
          };

          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig,
            safetySettings,
          });

          return result.response.text();
        } catch (error: any) {
          // Only retry on 429 (rate limit) or 5xx (server error) status codes
          if (error.status === 429 || (error.status >= 500 && error.status < 600)) {
            retries++;
            if (retries < maxRetries) {
              // Exponential backoff with jitter
              const delay = baseDelay * Math.pow(2, retries) * (0.5 + Math.random() * 0.5);
              console.error(`Retrying after ${delay}ms (attempt ${retries}/${maxRetries})...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          }
          throw error;
        }
      }
      throw new Error("Maximum retries exceeded");
    } catch (error: any) {
      console.error("Error generating content:", error);
      throw new Error(`Failed to get response from Gemini: ${error.message || JSON.stringify(error)}`);
    }
  }

  /**
   * Create and use a chat session
   */
  async chatWithHistory(
    modelName: string,
    history: any[],
    message: string,
    options: any = {}
  ): Promise<string> {
    try {
      const model = this.getModel(modelName);

      // Convert history to Gemini API format
      const formattedHistory = history.map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      }));

      // Add the new message
      const contents = [
        ...formattedHistory,
        { role: "user", parts: [{ text: message }] }
      ];

      // Generation config
      const generationConfig = {
        temperature: options.temperature,
        maxOutputTokens: options.maxOutputTokens,
        topK: options.topK,
        topP: options.topP,
      };

      const result = await model.generateContent({
        contents,
        generationConfig,
      });

      return result.response.text();
    } catch (error: any) {
      console.error("Error in chat session:", error);
      throw new Error(`Failed to chat with Gemini: ${error.message || JSON.stringify(error)}`);
    }
  }

  /**
   * Call a function using Gemini's function calling capability
   */
  async callFunction(
    modelName: string,
    prompt: string,
    functionDefs: any[],
    options: any = {}
  ): Promise<any> {
    try {
      const model = this.getModel(modelName);

      // Check if model supports function calling
      // Note: This is only available in newer Gemini models
      if (!model.startChat) {
        throw new Error(`Model ${modelName} doesn't support function calling`);
      }

      const chat = model.startChat({
        generationConfig: {
          temperature: options.temperature,
          maxOutputTokens: options.maxOutputTokens,
        },
        tools: [{ functionDeclarations: functionDefs }],
      });

      const result = await chat.sendMessage(prompt);
      const functionCall = result.response.functionCall();

      if (functionCall) {
        return {
          functionName: functionCall.name,
          functionArgs: typeof functionCall.args === 'string'
            ? JSON.parse(functionCall.args)
            : functionCall.args,
        };
      }

      return { text: result.response.text() };
    } catch (error: any) {
      console.error("Error calling function:", error);
      throw new Error(`Failed to call function with Gemini: ${error.message || JSON.stringify(error)}`);
    }
  }
}

// Create an instance of the GeminiAPI helper
const geminiAPI = new GeminiAPI();

/**
 * Register the ask_gemini tool
 */
server.tool(
  "ask_gemini",
  "Ask a question to Google's Gemini AI model and get a response",
  {
    model: GeminiModels.describe("The Gemini model to use"),
    query: z.string().describe("The question or prompt to send to Gemini"),
    temperature: z.number().optional().describe("Controls randomness (0-1)"),
    maxOutputTokens: z.number().optional().describe("Maximum tokens to generate"),
    topK: z.number().optional().describe("Optional. The number of most likely tokens to consider for generation."),
    topP: z.number().optional().describe("Optional. The cumulative probability of tokens to consider for generation."),
  },
  async ({ model, query, temperature, maxOutputTokens, topK, topP }) => {
    const options: any = {};

    if (temperature !== undefined) {
      options.temperature = temperature;
    }

    if (maxOutputTokens !== undefined) {
      options.maxOutputTokens = maxOutputTokens;
    }

    if (topK !== undefined) {
      options.topK = topK;
    }

    if (topP !== undefined) {
      options.topP = topP;
    }

    try {
      const response = await geminiAPI.generateContent(model, query, options);

      return {
        content: [
          {
            type: "text",
            text: response,
          },
        ],
      };
    } catch (error: any) {
      console.error("Error in ask_gemini tool:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message || "Unknown error"}`,
          },
        ],
      };
    }
  }
);

/**
 * Define the conversation message schema
 */
const conversationMessageSchema = z.object({
  role: z.enum(["user", "model"]),
  content: z.string(),
});

/**
 * Register the chat_with_gemini tool
 */
server.tool(
  "chat_with_gemini",
  "Have a multi-turn conversation with Google's Gemini AI",
  {
    model: GeminiModels.describe("The Gemini model to use"),
    conversation: z.array(conversationMessageSchema).describe("Previous conversation history"),
    message: z.string().describe("New message to add to the conversation"),
    temperature: z.number().optional().describe("Controls randomness (0-1)"),
    maxOutputTokens: z.number().optional().describe("Maximum tokens to generate"),
  },
  async ({ model, conversation, message, temperature, maxOutputTokens }) => {
    const options: any = {};

    if (temperature !== undefined) {
      options.temperature = temperature;
    }

    if (maxOutputTokens !== undefined) {
      options.maxOutputTokens = maxOutputTokens;
    }

    try {
      const response = await geminiAPI.chatWithHistory(model, conversation, message, options);

      return {
        content: [
          {
            type: "text",
            text: response,
          },
        ],
      };
    } catch (error: any) {
      console.error("Error in chat_with_gemini tool:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message || "Unknown error"}`,
          },
        ],
      };
    }
  }
);

/**
 * Register the gemini_function_call tool
 * This is for newer Gemini models that support function calling
 */
server.tool(
  "gemini_function_call",
  "Call a function using Gemini's function calling capability",
  {
    model: GeminiModels.describe("The Gemini model to use"),
    prompt: z.string().describe("The prompt to send to Gemini"),
    functions: z.array(z.any()).describe("Function definitions"),
    temperature: z.number().optional().describe("Controls randomness (0-1)"),
    maxOutputTokens: z.number().optional().describe("Maximum tokens to generate"),
  },
  async ({ model, prompt, functions, temperature, maxOutputTokens }) => {
    const options: any = {};

    if (temperature !== undefined) {
      options.temperature = temperature;
    }

    if (maxOutputTokens !== undefined) {
      options.maxOutputTokens = maxOutputTokens;
    }

    try {
      const response = await geminiAPI.callFunction(model, prompt, functions, options);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response),
          },
        ],
      };
    } catch (error: any) {
      console.error("Error in gemini_function_call tool:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message || "Unknown error"}`,
          },
        ],
      };
    }
  }
);

/**
 * Define a resource for Gemini model information
 */
server.resource(
  "gemini_models",
  "gemini_models_resource",
  async () => {
    const models = [
      {
        id: "gemini-2.5-pro-exp-03-25",
        name: "Gemini 2.5 Pro",
        description: "Advanced multimodal model with strong reasoning capabilities",
        features: ["Text", "Images", "Function calling"],
        contextWindow: 1000000,
      },
      {
        id: "gemini-2.0-flash",
        name: "Gemini 2.0 Flash",
        description: "Efficient general-purpose model",
        features: ["Text"],
        contextWindow: 32000,
      },
      {
        id: "gemini-2.0-flash-lite",
        name: "Gemini 2.0 Flash Lite",
        description: "Lightweight version of Gemini 2.0 Flash",
        features: ["Text"],
        contextWindow: 16000,
      },
    ];

    return {
      contents: [
        {
          uri: "models.json",
          text: JSON.stringify(models, null, 2),
        },
      ],
    };
  }
);

/**
 * Start the MCP server
 * Support stdio transport for local connections
 */
async function main() {
  try {
    // Start with stdio transport for local connections
    const stdioTransport = new StdioServerTransport();
    await server.connect(stdioTransport);
    console.error("Gemini MCP Server running on stdio");
  } catch (error: any) {
    console.error("Error starting server:", error.message || error);
    process.exit(1);
  }
}

// Start the server
main().catch((error: any) => {
  console.error("Fatal error in main():", error.message || error);
  process.exit(1);
});
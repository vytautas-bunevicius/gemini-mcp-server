#!/usr/bin/env node
/**
 * Gemini MCP Server implementation
 * This server provides tools to interact with Google's Gemini AI models
 * following the Model Context Protocol
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
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
// Create server instance
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
 * Helper functions for interacting with Gemini API
 */
/**
 * Generate content from a Gemini model
 */
async function generateGeminiContent(modelName, prompt, options = {}) {
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        return result.response.text();
    }
    catch (error) {
        console.error("Error generating content:", error);
        throw new Error(`Failed to get response from Gemini: ${error.message || error}`);
    }
}
/**
 * Generate content with a chat history
 */
async function chatWithGemini(modelName, history, message, options = {}) {
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const chat = model.startChat({ history });
        const result = await chat.sendMessage(message);
        return result.response.text();
    }
    catch (error) {
        console.error("Error in chat session:", error);
        throw new Error(`Failed to chat with Gemini: ${error.message || error}`);
    }
}
// Register the ask_gemini tool
server.tool("ask_gemini", "Ask a question to Google's Gemini AI model and get a response", {
    model: z.enum([
        // Gemini 2.0 models
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-2.0-flash-thinking-exp-01-21",
        "gemini-2.0-flash-exp-image-generation",
        // Gemini 2.5 models
        "gemini-2.5-pro-exp-03-25",
    ]).describe("The Gemini model to use"),
    query: z.string().describe("The question or prompt to send to Gemini"),
    temperature: z.number().optional().describe("Controls randomness (0-1)"),
    maxOutputTokens: z.number().optional().describe("Maximum tokens to generate"),
}, async ({ model, query, temperature, maxOutputTokens }) => {
    const options = {};
    if (temperature !== undefined) {
        options.temperature = temperature;
    }
    if (maxOutputTokens !== undefined) {
        options.maxOutputTokens = maxOutputTokens;
    }
    try {
        const response = await generateGeminiContent(model, query, options);
        return {
            content: [
                {
                    type: "text",
                    text: response,
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error.message || "Unknown error"}`,
                },
            ],
        };
    }
});
// Define the conversation message schema
const conversationMessageSchema = z.object({
    role: z.enum(["user", "model"]),
    content: z.string(),
});
// Register the chat_with_gemini tool
server.tool("chat_with_gemini", "Have a multi-turn conversation with Google's Gemini AI", {
    model: z.enum([
        // Gemini 2.0 models
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-2.0-flash-thinking-exp-01-21",
        // Gemini 2.5 models
        "gemini-2.5-pro-exp-03-25",
    ]).describe("The Gemini model to use"),
    conversation: z.array(conversationMessageSchema).describe("Previous conversation history"),
    message: z.string().describe("New message to add to the conversation"),
    temperature: z.number().optional().describe("Controls randomness (0-1)"),
}, async ({ model, conversation, message, temperature }) => {
    const options = {};
    if (temperature !== undefined) {
        options.temperature = temperature;
    }
    try {
        const response = await chatWithGemini(model, conversation, message, options);
        return {
            content: [
                {
                    type: "text",
                    text: response,
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error.message || "Unknown error"}`,
                },
            ],
        };
    }
});
/**
 * Main function to start the server
 */
async function main() {
    try {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("Gemini MCP Server running on stdio");
    }
    catch (error) {
        console.error("Error starting server:", error.message || error);
        process.exit(1);
    }
}
main().catch((error) => {
    console.error("Fatal error in main():", error.message || error);
    process.exit(1);
});

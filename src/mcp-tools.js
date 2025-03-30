/**
 * MCP Tools for Gemini API interaction
 * @module mcp-tools
 */
import express from 'express';
import { generateContent, chatWithHistory } from './gemini-api.js';

const router = express.Router();

/**
 * Ask Gemini AI a question and get a response
 * @param {string} modelName - Name of the Gemini model to use (gemini-pro, gemini-flash, etc.)
 * @param {string} query - The question or prompt to send to Gemini
 * @param {object} options - Optional parameters for the generation
 * @returns {Promise<string>} The response from Gemini
 */
async function askGemini(modelName, query, options = {}) {
  try {
    const response = await generateContent(modelName, query, options);
    return response.text();
  } catch (error) {
    console.error('Error asking Gemini:', error);
    throw new Error(`Failed to get response from Gemini: ${error.message}`);
  }
}

/**
 * Have a multi-turn conversation with Gemini
 * @param {string} modelName - Name of the Gemini model to use
 * @param {Array<object>} conversation - Array of conversation messages
 * @param {string} newMessage - New message to add to conversation
 * @param {object} options - Optional parameters for the generation
 * @returns {Promise<string>} The response from Gemini
 */
async function chatWithGemini(modelName, conversation, newMessage, options = {}) {
  try {
    const response = await chatWithHistory(
      modelName,
      conversation,
      newMessage,
      options
    );
    return response.text();
  } catch (error) {
    console.error('Error chatting with Gemini:', error);
    throw new Error(`Failed to chat with Gemini: ${error.message}`);
  }
}

/**
 * MCP tool endpoints configuration
 * @param {object} app - Express app instance
 */
function setupMcpTools(app) {
  // Tool: ask_gemini
  app.post('/tools/ask_gemini', async (req, res) => {
    try {
      const { model, query, options } = req.body;

      if (!model || !query) {
        return res.status(400).json({
          success: false,
          error: 'Model and query are required',
        });
      }

      const response = await askGemini(model, query, options);
      return res.json({
        success: true,
        result: response,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // Tool: chat_with_gemini
  app.post('/tools/chat_with_gemini', async (req, res) => {
    try {
      const { model, conversation, message, options } = req.body;

      if (!model || !message || !Array.isArray(conversation)) {
        return res.status(400).json({
          success: false,
          error: 'Model, valid conversation array, and message are required',
        });
      }

      const response = await chatWithGemini(model, conversation, message, options);
      return res.json({
        success: true,
        result: response,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
}

// Define tool schema for MCP
const toolDefinitions = {
  ask_gemini: {
    description: "Ask a question to Google's Gemini AI model and get a response",
    parameters: {
      type: "object",
      required: ["model", "query"],
      properties: {
        model: {
          type: "string",
          enum: [
            // Gemini 2.0 models
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-2.0-flash-thinking-exp-01-21",
            "gemini-2.0-flash-exp-image-generation",

            // Gemini 2.5 models
            "gemini-2.5-pro-exp-03-25"
          ],
          description: "The Gemini model to use"
        },
        query: {
          type: "string",
          description: "The question or prompt to send to Gemini"
        },
        options: {
          type: "object",
          description: "Optional parameters for generation",
          properties: {
            temperature: {
              type: "number",
              description: "Controls randomness (0-1)"
            },
            maxOutputTokens: {
              type: "integer",
              description: "Maximum tokens to generate"
            }
          }
        }
      }
    }
  },

  chat_with_gemini: {
    description: "Have a multi-turn conversation with Google's Gemini AI",
    parameters: {
      type: "object",
      required: ["model", "conversation", "message"],
      properties: {
        model: {
          type: "string",
          enum: [
            // Gemini 1.0 models
            "gemini-pro",
            "gemini-ultra",

            // Gemini 2.0 models
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-2.0-flash-thinking-exp-01-21",

            // Gemini 2.5 models
            "gemini-2.5-pro-exp-03-25"
          ],
          description: "The Gemini model to use"
        },
        conversation: {
          type: "array",
          description: "Previous conversation history",
          items: {
            type: "object",
            properties: {
              role: {
                type: "string",
                enum: ["user", "model"]
              },
              content: {
                type: "string"
              }
            }
          }
        },
        message: {
          type: "string",
          description: "New message to add to the conversation"
        },
        options: {
          type: "object",
          description: "Optional parameters for generation",
          properties: {
            temperature: {
              type: "number",
              description: "Controls randomness (0-1)"
            }
          }
        }
      }
    }
  }
};

export {
  setupMcpTools,
  toolDefinitions,
  askGemini,
  chatWithGemini,
}; 
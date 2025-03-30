/**
 * MCP Server for Gemini integration
 * @module mcp-server
 * 
 * This implements the Model Context Protocol (MCP) server to allow other
 * LLM clients like Claude to interact with Gemini models.
 */
import express from 'express';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { askGemini, chatWithGemini, toolDefinitions } from './mcp-tools.js';

/**
 * Initialize and configure the MCP server
 * @param {number} mcpPort - Port for the MCP server to listen on
 * @returns {Object} Server instance and setup methods
 */
function createMcpServer(mcpPort = 3002) {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  // Server metadata and capabilities
  const serverMetadata = {
    name: 'gemini-mcp-server',
    version: '1.0.0',
    description: 'MCP server for interacting with Google Gemini models',
    capabilities: {
      tools: Object.keys(toolDefinitions)
    }
  };

  /**
   * Process and execute MCP tool requests
   * @param {Object} request - The tool request object
   * @returns {Promise<Object>} Tool execution result
   */
  async function executeToolRequest(request) {
    const { tool, parameters } = request;

    try {
      let result;

      // Ask Gemini tool
      if (tool === 'ask_gemini') {
        const { model, query, options } = parameters;
        result = await askGemini(model, query, options);
      }
      // Chat with Gemini tool
      else if (tool === 'chat_with_gemini') {
        const { model, conversation, message, options } = parameters;
        result = await chatWithGemini(model, conversation, message, options);
      }
      else {
        throw new Error(`Unknown tool: ${tool}`);
      }

      return {
        type: 'tool_result',
        id: request.id,
        result
      };
    } catch (error) {
      console.error(`Error executing tool ${tool}:`, error);
      return {
        type: 'tool_error',
        id: request.id,
        error: {
          message: error.message
        }
      };
    }
  }

  // WebSocket connection handler
  wss.on('connection', (ws) => {
    console.log('Client connected to MCP server');

    // Send server information on connection
    ws.send(JSON.stringify({
      type: 'server_info',
      server: serverMetadata
    }));

    // Handle messages from clients
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data);

        // Handle different message types
        switch (message.type) {
          case 'get_tools':
            ws.send(JSON.stringify({
              type: 'tools',
              tools: toolDefinitions
            }));
            break;

          case 'tool_call':
            const result = await executeToolRequest(message);
            ws.send(JSON.stringify(result));
            break;

          default:
            ws.send(JSON.stringify({
              type: 'error',
              error: {
                message: `Unknown message type: ${message.type}`
              }
            }));
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          error: {
            message: 'Error processing message'
          }
        }));
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      console.log('Client disconnected from MCP server');
    });
  });

  // HTTP endpoints for MCP

  // Tool definitions endpoint
  app.get('/tools', (req, res) => {
    res.json(toolDefinitions);
  });

  // Server info endpoint
  app.get('/info', (req, res) => {
    res.json(serverMetadata);
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Start the server
  function start() {
    server.listen(mcpPort, () => {
      console.log(`MCP Server running on port ${mcpPort}`);
    });

    return server;
  }

  return {
    start,
    server,
    app
  };
}

export { createMcpServer }; 
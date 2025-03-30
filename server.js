/**
 * Gemini MCP Server entry point
 */
import 'dotenv/config';
import app from './src/app.js';
import { createMcpServer } from './src/mcp-server.js';

// API Server port
const API_PORT = process.env.PORT || 3001;
// MCP Server port
const MCP_PORT = process.env.MCP_PORT || 3002;

// Start API server
app.listen(API_PORT, () => {
  console.log(`Gemini API Server running on port ${API_PORT}`);
});

// Start MCP server
const mcpServer = createMcpServer(MCP_PORT);
mcpServer.start();
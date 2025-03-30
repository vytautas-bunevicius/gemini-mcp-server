/**
 * Express application setup for Gemini MCP server
 */
import express from 'express';
import cors from 'cors';
import routes from './routes.js';
import { setupMcpTools, toolDefinitions } from './mcp-tools.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', routes);

// Setup MCP tools
setupMcpTools(app);

/**
 * Health check endpoint
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * MCP tool definitions endpoint
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
app.get('/tools', (req, res) => {
  res.json(toolDefinitions);
});

/**
 * Error handling middleware
 * @param {Error} err - Error object
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, error: err.message });
});

export default app;
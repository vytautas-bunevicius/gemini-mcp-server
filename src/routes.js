/**
 * API route definitions for Gemini MCP server
 * @module routes
 */
import express from 'express';
import { generateContent, generateContentStream, chatWithHistory } from './gemini-api.js';

const router = express.Router();

/**
 * Generate content endpoint
 * @route POST /api/generate
 * @param {object} req.body.model - Gemini model name
 * @param {string|object} req.body.prompt - Text prompt or structured content
 * @param {object} req.body.options - Generation options
 */
router.post('/generate', async (req, res, next) => {
  try {
    const { model, prompt, options } = req.body;

    if (!model || !prompt) {
      return res.status(400).json({
        success: false,
        error: 'Model and prompt are required',
      });
    }

    const response = await generateContent(model, prompt, options);
    return res.json({
      success: true,
      text: response.text(),
      fullResponse: response,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * Stream content endpoint
 * @route POST /api/generate/stream
 * @param {object} req.body.model - Gemini model name
 * @param {string|object} req.body.prompt - Text prompt or structured content
 * @param {object} req.body.options - Generation options
 */
router.post('/generate/stream', async (req, res, next) => {
  try {
    const { model, prompt, options } = req.body;

    if (!model || !prompt) {
      return res.status(400).json({
        success: false,
        error: 'Model and prompt are required',
      });
    }

    const streamingResult = await generateContentStream(model, prompt, options);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of streamingResult.stream) {
      const chunkText = chunk.text();
      res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    return res.end();
  } catch (error) {
    return next(error);
  }
});

/**
 * Chat endpoint
 * @route POST /api/chat
 * @param {object} req.body.model - Gemini model name
 * @param {Array} req.body.messages - Array of conversation messages
 * @param {object} req.body.options - Generation options
 */
router.post('/chat', async (req, res, next) => {
  try {
    const { model, messages, options } = req.body;

    if (!model || !messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Model and valid messages array are required',
      });
    }

    // Extract history and most recent message
    const history = messages.slice(0, -1);
    const latestMessage = messages[messages.length - 1].content;

    const response = await chatWithHistory(model, history, latestMessage, options);

    return res.json({
      success: true,
      text: response.text(),
      fullResponse: response,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
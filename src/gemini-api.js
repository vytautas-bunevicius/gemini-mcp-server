/**
 * Core Gemini API integration module
 * @module gemini-api
 */
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Generate content from Gemini model
 * @param {string} modelName - Name of the model to use
 * @param {string|object} prompt - Text prompt or structured content
 * @param {object} options - Generation options like temperature
 * @returns {Promise<object>} Generation response
 * @throws {Error} If API request fails
 */
async function generateContent(modelName, prompt, options = {}) {
  try {
    const model = genAI.models;
    const result = await model.generateContent({
      model: modelName,
      contents: prompt,
      ...options
    });
    return result;
  } catch (error) {
    console.error('Error generating content:', error);
    throw error;
  }
}

/**
 * Generate streaming content from Gemini model
 * @param {string} modelName - Name of the model to use
 * @param {string|object} prompt - Text prompt or structured content
 * @param {object} options - Generation options like temperature
 * @returns {Promise<object>} Streaming generation response
 * @throws {Error} If API request fails
 */
async function generateContentStream(modelName, prompt, options = {}) {
  try {
    const model = genAI.models;
    return await model.generateContentStream({
      model: modelName,
      contents: prompt,
      ...options
    });
  } catch (error) {
    console.error('Error generating streaming content:', error);
    throw error;
  }
}

/**
 * Create and use a chat session
 * @param {string} modelName - Name of the model to use
 * @param {Array} history - Array of past messages
 * @param {string} message - New message content
 * @param {object} options - Generation options
 * @returns {Promise<object>} Chat response
 * @throws {Error} If API request fails
 */
async function chatWithHistory(modelName, history, message, options = {}) {
  try {
    // Convert history format if needed
    const formattedHistory = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    const result = await genAI.models.generateContent({
      model: modelName,
      contents: [
        ...formattedHistory,
        { role: "user", parts: [{ text: message }] }
      ],
      ...options
    });
    return result;
  } catch (error) {
    console.error('Error in chat session:', error);
    throw error;
  }
}

export {
  generateContent,
  generateContentStream,
  chatWithHistory,
};
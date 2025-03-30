# Gemini MCP Server

A Model Context Protocol (MCP) server for interacting with Google's Gemini AI models using the official MCP SDK.

[![License](https://img.shields.io/badge/license-Unlicense-blue.svg)](LICENSE)

## Table of Contents

- [Purpose](#purpose)
- [Features](#features)
- [Available Tools](#available-tools)
- [Available Resources](#available-resources)
- [Supported Gemini Models](#supported-gemini-models)
- [Quick Start](#quick-start)
- [Configuring Claude for Desktop](#configuring-claude-for-desktop)
- [Using Gemini from Claude](#using-gemini-from-claude)
- [Remote MCP Server Setup](#remote-mcp-server-setup)
- [Security Considerations](#security-considerations)
- [License](#license)

## Purpose

This server allows Claude for Desktop and other MCP clients to use Google's Gemini AI models. It implements the latest Model Context Protocol specification to provide a standardized interface for interacting with Gemini.

## Features

- **Complete MCP Implementation**: Supports both tools and resources
- **Multiple Transport Methods**: Works with both stdio (local) and HTTP+SSE (remote) connections
- **Latest Gemini API Integration**: Uses the most recent Gemini models including 2.5 series
- **Function Calling Support**: Implements function calling capability for supported models
- **Security**: Optional authentication for remote connections
- **Resilience**: Implements retry logic with exponential backoff for API calls

## Available Tools

### ask_gemini
Send a question to Gemini models and get a response.

Parameters:
- `model`: The Gemini model to use (e.g., "gemini-2.5-pro-exp-03-25")
- `query`: The question or prompt to send to Gemini
- `temperature`: (Optional) Controls randomness (0-1)
- `maxOutputTokens`: (Optional) Maximum tokens to generate
- `topK`: (Optional) The number of most likely tokens to consider
- `topP`: (Optional) The cumulative probability of tokens to consider

### chat_with_gemini
Have a multi-turn conversation with Gemini models.

Parameters:
- `model`: The Gemini model to use
- `conversation`: Previous conversation history
- `message`: New message to add to the conversation
- `temperature`: (Optional) Controls randomness (0-1)
- `maxOutputTokens`: (Optional) Maximum tokens to generate

### gemini_function_call
Call a function using Gemini's function calling capability (for supported models).

Parameters:
- `model`: The Gemini model to use
- `prompt`: The prompt to send to Gemini
- `functions`: Function definitions
- `temperature`: (Optional) Controls randomness (0-1)
- `maxOutputTokens`: (Optional) Maximum tokens to generate

## Available Resources

### gemini_models
Information about available Gemini models, including capabilities and context window sizes.

## Supported Gemini Models

- **Gemini 2.5**:
  - gemini-2.5-pro-exp-03-25
  - gemini-2.5-flash
- **Gemini 2.0**:
  - gemini-2.0-flash
  - gemini-2.0-flash-lite
  - gemini-2.0-flash-thinking-exp-01-21
  - gemini-2.0-flash-exp-image-generation
- **Legacy Models**:
  - gemini-pro
  - gemini-ultra

## Quick Start

### Prerequisites

- Node.js 18+ 
- Google Gemini API key (get from [Google AI Studio](https://ai.google.dev/))

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/gemini-mcp-server.git
   cd gemini-mcp-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

4. Build the project:
   ```bash
   npm run build
   ```

5. Start the server:
   ```bash
   npm start
   ```

For HTTP/SSE transport (remote connections):
   ```bash
   npm start -- --http
   ```

## Configuring Claude for Desktop

1. Install [Claude for Desktop](https://claude.ai/desktop)
2. Open Claude's configuration file at `~/Library/Application Support/Claude/claude_desktop_config.json`
3. Add the MCP server configuration:

```json
{
  "mcpServers": {
    "gemini": {
      "command": "node",
      "args": [
        "/absolute/path/to/gemini-mcp-server/build/index.js"
      ],
      "env": {
        "GEMINI_API_KEY": "your-gemini-api-key-here"
      }
    }
  }
}
```

4. Save the file and restart Claude for Desktop

## Using Gemini from Claude

Once configured, Claude will show available tools (look for the hammer icon). You can prompt Claude with:

- "Ask Gemini 2.5 Pro what the future of AI looks like"
- "Have a conversation with Gemini 2.0 Flash about quantum computing"
- "Ask Gemini about its available models"

## Remote MCP Server Setup

For remote connections using HTTP+SSE:

1. Set the following environment variables in your `.env` file:
   ```
   MCP_PORT=3002
   MCP_HOST=0.0.0.0  # Use 0.0.0.0 to listen on all interfaces
   MCP_AUTH_ENABLED=true
   MCP_AUTH_SECRET=your_secret_key_here
   ```

2. Start the server with HTTP transport:
   ```bash
   npm start -- --http
   ```

3. Configure your MCP client to connect to:
   ```
   http://your-server-address:3002/mcp
   ```
   
   With the authentication header:
   ```
   Authorization: Bearer your_secret_key_here
   ```

## Security Considerations

- Always use authentication for remote MCP connections
- Keep your API keys secure
- Consider running behind a reverse proxy for additional security
- For production use, consider deploying in a containerized environment

## License

This project is licensed under the terms of the Unlicense. See the [LICENSE](LICENSE) file for details.

The Unlicense is a public domain dedication; anyone is free to copy, modify, publish, use, compile, sell, or distribute the original or modified code for any purpose, commercial or non-commercial, and by any means. There are no restrictions on use.
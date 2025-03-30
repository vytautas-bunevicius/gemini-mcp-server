# Gemini MCP Server

A Model Context Protocol (MCP) server for interacting with Google's Gemini AI models.

## Overview

This server implements the Model Context Protocol specification to provide a standardized interface for MCP clients like Claude to interact with Google's Gemini AI models.

## Features

- **Standard MCP Implementation**: Full support for tools and resources
- **Local Transport**: Works with stdio transport for local connections
- **Latest Gemini API Integration**: Supports the most recent Gemini models including 2.5 series
- **Function Calling Support**: Implements function calling capability for supported models
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
- **Gemini 2.0**:
  - gemini-2.0-flash
  - gemini-2.0-flash-lite
  - gemini-2.0-flash-thinking-exp-01-21
  - gemini-2.0-flash-exp-image-generation

## Installation

### Prerequisites

- Node.js 18+ 
- Google Gemini API key (get from [Google AI Studio](https://ai.google.dev/))

### Setup

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/gemini-mcp-server.git
   cd gemini-mcp-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your Gemini API key:
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

## Configuring Claude for Desktop

1. Install [Claude for Desktop](https://claude.ai/desktop)
2. Open Claude's configuration file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
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

## Security Considerations

- Keep your API keys secure
- Never share your `.env` file
- Consider running behind a reverse proxy for additional security in production environments

## License

This project is licensed under the terms of the Unlicense. See the [LICENSE](LICENSE) file for details.
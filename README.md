# Gemini MCP Server

A Model Context Protocol (MCP) server for interacting with Google's Gemini AI models using the official MCP SDK.

## Purpose

This server allows Claude for Desktop and other MCP clients to use Google's Gemini AI models. It implements the Model Context Protocol specification to provide a standardized interface for interacting with Gemini.

## Available Tools

### ask_gemini
Send a question to Gemini models and get a response.

Parameters:
- `model`: The Gemini model to use (e.g., "gemini-2.5-pro-exp-03-25")
- `query`: The question or prompt to send to Gemini
- `temperature`: (Optional) Controls randomness (0-1)
- `maxOutputTokens`: (Optional) Maximum tokens to generate

### chat_with_gemini
Have a multi-turn conversation with Gemini models.

Parameters:
- `model`: The Gemini model to use
- `conversation`: Previous conversation history
- `message`: New message to add to the conversation
- `temperature`: (Optional) Controls randomness (0-1)

## Supported Gemini Models

- **Gemini 2.0**:
  - gemini-2.0-flash
  - gemini-2.0-flash-lite
  - gemini-2.0-flash-thinking-exp-01-21
  - gemini-2.0-flash-exp-image-generation
- **Gemini 2.5**:
  - gemini-2.5-pro-exp-03-25

## Quick Start

### Prerequisites

- Node.js 16+ 
- Google Gemini API key (get from [Google AI Studio](https://ai.google.dev/))

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.example` and add your Gemini API key
4. Build the project:
   ```
   npm run build
   ```
5. Start the server:
   ```
   npm start
   ```

## Configuring Claude for Desktop

1. Install [Claude for Desktop](https://claude.ai/desktop) if you haven't already
2. Open Claude's configuration file at `~/Library/Application Support/Claude/claude_desktop_config.json`
3. Add the MCP server configuration:

```json
{
  "mcpServers": {
    "gemini": {
      "command": "node",
      "args": [
        "/absolute/path/to/gemini-mcp-server/build/index.js"
      ]
    }
  }
}
```

4. Save the file and restart Claude for Desktop

## Using Gemini from Claude

Once configured, Claude will show available tools (look for the hammer icon). You can prompt Claude with:

- "Ask Gemini 2.5 Pro what the future of AI looks like"
- "Have a conversation with Gemini 2.0 Flash about quantum computing"

Claude will use the appropriate tool to interact with the specified Gemini model.

## Adding a New Gemini Model

To add a new Gemini model:

1. Open `src/index.ts`
2. Find the tool definitions (the `z.enum` arrays)
3. Add the new model name to the list
4. Rebuild the server with `npm run build`

## Project Structure

```
gemini-mcp-server/
├── src/                     # Source code directory
│   └── index.ts             # Main MCP server implementation
├── .env.example             # Example environment variables
├── .gitignore               # Git ignore file
├── package.json             # Node.js dependencies
├── tsconfig.json            # TypeScript configuration
└── README.md                # Project documentation
```

## License

MIT
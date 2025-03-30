# Gemini MCP Server

**A Model Context Protocol (MCP) server for interacting with Google's Gemini AI models.**

This server implements the [Model Context Protocol](https://github.com/anthropics/model-context-protocol) specification, acting as a bridge to allow MCP clients (like Claude for Desktop) to interact seamlessly with Google's powerful Gemini AI models via a standardized interface.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Available Tools](#available-tools)
  - [ask_gemini](#ask_gemini)
  - [chat_with_gemini](#chat_with_gemini)
  - [gemini_function_call](#gemini_function_call)
- [Available Resources](#available-resources)
  - [gemini_models](#gemini_models)
- [Supported Gemini Models](#supported-gemini-models)
- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
- [Docker Setup](#docker-setup)
  - [Build the Docker Image](#build-the-docker-image)
  - [Run the Container (Stdio)](#run-the-container-stdio)
  - [Run the Container (Network Port for Claude Desktop)](#run-the-container-network-port-for-claude-desktop)
  - [Docker Compose](#docker-compose)
- [Configuring Claude for Desktop](#configuring-claude-for-desktop)
  - [Method 1: Using Stdio (Recommended for Local Use)](#method-1-using-stdio-recommended-for-local-use)
  - [Method 2: Using Docker Network Port](#method-2-using-docker-network-port)
- [Using Gemini from Claude](#using-gemini-from-claude)
- [Security Considerations](#security-considerations)
- [License](#license)

## Overview

This server acts as an adapter, translating requests from MCP clients into API calls for Google's Gemini models and returning the responses in the MCP format. It enables users of MCP-compatible clients to leverage Gemini's capabilities, including different models and function calling.

## Features

-   **Standard MCP Implementation**: Full support for the MCP specification, including tools and resources.
-   **Local Transport**: Primarily designed for `stdio` transport for secure, local connections (e.g., with desktop applications). Network transport via Docker is also supported.
-   **Latest Gemini API Integration**: Supports recent Gemini models, including the Gemini 1.5 series (as available via the API).
-   **Function Calling Support**: Implements Gemini's function calling capability for models that support it.
-   **Resilience**: Includes retry logic with exponential backoff for handling transient API errors.

## Available Tools

These tools become available within MCP clients connected to this server.

### ask_gemini

Sends a single question (prompt) to a specified Gemini model and returns the response.

**Parameters:**

-   `model` (string, required): The Gemini model ID to use (e.g., `"gemini-1.5-flash-latest"`).
-   `query` (string, required): The question or prompt to send to the Gemini model.
-   `temperature` (number, optional): Controls randomness (0.0 to 1.0). Higher values mean more creative responses.
-   `maxOutputTokens` (integer, optional): Maximum number of tokens to generate in the response.
-   `topK` (integer, optional): The number of highest probability tokens to consider at each step.
-   `topP` (number, optional): The cumulative probability mass of tokens to consider (nucleus sampling).

### chat_with_gemini

Manages a multi-turn conversation with a specified Gemini model.

**Parameters:**

-   `model` (string, required): The Gemini model ID to use.
-   `conversation` (array, required): An array representing the conversation history. Each element should conform to the expected format (e.g., `{ role: 'user' | 'model', parts: [{ text: '...' }] }`).
-   `message` (string, required): The new user message to add to the conversation.
-   `temperature` (number, optional): Controls randomness (0.0 to 1.0).
-   `maxOutputTokens` (integer, optional): Maximum number of tokens to generate.

### gemini_function_call

Leverages Gemini's function calling feature (only for models supporting it). Sends a prompt and a set of function definitions to the model, expecting it to potentially return a request to call one of those functions.

**Parameters:**

-   `model` (string, required): The Gemini model ID to use (must support function calling).
-   `prompt` (string, required): The prompt to send to the model.
-   `functions` (array, required): An array of function declarations conforming to the Gemini API specification.
-   `temperature` (number, optional): Controls randomness (0.0 to 1.0).
-   `maxOutputTokens` (integer, optional): Maximum number of tokens to generate.

## Available Resources

These resources provide information accessible via the MCP client.

### gemini_models

Provides details about the Gemini models currently accessible via the configured API key, potentially including capabilities and context window sizes (subject to API limitations).

## Supported Gemini Models

This server interacts with models available through the Google Generative AI SDK. Common models include (but are not limited to, check the `gemini_models` resource for currently available ones):

-   **Gemini 1.5**:
    -   `gemini-1.5-pro-latest`
    -   `gemini-1.5-flash-latest`
-   **Gemini 1.0**:
    -   `gemini-pro`

*(Note: Model availability may change based on Google's API updates and your API key access level.)*

## Installation

### Prerequisites

-   **Node.js**: Version 18 or higher recommended.
-   **npm** or **yarn**: Package manager for Node.js.
-   **Google Gemini API Key**: Obtain one from [Google AI Studio](https://ai.google.dev/). **Keep this key secure!**

### Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/vytautas-bunevicius/gemini-mcp-server.git](https://github.com/vytautas-bunevicius/gemini-mcp-server.git)
    cd gemini-mcp-server
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or if using yarn:
    # yarn install
    # Consider using 'npm ci' for reproducible builds in CI/CD environments
    ```

3.  **Configure API Key:**
    Create a `.env` file in the project root directory and add your API key:
    ```dotenv
    # .env
    GEMINI_API_KEY=YOUR_API_KEY_HERE
    ```
    **Important:** Add `.env` to your `.gitignore` file if it's not already there to prevent accidentally committing your key.

4.  **Build the project:**
    This compiles the TypeScript code to JavaScript.
    ```bash
    npm run build
    ```
    The output will be in the `build` directory.

5.  **Start the server (for testing or direct use):**
    This command typically runs the server using `stdio` for communication, suitable for clients like Claude Desktop configured to launch the process directly.
    ```bash
    npm start
    ```

## Docker Setup

You can also run the server within a Docker container.

### Build the Docker Image

From the project root directory:
```bash
docker build -t gemini-mcp-server .
```

### Run the Container (Stdio)

This runs the container using `stdio` for communication, similar to `npm start`. You would typically configure your MCP client to execute this Docker command.
```bash
# Replace YOUR_API_KEY_HERE with your actual key
docker run -i --rm \
  -e GEMINI_API_KEY=YOUR_API_KEY_HERE \
  gemini-mcp-server
```
*(Note: The `-i` flag is crucial for stdin interaction).*

### Run the Container (Network Port for Claude Desktop)

This method runs the container and exposes a network port (e.g., 3001). This is useful if configuring Claude Desktop to connect via URL instead of launching a command.

```bash
# Replace YOUR_API_KEY_HERE with your actual key
docker run -it --rm \
  -e GEMINI_API_KEY=YOUR_API_KEY_HERE \
  -p 127.0.0.1:3001:3001 \
  --name gemini-mcp \
  gemini-mcp-server
```
*(Note: `-p 127.0.0.1:3001:3001` binds the port only to localhost for security).*

### Docker Compose

For easier management, especially if combining with other services, use Docker Compose.

1.  Create a `docker-compose.yml` file:
    ```yaml
    version: '3.8'
    services:
      gemini-mcp:
        build: .
        container_name: gemini-mcp
        environment:
          # It's more secure to use .env files with Docker Compose
          # Create a .env file in the same directory as docker-compose.yml:
          # GEMINI_API_KEY=YOUR_API_KEY_HERE
          - GEMINI_API_KEY=${GEMINI_API_KEY}
        # Uncomment ports section if you need network access (e.g., for Claude URL config)
        # ports:
        #  - "127.0.0.1:3001:3001" # Expose port 3001 only on localhost
        # Use 'stdin_open: true' and 'tty: true' if you need stdio interaction via Compose
        # stdin_open: true # Equivalent to -i
        # tty: true      # Equivalent to -t
    ```

2.  Create a `.env` file in the same directory as `docker-compose.yml`:
    ```dotenv
    # .env (for Docker Compose)
    GEMINI_API_KEY=YOUR_API_KEY_HERE
    ```

3.  Run with Docker Compose:
    ```bash
    # To run in the foreground (for stdio or debugging)
    docker-compose up --build

    # To run in the background (detached, usually for network mode)
    # docker-compose up -d --build
    ```

## Configuring Claude for Desktop

You need to tell Claude for Desktop how to launch and communicate with this MCP server.

1.  **Install Claude for Desktop**: If you haven't already, get it from [claude.ai/desktop](https://claude.ai/desktop).
2.  **Locate Configuration File**:
    * **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
    * **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
    * **Linux**: `~/.config/Claude/claude_desktop_config.json` (path may vary slightly)
3.  **Edit the Configuration File**: Add the `mcpServers` section. Choose *one* of the methods below:

### Method 1: Using Stdio (Recommended for Local Use)

This method lets Claude manage the server process directly using `stdio`. Replace `/absolute/path/to/gemini-mcp-server/build/index.js` with the actual path on your system and provide your API key.

```json
{
  "mcpServers": {
    "gemini": {
      "command": "node", // Command to execute
      "args": [
        // **IMPORTANT**: Use the FULL, ABSOLUTE path to the compiled JS file
        "/absolute/path/to/gemini-mcp-server/build/index.js"
      ],
      "env": {
        // Provide the API key directly here
        "GEMINI_API_KEY": "YOUR_API_KEY_HERE"
        // You can add other environment variables if needed
        // "NODE_ENV": "production"
      }
    }
    // You can add other MCP servers here
  }
  // Other Claude settings might be present here
}
```

### Method 2: Using Docker Network Port

If you ran the Docker container exposing port 3001 (as shown in the Docker section), you can configure Claude to connect via URL. Ensure the Docker container is running *before* starting Claude.

```json
{
  "mcpServers": {
    "gemini": {
      // Connect to the exposed port from the Docker container
      "url": "http://localhost:3001"
    }
    // You can add other MCP servers here
  }
  // Other Claude settings might be present here
}
```

4.  **Save and Restart**: Save the `claude_desktop_config.json` file and restart Claude for Desktop.

## Using Gemini from Claude

Once configured correctly and Claude is restarted:

1.  Claude should detect the new MCP server ("gemini" in this example).
2.  Tools provided by the server (like `ask_gemini`, `chat_with_gemini`) will become available. Look for the tool icon (often a hammer) in Claude's interface when composing a message.
3.  You can invoke the tools by asking Claude naturally:
    * "Use the `ask_gemini` tool with the `gemini-1.5-flash-latest` model to tell me about the Model Context Protocol."
    * "Ask Gemini Pro: What are the key features of the latest Gemini models?"
    * "Start a conversation with `chat_with_gemini` about the benefits of using MCP."
    * "Use the `gemini_models` resource to list available models."

Claude will then prompt you (or automatically use the tool) based on your configuration and the detected tools.

## Security Considerations

-   **API Key Security**: Your `GEMINI_API_KEY` is sensitive.
    -   **Never** commit your `.env` file or API keys directly into source control (ensure `.env` is in your `.gitignore`).
    -   Use environment variables or secure secret management solutions, especially in production or shared environments.
    -   When using Docker, prefer injecting environment variables securely (e.g., via Docker Compose `.env` files or orchestration secrets) rather than hardcoding them in Dockerfiles or commands.
-   **Network Exposure**: If running the server with an exposed network port (like in the Docker network example or if you modify the server code), ensure it's bound to `localhost` (`127.0.0.1`) unless you specifically need wider network access and understand the security implications. Consider firewall rules if exposing beyond localhost.
-   **Input Sanitization**: While the MCP protocol has structure, be mindful that prompts passed to Gemini models originate from user input.

## License

This project is licensed under the terms of the **Unlicense**. This means it is effectively released into the public domain. See the [LICENSE](LICENSE) file for details. You are free to use, modify, and distribute the code with practically no restrictions.
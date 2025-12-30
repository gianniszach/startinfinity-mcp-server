# StartInfinity MCP Server

A Model Context Protocol (MCP) server that provides tools for managing StartInfinity projects via their API.

## Features

This MCP server exposes 8 tools for interacting with the StartInfinity API:

1. **fetch_dashboard** - Returns workspace information
2. **fetch_boards** - Lists all boards in a workspace
3. **fetch_board** - Gets detailed information about a specific board
4. **fetch_items** - Lists items from a board (with optional folder filter)
5. **fetch_item_details** - Gets detailed item information
6. **update_item** - Updates item attributes
7. **fetch_view** - Gets view configuration
8. **post_comment** - Creates a comment on an item

## Prerequisites

- Node.js 18+ 
- A StartInfinity account with API access
- A Personal Access Token from StartInfinity

## Setup

1. **Clone or navigate to this directory**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials:
   ```
   STARTINFINITY_API_TOKEN=your_api_token_here
   STARTINFINITY_WORKSPACE_ID=your_workspace_id_here
   ```
   
   You can obtain your API token from your StartInfinity profile page. The workspace ID is optional if you provide it when calling tools.

4. **Build the project:**
   ```bash
   npm run build
   ```

## Docker Setup

### Building the Docker Image

```bash
docker build -t startinfinity-mcp-server:latest .
```

### Running with Docker

**Using docker run:**
```bash
docker run -it --rm \
  -e STARTINFINITY_API_TOKEN=your_api_token_here \
  -e STARTINFINITY_WORKSPACE_ID=your_workspace_id_here \
  startinfinity-mcp-server:latest
```

**Using docker-compose:**

1. Create a `.env` file with your credentials:
   ```
   STARTINFINITY_API_TOKEN=your_api_token_here
   STARTINFINITY_WORKSPACE_ID=your_workspace_id_here
   ```

2. Run with docker-compose:
   ```bash
   docker-compose up
   ```

### Connecting Docker Container to Cursor AI

When configuring the MCP server in Cursor, use:

```json
{
  "mcpServers": {
    "startinfinity": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e", "STARTINFINITY_API_TOKEN=your_api_token_here",
        "-e", "STARTINFINITY_WORKSPACE_ID=your_workspace_id_here",
        "startinfinity-mcp-server:latest"
      ]
    }
  }
}
```

Or if using docker-compose:
```json
{
  "mcpServers": {
    "startinfinity": {
      "command": "docker-compose",
      "args": [
        "-f", "/path/to/docker-compose.yml",
        "run", "--rm",
        "startinfinity-mcp-server"
      ],
      "env": {
        "STARTINFINITY_API_TOKEN": "your_api_token_here",
        "STARTINFINITY_WORKSPACE_ID": "your_workspace_id_here"
      }
    }
  }
}
```

## Running the Server

To run the MCP server:

```bash
npm start
```

For development with auto-rebuild:

```bash
npm run dev
```

In another terminal:
```bash
npm start
```

## Connecting to Cursor AI

To connect this MCP server to Cursor AI:

1. Open Cursor settings
2. Navigate to MCP settings
3. Add a new MCP server with the following configuration:

```json
{
  "mcpServers": {
    "startinfinity": {
      "command": "node",
      "args": ["/path/to/startinfinity-mcp-server/dist/index.js"],
      "env": {
        "STARTINFINITY_API_TOKEN": "your_api_token_here",
        "STARTINFINITY_WORKSPACE_ID": "your_workspace_id_here"
      }
    }
  }
}
```

Replace `/path/to/startinfinity-mcp-server` with the actual path to this project directory.

## Tool Usage Examples

### Fetch Dashboard
Returns workspace information.

**Input:**
```json
{
  "workspaceId": "669"  // Optional if STARTINFINITY_WORKSPACE_ID is set
}
```

### Fetch Boards
Lists all boards in a workspace.

**Input:**
```json
{
  "workspaceId": "669"  // Optional if STARTINFINITY_WORKSPACE_ID is set
}
```

### Fetch Board
Gets detailed information about a specific board.

**Input:**
```json
{
  "workspaceId": "669",
  "boardId": "LA1dW8i1TTK"
}
```

### Fetch Items
Lists items from a board with optional filtering.

**Input:**
```json
{
  "workspaceId": "669",
  "boardId": "LA1dW8i1TTK",
  "folderId": "optional_folder_id",
  "limit": 50
}
```

### Fetch Item Details
Gets detailed information about a specific item.

**Input:**
```json
{
  "workspaceId": "669",
  "boardId": "LA1dW8i1TTK",
  "itemId": "item_id_here"
}
```

### Update Item
Updates attributes of an existing item.

**Input:**
```json
{
  "workspaceId": "669",
  "boardId": "LA1dW8i1TTK",
  "itemId": "item_id_here",
  "values": {
    "attribute_id_1": "new_value_1",
    "attribute_id_2": "new_value_2"
  }
}
```

### Fetch View
Gets view configuration for a specific view.

**Input:**
```json
{
  "workspaceId": "669",
  "boardId": "LA1dW8i1TTK",
  "viewId": "view_id_here"
}
```

### Post Comment
Creates a comment on a specific item.

**Input:**
```json
{
  "workspaceId": "669",
  "boardId": "LA1dW8i1TTK",
  "itemId": "item_id_here",
  "content": "This is a comment"
}
```

## API Documentation

For detailed information about the StartInfinity API, refer to:
https://devdocs.startinfinity.com/2025-12-01.morava/

## Rate Limiting

The StartInfinity API has a rate limit of 180 requests per minute. The server will return an error message if the rate limit is exceeded.

## Error Handling

The server handles various error scenarios:
- Missing or invalid API tokens
- Missing required parameters
- API rate limiting (429 errors)
- Network errors
- Invalid API responses

All errors are returned in a user-friendly format.

## License

MIT


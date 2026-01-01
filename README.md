# StartInfinity MCP Server

A Model Context Protocol (MCP) server that provides comprehensive tools for managing StartInfinity projects via their API.

## Features

This MCP server exposes **21 tools** for interacting with the StartInfinity API:

### Workspace & Board Management
1. **fetch_dashboard** - Returns workspace information
2. **fetch_boards** - Lists all boards in a workspace
3. **fetch_board** - Gets detailed information about a specific board
4. **create_board** - Creates a new board in a workspace
5. **delete_board** - Deletes a board from a workspace

### Folder Management
6. **fetch_folders** - Lists all folders in a board
7. **create_folder** - Creates a new folder in a board
8. **delete_folder** - Deletes a folder from a board

### Item Management
9. **fetch_items** - Lists items from a board (with optional folder filter and pagination)
10. **fetch_items_by_attribute** - Fetches items filtered by attribute name and value
11. **fetch_item_details** - Gets detailed information about a specific item
12. **fetch_item_json** - Fetches item data as JSON with attribute names as keys
13. **create_item** - Creates a new item in a board folder
14. **update_item** - Updates attributes of an existing item
15. **delete_item** - Deletes (archives) an item from a board

### Attributes & Views
16. **fetch_attributes** - Lists all attributes for a board
17. **fetch_view** - Gets view configuration for a specific view

### Members & Formatting
18. **fetch_members** - Lists all members in a workspace
19. **fetch_items_formatted** - Fetches items with formatted attributes and titles for reporting

### Comments & Snapshots
20. **post_comment** - Creates a comment on a specific item
21. **fetch_folder_snapshot** - Provides a snapshot report of items in progress and pending

## Prerequisites

- Node.js 18+ 
- A StartInfinity account with API access
- A Personal Access Token from StartInfinity
- Docker (optional, for containerized deployment)

## Getting Started

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd startinfinity-mcp-server
   ```

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
   ```env
   STARTINFINITY_API_TOKEN=your_api_token_here
   STARTINFINITY_WORKSPACE_ID=your_workspace_id_here
   ```
   
   **Important:** The `STARTINFINITY_WORKSPACE_ID` is **required** and must be set in the environment variable. It is no longer accepted as a tool parameter.

4. **Build the project:**
   ```bash
   npm run build
   ```

5. **Run the server:**
   ```bash
   npm start
   ```

### Docker Setup

#### Building the Docker Image

```bash
docker build -t startinfinity-mcp-server:latest .
```

#### Running with Docker

**Using docker run:**
```bash
docker run -it --rm \
  -e STARTINFINITY_API_TOKEN=your_api_token_here \
  -e STARTINFINITY_WORKSPACE_ID=your_workspace_id_here \
  startinfinity-mcp-server:latest
```

**Using docker-compose:**

1. Create a `.env` file with your credentials:
   ```env
   STARTINFINITY_API_TOKEN=your_api_token_here
   STARTINFINITY_WORKSPACE_ID=your_workspace_id_here
   ```

2. Run with docker-compose:
   ```bash
   docker-compose up
   ```

### Connecting to Cursor AI

To connect this MCP server to Cursor AI:

1. Open Cursor settings
2. Navigate to MCP settings
3. Add a new MCP server with the following configuration:

**For local Node.js:**
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

**For Docker:**
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

**For docker-compose:**
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

Replace `/path/to/startinfinity-mcp-server` with the actual path to this project directory.

## Basic Usage

### Environment Variables

**Required:**
- `STARTINFINITY_API_TOKEN` - Your StartInfinity API token (obtain from your profile page)
- `STARTINFINITY_WORKSPACE_ID` - Your workspace ID (required, must be set in environment)

**Note:** The `workspaceId` parameter has been removed from all tools. The workspace ID is now always taken from the `STARTINFINITY_WORKSPACE_ID` environment variable.

### Common Workflows

#### 1. Fetching Items by Status

```json
{
  "tool": "fetch_items_by_attribute",
  "arguments": {
    "boardId": "LA1dW8i1TTK",
    "attributeName": "Status",
    "attributeValue": "Doing"
  }
}
```

#### 2. Creating a New Item

```json
{
  "tool": "create_item",
  "arguments": {
    "boardId": "LA1dW8i1TTK",
    "folderId": "folder_id_here",
    "values": {
      "54767acf-0832-4080-839c-5556bbbd9f10": "Item Name",
      "attribute_id_2": "value_2"
    }
  }
}
```

#### 3. Posting a Comment

```json
{
  "tool": "post_comment",
  "arguments": {
    "boardId": "LA1dW8i1TTK",
    "itemId": "item_id_here",
    "content": "This is a comment"
  }
}
```

#### 4. Getting Formatted Items

```json
{
  "tool": "fetch_items_formatted",
  "arguments": {
    "boardId": "LA1dW8i1TTK",
    "folderId": "optional_folder_id",
    "includeSummary": true
  }
}
```

## Tool Reference

### Fetch Dashboard
Returns workspace information.

**Input:**
```json
{}
```

### Fetch Boards
Lists all boards in a workspace.

**Input:**
```json
{}
```

### Fetch Board
Gets detailed information about a specific board.

**Input:**
```json
{
  "boardId": "LA1dW8i1TTK"
}
```

### Fetch Folders
Lists all folders in a board.

**Input:**
```json
{
  "boardId": "LA1dW8i1TTK"
}
```

### Fetch Items
Lists items from a board with optional filtering.

**Input:**
```json
{
  "boardId": "LA1dW8i1TTK",
  "folderId": "optional_folder_id",
  "limit": 50,
  "before": "optional_cursor",
  "after": "optional_cursor"
}
```

### Fetch Items by Attribute
Fetches items filtered by a specific attribute name and value.

**Input:**
```json
{
  "boardId": "LA1dW8i1TTK",
  "attributeName": "Status",
  "attributeValue": "Doing",
  "folderId": "optional_folder_id",
  "limit": 50
}
```

### Fetch Item Details
Gets detailed information about a specific item.

**Input:**
```json
{
  "boardId": "LA1dW8i1TTK",
  "itemId": "item_id_here"
}
```

### Update Item
Updates attributes of an existing item.

**Input:**
```json
{
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
  "boardId": "LA1dW8i1TTK",
  "viewId": "view_id_here"
}
```

### Fetch Attributes
Lists all attributes for a board to understand the attribute structure.

**Input:**
```json
{
  "boardId": "LA1dW8i1TTK"
}
```

### Fetch Members
Lists all members in a workspace to map member IDs to names.

**Input:**
```json
{}
```

### Fetch Items Formatted
Fetches items with formatted attributes and titles for reporting.

**Input:**
```json
{
  "boardId": "LA1dW8i1TTK",
  "folderId": "optional_folder_id",
  "limit": 50,
  "includeSummary": true
}
```

### Post Comment
Creates a comment on a specific item.

**Input:**
```json
{
  "boardId": "LA1dW8i1TTK",
  "itemId": "item_id_here",
  "content": "This is a comment"
}
```

### Fetch Folder Snapshot
Provides a snapshot report of items in progress and pending in a folder.

**Input:**
```json
{
  "boardId": "LA1dW8i1TTK",
  "folderName": "Folder Name",
  "folderId": "optional_folder_id"
}
```

### Fetch Item JSON
Fetches all available data for an item as JSON with attribute names as keys.

**Input:**
```json
{
  "boardId": "LA1dW8i1TTK",
  "itemId": "item_id_here"
}
```

### Create Item
Creates a new item in a board folder.

**Input:**
```json
{
  "boardId": "LA1dW8i1TTK",
  "folderId": "folder_id_here",
  "values": {
    "attribute_id": "value"
  }
}
```

### Delete Item
Deletes (archives) an item from a board.

**Input:**
```json
{
  "boardId": "LA1dW8i1TTK",
  "itemId": "item_id_here"
}
```

### Create Folder
Creates a new folder in a board.

**Input:**
```json
{
  "boardId": "LA1dW8i1TTK",
  "name": "Folder Name",
  "parentId": "optional_parent_folder_id"
}
```

### Delete Folder
Deletes a folder from a board.

**Input:**
```json
{
  "boardId": "LA1dW8i1TTK",
  "folderId": "folder_id_here"
}
```

### Create Board
Creates a new board in a workspace.

**Input:**
```json
{
  "name": "Board Name",
  "description": "Optional description"
}
```

### Delete Board
Deletes a board from a workspace.

**Input:**
```json
{
  "boardId": "board_id_here"
}
```

## Development

### Running in Development Mode

For development with auto-rebuild:

```bash
npm run dev
```

In another terminal:
```bash
npm start
```

### Testing

The project includes a comprehensive test suite with a mock API server.

**Run tests:**
```bash
npm test
```

**Run tests with coverage:**
```bash
npm run test:coverage
```

**Run tests in watch mode:**
```bash
npm run test:watch
```

**Run tests in Docker:**
```bash
# Start mock API server
docker-compose up -d mock-api

# Run tests
docker-compose run --rm --entrypoint sh startinfinity-mcp-server -c "npm install --include=dev && npm test"
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
- Missing `STARTINFINITY_WORKSPACE_ID` environment variable
- API rate limiting (429 errors)
- Network errors
- Invalid API responses

All errors are returned in a user-friendly format.

## License

MIT

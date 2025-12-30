#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { StartInfinityClient } from './api/startinfinity.js';

// Load environment variables
dotenv.config();

const API_TOKEN = process.env.STARTINFINITY_API_TOKEN;
const WORKSPACE_ID = process.env.STARTINFINITY_WORKSPACE_ID;

if (!API_TOKEN) {
  console.error('Error: STARTINFINITY_API_TOKEN environment variable is required');
  process.exit(1);
}

// Initialize API client
const apiClient = new StartInfinityClient({
  apiToken: API_TOKEN,
  workspaceId: WORKSPACE_ID,
});

// Create MCP server
const server = new Server(
  {
    name: 'startinfinity-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'fetch_dashboard',
        description: 'Fetches workspace information (dashboard)',
        inputSchema: {
          type: 'object',
          properties: {
            workspaceId: {
              type: 'string',
              description: 'Workspace ID (optional if STARTINFINITY_WORKSPACE_ID is set)',
            },
          },
        },
      },
      {
        name: 'fetch_boards',
        description: 'Lists all boards in a workspace',
        inputSchema: {
          type: 'object',
          properties: {
            workspaceId: {
              type: 'string',
              description: 'Workspace ID (optional if STARTINFINITY_WORKSPACE_ID is set)',
            },
          },
        },
      },
      {
        name: 'fetch_board',
        description: 'Gets detailed information about a specific board',
        inputSchema: {
          type: 'object',
          properties: {
            workspaceId: {
              type: 'string',
              description: 'Workspace ID',
            },
            boardId: {
              type: 'string',
              description: 'Board ID',
            },
          },
          required: ['workspaceId', 'boardId'],
        },
      },
      {
        name: 'fetch_items',
        description: 'Lists items from a board with optional folder filter and pagination',
        inputSchema: {
          type: 'object',
          properties: {
            workspaceId: {
              type: 'string',
              description: 'Workspace ID',
            },
            boardId: {
              type: 'string',
              description: 'Board ID',
            },
            folderId: {
              type: 'string',
              description: 'Optional folder ID to filter items',
            },
            limit: {
              type: 'number',
              description: 'Optional limit for pagination',
            },
            before: {
              type: 'string',
              description: 'Optional pagination cursor (before)',
            },
            after: {
              type: 'string',
              description: 'Optional pagination cursor (after)',
            },
          },
          required: ['workspaceId', 'boardId'],
        },
      },
      {
        name: 'fetch_item_details',
        description: 'Gets detailed information about a specific item',
        inputSchema: {
          type: 'object',
          properties: {
            workspaceId: {
              type: 'string',
              description: 'Workspace ID',
            },
            boardId: {
              type: 'string',
              description: 'Board ID',
            },
            itemId: {
              type: 'string',
              description: 'Item ID',
            },
          },
          required: ['workspaceId', 'boardId', 'itemId'],
        },
      },
      {
        name: 'update_item',
        description: 'Updates attributes of an existing item',
        inputSchema: {
          type: 'object',
          properties: {
            workspaceId: {
              type: 'string',
              description: 'Workspace ID',
            },
            boardId: {
              type: 'string',
              description: 'Board ID',
            },
            itemId: {
              type: 'string',
              description: 'Item ID',
            },
            values: {
              type: 'object',
              description: 'Object with attribute updates (key: attribute ID, value: new value)',
            },
          },
          required: ['workspaceId', 'boardId', 'itemId', 'values'],
        },
      },
      {
        name: 'fetch_view',
        description: 'Gets view configuration for a specific view',
        inputSchema: {
          type: 'object',
          properties: {
            workspaceId: {
              type: 'string',
              description: 'Workspace ID',
            },
            boardId: {
              type: 'string',
              description: 'Board ID',
            },
            viewId: {
              type: 'string',
              description: 'View ID',
            },
          },
          required: ['workspaceId', 'boardId', 'viewId'],
        },
      },
      {
        name: 'post_comment',
        description: 'Creates a comment on a specific item',
        inputSchema: {
          type: 'object',
          properties: {
            workspaceId: {
              type: 'string',
              description: 'Workspace ID',
            },
            boardId: {
              type: 'string',
              description: 'Board ID',
            },
            itemId: {
              type: 'string',
              description: 'Item ID',
            },
            content: {
              type: 'string',
              description: 'Comment content',
            },
          },
          required: ['workspaceId', 'boardId', 'itemId', 'content'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'fetch_dashboard': {
        const workspaceId = args?.workspaceId as string | undefined;
        const result = await apiClient.getWorkspace(workspaceId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'fetch_boards': {
        const workspaceId = args?.workspaceId as string | undefined;
        const result = await apiClient.getBoards(workspaceId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'fetch_board': {
        const workspaceId = args?.workspaceId as string;
        const boardId = args?.boardId as string;
        if (!workspaceId || !boardId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'workspaceId and boardId are required'
          );
        }
        const result = await apiClient.getBoard(workspaceId, boardId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'fetch_items': {
        const workspaceId = args?.workspaceId as string;
        const boardId = args?.boardId as string;
        if (!workspaceId || !boardId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'workspaceId and boardId are required'
          );
        }
        const folderId = args?.folderId as string | undefined;
        const limit = args?.limit as number | undefined;
        const before = args?.before as string | undefined;
        const after = args?.after as string | undefined;
        const result = await apiClient.getItems(workspaceId, boardId, {
          folderId,
          limit,
          before,
          after,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'fetch_item_details': {
        const workspaceId = args?.workspaceId as string;
        const boardId = args?.boardId as string;
        const itemId = args?.itemId as string;
        if (!workspaceId || !boardId || !itemId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'workspaceId, boardId, and itemId are required'
          );
        }
        const result = await apiClient.getItem(workspaceId, boardId, itemId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'update_item': {
        const workspaceId = args?.workspaceId as string;
        const boardId = args?.boardId as string;
        const itemId = args?.itemId as string;
        const values = args?.values as Record<string, any>;
        if (!workspaceId || !boardId || !itemId || !values) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'workspaceId, boardId, itemId, and values are required'
          );
        }
        const result = await apiClient.updateItem(workspaceId, boardId, itemId, values);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'fetch_view': {
        const workspaceId = args?.workspaceId as string;
        const boardId = args?.boardId as string;
        const viewId = args?.viewId as string;
        if (!workspaceId || !boardId || !viewId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'workspaceId, boardId, and viewId are required'
          );
        }
        const result = await apiClient.getView(workspaceId, boardId, viewId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'post_comment': {
        const workspaceId = args?.workspaceId as string;
        const boardId = args?.boardId as string;
        const itemId = args?.itemId as string;
        const content = args?.content as string;
        if (!workspaceId || !boardId || !itemId || !content) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'workspaceId, boardId, itemId, and content are required'
          );
        }
        const result = await apiClient.createComment(workspaceId, boardId, itemId, content);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new McpError(
      ErrorCode.InternalError,
      `Error executing tool ${name}: ${errorMessage}`
    );
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('StartInfinity MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});


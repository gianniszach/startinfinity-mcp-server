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
import { formatItems, formatItem, createItemSummary, createMemberMap, createSnapshotReport, formatItemAsJson, Attribute } from './utils/itemHelpers.js';

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
        name: 'fetch_folders',
        description: 'Lists all folders in a board',
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
        name: 'fetch_attributes',
        description: 'Lists all attributes for a board to understand the attribute structure',
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
        name: 'fetch_members',
        description: 'Lists all members in a workspace to map member IDs to names',
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
        name: 'fetch_items_formatted',
        description: 'Fetches items from a board/folder with formatted attributes and titles for reporting',
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
            includeSummary: {
              type: 'boolean',
              description: 'Include a summary report (default: true)',
            },
          },
          required: ['workspaceId', 'boardId'],
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
      {
        name: 'fetch_folder_snapshot',
        description: 'Processes all items under a folder (including subfolders) and provides a snapshot report of what is in progress now and what is pending in the near future',
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
            folderName: {
              type: 'string',
              description: 'Folder name to process (case-insensitive partial match)',
            },
            folderId: {
              type: 'string',
              description: 'Folder ID (optional, if provided folderName is ignored)',
            },
          },
          required: ['workspaceId', 'boardId'],
        },
      },
      {
        name: 'fetch_item_json',
        description: 'Fetches all available data for an item by ID and returns it as JSON with attribute names as keys and values (uses "-" for attributes without values)',
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

      case 'fetch_folders': {
        const workspaceId = args?.workspaceId as string;
        const boardId = args?.boardId as string;
        if (!workspaceId || !boardId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'workspaceId and boardId are required'
          );
        }
        const result = await apiClient.getFolders(workspaceId, boardId);
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

      case 'fetch_attributes': {
        const workspaceId = args?.workspaceId as string;
        const boardId = args?.boardId as string;
        if (!workspaceId || !boardId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'workspaceId and boardId are required'
          );
        }
        const result = await apiClient.getAttributes(workspaceId, boardId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'fetch_members': {
        const workspaceId = args?.workspaceId as string | undefined;
        const result = await apiClient.getMembers(workspaceId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'fetch_items_formatted': {
        const workspaceId = args?.workspaceId as string;
        const boardId = args?.boardId as string;
        const folderId = args?.folderId as string | undefined;
        const limit = args?.limit as number | undefined;
        const includeSummary = args?.includeSummary !== false; // default to true
        
        if (!workspaceId || !boardId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'workspaceId and boardId are required'
          );
        }

        // Fetch items, attributes, and members in parallel
        const [itemsResult, attributesResult, membersResult] = await Promise.all([
          apiClient.getItems(workspaceId, boardId, { folderId, limit }),
          apiClient.getAttributes(workspaceId, boardId),
          apiClient.getMembers(workspaceId).catch(() => ({ data: [] })), // Gracefully handle errors
        ]);

        const items = itemsResult.data || [];
        const attributes = attributesResult.data || [];
        const members = membersResult.data || [];

        // Create member map for resolving member IDs to names
        const memberMap = createMemberMap(members);

        // Find the Name attribute ID
        const nameAttribute = attributes.find((attr: any) => attr.name === 'Name');
        const nameAttributeId = nameAttribute?.id || '54767acf-0832-4080-839c-5556bbbd9f10';

        // Format items with member mapping
        const formattedItems = formatItems(items, attributes, nameAttributeId, memberMap);

        // Create response
        const response: any = {
          items: formattedItems,
          pagination: {
            has_more: itemsResult.has_more || false,
            before: itemsResult.before,
            after: itemsResult.after,
          },
        };

        // Add summary if requested
        if (includeSummary) {
          response.summary = createItemSummary(formattedItems);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2),
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

      case 'fetch_folder_snapshot': {
        const workspaceId = args?.workspaceId as string;
        const boardId = args?.boardId as string;
        const folderName = args?.folderName as string | undefined;
        const folderId = args?.folderId as string | undefined;
        
        if (!workspaceId || !boardId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'workspaceId and boardId are required'
          );
        }

        // Fetch folders, attributes, and members
        const [foldersResult, attributesResult, membersResult] = await Promise.all([
          apiClient.getFolders(workspaceId, boardId),
          apiClient.getAttributes(workspaceId, boardId),
          apiClient.getMembers(workspaceId).catch(() => ({ data: [] })),
        ]);

        const folders = foldersResult.data || [];
        const attributes = attributesResult.data || [];
        const members = membersResult.data || [];
        const memberMap = createMemberMap(members);

        // Find the target folder
        let targetFolder: any = null;
        if (folderId) {
          targetFolder = folders.find((f: any) => f.id === folderId);
        } else if (folderName) {
          const lowerFolderName = folderName.toLowerCase();
          targetFolder = folders.find((f: any) => 
            f.name && f.name.toLowerCase().includes(lowerFolderName)
          );
        }

        if (!targetFolder) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Folder not found: ${folderName || folderId}`
          );
        }

        // Recursively collect all folder IDs (parent + subfolders)
        const folderIds: string[] = [targetFolder.id];
        const collectSubfolders = (parentId: string) => {
          const subfolders = folders.filter((f: any) => f.parent_id === parentId);
          for (const subfolder of subfolders) {
            folderIds.push(subfolder.id);
            collectSubfolders(subfolder.id);
          }
        };
        collectSubfolders(targetFolder.id);

        // Fetch all items from all folders
        const allItems: any[] = [];
        for (const fid of folderIds) {
          let hasMore = true;
          let after: string | undefined = undefined;
          
          while (hasMore) {
            const itemsResult = await apiClient.getItems(workspaceId, boardId, {
              folderId: fid,
              limit: 100,
              after,
            });
            
            const items = itemsResult.data || [];
            allItems.push(...items);
            
            hasMore = itemsResult.has_more || false;
            after = itemsResult.after;
          }
        }

        // Find the Name attribute ID
        const nameAttribute = attributes.find((attr: any) => attr.name === 'Name');
        const nameAttributeId = nameAttribute?.id || '54767acf-0832-4080-839c-5556bbbd9f10';

        // Format all items
        const formattedItems = formatItems(allItems, attributes as Attribute[], nameAttributeId, memberMap);

        // Create snapshot report
        const snapshot = createSnapshotReport(formattedItems, attributes as Attribute[]);

        // Create response with folder information
        const response = {
          folder: {
            id: targetFolder.id,
            name: targetFolder.name,
            subfoldersProcessed: folderIds.length - 1,
          },
          snapshot: {
            inProgress: snapshot.inProgress.map(item => ({
              id: item.id,
              title: item.title,
              folderId: item.metadata.folder_id,
              attributes: item.attributes,
            })),
            pendingNearFuture: snapshot.pendingNearFuture.map(item => ({
              id: item.id,
              title: item.title,
              folderId: item.metadata.folder_id,
              attributes: item.attributes,
            })),
            summary: snapshot.summary,
          },
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      case 'fetch_item_json': {
        const workspaceId = args?.workspaceId as string;
        const boardId = args?.boardId as string;
        const itemId = args?.itemId as string;
        
        if (!workspaceId || !boardId || !itemId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'workspaceId, boardId, and itemId are required'
          );
        }

        // Fetch item, attributes, and members in parallel
        const [itemResult, attributesResult, membersResult] = await Promise.all([
          apiClient.getItem(workspaceId, boardId, itemId),
          apiClient.getAttributes(workspaceId, boardId),
          apiClient.getMembers(workspaceId).catch(() => ({ data: [] })),
        ]);

        const item = itemResult.data || itemResult;
        const attributes = attributesResult.data || [];
        const members = membersResult.data || [];
        const memberMap = createMemberMap(members);

        // Format item as JSON with attribute names as keys
        const itemJson = formatItemAsJson(item, attributes as Attribute[], memberMap);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(itemJson, null, 2),
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


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
import { formatItems, formatItem, createItemSummary, createMemberMap, createLabelMap, createSnapshotReport, formatItemAsJson, Attribute } from './utils/itemHelpers.js';

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
          properties: {},
        },
      },
      {
        name: 'fetch_boards',
        description: 'Lists all boards in a workspace',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'fetch_board',
        description: 'Gets detailed information about a specific board',
        inputSchema: {
          type: 'object',
          properties: {
            boardId: {
              type: 'string',
              description: 'Board ID',
            },
          },
          required: ['boardId'],
        },
      },
      {
        name: 'fetch_folders',
        description: 'Lists all folders in a board',
        inputSchema: {
          type: 'object',
          properties: {
            boardId: {
              type: 'string',
              description: 'Board ID',
            },
          },
          required: ['boardId'],
        },
      },
      {
        name: 'fetch_items',
        description: 'Lists items from a board with optional folder filter and pagination',
        inputSchema: {
          type: 'object',
          properties: {
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
          required: ['boardId'],
        },
      },
      {
        name: 'fetch_items_by_attribute',
        description: 'Fetches items from a board filtered by a specific attribute name and value. Supports partial matching (case-insensitive) for string values.',
        inputSchema: {
          type: 'object',
          properties: {
            boardId: {
              type: 'string',
              description: 'Board ID',
            },
            attributeName: {
              type: 'string',
              description: 'Name of the attribute to filter by (e.g., "Status", "Priority", "Assignee")',
            },
            attributeValue: {
              type: 'string',
              description: 'Value to match. For string attributes, this performs case-insensitive partial matching.',
            },
            folderId: {
              type: 'string',
              description: 'Optional folder ID to filter items',
            },
            limit: {
              type: 'number',
              description: 'Optional limit for pagination',
            },
          },
          required: ['boardId', 'attributeName', 'attributeValue'],
        },
      },
      {
        name: 'fetch_item_details',
        description: 'Gets detailed information about a specific item',
        inputSchema: {
          type: 'object',
          properties: {
            boardId: {
              type: 'string',
              description: 'Board ID',
            },
            itemId: {
              type: 'string',
              description: 'Item ID',
            },
          },
          required: ['boardId', 'itemId'],
        },
      },
      {
        name: 'update_item',
        description: 'Updates attributes of an existing item',
        inputSchema: {
          type: 'object',
          properties: {
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
          required: ['boardId', 'itemId', 'values'],
        },
      },
      {
        name: 'fetch_view',
        description: 'Gets view configuration for a specific view',
        inputSchema: {
          type: 'object',
          properties: {
            boardId: {
              type: 'string',
              description: 'Board ID',
            },
            viewId: {
              type: 'string',
              description: 'View ID',
            },
          },
          required: ['boardId', 'viewId'],
        },
      },
      {
        name: 'fetch_attributes',
        description: 'Lists all attributes for a board to understand the attribute structure',
        inputSchema: {
          type: 'object',
          properties: {
            boardId: {
              type: 'string',
              description: 'Board ID',
            },
          },
          required: ['boardId'],
        },
      },
      {
        name: 'fetch_members',
        description: 'Lists all members in a workspace to map member IDs to names',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'fetch_items_formatted',
        description: 'Fetches items from a board/folder with formatted attributes and titles for reporting',
        inputSchema: {
          type: 'object',
          properties: {
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
          required: ['boardId'],
        },
      },
      {
        name: 'post_comment',
        description: 'Creates a comment on a specific item',
        inputSchema: {
          type: 'object',
          properties: {
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
          required: ['boardId', 'itemId', 'content'],
        },
      },
      {
        name: 'fetch_folder_snapshot',
        description: 'Processes all items under a folder (including subfolders) and provides a snapshot report of what is in progress now and what is pending in the near future',
        inputSchema: {
          type: 'object',
          properties: {
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
          required: ['boardId'],
        },
      },
      {
        name: 'fetch_item_json',
        description: 'Fetches all available data for an item by ID and returns it as JSON with attribute names as keys and values (uses "-" for attributes without values)',
        inputSchema: {
          type: 'object',
          properties: {
            boardId: {
              type: 'string',
              description: 'Board ID',
            },
            itemId: {
              type: 'string',
              description: 'Item ID',
            },
          },
          required: ['boardId', 'itemId'],
        },
      },
      {
        name: 'create_item',
        description: 'Creates a new item in a board folder',
        inputSchema: {
          type: 'object',
          properties: {
            boardId: {
              type: 'string',
              description: 'Board ID',
            },
            folderId: {
              type: 'string',
              description: 'Folder ID where the item will be created',
            },
            values: {
              type: 'object',
              description: 'Object with attribute values (key: attribute ID, value: attribute value)',
            },
          },
          required: ['boardId', 'folderId', 'values'],
        },
      },
      {
        name: 'delete_item',
        description: 'Deletes (archives) an item from a board',
        inputSchema: {
          type: 'object',
          properties: {
            boardId: {
              type: 'string',
              description: 'Board ID',
            },
            itemId: {
              type: 'string',
              description: 'Item ID to delete',
            },
          },
          required: ['boardId', 'itemId'],
        },
      },
      {
        name: 'create_folder',
        description: 'Creates a new folder in a board',
        inputSchema: {
          type: 'object',
          properties: {
            boardId: {
              type: 'string',
              description: 'Board ID',
            },
            name: {
              type: 'string',
              description: 'Folder name',
            },
            parentId: {
              type: 'string',
              description: 'Optional parent folder ID for nested folders',
            },
          },
          required: ['boardId', 'name'],
        },
      },
      {
        name: 'delete_folder',
        description: 'Deletes a folder from a board',
        inputSchema: {
          type: 'object',
          properties: {
            boardId: {
              type: 'string',
              description: 'Board ID',
            },
            folderId: {
              type: 'string',
              description: 'Folder ID to delete',
            },
          },
          required: ['boardId', 'folderId'],
        },
      },
      {
        name: 'create_board',
        description: 'Creates a new board in a workspace',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Board name',
            },
            description: {
              type: 'string',
              description: 'Optional board description',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'delete_board',
        description: 'Deletes a board from a workspace',
        inputSchema: {
          type: 'object',
          properties: {
            boardId: {
              type: 'string',
              description: 'Board ID to delete',
            },
          },
          required: ['boardId'],
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
        if (!WORKSPACE_ID) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'STARTINFINITY_WORKSPACE_ID environment variable is required.'
          );
        }
        const result = await apiClient.getWorkspace(WORKSPACE_ID);
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
        if (!WORKSPACE_ID) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'STARTINFINITY_WORKSPACE_ID environment variable is required.'
          );
        }
        const result = await apiClient.getBoards(WORKSPACE_ID);
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
        const boardId = args?.boardId as string;
        if (!boardId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'boardId is required'
          );
        }
        if (!WORKSPACE_ID) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'STARTINFINITY_WORKSPACE_ID environment variable is required.'
          );
        }
        const result = await apiClient.getBoard(WORKSPACE_ID, boardId);
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
        const boardId = args?.boardId as string;
        if (!boardId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'boardId is required'
          );
        }
        if (!WORKSPACE_ID) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'STARTINFINITY_WORKSPACE_ID environment variable is required.'
          );
        }
        const result = await apiClient.getFolders(WORKSPACE_ID, boardId);
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
        const boardId = args?.boardId as string;
        if (!boardId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'boardId is required'
          );
        }
        if (!WORKSPACE_ID) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'STARTINFINITY_WORKSPACE_ID environment variable is required.'
          );
        }
        const folderId = args?.folderId as string | undefined;
        const limit = args?.limit as number | undefined;
        const before = args?.before as string | undefined;
        const after = args?.after as string | undefined;
        const result = await apiClient.getItems(WORKSPACE_ID, boardId, {
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

      case 'fetch_items_by_attribute': {
        const boardId = args?.boardId as string;
        const attributeName = args?.attributeName as string;
        const attributeValue = args?.attributeValue as string;
        if (!boardId || !attributeName || !attributeValue) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'boardId, attributeName, and attributeValue are required'
          );
        }
        const folderId = args?.folderId as string | undefined;
        const limit = args?.limit as number | undefined;

        // Use workspace ID from environment (required)
        if (!WORKSPACE_ID) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'STARTINFINITY_WORKSPACE_ID environment variable is required.'
          );
        }

        // Fetch items, attributes (with full details), and members in parallel
        const [itemsResult, attributesResult, membersResult] = await Promise.all([
          apiClient.getItems(WORKSPACE_ID, boardId, { folderId, limit }),
          apiClient.getAttributes(WORKSPACE_ID, boardId, ['options', 'values', 'labels']),
          apiClient.getMembers(WORKSPACE_ID).catch(() => ({ data: [] })),
        ]);

        const items = itemsResult.data || [];
        const attributes = attributesResult.data || [];
        const members = membersResult.data || [];

        // Find the attribute by name (case-insensitive)
        const targetAttribute = attributes.find((attr: Attribute) =>
          attr.name.toLowerCase() === attributeName.toLowerCase()
        );

        if (!targetAttribute) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Attribute "${attributeName}" not found. Available attributes: ${attributes.map((a: Attribute) => a.name).join(', ')}`
          );
        }

        // Create member map for resolving member IDs to names
        const memberMap = createMemberMap(members);
        
        // Create label map for resolving label IDs to names
        // Try to extract label information from the target attribute specifically
        const labelMap = createLabelMap(attributes);
        
        // If label map is empty for label/select types, try to build it from the raw attribute object
        if ((targetAttribute.type === 'label' || targetAttribute.type === 'select') && Object.keys(labelMap).length === 0) {
          // Try to find label information in the raw attribute object - check all possible locations
          const rawAttr = targetAttribute as any;
          
          // Helper function to recursively search for label options
          const findLabelOptions = (obj: any, path: string = ''): void => {
            if (!obj || typeof obj !== 'object') return;
            
            // Check if this looks like a label option
            if (obj.id && (obj.name || obj.label || obj.title || obj.text)) {
              const name = obj.name || obj.label || obj.title || obj.text;
              if (obj.id && name) {
                labelMap[obj.id] = name;
              }
            }
            
            // Recursively check arrays and objects
            if (Array.isArray(obj)) {
              obj.forEach((item, idx) => findLabelOptions(item, `${path}[${idx}]`));
            } else {
              for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                  // Skip circular references and very deep nesting
                  if (path.split('.').length < 5) {
                    findLabelOptions(obj[key], path ? `${path}.${key}` : key);
                  }
                }
              }
            }
          };
          
          // Search the entire attribute object
          findLabelOptions(rawAttr);
        }

        // Find the Name attribute ID
        const nameAttribute = attributes.find((attr: Attribute) => attr.name === 'Name');
        const nameAttributeId = nameAttribute?.id || '54767acf-0832-4080-839c-5556bbbd9f10';

        // Format items
        const formattedItems = formatItems(items, attributes, nameAttributeId, memberMap, labelMap);

        // For label/select type attributes, find matching label IDs by name
        let matchingLabelIds: string[] = [];
        if (targetAttribute.type === 'label' || targetAttribute.type === 'select') {
          const searchValue = attributeValue.toLowerCase();
          // Find all label IDs whose names match the search term
          matchingLabelIds = Object.entries(labelMap)
            .filter(([id, name]) => name.toLowerCase().includes(searchValue))
            .map(([id]) => id);
        }

        // Filter items by attribute value
        const filteredItems = formattedItems.filter((item) => {
          const attrData = item.attributes[targetAttribute.name];
          if (!attrData || attrData.value === undefined || attrData.value === null) {
            return false;
          }

          // For label/select types, match against discovered label IDs
          if ((targetAttribute.type === 'label' || targetAttribute.type === 'select') && matchingLabelIds.length > 0) {
            // Check if any of the item's label IDs (from rawValue) match the discovered IDs
            const itemLabelIds = Array.isArray(attrData.rawValue) ? attrData.rawValue : [];
            return itemLabelIds.some((labelId: string) => matchingLabelIds.includes(labelId));
          }

          // For other types, use the existing logic
          const itemValue = attrData.value;
          const searchValue = attributeValue.toLowerCase();

          // Handle different value types
          if (Array.isArray(itemValue)) {
            // For array values (e.g., members, tags), check if any element matches
            return itemValue.some((val: any) =>
              String(val).toLowerCase().includes(searchValue)
            );
          } else {
            // For string values, perform case-insensitive partial matching
            return String(itemValue).toLowerCase().includes(searchValue);
          }
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  filteredItems,
                  filter: {
                    attributeName: targetAttribute.name,
                    attributeValue: attributeValue,
                    totalItems: items.length,
                    filteredCount: filteredItems.length,
                  },
                  pagination: {
                    has_more: itemsResult.has_more || false,
                    before: itemsResult.before,
                    after: itemsResult.after,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'fetch_item_details': {
        const boardId = args?.boardId as string;
        const itemId = args?.itemId as string;
        if (!boardId || !itemId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'boardId and itemId are required'
          );
        }
        
        // Use workspace ID from environment (required)
        if (!WORKSPACE_ID) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'STARTINFINITY_WORKSPACE_ID environment variable is required.'
          );
        }
        
        const result = await apiClient.getItem(WORKSPACE_ID, boardId, itemId);
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
        const boardId = args?.boardId as string;
        const itemId = args?.itemId as string;
        const values = args?.values as Record<string, any>;
        if (!boardId || !itemId || !values) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'boardId, itemId, and values are required'
          );
        }
        if (!WORKSPACE_ID) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'STARTINFINITY_WORKSPACE_ID environment variable is required.'
          );
        }
        const result = await apiClient.updateItem(WORKSPACE_ID, boardId, itemId, values);
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
        const boardId = args?.boardId as string;
        const viewId = args?.viewId as string;
        if (!boardId || !viewId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'boardId and viewId are required'
          );
        }
        if (!WORKSPACE_ID) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'STARTINFINITY_WORKSPACE_ID environment variable is required.'
          );
        }
        const result = await apiClient.getView(WORKSPACE_ID, boardId, viewId);
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
        const boardId = args?.boardId as string;
        if (!boardId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'boardId is required'
          );
        }
        
        // Use workspace ID from environment (required)
        if (!WORKSPACE_ID) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'STARTINFINITY_WORKSPACE_ID environment variable is required.'
          );
        }
        
        const result = await apiClient.getAttributes(WORKSPACE_ID, boardId, ['options', 'values', 'labels']);
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
        if (!WORKSPACE_ID) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'STARTINFINITY_WORKSPACE_ID environment variable is required.'
          );
        }
        const result = await apiClient.getMembers(WORKSPACE_ID);
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
        const boardId = args?.boardId as string;
        const folderId = args?.folderId as string | undefined;
        const limit = args?.limit as number | undefined;
        const includeSummary = args?.includeSummary !== false; // default to true
        
        if (!boardId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'boardId is required'
          );
        }
        if (!WORKSPACE_ID) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'STARTINFINITY_WORKSPACE_ID environment variable is required.'
          );
        }

        // Fetch items, attributes (with full details), and members in parallel
        const [itemsResult, attributesResult, membersResult] = await Promise.all([
          apiClient.getItems(WORKSPACE_ID, boardId, { folderId, limit }),
          apiClient.getAttributes(WORKSPACE_ID, boardId, ['options', 'values', 'labels']),
          apiClient.getMembers(WORKSPACE_ID).catch(() => ({ data: [] })), // Gracefully handle errors
        ]);

        const items = itemsResult.data || [];
        const attributes = attributesResult.data || [];
        const members = membersResult.data || [];

        // Create member map for resolving member IDs to names
        const memberMap = createMemberMap(members);
        
        // Create label map for resolving label IDs to names
        const labelMap = createLabelMap(attributes);

        // Find the Name attribute ID
        const nameAttribute = attributes.find((attr: any) => attr.name === 'Name');
        const nameAttributeId = nameAttribute?.id || '54767acf-0832-4080-839c-5556bbbd9f10';

        // Format items with member and label mapping
        const formattedItems = formatItems(items, attributes, nameAttributeId, memberMap, labelMap);

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
        const boardId = args?.boardId as string;
        const itemId = args?.itemId as string;
        const content = args?.content as string;
        if (!boardId || !itemId || !content) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'boardId, itemId, and content are required'
          );
        }
        
        // Use workspace ID from environment (required)
        if (!WORKSPACE_ID) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'STARTINFINITY_WORKSPACE_ID environment variable is required.'
          );
        }
        
        const result = await apiClient.createComment(WORKSPACE_ID, boardId, itemId, content);
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
        const boardId = args?.boardId as string;
        const folderName = args?.folderName as string | undefined;
        const folderId = args?.folderId as string | undefined;
        
        if (!boardId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'boardId is required'
          );
        }
        if (!WORKSPACE_ID) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'STARTINFINITY_WORKSPACE_ID environment variable is required.'
          );
        }

        // Fetch folders, attributes (with full details), and members
        const [foldersResult, attributesResult, membersResult] = await Promise.all([
          apiClient.getFolders(WORKSPACE_ID, boardId),
          apiClient.getAttributes(WORKSPACE_ID, boardId, ['options', 'values', 'labels']),
          apiClient.getMembers(WORKSPACE_ID).catch(() => ({ data: [] })),
        ]);

        const folders = foldersResult.data || [];
        const attributes = attributesResult.data || [];
        const members = membersResult.data || [];
        const memberMap = createMemberMap(members);
        const labelMap = createLabelMap(attributes);

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
            const itemsResult = await apiClient.getItems(WORKSPACE_ID, boardId, {
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
        const formattedItems = formatItems(allItems, attributes as Attribute[], nameAttributeId, memberMap, labelMap);

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
        const boardId = args?.boardId as string;
        const itemId = args?.itemId as string;
        
        if (!boardId || !itemId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'boardId and itemId are required'
          );
        }
        if (!WORKSPACE_ID) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'STARTINFINITY_WORKSPACE_ID environment variable is required.'
          );
        }

        // Fetch item, attributes (with full details), and members in parallel
        const [itemResult, attributesResult, membersResult] = await Promise.all([
          apiClient.getItem(WORKSPACE_ID, boardId, itemId),
          apiClient.getAttributes(WORKSPACE_ID, boardId, ['options', 'values', 'labels']),
          apiClient.getMembers(WORKSPACE_ID).catch(() => ({ data: [] })),
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

      case 'create_item': {
        const boardId = args?.boardId as string;
        const folderId = args?.folderId as string;
        const values = args?.values as Record<string, any>;
        if (!boardId || !folderId || !values) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'boardId, folderId, and values are required'
          );
        }
        if (!WORKSPACE_ID) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'STARTINFINITY_WORKSPACE_ID environment variable is required.'
          );
        }
        const result = await apiClient.createItem(WORKSPACE_ID, boardId, folderId, values);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'delete_item': {
        const boardId = args?.boardId as string;
        const itemId = args?.itemId as string;
        if (!boardId || !itemId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'boardId and itemId are required'
          );
        }
        if (!WORKSPACE_ID) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'STARTINFINITY_WORKSPACE_ID environment variable is required.'
          );
        }
        const result = await apiClient.deleteItem(WORKSPACE_ID, boardId, itemId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'create_folder': {
        const boardId = args?.boardId as string;
        const name = args?.name as string;
        const parentId = args?.parentId as string | undefined;
        if (!boardId || !name) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'boardId and name are required'
          );
        }
        if (!WORKSPACE_ID) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'STARTINFINITY_WORKSPACE_ID environment variable is required.'
          );
        }
        const result = await apiClient.createFolder(WORKSPACE_ID, boardId, name, parentId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'delete_folder': {
        const boardId = args?.boardId as string;
        const folderId = args?.folderId as string;
        if (!boardId || !folderId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'boardId and folderId are required'
          );
        }
        if (!WORKSPACE_ID) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'STARTINFINITY_WORKSPACE_ID environment variable is required.'
          );
        }
        const result = await apiClient.deleteFolder(WORKSPACE_ID, boardId, folderId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'create_board': {
        const name = args?.name as string;
        const description = args?.description as string | undefined;
        if (!name) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'name is required'
          );
        }
        if (!WORKSPACE_ID) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'STARTINFINITY_WORKSPACE_ID environment variable is required.'
          );
        }
        const result = await apiClient.createBoard(WORKSPACE_ID, name, description);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'delete_board': {
        const boardId = args?.boardId as string;
        if (!boardId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'boardId is required'
          );
        }
        if (!WORKSPACE_ID) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'STARTINFINITY_WORKSPACE_ID environment variable is required.'
          );
        }
        const result = await apiClient.deleteBoard(WORKSPACE_ID, boardId);
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


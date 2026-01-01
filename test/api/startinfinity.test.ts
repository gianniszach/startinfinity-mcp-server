import { StartInfinityClient } from '../../src/api/startinfinity.js';
import axios from 'axios';

// Mock API URL should include /api/v2 since the client expects it in the baseURL
const MOCK_API_URL = (process.env.MOCK_API_URL || 'http://localhost:3001') + '/api/v2';

describe('StartInfinityClient', () => {
  let client: StartInfinityClient;

  beforeAll(async () => {
    // Wait for the mock API server to be ready by making a test request
    let retries = 10;
    while (retries > 0) {
      try {
        await axios.post(`${MOCK_API_URL}/workspaces/669/boards/test/items`, { folder_id: 'test', values: [] });
        break;
      } catch (error: any) {
        if (error.response && error.response.status !== 404) {
          // Server is responding, break
          break;
        }
        retries--;
        if (retries === 0) {
          // Don't throw the full error object to avoid circular structure issues
          throw new Error(`Mock API server not ready after ${retries} retries`);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    // Create client with mock API URL
    client = new StartInfinityClient({
      apiToken: 'test-token',
      workspaceId: '669',
    });
    // Override the baseURL to point to mock server
    (client as any).client.defaults.baseURL = MOCK_API_URL;
  });

  describe('createItem', () => {
    it('should create an item successfully', async () => {
      const workspaceId = '669';
      const boardId = 'LA1dW8i1TTK';
      const folderId = 'f1f2f3f4-f5f6-7890-abcd-ef1234567890';
      const values = {
        '54767acf-0832-4080-839c-5556bbbd9f10': 'Test Item Name',
      };

      const result = await client.createItem(workspaceId, boardId, folderId, values);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.object).toBe('item');
      expect(result.folder_id).toBe(folderId);
    });

    it('should handle API errors', async () => {
      const client = new StartInfinityClient({
        apiToken: 'test-token',
      });
      (client as any).client.defaults.baseURL = 'http://localhost:9999'; // Invalid port

      await expect(
        client.createItem('669', 'LA1dW8i1TTK', 'folder-id', {})
      ).rejects.toThrow();
    });
  });

  describe('deleteItem', () => {
    it('should delete an item successfully', async () => {
      const workspaceId = '669';
      const boardId = 'LA1dW8i1TTK';
      const itemId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

      const result = await client.deleteItem(workspaceId, boardId, itemId);

      expect(result).toBeDefined();
      expect(result.id).toBe(itemId);
      expect(result.deleted).toBe(true);
    });
  });

  describe('createFolder', () => {
    it('should create a folder successfully', async () => {
      const workspaceId = '669';
      const boardId = 'LA1dW8i1TTK';
      const name = 'Test Folder';

      const result = await client.createFolder(workspaceId, boardId, name);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.object).toBe('folder');
      expect(result.name).toBe(name);
    });

    it('should create a nested folder with parentId', async () => {
      const workspaceId = '669';
      const boardId = 'LA1dW8i1TTK';
      const name = 'Nested Folder';
      const parentId = 'parent-folder-id';

      const result = await client.createFolder(workspaceId, boardId, name, parentId);

      expect(result).toBeDefined();
      expect(result.name).toBe(name);
    });
  });

  describe('deleteFolder', () => {
    it('should delete a folder successfully', async () => {
      const workspaceId = '669';
      const boardId = 'LA1dW8i1TTK';
      const folderId = 'f1f2f3f4-f5f6-7890-abcd-ef1234567890';

      const result = await client.deleteFolder(workspaceId, boardId, folderId);

      expect(result).toBeDefined();
      expect(result.id).toBe(folderId);
      expect(result.deleted).toBe(true);
    });
  });

  describe('createBoard', () => {
    it('should create a board successfully', async () => {
      const workspaceId = '669';
      const name = 'Test Board';

      const result = await client.createBoard(workspaceId, name);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.object).toBe('board');
      expect(result.name).toBe(name);
    });

    it('should create a board with description', async () => {
      const workspaceId = '669';
      const name = 'Test Board';
      const description = 'Test Description';

      const result = await client.createBoard(workspaceId, name, description);

      expect(result).toBeDefined();
      expect(result.name).toBe(name);
      expect(result.description).toBe(description);
    });
  });

  describe('deleteBoard', () => {
    it('should delete a board successfully', async () => {
      const workspaceId = '669';
      const boardId = 'b1b2b3b4-b5b6-7890-abcd-ef1234567890';

      const result = await client.deleteBoard(workspaceId, boardId);

      expect(result).toBeDefined();
      expect(result.id).toBe(boardId);
      expect(result.deleted).toBe(true);
    });
  });
});


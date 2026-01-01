import { StartInfinityClient } from '../../src/api/startinfinity.js';

// Mock API URL should include /api/v2 since the client expects it in the baseURL
const MOCK_API_URL = (process.env.MOCK_API_URL || 'http://localhost:3001') + '/api/v2';

describe('create_folder tool', () => {
  let client: StartInfinityClient;

  beforeAll(async () => {
    client = new StartInfinityClient({
      apiToken: 'test-token',
      workspaceId: '669',
    });
    (client as any).client.defaults.baseURL = MOCK_API_URL;
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  it('should create a folder with valid parameters', async () => {
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

  it('should handle missing required parameters', async () => {
    await expect(
      client.createFolder('', 'boardId', '')
    ).rejects.toThrow();
  });
});


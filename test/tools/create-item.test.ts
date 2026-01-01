import { StartInfinityClient } from '../../src/api/startinfinity.js';

// Mock API URL should include /api/v2 since the client expects it in the baseURL
const MOCK_API_URL = (process.env.MOCK_API_URL || 'http://localhost:3001') + '/api/v2';

describe('create_item tool', () => {
  let client: StartInfinityClient;

  beforeAll(async () => {
    client = new StartInfinityClient({
      apiToken: 'test-token',
      workspaceId: '669',
    });
    (client as any).client.defaults.baseURL = MOCK_API_URL;
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  it('should create an item with valid parameters', async () => {
    const workspaceId = '669';
    const boardId = 'LA1dW8i1TTK';
    const folderId = 'f1f2f3f4-f5f6-7890-abcd-ef1234567890';
    const values = {
      '54767acf-0832-4080-839c-5556bbbd9f10': 'Test Item',
    };

    const result = await client.createItem(workspaceId, boardId, folderId, values);

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.object).toBe('item');
  });

  it('should handle missing required parameters', async () => {
    await expect(
      client.createItem('', 'boardId', 'folderId', {})
    ).rejects.toThrow();
  });
});


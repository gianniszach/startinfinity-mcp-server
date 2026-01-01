import { StartInfinityClient } from '../../src/api/startinfinity.js';

// Mock API URL should include /api/v2 since the client expects it in the baseURL
const MOCK_API_URL = (process.env.MOCK_API_URL || 'http://localhost:3001') + '/api/v2';

describe('delete_board tool', () => {
  let client: StartInfinityClient;

  beforeAll(async () => {
    client = new StartInfinityClient({
      apiToken: 'test-token',
      workspaceId: '669',
    });
    (client as any).client.defaults.baseURL = MOCK_API_URL;
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  it('should delete a board successfully', async () => {
    const workspaceId = '669';
    const boardId = 'b1b2b3b4-b5b6-7890-abcd-ef1234567890';

    const result = await client.deleteBoard(workspaceId, boardId);

    expect(result).toBeDefined();
    expect(result.id).toBe(boardId);
    expect(result.deleted).toBe(true);
  });

  it('should handle missing required parameters', async () => {
    await expect(
      client.deleteBoard('', 'boardId')
    ).rejects.toThrow();
  });
});


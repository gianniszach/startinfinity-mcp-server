import { StartInfinityClient } from '../../src/api/startinfinity.js';

// Mock API URL should include /api/v2 since the client expects it in the baseURL
const MOCK_API_URL = (process.env.MOCK_API_URL || 'http://localhost:3001') + '/api/v2';

describe('create_board tool', () => {
  let client: StartInfinityClient;

  beforeAll(async () => {
    client = new StartInfinityClient({
      apiToken: 'test-token',
      workspaceId: '669',
    });
    (client as any).client.defaults.baseURL = MOCK_API_URL;
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  it('should create a board with valid parameters', async () => {
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

  it('should handle missing required parameters', async () => {
    await expect(
      client.createBoard('', '')
    ).rejects.toThrow();
  });
});


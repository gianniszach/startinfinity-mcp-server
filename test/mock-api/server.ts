import express, { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const app: Express = express();
app.use(express.json());

// Use process.cwd() to get the project root, then navigate to responses
// In Docker container, responses are mounted at /app/responses
const RESPONSES_DIR = process.env.RESPONSES_DIR || path.join(process.cwd(), 'test', 'mock-api', 'responses');

// Helper function to load response file
function loadResponse(filename: string): any {
  const filePath = path.join(RESPONSES_DIR, filename);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }
  return null;
}

// Helper function to send response
function sendResponse(res: Response, status: number, data: any) {
  res.status(status).json(data);
}

// Create item endpoint
app.post('/api/v2/workspaces/:workspaceId/boards/:boardId/items', (req: Request, res: Response) => {
  const { workspaceId, boardId } = req.params;
  const response = loadResponse('create-item-success.json');
  if (response) {
    sendResponse(res, 200, response);
  } else {
    sendResponse(res, 200, {
      id: 'mock-item-id',
      object: 'item',
      folder_id: req.body.folder_id,
      values: req.body.values || [],
      created_at: new Date().toISOString(),
    });
  }
});

// Delete item endpoint
app.delete('/api/v2/workspaces/:workspaceId/boards/:boardId/items/:itemId', (req: Request, res: Response) => {
  const { workspaceId, boardId, itemId } = req.params;
  const response = loadResponse('delete-item-success.json');
  if (response) {
    sendResponse(res, 200, response);
  } else {
    sendResponse(res, 200, {
      id: itemId,
      object: 'item',
      deleted: true,
    });
  }
});

// Create folder endpoint
app.post('/api/v2/workspaces/:workspaceId/boards/:boardId/folders', (req: Request, res: Response) => {
  const { workspaceId, boardId } = req.params;
  const response = loadResponse('create-folder-success.json');
  if (response) {
    // Override name and parent_id with actual request values
    response.name = req.body.name;
    if (req.body.parent_id !== undefined) {
      response.parent_id = req.body.parent_id || null;
    }
    sendResponse(res, 200, response);
  } else {
    sendResponse(res, 200, {
      id: 'mock-folder-id',
      object: 'folder',
      name: req.body.name,
      parent_id: req.body.parent_id || null,
      board_id: boardId,
      created_at: new Date().toISOString(),
    });
  }
});

// Delete folder endpoint
app.delete('/api/v2/workspaces/:workspaceId/boards/:boardId/folders/:folderId', (req: Request, res: Response) => {
  const { workspaceId, boardId, folderId } = req.params;
  const response = loadResponse('delete-folder-success.json');
  if (response) {
    sendResponse(res, 200, response);
  } else {
    sendResponse(res, 200, {
      id: folderId,
      object: 'folder',
      deleted: true,
    });
  }
});

// Create board endpoint
app.post('/api/v2/workspaces/:workspaceId/boards', (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const response = loadResponse('create-board-success.json');
  if (response) {
    // Override name and description with actual request values
    response.name = req.body.name;
    if (req.body.description !== undefined) {
      response.description = req.body.description || null;
    }
    sendResponse(res, 200, response);
  } else {
    sendResponse(res, 200, {
      id: 'mock-board-id',
      object: 'board',
      name: req.body.name,
      description: req.body.description || null,
      workspace_id: workspaceId,
      created_at: new Date().toISOString(),
    });
  }
});

// Delete board endpoint
app.delete('/api/v2/workspaces/:workspaceId/boards/:boardId', (req: Request, res: Response) => {
  const { workspaceId, boardId } = req.params;
  const response = loadResponse('delete-board-success.json');
  if (response) {
    sendResponse(res, 200, response);
  } else {
    sendResponse(res, 200, {
      id: boardId,
      object: 'board',
      deleted: true,
    });
  }
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Mock API Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

const PORT = process.env.MOCK_API_PORT || 3001;

// Only start server if run directly (not imported)
// Check if this file is being run directly by checking process.argv
if (process.argv[1] && (process.argv[1].includes('server.ts') || process.argv[1].includes('server.js'))) {
  app.listen(PORT, () => {
    console.log(`Mock API server running on port ${PORT}`);
  });
}

export default app;


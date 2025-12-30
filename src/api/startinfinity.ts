import axios, { AxiosInstance, AxiosError } from 'axios';

export interface StartInfinityClientConfig {
  apiToken: string;
  workspaceId?: string;
}

export interface GetItemsOptions {
  folderId?: string;
  limit?: number;
  before?: string;
  after?: string;
}

export interface UpdateItemValues {
  [attributeId: string]: any;
}

export class StartInfinityClient {
  private client: AxiosInstance;
  private workspaceId?: string;

  constructor(config: StartInfinityClientConfig) {
    this.workspaceId = config.workspaceId;
    this.client = axios.create({
      baseURL: 'https://app.startinfinity.com/api/v2',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Version': '2025-12-01.morava',
      },
    });
  }

  private async request<T>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: string, data?: any): Promise<T> {
    try {
      const response = await this.client.request<T>({
        method,
        url,
        data,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string; error?: string }>;
        if (axiosError.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        const errorMessage = axiosError.response?.data?.message || 
                           axiosError.response?.data?.error || 
                           axiosError.message || 
                           'Unknown error occurred';
        throw new Error(`StartInfinity API error: ${errorMessage}`);
      }
      throw error;
    }
  }

  private getWorkspaceId(workspaceId?: string): string {
    const id = workspaceId || this.workspaceId;
    if (!id) {
      throw new Error('Workspace ID is required. Provide it as a parameter or set STARTINFINITY_WORKSPACE_ID environment variable.');
    }
    return id;
  }

  async getWorkspace(workspaceId?: string): Promise<any> {
    const wsId = this.getWorkspaceId(workspaceId);
    return this.request<any>('GET', `/workspaces/${wsId}`);
  }

  async getBoards(workspaceId?: string): Promise<any> {
    const wsId = this.getWorkspaceId(workspaceId);
    return this.request<any>('GET', `/workspaces/${wsId}/boards`);
  }

  async getBoard(workspaceId: string, boardId: string): Promise<any> {
    return this.request<any>('GET', `/workspaces/${workspaceId}/boards/${boardId}`);
  }

  async getItems(workspaceId: string, boardId: string, options?: GetItemsOptions): Promise<any> {
    const params = new URLSearchParams();
    if (options?.folderId) {
      params.append('folder_id', options.folderId);
    }
    if (options?.limit) {
      params.append('limit', options.limit.toString());
    }
    if (options?.before) {
      params.append('before', options.before);
    }
    if (options?.after) {
      params.append('after', options.after);
    }
    // Add expand parameter to include values
    params.append('expand[]', 'values');
    
    const queryString = params.toString();
    const url = `/workspaces/${workspaceId}/boards/${boardId}/items${queryString ? `?${queryString}` : ''}`;
    return this.request<any>('GET', url);
  }

  async getItem(workspaceId: string, boardId: string, itemId: string): Promise<any> {
    // Add expand parameter to include values
    return this.request<any>('GET', `/workspaces/${workspaceId}/boards/${boardId}/items/${itemId}?expand[]=values`);
  }

  async updateItem(workspaceId: string, boardId: string, itemId: string, values: UpdateItemValues): Promise<any> {
    // Convert key-value object to array format expected by API
    const valuesArray = Object.entries(values).map(([attributeId, data]) => ({
      attribute_id: attributeId,
      data: data,
    }));
    return this.request<any>('PUT', `/workspaces/${workspaceId}/boards/${boardId}/items/${itemId}`, { 
      values: valuesArray 
    });
  }

  async getFolders(workspaceId: string, boardId: string): Promise<any> {
    return this.request<any>('GET', `/workspaces/${workspaceId}/boards/${boardId}/folders`);
  }

  async getAttributes(workspaceId: string, boardId: string): Promise<any> {
    return this.request<any>('GET', `/workspaces/${workspaceId}/boards/${boardId}/attributes`);
  }

  async getView(workspaceId: string, boardId: string, viewId: string): Promise<any> {
    return this.request<any>('GET', `/workspaces/${workspaceId}/boards/${boardId}/views/${viewId}`);
  }

  async createComment(workspaceId: string, boardId: string, itemId: string, content: string): Promise<any> {
    return this.request<any>('POST', `/workspaces/${workspaceId}/boards/${boardId}/items/${itemId}/comments`, {
      content,
    });
  }

  async getMembers(workspaceId?: string): Promise<any> {
    const wsId = this.getWorkspaceId(workspaceId);
    return this.request<any>('GET', `/workspaces/${wsId}/members`);
  }
}


export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  pagination?: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginationResponse {
  limit: number;
  offset: number;
  total: number;
}


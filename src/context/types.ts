export interface FileContext {
  path: string;
  relevance: number; // 0.0 to 1.0
  tier: 'path' | 'summary' | 'full';
  content?: string;
  summary?: string;
}

export interface ContextRequest {
  query: string;
  maxTokens?: number;
}

export interface ContextResult {
  files: FileContext[];
  totalTokens: number;
}

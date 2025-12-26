export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMResponseStream {
  content: string;
  isDone: boolean;
}

export interface LLMClient {
  chat(messages: LLMMessage[]): Promise<string>;
  chatStream(messages: LLMMessage[]): AsyncGenerator<string, void, unknown>;
}

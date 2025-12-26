import { LLMClient, LLMMessage } from './types.js';

export class OpenAICompatibleAdapter implements LLMClient {
  private baseUrl: string;
  private apiKey?: string;
  private model: string;

  constructor(model: string, baseUrl?: string, apiKey?: string) {
    this.model = model;
    this.baseUrl = baseUrl || 'https://api.openai.com/v1';
    this.apiKey = apiKey;
  }

  async chat(messages: LLMMessage[]): Promise<string> {
    const url = `${this.baseUrl}/chat/completions`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const body = {
      model: this.model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI Provider Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }

  async *chatStream(messages: LLMMessage[]): AsyncGenerator<string, void, unknown> {
    // Basic non-streaming fallback for now or implementation if needed. 
    // Requirement says "chat(messages) -> string", streaming not explicitly prioritized in "Core Objective" v1 but good to have.
    // Implementing strict "chat" as per PRD "Unified LLM Interface: chat(messages) -> string".
    // I will implement non-streaming first to satisfy the strict PRD.
    const result = await this.chat(messages);
    yield result;
  }
}

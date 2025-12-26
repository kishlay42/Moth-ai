import { LLMClient, LLMMessage } from './types.js';

export class ClaudeClient implements LLMClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async chat(messages: LLMMessage[]): Promise<string> {
    const url = 'https://api.anthropic.com/v1/messages';
    
    // Transform messages to Anthropic format
    // Anthropic requires 'user' or 'assistant' roles. System prompt is separate (usually).
    // For simplicity, we'll map system messages to user messages or extract them if complex handling needed.
    // Spec says 'chat(messages) -> string', we map as best as possible.
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role,
      content: m.content
    }));

    const body: any = {
      model: this.model,
      messages: conversationMessages,
      max_tokens: 1024, 
    };

    if (systemMessage) {
        body.system = systemMessage.content;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic Provider Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || "";
  }

  async *chatStream(messages: LLMMessage[]): AsyncGenerator<string, void, unknown> {
    const result = await this.chat(messages);
    yield result;
  }
}

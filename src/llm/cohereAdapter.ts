import { LLMClient, LLMMessage } from './types.js';

export class CohereClient implements LLMClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async chat(messages: LLMMessage[]): Promise<string> {
    const url = 'https://api.cohere.ai/v1/chat';
    
    // Cohere uses 'message' + 'chat_history' usually, or just 'message'
    // Simplified mapping for "Unified Interface":
    const lastMessage = messages[messages.length - 1];
    const history = messages.slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'USER' : 'CHATBOT',
        message: m.content
    }));

    const body = {
      model: this.model,
      message: lastMessage.content,
      chat_history: history.length > 0 ? history : undefined
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Request-Source': 'moth-cli'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cohere Provider Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.text || "";
  }

  async *chatStream(messages: LLMMessage[]): AsyncGenerator<string, void, unknown> {
    const result = await this.chat(messages);
    yield result;
  }
}

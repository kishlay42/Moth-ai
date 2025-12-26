# LLM Integration (`src/llm`)

Moth routes all model interactions through a unified adapter layer.

## Factory Pattern (`src/llm/factory.ts`)

The `createLLMClient` function instantiates the correct adapter based on the configuration.

```typescript
export const createLLMClient = (config: ActiveConfig): LLMClient => {
    switch (config.provider) {
        case 'ollama':
        case 'openai-compatible':
            return new OpenAIAdapter(...);
        case 'gemini-native':
            return new GeminiAdapter(...);
        case 'claude-native':
            return new ClaudeAdapter(...);
        // ...
    }
}
```

## Adapter Interface (`src/llm/types.ts`)

All adapters must implement the `LLMClient` interface.

```typescript
export interface LLMClient {
    chat(messages: LLMMessage[]): Promise<string>;
    chatStream(messages: LLMMessage[]): AsyncGenerator<string, void, unknown>;
}
```

## Supported Providers

### OpenAI Compatible (`src/llm/openAIAdapter.ts`)
-   **Usage**: Used for OpenAI, Ollama, vLLM, DeepSeek, generic endpoints.
-   **Configuration**: Requires `apiBase` (URL) and optionally `apiKey`.
-   **Ollama Special Case**: Uses `http://127.0.0.1:11434/v1` as default base.

### Gemini Native (`src/llm/geminiAdapter.ts`)
-   **Usage**: Google Gemini API.
-   **Library**: Uses `@google/generative-ai` SDK.
-   **Safety**: Configures safety settings to BLOCK_NONE for coding tasks.

### Claude Native (`src/llm/claudeAdapter.ts`)
-   **Usage**: Anthropic Claude API.
-   **Library**: Uses `@anthropic-ai/sdk`.

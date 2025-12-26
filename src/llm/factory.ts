import { LLMClient } from './types.js';
import { LLMProfile } from '../config/configManager.js';
import { GeminiClient } from './geminiAdapter.js';
import { OpenAICompatibleAdapter } from './openAIAdapter.js';
import { ClaudeClient } from './claudeAdapter.js';
import { CohereClient } from './cohereAdapter.js';
import { getApiKey } from '../config/keychain.js';

export async function createLLMClient(profile: LLMProfile): Promise<LLMClient> {
  const apiKey = await getApiKey(profile.name);

  switch (profile.provider) {
    case 'gemini-native':
    case 'gemini':
      if (!apiKey) throw new Error('API Key required for Gemini Native');
      return new GeminiClient(apiKey, profile.model);

    case 'openai-compatible':
      // API Key is optional for some local providers
      return new OpenAICompatibleAdapter(profile.model, profile.baseUrl, apiKey || undefined);

    case 'ollama':
      return new OpenAICompatibleAdapter(profile.model, profile.baseUrl || 'http://127.0.0.1:11434/v1', apiKey || undefined);

    case 'claude-native':
      if (!apiKey) throw new Error('API Key required for Claude Native');
      return new ClaudeClient(apiKey, profile.model);

    case 'cohere-native':
      if (!apiKey) throw new Error('API Key required for Cohere Native');
      return new CohereClient(apiKey, profile.model);

    default:
      throw new Error(`Unsupported adapter: ${profile.provider}`);
  }
}

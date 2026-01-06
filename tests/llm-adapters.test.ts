import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { OpenAICompatibleAdapter } from '../src/llm/openAIAdapter.js';
import { GeminiClient } from '../src/llm/geminiAdapter.js';
import { ClaudeClient } from '../src/llm/claudeAdapter.js';
import { CohereClient } from '../src/llm/cohereAdapter.js';

/**
 * Unit tests for LLM Adapters
 * 
 * These tests verify that each adapter:
 * 1. Formats requests correctly for their respective APIs
 * 2. Parses responses correctly
 * 3. Handles errors gracefully
 * 
 * Note: These tests use mocked fetch responses to avoid actual API calls
 */

// Mock fetch globally
const originalFetch = globalThis.fetch;

function mockFetch(response: any, ok = true, status = 200) {
  globalThis.fetch = mock.fn(async () => ({
    ok,
    status,
    json: async () => response,
    text: async () => JSON.stringify(response),
  })) as any;
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

describe('OpenAI Compatible Adapter', () => {
  it('should format messages correctly for OpenAI API', async () => {
    mockFetch({
      choices: [{ message: { content: 'Hello!' } }]
    });

    const adapter = new OpenAICompatibleAdapter('gpt-4', 'https://api.openai.com/v1', 'test-key');
    const response = await adapter.chat([
      { role: 'user', content: 'Hi' }
    ]);

    assert.strictEqual(response, 'Hello!');
    
    // Verify fetch was called with correct parameters
    const fetchCall = (globalThis.fetch as any).mock.calls[0];
    const body = JSON.parse(fetchCall.arguments[1].body);
    
    assert.strictEqual(body.model, 'gpt-4');
    assert.strictEqual(body.messages[0].role, 'user');
    assert.strictEqual(body.messages[0].content, 'Hi');

    restoreFetch();
  });

  it('should work without API key for local providers', async () => {
    mockFetch({
      choices: [{ message: { content: 'Response from local model' } }]
    });

    const adapter = new OpenAICompatibleAdapter('llama3', 'http://localhost:11434/v1');
    const response = await adapter.chat([
      { role: 'user', content: 'Test' }
    ]);

    assert.strictEqual(response, 'Response from local model');
    
    // Verify no Authorization header when no API key
    const fetchCall = (globalThis.fetch as any).mock.calls[0];
    const headers = fetchCall.arguments[1].headers;
    assert.strictEqual(headers['Authorization'], undefined);

    restoreFetch();
  });

  it('should handle API errors gracefully', async () => {
    mockFetch({ error: 'Invalid API key' }, false, 401);

    const adapter = new OpenAICompatibleAdapter('gpt-4', 'https://api.openai.com/v1', 'invalid-key');
    
    await assert.rejects(
      async () => await adapter.chat([{ role: 'user', content: 'Hi' }]),
      /OpenAI Provider Error \(401\)/
    );

    restoreFetch();
  });
});

describe('Claude Adapter', () => {
  it('should format messages correctly for Anthropic API', async () => {
    mockFetch({
      content: [{ text: 'Claude response' }]
    });

    const adapter = new ClaudeClient('test-key', 'claude-3-5-sonnet-20241022');
    const response = await adapter.chat([
      { role: 'system', content: 'You are helpful' },
      { role: 'user', content: 'Hello' }
    ]);

    assert.strictEqual(response, 'Claude response');
    
    // Verify system message is extracted
    const fetchCall = (globalThis.fetch as any).mock.calls[0];
    const body = JSON.parse(fetchCall.arguments[1].body);
    
    assert.strictEqual(body.system, 'You are helpful');
    assert.strictEqual(body.messages.length, 1);
    assert.strictEqual(body.messages[0].role, 'user');

    restoreFetch();
  });

  it('should include correct headers for Anthropic', async () => {
    mockFetch({
      content: [{ text: 'Response' }]
    });

    const adapter = new ClaudeClient('test-api-key', 'claude-3-5-sonnet-20241022');
    await adapter.chat([{ role: 'user', content: 'Test' }]);

    const fetchCall = (globalThis.fetch as any).mock.calls[0];
    const headers = fetchCall.arguments[1].headers;
    
    assert.strictEqual(headers['x-api-key'], 'test-api-key');
    assert.strictEqual(headers['anthropic-version'], '2023-06-01');
    assert.strictEqual(headers['content-type'], 'application/json');

    restoreFetch();
  });

  it('should handle Anthropic API errors', async () => {
    mockFetch({ error: 'Invalid API key' }, false, 401);

    const adapter = new ClaudeClient('invalid-key', 'claude-3-5-sonnet-20241022');
    
    await assert.rejects(
      async () => await adapter.chat([{ role: 'user', content: 'Hi' }]),
      /Anthropic Provider Error \(401\)/
    );

    restoreFetch();
  });
});

describe('Cohere Adapter', () => {
  it('should format messages correctly for Cohere API', async () => {
    mockFetch({
      text: 'Cohere response'
    });

    const adapter = new CohereClient('test-key', 'command-r-plus');
    const response = await adapter.chat([
      { role: 'user', content: 'First message' },
      { role: 'assistant', content: 'First response' },
      { role: 'user', content: 'Second message' }
    ]);

    assert.strictEqual(response, 'Cohere response');
    
    // Verify chat history format
    const fetchCall = (globalThis.fetch as any).mock.calls[0];
    const body = JSON.parse(fetchCall.arguments[1].body);
    
    assert.strictEqual(body.message, 'Second message');
    assert.strictEqual(body.chat_history.length, 2);
    assert.strictEqual(body.chat_history[0].role, 'USER');
    assert.strictEqual(body.chat_history[1].role, 'CHATBOT');

    restoreFetch();
  });

  it('should handle Cohere API errors', async () => {
    mockFetch({ message: 'Invalid API key' }, false, 401);

    const adapter = new CohereClient('invalid-key', 'command-r-plus');
    
    await assert.rejects(
      async () => await adapter.chat([{ role: 'user', content: 'Hi' }]),
      /Cohere Provider Error \(401\)/
    );

    restoreFetch();
  });
});

describe('Gemini Adapter', () => {
  it('should initialize with API key and model', () => {
    // Note: GeminiClient uses Google's SDK which is harder to mock
    // This test just verifies instantiation doesn't throw
    assert.doesNotThrow(() => {
      new GeminiClient('test-key', 'gemini-2.0-flash-exp');
    });
  });

  // Additional Gemini tests would require mocking the @google/generative-ai SDK
  // For now, manual testing will cover Gemini functionality
});

console.log('✅ All LLM adapter unit tests completed');

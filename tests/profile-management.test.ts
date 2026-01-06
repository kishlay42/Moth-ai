import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import { loadConfig, saveConfig, addProfile, removeProfile, setActiveProfile, type Config, type LLMProfile } from '../src/config/configManager.js';

/**
 * Integration tests for LLM Profile Management
 * 
 * These tests verify:
 * 1. Profile CRUD operations (Create, Read, Update, Delete)
 * 2. Active profile management
 * 3. Configuration persistence to YAML file
 * 
 * Note: These tests use a temporary config directory to avoid affecting user config
 */

const TEST_CONFIG_DIR = path.join(process.cwd(), 'tests', 'temp-config');
const TEST_CONFIG_FILE = path.join(TEST_CONFIG_DIR, 'profiles.yaml');

// Setup and teardown helpers
function setupTestConfig() {
  if (!fs.existsSync(TEST_CONFIG_DIR)) {
    fs.mkdirSync(TEST_CONFIG_DIR, { recursive: true });
  }
}

function cleanupTestConfig() {
  if (fs.existsSync(TEST_CONFIG_FILE)) {
    fs.unlinkSync(TEST_CONFIG_FILE);
  }
  if (fs.existsSync(TEST_CONFIG_DIR)) {
    fs.rmdirSync(TEST_CONFIG_DIR);
  }
}

describe('Profile Management', () => {
  it('should create default config when none exists', () => {
    setupTestConfig();
    
    const config = loadConfig();
    
    assert.ok(config);
    assert.ok(Array.isArray(config.profiles));
    assert.strictEqual(config.profiles.length, 0);
    
    cleanupTestConfig();
  });

  it('should add a new profile', () => {
    setupTestConfig();
    
    let config = loadConfig();
    
    const newProfile: LLMProfile = {
      name: 'test-ollama',
      provider: 'ollama',
      model: 'llama3',
      baseUrl: 'http://localhost:11434'
    };
    
    config = addProfile(config, newProfile);
    saveConfig(config);
    
    // Reload config to verify persistence
    const reloadedConfig = loadConfig();
    
    assert.strictEqual(reloadedConfig.profiles.length, 1);
    assert.strictEqual(reloadedConfig.profiles[0].name, 'test-ollama');
    assert.strictEqual(reloadedConfig.profiles[0].provider, 'ollama');
    assert.strictEqual(reloadedConfig.profiles[0].model, 'llama3');
    
    cleanupTestConfig();
  });

  it('should update existing profile when adding with same name', () => {
    setupTestConfig();
    
    let config = loadConfig();
    
    const profile1: LLMProfile = {
      name: 'my-profile',
      provider: 'ollama',
      model: 'llama3'
    };
    
    config = addProfile(config, profile1);
    saveConfig(config);
    
    const profile2: LLMProfile = {
      name: 'my-profile',
      provider: 'openai-compatible',
      model: 'gpt-4'
    };
    
    config = addProfile(config, profile2);
    saveConfig(config);
    
    const reloadedConfig = loadConfig();
    
    assert.strictEqual(reloadedConfig.profiles.length, 1);
    assert.strictEqual(reloadedConfig.profiles[0].provider, 'openai-compatible');
    assert.strictEqual(reloadedConfig.profiles[0].model, 'gpt-4');
    
    cleanupTestConfig();
  });

  it('should remove a profile', () => {
    setupTestConfig();
    
    let config = loadConfig();
    
    config = addProfile(config, {
      name: 'profile-1',
      provider: 'ollama',
      model: 'llama3'
    });
    
    config = addProfile(config, {
      name: 'profile-2',
      provider: 'openai-compatible',
      model: 'gpt-4'
    });
    
    saveConfig(config);
    
    config = removeProfile(config, 'profile-1');
    saveConfig(config);
    
    const reloadedConfig = loadConfig();
    
    assert.strictEqual(reloadedConfig.profiles.length, 1);
    assert.strictEqual(reloadedConfig.profiles[0].name, 'profile-2');
    
    cleanupTestConfig();
  });

  it('should set and persist active profile', () => {
    setupTestConfig();
    
    let config = loadConfig();
    
    config = addProfile(config, {
      name: 'ollama-profile',
      provider: 'ollama',
      model: 'llama3'
    });
    
    config = addProfile(config, {
      name: 'openai-profile',
      provider: 'openai-compatible',
      model: 'gpt-4'
    });
    
    config = setActiveProfile(config, 'openai-profile');
    saveConfig(config);
    
    const reloadedConfig = loadConfig();
    
    assert.strictEqual(reloadedConfig.activeProfile, 'openai-profile');
    
    cleanupTestConfig();
  });

  it('should clear active profile when removing it', () => {
    setupTestConfig();
    
    let config = loadConfig();
    
    config = addProfile(config, {
      name: 'test-profile',
      provider: 'ollama',
      model: 'llama3'
    });
    
    config = setActiveProfile(config, 'test-profile');
    saveConfig(config);
    
    config = removeProfile(config, 'test-profile');
    saveConfig(config);
    
    const reloadedConfig = loadConfig();
    
    assert.strictEqual(reloadedConfig.activeProfile, undefined);
    assert.strictEqual(reloadedConfig.profiles.length, 0);
    
    cleanupTestConfig();
  });

  it('should handle multiple profiles of different providers', () => {
    setupTestConfig();
    
    let config = loadConfig();
    
    const profiles: LLMProfile[] = [
      { name: 'ollama-llama', provider: 'ollama', model: 'llama3' },
      { name: 'openai-gpt4', provider: 'openai-compatible', model: 'gpt-4' },
      { name: 'claude-sonnet', provider: 'claude-native', model: 'claude-3-5-sonnet-20241022' },
      { name: 'gemini-flash', provider: 'gemini-native', model: 'gemini-2.0-flash-exp' },
      { name: 'cohere-command', provider: 'cohere-native', model: 'command-r-plus' }
    ];
    
    profiles.forEach(profile => {
      config = addProfile(config, profile);
    });
    
    saveConfig(config);
    
    const reloadedConfig = loadConfig();
    
    assert.strictEqual(reloadedConfig.profiles.length, 5);
    assert.ok(reloadedConfig.profiles.find(p => p.provider === 'ollama'));
    assert.ok(reloadedConfig.profiles.find(p => p.provider === 'openai-compatible'));
    assert.ok(reloadedConfig.profiles.find(p => p.provider === 'claude-native'));
    assert.ok(reloadedConfig.profiles.find(p => p.provider === 'gemini-native'));
    assert.ok(reloadedConfig.profiles.find(p => p.provider === 'cohere-native'));
    
    cleanupTestConfig();
  });
});

console.log('✅ All profile management integration tests completed');

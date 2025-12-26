import * as fs from 'fs';
import * as path from 'path';
import yaml from 'js-yaml';
import { CONFIG_DIR, ensureConfigDir } from '../utils/paths.js';

export type LLMProvider = 'openai-compatible' | 'ollama' | 'claude-native' | 'gemini-native' | 'gemini' | 'cohere-native';

export interface LLMProfile {
  name: string;
  provider: LLMProvider;
  model: string;
  baseUrl?: string;
}

export interface Config {
  activeProfile?: string;
  profiles: LLMProfile[];
  username?: string;
}

const CONFIG_FILE = path.join(CONFIG_DIR, 'profiles.yaml');

const DEFAULT_CONFIG: Config = {
  profiles: [],
};

export function loadConfig(): Config {
  ensureConfigDir();
  if (!fs.existsSync(CONFIG_FILE)) {
    saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }
  try {
    const content = fs.readFileSync(CONFIG_FILE, 'utf8');
    const parsed = yaml.load(content) as Config;
    // ensure structure matches
    return {
       profiles: parsed?.profiles || [],
       activeProfile: parsed?.activeProfile,
       username: parsed?.username
    };
  } catch (e) {
    // console.error('Failed to load config, using default', e); 
    // ^ Silence for now or use UI error in future
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: Config): void {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, yaml.dump(config), 'utf8');
}

export function addProfile(config: Config, profile: LLMProfile): Config {
  const existingIndex = config.profiles.findIndex(p => p.name === profile.name);
  if (existingIndex >= 0) {
    config.profiles[existingIndex] = profile;
  } else {
    config.profiles.push(profile);
  }
  return config;
}

export function removeProfile(config: Config, name: string): Config {
  config.profiles = config.profiles.filter(p => p.name !== name);
  if (config.activeProfile === name) {
    config.activeProfile = undefined;
  }
  return config;
}

export function setActiveProfile(config: Config, name: string): Config {
  const exists = config.profiles.some(p => p.name === name);
  if (exists) {
    config.activeProfile = name;
  }
  return config;
}

export function setUsername(config: Config, username: string): Config {
  config.username = username;
  return config;
}

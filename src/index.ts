#!/usr/bin/env node
import { Command } from 'commander';
import React from 'react';
import { render } from 'ink';
import { App } from './ui/App.js';
import { ensureConfigDir, findProjectRoot } from './utils/paths.js';
import { createLLMClient } from './llm/factory.js';
import { loadConfig, saveConfig, addProfile, setActiveProfile, removeProfile, LLMProvider, setUsername } from './config/configManager.js';
import { setApiKey, deleteApiKey } from './config/keychain.js';
// Strict Mode: Prompts must come from UI
import { ProjectScanner } from './context/scanner.js';
import { ContextManager } from './context/manager.js';

const program = new Command();

program
  .name('moth')
  .description('Local, LLM-agnostic code intelligence CLI')
  .version('1.0.0', '-v, --version')
  // No arguments allowed on top level.
  .action(() => {
    startChatSession();
  });

import { TodoManager } from './planning/todoManager.js';

// Helper to render Ink UI
const renderUI = (command: string, args: Record<string, any>) => {
  const todoManager = new TodoManager(); // In a real persistent app, we'd load this
  const { username, ...cmdArgs } = args;
  render(React.createElement(App, { command, args: cmdArgs, todoManager, username }));
};

const startChatSession = async () => {
    // No prompt handling here.
    const prompt = ""; 
    
    let config = loadConfig();
    let activeProfileName = config.activeProfile;
    
    // 1. If no profiles at all -> Force Wizard
    if (!activeProfileName || config.profiles.length === 0) {
        if (config.profiles.length === 0) {
            console.log("No profiles found. Setting up your first LLM profile...");
            await new Promise<void>((resolve) => {
                const { unmount } = render(React.createElement(LLMWizard, {
                    onComplete: async (resultConfig: any) => {
                        let newConfig = loadConfig();
                        newConfig = addProfile(newConfig, resultConfig);
                        if (resultConfig.apiKey) {
                            await setApiKey(resultConfig.name, resultConfig.apiKey);
                        }
                        newConfig = setActiveProfile(newConfig, resultConfig.name);
                        saveConfig(newConfig);
                        console.log(`Profile '${resultConfig.name}' created.`);
                        setTimeout(() => {
                            unmount();
                            resolve();
                        }, 500); // Brief pause to see success
                    },
                    onCancel: () => {
                        console.log('Setup cancelled.');
                        process.exit(0);
                    }
                }));
            });
            // Reload config and proceed
            config = loadConfig();
            activeProfileName = config.activeProfile;
        } else if (!activeProfileName) {
            // 2. If profiles exist but none active -> Force Selector
             console.log("No active profile selected. Please select one:");
             await new Promise<void>((resolve) => {
                 const { unmount } = render(React.createElement(ProfileManager, { 
                     config, 
                     onSelect: (selected) => {
                         // already saved active in ProfileManager logic, but let's just resolve
                         unmount();
                         resolve();
                     }
                 }));
             });
             // Reload
             config = loadConfig();
             activeProfileName = config.activeProfile;
        }
    }
    
    // 3. Main Chat Flow
    const activeProfile = config.profiles.find(p => p.name === activeProfileName);
    if (!activeProfile) {
       console.error(`Active profile '${activeProfileName}' not found (or data corruption).`);
       process.exit(1);
    }

    try {
      const client = await createLLMClient(activeProfile);
      renderUI('run', { 
        prompt, 
        client, 
        profile: activeProfile,
        username: config.username 
      });
    } catch (error: any) {
      console.error('Failed to initialize LLM:', error.message);
      process.exit(1);
    }
};

// Explicit run command is still good to keep
program
  .command('run')
  .description('Run the main loop')
  .argument('[prompt...]', 'Initial prompt')
  .action(startChatSession);

const llm = program.command('llm').description('Manage LLM profiles');

// Top-level aliases for convenience and error prevention
program.command('use')
  .description('Alias for "llm use"')
  .argument('[name]', 'Profile name')
  .action((name?: string) => {
    let config = loadConfig();
    if (!name) {
        console.log("No active profile selected. Please select one:");
        render(React.createElement(ProfileManager, { 
            config,
            onSelect: (selected) => {
                 // onSelect saves internally
                 process.exit(0);
            }
        }));
        return;
    }
    config = setActiveProfile(config, name);
    saveConfig(config);
    console.log(`Active profile set to '${name}'.`);
  });

program.command('list')
  .description('Alias for "llm list"')
  .action(() => {
    const config = loadConfig();
    render(React.createElement(ProfileManager, { config }));
  });

program.command('remove')
  .description('Alias for "llm remove"')
  .argument('[name]', 'Profile name')
  .action(async (name?: string) => {
    let config = loadConfig();
    if (!name) {
        render(React.createElement(LLMRemover, { 
            config,
            onExit: () => process.exit(0)
        }));
        return;
    }
    config = removeProfile(config, name);
    saveConfig(config);
    await deleteApiKey(name);
    console.log(`Profile '${name}' removed.`);
  });

program.command('add')
  .description('Alias for "llm add"')
  .option('-n, --name <name>', 'Profile name')
  .option('-p, --provider <provider>', 'Adapter type')
  .option('-m, --model <model>', 'Model name')
  .option('-u, --url <url>', 'Base URL')
  .option('-k, --key <key>', 'API Key')
  .action(async (options) => {
     // Re-use exactly the same logic as llm add
     if (!options.name && !options.provider && !options.model) {
         render(React.createElement(LLMWizard, {
             onComplete: async (resultConfig: any) => {
                 let config = loadConfig();
                 config = addProfile(config, resultConfig);
                 if (resultConfig.apiKey) {
                     await setApiKey(resultConfig.name, resultConfig.apiKey);
                 }
                 config = setActiveProfile(config, resultConfig.name);
                 saveConfig(config);
                 console.log(`Profile '${resultConfig.name}' created.`);
                 
                 // Chain to main chat
                 process.exit(0); // For now, just exit as per current wizard
             },
             onCancel: () => {
                 console.log('Setup cancelled.');
                 process.exit(0);
             }
         }));
         return;
     }
     
     // Legacy logic copy
     if (!options.name || !options.provider || !options.model) {
         console.error('Error: When using CLI flags, --name, --provider, and --model are required.');
         process.exit(1);
     }
     let config = loadConfig();
     const validProviders = ['openai-compatible', 'ollama', 'claude-native', 'gemini-native', 'cohere-native'];
     if (!validProviders.includes(options.provider)) {
         console.error(`Invalid provider. Must be one of: ${validProviders.join(', ')}`);
         process.exit(1);
     }
     if (options.provider === 'openai-compatible' && !options.url) {
         console.error('Base URL (--url) is required for openai-compatible adapter.');
         process.exit(1);
     }
     config = addProfile(config, {
       name: options.name,
       provider: options.provider as LLMProvider,
       model: options.model,
       baseUrl: options.url
     });
     if (options.key) {
       await setApiKey(options.name, options.key);
     }
     if (config.profiles.length === 1) {
       config = setActiveProfile(config, options.name);
     }
     saveConfig(config);
     console.log(`Profile '${options.name}' added.`);
  });
import { ProfileManager } from './ui/ProfileManager.js';
import { LLMWizard } from './ui/wizards/LLMWizard.js';

llm.command('list')
  .description('List all profiles')
  .action(() => {
    const config = loadConfig();
    render(React.createElement(ProfileManager, { config }));
  });

llm.command('add')
  .description('Add a new profile')
  .option('-n, --name <name>', 'Profile name')
  .option('-p, --provider <provider>', 'Adapter type')
  .option('-m, --model <model>', 'Model name')
  .option('-u, --url <url>', 'Base URL')
  .option('-k, --key <key>', 'API Key')
  .action(async (options) => {
     // If no options provided, launch wizard
     if (!options.name && !options.provider && !options.model) {
         render(React.createElement(LLMWizard, {
             onComplete: async (resultConfig: any) => {
                 let config = loadConfig();
                 config = addProfile(config, resultConfig);
                 if (resultConfig.apiKey) {
                     await setApiKey(resultConfig.name, resultConfig.apiKey);
                 }
                 if (config.profiles.length === 1) {
                     config = setActiveProfile(config, resultConfig.name);
                 }
                 saveConfig(config);
                 console.log(`Profile '${resultConfig.name}' added successfully!`);
                 process.exit(0);
             },
             onCancel: () => {
                 console.log('Setup cancelled.');
                 process.exit(0);
             }
         }));
         return;
     }

     // Legacy CLI mode - strict validation
     if (!options.name || !options.provider || !options.model) {
         console.error('Error: When using CLI flags, --name, --provider, and --model are required.');
         console.error('Run "moth llm add" without arguments for the interactive wizard.');
         process.exit(1);
     }

     let config = loadConfig();
     
     // strict validation
     const validProviders = ['openai-compatible', 'ollama', 'claude-native', 'gemini-native', 'cohere-native'];
     if (!validProviders.includes(options.provider)) {
         console.error(`Invalid provider. Must be one of: ${validProviders.join(', ')}`);
         process.exit(1);
     }
     
     if (options.provider === 'openai-compatible' && !options.url) {
         console.error('Base URL (--url) is required for openai-compatible adapter.');
         process.exit(1);
     }

     config = addProfile(config, {
       name: options.name,
       provider: options.provider as LLMProvider,
       model: options.model,
       baseUrl: options.url
     });
     
     if (options.key) {
       await setApiKey(options.name, options.key);
     }
     
     // Set as active if it's the first one
     if (config.profiles.length === 1) {
       config = setActiveProfile(config, options.name);
     }
     
     saveConfig(config);
     console.log(`Profile '${options.name}' added.`);
  });

llm.command('use')
  .description('Set active profile')
  .argument('<name>', 'Profile name')
  .action((name: string) => {
    let config = loadConfig();
    config = setActiveProfile(config, name);
    saveConfig(config);
    console.log(`Active profile set to '${name}'.`);
  });

import { LLMRemover } from './ui/wizards/LLMRemover.js';

llm.command('remove')
  .description('Remove a profile')
  .argument('[name]', 'Profile name')
  .action(async (name?: string) => {
    let config = loadConfig();
    
    if (!name) {
        render(React.createElement(LLMRemover, { 
            config,
            onExit: () => process.exit(0)
        }));
        return;
    }

    config = removeProfile(config, name);
    saveConfig(config);
    await deleteApiKey(name);
    console.log(`Profile '${name}' removed.`);
  });

program
  .command('config')
  .description('Manage configuration')
  .command('name')
  .description('Set your display name')
  .argument('<name>', 'Display name')
  .action((name: string) => {
    let config = loadConfig();
    config = setUsername(config, name);
    saveConfig(config);
    console.log(`Display name set to '${name}'.`);
  });

const context = program.command('context').description('Manage context');

context.command('scan')
  .description('Scan project files respecting .gitignore')
  .action(async () => {
    const root = findProjectRoot();
    if (!root) {
      console.error('Project root not found.');
      process.exit(1);
    }
    
    console.log(`Scanning project at: ${root}`);
    const scanner = new ProjectScanner(root);
    const files = await scanner.scan();
    
    console.log(`Found ${files.length} files:`);
    files.slice(0, 20).forEach(f => console.log(` - ${f}`));
    if (files.length > 20) {
       console.log(`... and ${files.length - 20} more.`);
    }
  });

context.command('gather')
  .description('Gather context for a query (debug)')
  .argument('<query...>', 'Query to score files against')
  .action(async (queryParts) => {
    const query = queryParts.join(' ');
    const root = findProjectRoot();
    if (!root) {
      console.error('Project root not found.');
      process.exit(1);
    }
    
    console.log(`Gathering context for: "${query}"`);
    const manager = new ContextManager(root);
    const result = await manager.gather({ query });
    
    console.log(`Top 10 Relevant Files:`);
    result.files.slice(0, 10).forEach(f => {
       console.log(`[${f.relevance.toFixed(1)}] ${f.tier.toUpperCase()} - ${f.path}`);
    });
  });

import { Patcher } from './editing/patcher.js';
import * as fs from 'fs/promises';

const patchCmd = program.command('patch').description('Manage patches');

patchCmd.command('apply')
  .description('Apply a diff file to a target file')
  .argument('<target>', 'Target file path')
  .argument('<patchFile>', 'Path to file containing unified diff')
  .action(async (target, patchFile) => {
    const root = findProjectRoot();
    if (!root) {
      console.error('Project root not found.');
      process.exit(1);
    }
    
    try {
      const patchContent = await fs.readFile(patchFile, 'utf8');
      const patcher = new Patcher(root);
      const success = await patcher.applyPatch(target, patchContent);
      
      if (success) {
        console.log(`Successfully patched ${target}`);
      } else {
        console.log(`Failed to patch ${target}`);
        process.exit(1);
      }
    } catch (e: any) {
      console.error('Error:', e.message);
      process.exit(1);
    }
  });



program.parse(process.argv);

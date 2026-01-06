import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, Newline } from 'ink';
import * as os from 'os';
import { LLMClient, LLMMessage } from '../llm/types.js';
import { LLMProfile, Config, loadConfig, saveConfig, addProfile, setMode as saveMode } from '../config/configManager.js';
import { MothMode, MODES } from '../types/modes.js';
import { TodoManager } from '../planning/todoManager.js';
import { AgentOrchestrator } from '../agent/orchestrator.js';
import { createToolRegistry } from '../tools/factory.js';
import { findProjectRoot } from '../utils/paths.js';
import { PermissionRequest, PermissionResponse } from '../tools/types.js';
import { ProjectScanner } from '../context/scanner.js';
import { CustomTextInput } from './components/CustomTextInput.js';
import { WordMoth } from './components/WordMoth.js';
import { FileChip } from './components/FileChip.js';
import { FileAutocomplete } from './components/FileAutocomplete.js';
import { CommandPalette } from './components/CommandPalette.js';
import { MarkdownText } from './components/MarkdownText.js';
import { ProfileManager } from './ProfileManager.js';
import { LLMWizard } from './wizards/LLMWizard.js';
import { LLMRemover } from './wizards/LLMRemover.js';



interface Props {
  command: string;
  args: Record<string, any>;
  todoManager?: TodoManager; 
  username?: string;
}

export const App: React.FC<Props> = ({ command, args, todoManager: propTodoManager, username }) => {
  const [messages, setMessages] = useState<LLMMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [status, setStatus] = useState<string>('Ready');
  
  // UX State
  const [showWelcome, setShowWelcome] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [thinkingText, setThinkingText] = useState('Sauting...');
  
  // Mode State
  const [mode, setMode] = useState<MothMode>(() => {
    const config = loadConfig();
    return config.mode || 'default';
  });

  // File Reference State
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [showFileChips, setShowFileChips] = useState(false); // Collapsed by default

  // Command Palette State
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  
  // Active Wizard State (for command palette execution)
  const [activeWizard, setActiveWizard] = useState<'llm-list' | 'llm-add' | 'llm-use' | 'llm-remove' | null>(null);

  // Effect for cycling thinking text
  useEffect(() => {
    if (isProcessing) {
      const words = ['Sauting...', 'Bubbling...', 'Cooking...', 'Chopping...', 'Simmering...', 'Whisking...', 'Seasoning...'];
      const interval = setInterval(() => {
         setThinkingText(words[Math.floor(Math.random() * words.length)]);
      }, 800);
      return () => clearInterval(interval);
    }
  }, [isProcessing]);

  // Load available files on mount
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const root = findProjectRoot() || process.cwd();
        const scanner = new ProjectScanner(root);
        const files = await scanner.scan();
        setAvailableFiles(files);
      } catch (e) {
        console.error('Failed to load files:', e);
      }
    };
    loadFiles();
  }, []);
  
  // Permission State
  const [pendingPermission, setPendingPermission] = useState<PermissionRequest | null>(null);
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [permissionSelection, setPermissionSelection] = useState(0);

  // Initialize TodoManager
  const [todoManager] = useState(() => propTodoManager || new TodoManager());

  // --- Run Command Logic ---
  const client: LLMClient = args.client;
  const initialPrompt: string = args.prompt;
  const activeProfile: LLMProfile = args.profile;

  useEffect(() => {
    if (initialPrompt && messages.length === 0) {
      if (showWelcome) setShowWelcome(false);
      runAgent(initialPrompt);
    }
  }, [initialPrompt]);

  const runAgent = async (userPrompt: string, attachedFiles?: string[]) => {
    if (showWelcome) setShowWelcome(false);
    setIsProcessing(true);
    
    // Create new user message with attached files
    const userMsg: LLMMessage = { 
      role: 'user', 
      content: userPrompt,
      attachedFiles: attachedFiles && attachedFiles.length > 0 ? attachedFiles : undefined
    };
    setMessages(prev => [...prev, userMsg]);

    try {
        const root = findProjectRoot() || process.cwd();
        
        // Permission Callback
        const checkPermission = async (toolName: string, args: any): Promise<PermissionResponse> => {
            // Auto-approve if in autopilot mode
            if (mode === 'autopilot') {
                return { allowed: true };
            }
            return new Promise((resolve) => {
                setPendingPermission({
                    id: Date.now().toString(),
                    toolName,
                    args,
                    resolve: (response) => {
                        setPendingPermission(null);
                        resolve(response);
                    }
                });
            });
        };

        const registry = createToolRegistry(root, todoManager, checkPermission);
        const orchestrator = new AgentOrchestrator({
            model: client,
            tools: registry.getDefinitions(),
            maxSteps: 10
        }, registry, root);

        let finalAnswer = "";
        
        // Pass accumulated history to the agent
        // 'messages' state contains history prior to this turn.
        // We do NOT include the pending userMsg in the 'history' arg because orchestrator.run 
        // treats the prompt separately. Or we can include it in history and pass empty prompt?
        // Orchestrator.run logic: [System, ...history, CurrentPrompt]
        // So we pass 'messages' (which excludes current UserPrompt yet in this render cycle, 
        // but wait, we called setMessages above). 
        // Actually, setMessages update is invisible in this render closure.
        // So 'messages' here IS the history before this turn. Perfect.
        
        for await (const step of orchestrator.run(userPrompt, messages)) {
           if (isPaused) break; // Basic pause handling (not perfect resonance)
           
           if (step.thought) {
               // Ambient status update
               setStatus(step.thought);
           }
           if (step.toolCall) {
               setStatus(`Act: ${step.toolCall.name}`);
           }
           if (step.finalAnswer) finalAnswer = step.finalAnswer;
        }

        const assistantMsg: LLMMessage = { role: 'assistant', content: finalAnswer || "Done." };
        setMessages(prev => [...prev, assistantMsg]);

    } catch (e: any) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}` }]);
    } finally {
        setStatus('Ready');
        setIsProcessing(false);
    }
  };

  // Handle input changes to detect @ for autocomplete
  const handleInputChange = (value: string) => {
    setInputVal(value);
    
    // Extract and track file references from @ mentions
    const referencedFiles = extractFileReferences(value);
    setSelectedFiles(referencedFiles);
    
    // Detect @ symbol for file autocomplete
    const atIndex = value.lastIndexOf('@');
    if (atIndex !== -1) {
      const afterAt = value.slice(atIndex + 1);
      
      // Close autocomplete if there's a space after @ (end of filename)
      if (afterAt.includes(' ')) {
        setShowAutocomplete(false);
        return;
      }
      
      const query = afterAt;
      // Only show autocomplete if @ is at start or after a space
      if (atIndex === 0 || value[atIndex - 1] === ' ') {
        setAutocompleteQuery(query);
        setShowAutocomplete(true);
        setAutocompleteIndex(0);
      }
    } else {
      setShowAutocomplete(false);
    }
  };

  // Get filtered files for autocomplete
  const getFilteredFiles = () => {
    return availableFiles
      .filter(file => {
        const lowerFile = file.toLowerCase();
        const lowerQuery = autocompleteQuery.toLowerCase();
        return lowerFile.includes(lowerQuery);
      })
      .filter(file => !selectedFiles.includes(file)) // Exclude already selected
      .slice(0, 10);
  };

  const handleFileSelect = (file: string) => {
    // Replace the entire input value to ensure cursor ends up at the end
    const atIndex = inputVal.lastIndexOf('@');
    if (atIndex !== -1) {
      const beforeAt = inputVal.slice(0, atIndex);
      // Set the complete new value - this places cursor at the end automatically
      const newInput = beforeAt + '@' + file + ' ';
      setInputVal(newInput);
    }
    
    setShowAutocomplete(false);
    setAutocompleteQuery('');
  };

  const handleFileRemove = (file: string) => {
    setSelectedFiles(prev => prev.filter(f => f !== file));
  };

  // Extract file references from input text
  const extractFileReferences = (text: string): string[] => {
    const atMatches = text.match(/@[\w\/.\-]+/g) || [];
    return atMatches.map(match => match.slice(1)); // Remove @ prefix
  };

  // Execute command from command palette
  const executeCommand = (action: string) => {
    setShowCommandPalette(false);
    
    switch (action) {
      case 'autopilot':
        // Set mode to autopilot (same as Ctrl+B cycling to autopilot)
        setMode('autopilot');
        const config = loadConfig();
        const updatedConfig = saveMode(config, 'autopilot');
        saveConfig(updatedConfig);
        break;
      case 'llm-list':
        setActiveWizard('llm-list');
        break;
      case 'llm-add':
        setActiveWizard('llm-add');
        break;
      case 'llm-use':
        setActiveWizard('llm-use');
        break;
      case 'llm-remove':
        setActiveWizard('llm-remove');
        break;
      case 'help':
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Moth AI - Your terminal coding assistant.\n\nKeyboard Shortcuts:\n- Ctrl+U: Open command palette\n- Ctrl+O: Toggle file references\n- Esc: Pause/Resume\n\nFor full help, run: moth --help'
        }]);
        break;
    }
  };

  useInput((input, key) => {
    // Autocomplete Navigation
    if (showAutocomplete && !pendingPermission) {
      const filteredFiles = getFilteredFiles();
      
      if (key.escape) {
        setShowAutocomplete(false);
        return;
      }
      
      if (key.upArrow) {
        setAutocompleteIndex(prev => (prev - 1 + filteredFiles.length) % filteredFiles.length);
        return;
      }
      
      if (key.downArrow) {
        setAutocompleteIndex(prev => (prev + 1) % filteredFiles.length);
        return;
      }
      
      // Use Enter to select file from autocomplete
      if (key.return && filteredFiles.length > 0) {
        handleFileSelect(filteredFiles[autocompleteIndex]);
        return;
      }
    }

    // Ctrl+O to toggle file chips visibility
    if (input === 'o' && key.ctrl) {
      setShowFileChips(prev => !prev);
      return;
    }

    // Ctrl+U to toggle command palette
    if (input === 'u' && key.ctrl) {
      setShowCommandPalette(prev => !prev);
      return;
    }

    // Ctrl+B to cycle modes
    if (input === 'b' && key.ctrl) {
      const modes: MothMode[] = ['default', 'plan', 'autopilot'];
      const currentIndex = modes.indexOf(mode);
      const nextMode = modes[(currentIndex + 1) % modes.length];
      setMode(nextMode);
      
      // Persist mode to config
      const config = loadConfig();
      const updatedConfig = saveMode(config, nextMode);
      saveConfig(updatedConfig);
      
      // Mode indicator updates automatically, no need for notification
      return;
    }

    // ESC Pause
    if (key.escape && !showAutocomplete) {
        setIsPaused(prev => !prev);
        setStatus(prev => prev === 'Paused' ? 'Resumed' : 'Paused');
        return;
    }

    // Permission Handling
    if (pendingPermission) {
        if (feedbackMode) {
            if (key.return) {
                pendingPermission.resolve({ allowed: false, feedback: inputVal });
                setInputVal('');
                setFeedbackMode(false);
            } else if (key.backspace || key.delete) {
                setInputVal(prev => prev.slice(0, -1));
            } else {
                setInputVal(prev => prev + input);
            }
            return;
        }

        // Arrow Key Navigation
        if (key.upArrow) {
            setPermissionSelection(prev => (prev - 1 + 3) % 3);
            return;
        }
        if (key.downArrow) {
            setPermissionSelection(prev => (prev + 1) % 3);
            return;
        }

        if (key.return) {
             if (permissionSelection === 0) {
                 pendingPermission.resolve({ allowed: true });
             } else if (permissionSelection === 1) {
                 // Enable autopilot mode
                 setMode('autopilot');
                 const config = loadConfig();
                 const updatedConfig = saveMode(config, 'autopilot');
                 saveConfig(updatedConfig);
                 pendingPermission.resolve({ allowed: true });
             } else if (permissionSelection === 2) {
                 setFeedbackMode(true);
             }
             return;
        }

        if (input === 'a' || input === 'A') {
             // Yes - execute once
             pendingPermission.resolve({ allowed: true });
        } else if (input === 'b' || input === 'B') {
             // Yes - enable autopilot mode
             setMode('autopilot');
             const config = loadConfig();
             const updatedConfig = saveMode(config, 'autopilot');
             saveConfig(updatedConfig);
             pendingPermission.resolve({ allowed: true });
        } else if (input === 'c' || input === 'C') {
             // Tell Moth what to do instead
             setFeedbackMode(true);
        }
        return;
    }
  });

  // --- RENDER ---
  
  // Render wizards if active
  if (activeWizard === 'llm-list' || activeWizard === 'llm-use') {
    const config = loadConfig();
    return (
      <ProfileManager 
        config={config}
        onSelect={(profile) => {
          setActiveWizard(null);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Switched to profile '${profile.name}'.`
          }]);
        }}
      />
    );
  }

  if (activeWizard === 'llm-add') {
    return (
      <LLMWizard 
        onComplete={(newProfile) => {
          const config = loadConfig();
          const updatedConfig = addProfile(config, newProfile);
          saveConfig(updatedConfig);
          setActiveWizard(null);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Profile '${newProfile.name}' added successfully!`
          }]);
        }}
        onCancel={() => {
          setActiveWizard(null);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Cancelled.'
          }]);
        }}
      />
    );
  }

  if (activeWizard === 'llm-remove') {
    const config = loadConfig();
    return (
      <LLMRemover 
        config={config}
        onExit={() => {
          setActiveWizard(null);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Returned to chat.'
          }]);
        }}
      />
    );
  }
  
  return (
    <Box flexDirection="column" padding={1}>
        
      {command === 'run' && (
          <Box flexDirection="row" paddingX={1} paddingY={0} borderStyle="round" borderColor="#0192e5">
              {/* Left: MOTH logo, greeting, and version */}
              <Box flexDirection="column" marginTop={-1} paddingRight={1}>
                  <WordMoth text="MOTH" big />
                  <Box marginTop={-1}>
                      <Text dimColor>v1.0.4</Text>
                  </Box>
                  <Text color="#3EA0C3">Welcome, {username || os.userInfo().username}</Text>
              </Box>
              
              {/* Right: AI, folder, and hint */}
              <Box flexDirection="column" alignItems="flex-start" marginLeft={2}>
                  <Text color="green">Active_AI: {activeProfile?.name || 'None'}</Text>
                  <Text dimColor>Path: {process.cwd()}</Text>
                  <Text dimColor>Use Ctrl+U to view commands</Text>
              </Box>
          </Box>
      )}

      {/* Scrollable Chat Area */}
      {messages.length > 0 && (
          <Box flexDirection="column" marginBottom={1}>
            {messages.map((m, i) => (
                <Box key={i} flexDirection="column" marginBottom={1}>
                    <Text color={m.role === 'user' ? 'blue' : 'green'} bold>
                        {m.role === 'user' ? 'You' : 'Moth'}: 
                    </Text>
                    {m.role === 'assistant' ? (
                        <MarkdownText content={m.content} />
                    ) : (
                        <Text> {m.content}</Text>
                    )}
                </Box>
            ))}
          </Box>
      )}

      {/* Permission Overlay */}
      {pendingPermission && (
          <Box borderStyle="double" borderColor="red" flexDirection="column" padding={1} marginBottom={1}>
              <Text bold color="red">PERMISSION REQUIRED</Text>
              <Text>Tool: {pendingPermission.toolName}</Text>
              <Text>Args: {JSON.stringify(pendingPermission.args)}</Text>
              <Newline />
              {!feedbackMode ? (
                  <Box flexDirection="column">
                    <Text>
                        <Text color={permissionSelection === 0 ? "green" : undefined} bold={permissionSelection === 0}>
                            {permissionSelection === 0 ? "> " : "  "} [a] Yes - execute this action
                        </Text>
                    </Text>
                    <Text>
                        <Text color={permissionSelection === 1 ? "green" : undefined} bold={permissionSelection === 1}>
                            {permissionSelection === 1 ? "> " : "  "} [b] Yes - enable autopilot (approve all)
                        </Text>
                    </Text>
                    <Text>
                        <Text color={permissionSelection === 2 ? "green" : undefined} bold={permissionSelection === 2}>
                            {permissionSelection === 2 ? "> " : "  "} [c] Tell Moth what to do instead
                        </Text>
                    </Text>
                  </Box>
              ) : (
                  <Box>
                      <Text bold>Feedback: </Text>
                      <Text>{inputVal}</Text>
                  </Box>
              )}
          </Box>
      )}

      {/* Footer / Input */}
      {!pendingPermission && (
          <Box flexDirection="column">

              {/* Thinking / Status Indicator */}
              {isProcessing && (
                  <Box flexDirection="column" marginBottom={0}>
                      <Text color="yellow" italic>{thinkingText}</Text>
                      {status !== 'Ready' && <Text color="gray" dimColor>  {status}</Text>}
                  </Box>
              )}
              


              {/* Selected Files Chips - Collapsible */}
              {selectedFiles.length > 0 && (
                  <Box flexDirection="column" marginBottom={1}>
                      <Box flexDirection="row">
                          <Text dimColor>Referenced Files ({selectedFiles.length}) </Text>
                          <Text color="gray" dimColor>[Ctrl+O to {showFileChips ? 'hide' : 'show'}]</Text>
                      </Box>
                      {showFileChips && (
                          <Box flexDirection="row" flexWrap="wrap" marginTop={1}>
                              {selectedFiles.map((file) => (
                                  <FileChip 
                                    key={file} 
                                    filePath={file} 
                                    onRemove={() => handleFileRemove(file)} 
                                  />
                              ))}
                          </Box>
                      )}
                  </Box>
              )}

              {/* Input Line */}
              <Box borderStyle="round" borderColor={isProcessing ? "gray" : "blue"} paddingX={1}>
                  <Text color={isProcessing ? "gray" : "cyan"}>{'> '}</Text>
                  <CustomTextInput 
                    value={inputVal}
                    onChange={handleInputChange}
                    onSubmit={(val) => {
                        // Don't submit if autocomplete is open
                        if (showAutocomplete) {
                            return;
                        }
                        
                        if (val.trim() && !isProcessing) {
                            // Extract file references from @ mentions in text
                            const referencedFiles = extractFileReferences(val);
                            const allFiles = [...new Set([...selectedFiles, ...referencedFiles])];
                            
                            runAgent(val, allFiles.length > 0 ? allFiles : undefined);
                            setInputVal('');
                            setSelectedFiles([]);
                        }
                    }}
                    focus={!isProcessing && !pendingPermission}
                  />
              </Box>

              {/* File Autocomplete - Below Input */}
              {showAutocomplete && (
                  <FileAutocomplete 
                    files={availableFiles}
                    query={autocompleteQuery}
                    selectedIndex={autocompleteIndex}
                    onSelect={handleFileSelect}
                  />
              )}

              {/* Command Palette */}
              {showCommandPalette && (
                <CommandPalette 
                  onExecute={executeCommand}
                  onClose={() => setShowCommandPalette(false)}
                />
              )}

              {/* Bottom Status Line - Mode (left) and Profile (right) */}
              <Box flexDirection="row" justifyContent="space-between">
                {/* Mode Indicator - Left */}
                <Box flexDirection="row">
                  <Text color={MODES[mode].color}>
                    {MODES[mode].icon} {MODES[mode].displayName.toUpperCase()} MODE
                  </Text>
                  <Text dimColor> | Ctrl+B to switch</Text>
                </Box>
                
                {/* Profile - Right */}
                <Text color="gray" dimColor>{activeProfile?.name}</Text>
              </Box>
          </Box>
      )}
    </Box>
  );
};

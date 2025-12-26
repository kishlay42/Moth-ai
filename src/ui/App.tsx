import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, Newline } from 'ink';
import * as os from 'os';
import { LLMClient, LLMMessage } from '../llm/types.js';
import { LLMProfile, Config } from '../config/configManager.js';
import { TodoManager } from '../planning/todoManager.js';
import { AgentOrchestrator } from '../agent/orchestrator.js';
import { createToolRegistry } from '../tools/factory.js';
import { findProjectRoot } from '../utils/paths.js';
import { PermissionRequest, PermissionResponse } from '../tools/types.js';
import TextInput from 'ink-text-input';
import { WordMoth } from './components/WordMoth.js';



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
  
  const [autopilot, setAutopilot] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [thinkingText, setThinkingText] = useState('Sauting...');

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

  const runAgent = async (userPrompt: string) => {
    if (showWelcome) setShowWelcome(false);
    setIsProcessing(true);
    
    // Create new user message
    const userMsg: LLMMessage = { role: 'user', content: userPrompt };
    setMessages(prev => [...prev, userMsg]);

    try {
        const root = findProjectRoot() || process.cwd();
        
        // Permission Callback
        const checkPermission = async (toolName: string, args: any): Promise<PermissionResponse> => {
            if (autopilot) {
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
        }, registry);

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

  useInput((input, key) => {
    // ESC Pause
    if (key.escape) {
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
                 setAutopilot(true);
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
             // Yes - autopilot
             setAutopilot(true);
             pendingPermission.resolve({ allowed: true });
        } else if (input === 'c' || input === 'C') {
             // Tell Moth what to do instead
             setFeedbackMode(true);
        }
        return;
    }
  });

  // --- RENDER ---
  
  return (
    <Box flexDirection="column" padding={1}>
        
      {(command === 'run' && showWelcome && messages.length === 0) && (
          <Box flexDirection="column" paddingX={1} paddingBottom={1} paddingTop={0} borderStyle="round" borderColor="#0192e5" alignItems="flex-start">
              <WordMoth text="MOTH" big />
              <Box flexDirection="column" alignItems="flex-start" marginTop={-1}>
                  <Text dimColor>v1.0.0</Text>
                  <Text color="#3EA0C3" bold>Welcome back, {username || os.userInfo().username}.</Text>
                  <Text color="green">Active AI: {activeProfile?.name || 'None'}</Text>
                  <Text dimColor>Path: {process.cwd()}</Text>
                  <Text dimColor>Run "moth --help" to view all commands.</Text>
              </Box>
          </Box>
      )}

      {/* Scrollable Chat Area */}
      {messages.length > 0 && (
          <Box flexDirection="column" marginBottom={1}>
            {messages.map((m, i) => (
                <Box key={i} flexDirection="row" marginBottom={1}>
                    <Text color={m.role === 'user' ? 'blue' : 'green'} bold>
                        {m.role === 'user' ? 'You' : 'Moth'}: 
                    </Text>
                    <Text> {m.content}</Text>
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
              
              {/* Autopilot Indicator */}
              {autopilot && (
                  <Text color="magenta">AUTOPILOT MODE</Text>
              )}

              {/* Input Line */}
              <Box borderStyle="round" borderColor={isProcessing ? "gray" : "blue"} paddingX={1}>
                  <Text color={isProcessing ? "gray" : "cyan"}>{'> '}</Text>
                  <TextInput 
                    value={inputVal}
                    onChange={setInputVal}
                    onSubmit={(val) => {
                        if (val.trim() && !isProcessing) {
                            runAgent(val);
                            setInputVal('');
                        }
                    }}
                    focus={!isProcessing && !pendingPermission}
                  />
              </Box>
              <Box flexDirection="row" justifyContent="flex-end">
                  <Text color="gray" dimColor>{activeProfile?.name}</Text>
              </Box>
          </Box>
      )}
    </Box>
  );
};

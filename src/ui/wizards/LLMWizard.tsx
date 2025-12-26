import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { LLMProvider } from '../../config/configManager.js';

interface LLMWizardProps {
  onComplete: (config: any) => void;
  onCancel: () => void;
}

// 1. Model Families
const FAMILIES = [
  { label: 'GPT (OpenAI)', value: 'gpt' },
  { label: 'Claude (Anthropic)', value: 'claude' },
  { label: 'Gemini (Google)', value: 'gemini' },
  { label: 'LLaMA (Meta)', value: 'llama' },
  { label: 'Mistral', value: 'mistral' },
  { label: 'Qwen', value: 'qwen' },
  { label: 'Phi', value: 'phi' },
  { label: 'DeepSeek', value: 'deepseek' },
  { label: 'Other / Custom', value: 'custom' },
];

// 2. Deployment Types
const DEPLOYMENTS = [
  { label: 'Local (On my machine)', value: 'local' },
  { label: 'Cloud (Hosted API)', value: 'cloud' },
];

// Suggested models per family
const FAMILY_MODELS: Record<string, string[]> = {
  'gpt': ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  'claude': ['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
  'gemini': ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
  'llama': ['llama3.1', 'llama3', 'llama2'],
  'mistral': ['mistral', 'mixtral', 'codestral'],
  'qwen': ['qwen2.5', 'qwen2'],
  'phi': ['phi3.5', 'phi3'],
  'deepseek': ['deepseek-coder-v2', 'deepseek-chat'],
};

export const LLMWizard: React.FC<LLMWizardProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [family, setFamily] = useState<string>('');
  const [deployment, setDeployment] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>('');

  // Resolution State
  const [resolvedRuntime, setResolvedRuntime] = useState<{
      provider: LLMProvider;
      defaultBaseUrl?: string;
      requiresKey: boolean;
      requiresUrl: boolean;
  }>({ provider: 'openai-compatible', requiresKey: true, requiresUrl: false });


  // --- STEP 1: FAMILY ---
  const handleFamilySelect = (item: any) => {
    setFamily(item.value);
    setStep(2);
  };

  // --- STEP 2: DEPLOYMENT ---
  const handleDeploymentSelect = (item: any) => {
    const deployType = item.value;
    setDeployment(deployType);
    resolveRuntime(family, deployType);
  };

  const resolveRuntime = (fam: string, deploy: string) => {
      // LOGIC RESOLUTION
      if (deploy === 'local') {
          setResolvedRuntime({
              provider: 'ollama',
              defaultBaseUrl: 'http://localhost:11434/v1',
              requiresKey: false,
              requiresUrl: false // Implicitly handles URL usually, or we can confirm it
          });
      } else {
          // CLOUD
          if (fam === 'gemini') {
              setResolvedRuntime({ provider: 'gemini-native', requiresKey: true, requiresUrl: false });
          } else if (fam === 'claude') {
              setResolvedRuntime({ provider: 'claude-native', requiresKey: true, requiresUrl: false });
          } else if (fam === 'gpt') {
               // OpenAI standard
               setResolvedRuntime({ provider: 'openai-compatible', requiresKey: true, requiresUrl: false });
          } else {
              // LLaMA, Mistral, etc on Cloud -> Generic OpenAI Compatible (Groq, etc)
              setResolvedRuntime({ provider: 'openai-compatible', requiresKey: true, requiresUrl: true });
          }
      }
      setStep(3);
  };

  // --- STEP 3: MODEL VARIANT ---
  const handleModelSelect = (item: any) => {
      if (item.value === 'custom') {
          setIsCustomModel(true);
          setModel('');
      } else {
          setModel(item.value);
          setStep(4);
      }
  };

  const handleCustomModelSubmit = (val: string) => {
      setModel(val);
      setStep(4);
  };

  // --- STEP 4: AUTH / CREDENTIALS ---
  // This step might be split if we need both Key and URL.
  // Let's do Key first, then URL if needed.
  
  const [subStep, setSubStep] = useState<'key' | 'url'>('key');

  useEffect(() => {
      if (step === 4) {
          if (resolvedRuntime.requiresKey) {
              setSubStep('key');
          } else if (resolvedRuntime.requiresUrl) {
              setSubStep('url');
          } else {
              // Nothing needed
              setStep(5);
          }
      }
  }, [step, resolvedRuntime]);

  const handleKeySubmit = (val: string) => {
      setApiKey(val);
      if (resolvedRuntime.requiresUrl) {
          setSubStep('url');
      } else {
          setStep(5);
      }
  };
  
  const handleUrlSubmit = (val: string) => {
      setBaseUrl(val);
      setStep(5);
  };

  // --- STEP 5: CONFIRM ---
  useInput((input, key) => {
      if (step === 5 && key.return) {
          onComplete({
              name: `${family}-${model}`.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase(),
              provider: resolvedRuntime.provider,
              model: model,
              apiKey: apiKey || undefined,
              baseUrl: baseUrl || resolvedRuntime.defaultBaseUrl || undefined
          });
      }
      if (input === 'c' && key.ctrl) {
          onCancel();
      }
  });


  // RENDER HELPERS
  const modelItems = (FAMILY_MODELS[family] || []).map(m => ({ label: m, value: m }));
  modelItems.push({ label: 'Type Custom Model Name...', value: 'custom' });

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="magenta" width={65}>
       <Text bold color="magenta">🔥 MOTH MODEL WIZARD</Text>
       <Text color="gray">--------------------------------------------------</Text>

       {/* STEP 1 */}
       {step === 1 && (
           <Box flexDirection="column">
               <Text bold color="cyan">STEP 1: SELECT MODEL FAMILY</Text>
               <Box marginTop={1}><SelectInput items={FAMILIES} onSelect={handleFamilySelect} /></Box>
           </Box>
       )}

       {/* STEP 2 */}
       {step === 2 && (
           <Box flexDirection="column">
               <Text bold color="cyan">STEP 2: SELECT DEPLOYMENT</Text>
               <Text color="gray">Where will {family} run?</Text>
               <Box marginTop={1}><SelectInput items={DEPLOYMENTS} onSelect={handleDeploymentSelect} /></Box>
           </Box>
       )}

       {/* STEP 3 */}
       {step === 3 && (
           <Box flexDirection="column">
               <Text bold color="cyan">STEP 3: SELECT MODEL VARIANT</Text>
               <Text color="gray">Runtime: {resolvedRuntime.provider} ({deployment})</Text>
               {isCustomModel ? (
                    <Box marginTop={1} flexDirection="column">
                        <Text>Enter specific model name:</Text>
                        <TextInput value={model} onChange={setModel} onSubmit={handleCustomModelSubmit} />
                    </Box>
               ) : (
                    <Box marginTop={1}><SelectInput items={modelItems} onSelect={handleModelSelect} /></Box>
               )}
           </Box>
       )}

       {/* STEP 4 */}
       {step === 4 && (
           <Box flexDirection="column">
               <Text bold color="cyan">STEP 4: CREDENTIALS</Text>
               {subStep === 'key' && (
                   <Box marginTop={1} flexDirection="column">
                       <Text>Enter API Key for {family} ({deployment}):</Text>
                       <TextInput value={apiKey} onChange={setApiKey} onSubmit={handleKeySubmit} mask="*" />
                   </Box>
               )}
               {subStep === 'url' && (
                   <Box marginTop={1} flexDirection="column">
                        <Text>Enter Base URL endpoint:</Text>
                        <TextInput 
                            value={baseUrl} 
                            onChange={setBaseUrl} 
                            onSubmit={handleUrlSubmit} 
                            placeholder="https://api.groq.com/openai/v1" 
                        />
                   </Box>
               )}
           </Box>
       )}

       {/* STEP 5 */}
       {step === 5 && (
           <Box flexDirection="column">
               <Text bold color="green">STEP 5: CONFIRM RESOLUTION</Text>
               <Box marginTop={1} flexDirection="column" borderStyle="single" padding={1} borderColor="white">
                   <Text><Text bold>Family:</Text>     {family}</Text>
                   <Text><Text bold>Deployment:</Text> {deployment}</Text>
                   <Text><Text bold>Runtime:</Text>    {resolvedRuntime.provider}</Text>
                   <Text><Text bold>Model:</Text>      {model}</Text>
                   <Text><Text bold>Auth:</Text>       {apiKey ? '(Provided)' : '(None)'}</Text>
                   <Text><Text bold>Endpoint:</Text>   {baseUrl || resolvedRuntime.defaultBaseUrl || '(Default)'}</Text>
               </Box>
               <Box marginTop={1}>
                   <Text color="green" bold>Press [ENTER] to save configuration.</Text>
                   <Text color="red">Press [Ctrl+C] to cancel.</Text>
               </Box>
           </Box>
       )}
    </Box>
  );
};

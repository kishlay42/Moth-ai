import React, { useState } from 'react';
import { Box, Text, useInput, Newline, useApp } from 'ink';
import { Config, removeProfile, saveConfig } from '../../config/configManager.js';
import { deleteApiKey } from '../../config/keychain.js';

interface LLMRemoverProps {
  config: Config;
  onExit: () => void;
}

export const LLMRemover: React.FC<LLMRemoverProps> = ({ config: initialConfig, onExit }) => {
  const { exit } = useApp();
  const [localConfig, setLocalConfig] = useState(initialConfig);
  const [selectionIndex, setSelectionIndex] = useState(0);
  const [message, setMessage] = useState('');
  const [confirming, setConfirming] = useState<string | null>(null);

  useInput(async (input, key) => {
    // Escape or Ctrl+C/X to exit
    if (key.escape || (key.ctrl && (input === 'c' || input === 'x'))) {
        onExit();
        return;
    }

    if (localConfig.profiles.length === 0) {
        return;
    }

    // Navigation
    if (key.upArrow) {
        setSelectionIndex(prev => (prev - 1 + localConfig.profiles.length) % localConfig.profiles.length);
        return;
    }
    
    if (key.downArrow) {
        setSelectionIndex(prev => (prev + 1) % localConfig.profiles.length);
        return;
    }

    const selectedProfile = localConfig.profiles[selectionIndex];

    // Confirmation Mode
    if (confirming) {
        if (key.return || input.toLowerCase() === 'y') {
            // Do the delete
            const nameToRemove = selectedProfile.name;
            let newConfig = removeProfile(localConfig, nameToRemove);
            await deleteApiKey(nameToRemove); // Helper needs to be imported or mocked if not in configManager? It's in keychain.ts actually. 
            // Wait, removeProfile in configManager does cleaner logic but key deletion is separate usually? 
            // Checking imports... "deleteApiKey" is in keychain.ts.
            // I need to import it.
            
            saveConfig(newConfig);
            setLocalConfig(newConfig);
            setConfirming(null);
            setMessage(`Profile '${nameToRemove}' removed.`);
            setSelectionIndex(0);
            
            setTimeout(() => setMessage(''), 3000);
        } else if (input.toLowerCase() === 'n' || key.escape) {
            setConfirming(null);
        }
        return;
    }

    // Trigger Delete
    if (key.return || key.delete || key.backspace) {
        setConfirming(selectedProfile.name);
    }
  });
  
  // Need to fix imports for deleteApiKey which is in keychain, not configManager. 
  // I will assume I can import it from '../../config/keychain.js'.

  if (localConfig.profiles.length === 0) {
      return (
          <Box flexDirection="column" padding={1} borderStyle="round" borderColor="red">
              <Text color="red">No profiles found.</Text>
              <Text>Use "moth llm add" to create one.</Text>
          </Box>
      );
  }

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="red">
        <Text bold color="red">MOTH LLM REMOVER</Text>
        <Text color="yellow">Hint: Select profile and press Enter to delete.</Text>
        <Newline />
        
        {confirming ? (
             <Box flexDirection="column" borderStyle="single" borderColor="red" padding={1}>
                 <Text bold color="white" backgroundColor="red"> WARNING </Text>
                 <Text>Are you sure you want to permanently delete profile:</Text>
                 <Text bold>'{confirming}'?</Text>
                 <Newline />
                 <Text bold>[Y] Yes, Delete   [N] No, Cancel</Text>
             </Box>
        ) : (
            localConfig.profiles.map((p, i) => {
                const isSelected = i === selectionIndex;
                const isActive = p.name === localConfig.activeProfile;
                
                return (
                    <Box key={i} flexDirection="row">
                        <Text color={isSelected ? "red" : undefined} bold={isSelected}>
                            {isSelected ? "❯ " : "  "}
                        </Text> 
                        <Text bold={isActive} color={isActive ? "green" : (isSelected ? "red" : undefined)}>
                            {p.name}
                        </Text>
                        <Text> ({p.provider} / {p.model})</Text>
                        {isActive && <Text color="green" dimColor> (active)</Text>}
                    </Box>
                );
            })
        )}

        {message && (
             <Box marginTop={1}>
                 <Text color="red">{message}</Text>
             </Box>
        )}
    </Box>
  );
};

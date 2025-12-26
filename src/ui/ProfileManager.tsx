import React, { useState } from 'react';
import { Box, Text, useInput, Newline, useApp } from 'ink';
import { Config, setActiveProfile, saveConfig, loadConfig, LLMProfile } from '../config/configManager.js';

interface Props {
  config: Config;
  onSelect?: (profile: LLMProfile) => void;
}

export const ProfileManager: React.FC<Props> = ({ config: initialConfig, onSelect }) => {
  const { exit } = useApp();
  const [localConfig, setLocalConfig] = useState(initialConfig);
  const [selectionIndex, setSelectionIndex] = useState(() => {
     const idx = initialConfig.profiles.findIndex(p => p.name === initialConfig.activeProfile);
     return idx >= 0 ? idx : 0;
  });
  const [message, setMessage] = useState('');

  useInput((input, key) => {
    // Ctrl+X to Exit
    if (input === '\x18' || (key.ctrl && input === 'x')) {
        exit();
        // Only hard exit if we're not in a larger flow, but for now safe to exit app
        if (!onSelect) process.exit(0); 
        return;
    }

    if (key.upArrow) {
        setSelectionIndex(prev => (prev - 1 + localConfig.profiles.length) % localConfig.profiles.length);
        return;
    }
    
    if (key.downArrow) {
        setSelectionIndex(prev => (prev + 1) % localConfig.profiles.length);
        return;
    }

    if (key.return) {
        const selectedProfile = localConfig.profiles[selectionIndex];
        let newConfig = setActiveProfile(localConfig, selectedProfile.name);
        saveConfig(newConfig);
        setLocalConfig(newConfig);
        
        if (onSelect) {
            // Give a tiny visual feedback before unmounting? 
            // Or just instant. Instant is better for "flow".
            onSelect(selectedProfile);
        } else {
            setMessage(`Active profile set to '${selectedProfile.name}'`);
            setTimeout(() => setMessage(''), 3000);
        }
    }
  });

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="cyan">
        <Text bold>MOTH LLM PROFILES</Text>
        <Text color="green">Hint: Press Enter to select new model or Ctrl+X to exit nav.</Text>
        <Newline />
        {localConfig.profiles.map((p, i) => {
            const isSelected = i === selectionIndex;
            const isActive = p.name === localConfig.activeProfile;
            
            return (
                <Box key={i} flexDirection="row">
                    <Text color={isSelected ? "green" : undefined} bold={isSelected}>
                        {isSelected ? "* " : "  "}
                    </Text> 
                    <Text bold={isActive} color={isActive ? "green" : undefined}>
                        {p.name}
                    </Text>
                    <Text> ({p.provider} / {p.model})</Text>
                    {isActive && <Text color="green" dimColor> (active)</Text>}
                </Box>
            );
        })}
        {message && (
             <Box marginTop={1}>
                 <Text color="green">{message}</Text>
             </Box>
        )}
    </Box>
  );
};

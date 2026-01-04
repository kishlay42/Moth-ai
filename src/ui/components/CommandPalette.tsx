import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface Command {
  name: string;
  description: string;
  action: string; // The actual command to execute
}

interface CommandPaletteProps {
  onExecute: (action: string) => void;
  onClose: () => void;
}

const commands: Command[] = [
  { name: 'LLM: List Profiles', description: 'Show all configured LLM profiles', action: 'llm-list' },
  { name: 'LLM: Add Profile', description: 'Add a new LLM profile', action: 'llm-add' },
  { name: 'LLM: Switch Profile', description: 'Switch to a different LLM profile', action: 'llm-use' },
  { name: 'LLM: Remove Profile', description: 'Remove an LLM profile', action: 'llm-remove' },
  { name: 'Toggle Autopilot', description: 'Enable/disable autopilot mode', action: 'autopilot' },
  { name: 'Show Help', description: 'Display help information', action: 'help' },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onExecute, onClose }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => Math.min(commands.length - 1, prev + 1));
    } else if (key.return) {
      onExecute(commands[selectedIndex].action);
    } else if (key.escape || (input === 'u' && key.ctrl)) {
      onClose();
    }
  });

  return (
    <Box
      flexDirection="column"
    >
      <Box
        borderStyle="round"
        borderColor="cyan"
        flexDirection="column"
        paddingX={2}
        paddingY={1}
      >
        <Text bold color="cyan">Command Palette (Ctrl+U to close)</Text>
        <Text dimColor>Select a command and press Enter</Text>
        <Box marginTop={1} flexDirection="column">
          {commands.map((cmd, index) => (
            <Box key={cmd.action} marginY={0}>
              <Text
                color={index === selectedIndex ? 'green' : undefined}
                bold={index === selectedIndex}
              >
                {index === selectedIndex ? '> ' : '  '}
                {cmd.name}
              </Text>
              <Text dimColor> - {cmd.description}</Text>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

interface FileAutocompleteProps {
  files: string[];
  query: string;
  selectedIndex: number;
  onSelect: (file: string) => void;
}

export const FileAutocomplete: React.FC<FileAutocompleteProps> = ({ 
  files, 
  query, 
  selectedIndex,
  onSelect 
}) => {
  // Filter files based on query
  const filteredFiles = files
    .filter(file => {
      const lowerFile = file.toLowerCase();
      const lowerQuery = query.toLowerCase();
      return lowerFile.includes(lowerQuery);
    })
    .slice(0, 10); // Limit to 10 results

  if (filteredFiles.length === 0) {
    return (
      <Box 
        borderStyle="round" 
        borderColor="yellow" 
        flexDirection="column" 
        paddingX={1}
      >
        <Text dimColor>No files found matching "{query}"</Text>
      </Box>
    );
  }

  return (
    <Box 
      borderStyle="round" 
      borderColor="yellow" 
      flexDirection="column" 
      paddingX={1}
    >
      <Text bold color="yellow">↑↓ navigate, Enter inserts path, Esc cancels</Text>
      {filteredFiles.map((file, index) => (
        <Box key={file} marginLeft={1}>
          <Text 
            color={index === selectedIndex ? 'green' : undefined}
            bold={index === selectedIndex}
          >
            {index === selectedIndex ? '> ' : '  '}
            {file}
          </Text>
        </Box>
      ))}
    </Box>
  );
};

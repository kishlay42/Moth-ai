import React from 'react';
import { Box, Text } from 'ink';
import * as path from 'path';

interface FileChipProps {
  filePath: string;
  onRemove: () => void;
}

export const FileChip: React.FC<FileChipProps> = ({ filePath, onRemove }) => {
  const basename = path.basename(filePath);
  const dirname = path.dirname(filePath);

  return (
    <Box borderStyle="round" borderColor="cyan" paddingX={1} marginRight={1}>
      <Text color="cyan" bold>{basename}</Text>
      <Text dimColor> {dirname !== '.' ? `(${dirname})` : ''}</Text>
      <Text color="red" bold> [x]</Text>
    </Box>
  );
};

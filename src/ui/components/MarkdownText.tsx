import React from 'react';
import { Box, Text } from 'ink';

interface MarkdownTextProps {
  content: string;
}

/**
 * Renders markdown-style text with colors in the terminal
 * Supports:
 * - # Headings (cyan, bold)
 * - ## Subheadings (blue, bold)
 * - ### Sub-subheadings (green)
 * - **bold** text
 * - `code` inline (yellow)
 * - ```code blocks``` (yellow, dimmed)
 * - Tables (formatted)
 * - Bullet points
 */
export const MarkdownText: React.FC<MarkdownTextProps> = ({ content }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];

  lines.forEach((line, index) => {
    // Code block detection
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End of code block - render accumulated content
        elements.push(
          <Box key={`code-${index}`} flexDirection="column" marginY={1} paddingX={2} borderStyle="single" borderColor="yellow">
            {codeBlockContent.map((codeLine, i) => (
              <Text key={i} color="yellow" dimColor>{codeLine}</Text>
            ))}
          </Box>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        // Start of code block
        inCodeBlock = true;
        const lang = line.trim().slice(3);
        if (lang) {
          elements.push(
            <Text key={`lang-${index}`} color="gray" dimColor>[{lang}]</Text>
          );
        }
      }
      return;
    }

    // Inside code block
    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    // Main heading (# )
    if (line.startsWith('# ')) {
      elements.push(
        <Text key={index} color="cyan" bold>{line.slice(2)}</Text>
      );
      return;
    }

    // Subheading (## )
    if (line.startsWith('## ')) {
      elements.push(
        <Text key={index} color="blue" bold>{line.slice(3)}</Text>
      );
      return;
    }

    // Sub-subheading (### )
    if (line.startsWith('### ')) {
      elements.push(
        <Text key={index} color="green">{line.slice(4)}</Text>
      );
      return;
    }

    // Table detection (lines with | characters)
    if (line.includes('|') && line.trim().startsWith('|')) {
      const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
      
      // Check if it's a separator line (|---|---|)
      if (cells.every(c => /^-+$/.test(c))) {
        elements.push(
          <Text key={index} color="gray" dimColor>{line}</Text>
        );
        return;
      }
      
      // Regular table row
      elements.push(
        <Box key={index} flexDirection="row">
          {cells.map((cell, i) => (
            <Text key={i} color={i === 0 ? "cyan" : undefined}>
              {cell.padEnd(20, ' ')}
            </Text>
          ))}
        </Box>
      );
      return;
    }

    // Bullet points
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      const indent = line.search(/[*-]/);
      const content = line.slice(indent + 2);
      elements.push(
        <Text key={index}>
          {' '.repeat(indent)}
          <Text color="yellow">• </Text>
          {renderInlineFormatting(content)}
        </Text>
      );
      return;
    }

    // Numbered lists
    if (/^\s*\d+\.\s/.test(line)) {
      const match = line.match(/^(\s*)(\d+)\.\s(.*)$/);
      if (match) {
        const [, indent, num, content] = match;
        elements.push(
          <Text key={index}>
            {indent}
            <Text color="cyan">{num}. </Text>
            {renderInlineFormatting(content)}
          </Text>
        );
        return;
      }
    }

    // Empty lines
    if (line.trim() === '') {
      elements.push(<Text key={index}> </Text>);
      return;
    }

    // Regular text with inline formatting
    elements.push(
      <Text key={index}>{renderInlineFormatting(line)}</Text>
    );
  });

  return <Box flexDirection="column">{elements}</Box>;
};

/**
 * Renders inline markdown formatting like **bold**, `code`, etc.
 */
function renderInlineFormatting(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let currentIndex = 0;
  let key = 0;

  // Match patterns: `code`, **bold**
  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)/g;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > currentIndex) {
      parts.push(
        <Text key={key++}>{text.slice(currentIndex, match.index)}</Text>
      );
    }

    // Add the formatted match
    if (match[1]) {
      // Code (backticks)
      const code = match[1].slice(1, -1);
      parts.push(
        <Text key={key++} color="yellow" backgroundColor="black">{code}</Text>
      );
    } else if (match[2]) {
      // Bold
      const bold = match[2].slice(2, -2);
      parts.push(
        <Text key={key++} bold>{bold}</Text>
      );
    }

    currentIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (currentIndex < text.length) {
    parts.push(
      <Text key={key++}>{text.slice(currentIndex)}</Text>
    );
  }

  return parts.length > 0 ? <>{parts}</> : text;
}

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';

interface CustomTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  focus?: boolean;
  placeholder?: string;
}

export const CustomTextInput: React.FC<CustomTextInputProps> = ({
  value: externalValue,
  onChange,
  onSubmit,
  focus = true,
  placeholder = ''
}) => {
  const [internalValue, setInternalValue] = useState(externalValue);
  const [cursorPos, setCursorPos] = useState(externalValue.length);

  // Sync with external value changes (e.g., from file path insertion)
  useEffect(() => {
    setInternalValue(externalValue);
    // Place cursor at end when value changes externally
    setCursorPos(externalValue.length);
  }, [externalValue]);

  useInput((input, key) => {
    if (!focus) return;

    // Submit on Enter
    if (key.return) {
      onSubmit(internalValue);
      return;
    }

    // Backspace - delete character before cursor
    if (key.backspace) {
      if (cursorPos > 0) {
        const newValue = internalValue.slice(0, cursorPos - 1) + internalValue.slice(cursorPos);
        setInternalValue(newValue);
        setCursorPos(cursorPos - 1);
        onChange(newValue);
      }
      return;
    }

    // Delete - delete character after cursor
    if (key.delete) {
      if (cursorPos < internalValue.length) {
        const newValue = internalValue.slice(0, cursorPos) + internalValue.slice(cursorPos + 1);
        setInternalValue(newValue);
        onChange(newValue);
      }
      return;
    }

    // Left arrow - move cursor left
    if (key.leftArrow) {
      setCursorPos(Math.max(0, cursorPos - 1));
      return;
    }

    // Right arrow - move cursor right
    if (key.rightArrow) {
      setCursorPos(Math.min(internalValue.length, cursorPos + 1));
      return;
    }

    // Home - move to start
    if (key.home) {
      setCursorPos(0);
      return;
    }

    // End - move to end
    if (key.end) {
      setCursorPos(internalValue.length);
      return;
    }

    // Regular character input (ignore ctrl/meta combinations)
    if (input && !key.ctrl && !key.meta && input.length === 1) {
      const newValue = internalValue.slice(0, cursorPos) + input + internalValue.slice(cursorPos);
      setInternalValue(newValue);
      setCursorPos(cursorPos + 1);
      onChange(newValue);
      return;
    }
  }, { isActive: focus });

  // Render the input with cursor
  const displayValue = internalValue;
  const beforeCursor = displayValue.slice(0, cursorPos);
  const cursorChar = displayValue[cursorPos] || ' '; // Always show space if nothing there
  const afterCursor = displayValue.slice(cursorPos + 1);

  return (
    <Box>
      <Text>{beforeCursor}</Text>
      <Text inverse>{cursorChar}</Text>
      <Text>{afterCursor}</Text>
    </Box>
  );
};

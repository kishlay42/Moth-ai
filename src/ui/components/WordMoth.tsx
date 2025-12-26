import React from 'react';
import { Text } from 'ink';
import BigText from 'ink-big-text';

interface WordMothProps {
  text: string;
  big?: boolean;
}

export const WordMoth: React.FC<WordMothProps> = ({ text, big = false }) => {
  if (big) {
    return (
      <Text color="#3EA0C3">
        <BigText text={text} font="block" colors={['#0192e5', '#0192e5']} />
      </Text> // BigText needs specific handling or Text wrapper
    );
  }

  return (
    <Text color="#0192e5">{text}</Text>
  );
};

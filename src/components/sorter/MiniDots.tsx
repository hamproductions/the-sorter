import { Box, HStack } from 'styled-system/jsx';
import { token } from 'styled-system/tokens';
import type { GuessResult } from '~/hooks/useHeardleState';

export function MiniDots({ result, maxAttempts }: { result: GuessResult; maxAttempts: number }) {
  return (
    <HStack gap="1">
      {Array.from({ length: maxAttempts }).map((_, i) => {
        const historyItem = result.guessHistory[i];
        const isCorrectSlot = i === result.attempts - 1 && result.result === 'correct';
        let bg = 'transparent';
        let border = `2px solid ${token('colors.border.default')}`;
        if (isCorrectSlot) {
          bg = '#16a34a';
          border = '2px solid #16a34a';
        } else if (historyItem === 'wrong') {
          bg = token('colors.red.9');
          border = `2px solid ${token('colors.red.9')}`;
        } else if (historyItem === 'pass') {
          bg = '#d97706';
          border = '2px solid #d97706';
        }
        return (
          <Box
            key={i}
            style={{ backgroundColor: bg, border }}
            borderRadius="full"
            w="8px"
            h="8px"
          />
        );
      })}
    </HStack>
  );
}

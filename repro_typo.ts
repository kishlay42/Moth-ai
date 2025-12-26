import { findClosestCommand, levenshtein } from './src/utils/text.js';

const commands = ['use', 'add', 'list', 'remove', 'run', 'config', 'context', 'patch', 'llm'];
const input = 'lsit';

console.log(`Input: "${input}"`);
console.log(`Levenshtein distance to 'list': ${levenshtein(input, 'list')}`);
const closest = findClosestCommand(input, commands);
console.log(`Closest command: ${closest}`);

if (closest === 'list') {
    console.log("SUCCESS: Typo detected.");
} else {
    console.log("FAILURE: Typo NOT detected.");
}

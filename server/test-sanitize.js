// Simple test to check sanitizeInput function
const { sanitizeInput } = require('./src/utils/schemas.ts');

const input = 'onclick=alert("xss")Hello';
const result = sanitizeInput(input);
 
console.log('Input:', input);
console.log('Result:', result);
console.log('Result length:', result.length);
console.log('Result type:', typeof result); 
import { generateEmbeddings } from './generateEmbeddings';

async function main() {
  const text = process.argv[2] || 'The quick brown fox jumps over the lazy dog.';
  const chunk = { chunk: text, metadata: { userId: 'validator', fileId: 'validator', chunkIndex: 0 } };
  const result = await generateEmbeddings([chunk]);
  if (result.length === 0) {
    console.log('No embedding generated.');
    return;
  }
  const embedding = result[0].embedding;
  console.log('Embedding shape:', embedding.length);
  console.log('Top-5 dimensions:', embedding.slice(0, 5));
}

if (require.main === module) {
  main();
} 
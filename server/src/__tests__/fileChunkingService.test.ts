import { smartFileChunking } from '../services/fileChunkingService';
import fs from 'fs';
import path from 'path';

describe('smartFileChunking', () => {
  const userId = 'test-user';
  const fileId = 'test-file';

  it('chunks a 100-row CSV into 100+ chunks', async () => {
    const header = 'name,age,city';
    const rows = Array.from({ length: 100 }, (_, i) => `User${i},${20 + i},City${i}`);
    const csvContent = [header, ...rows].join('\n');
    const buffer = Buffer.from(csvContent);
    const chunks = await smartFileChunking({ buffer, fileName: 'test.csv', userId, fileId });
    expect(chunks.length).toBeGreaterThanOrEqual(100);
    expect(chunks[0]).toHaveProperty('userId', userId);
    expect(chunks[0]).toHaveProperty('fileId', fileId);
    expect(chunks[0]).toHaveProperty('chunkIndex', 0);
    expect(chunks[0]).toHaveProperty('content');
    expect(chunks[0]).toHaveProperty('modality', 'text');
  });

  it('chunks a multi-paragraph TXT into semantic chunks', async () => {
    const paras = Array.from({ length: 8 }, (_, i) => `Paragraph ${i + 1}. This is some text for paragraph ${i + 1}.`);
    const txtContent = paras.join('\n\n');
    const buffer = Buffer.from(txtContent);
    const chunks = await smartFileChunking({ buffer, fileName: 'test.txt', userId, fileId });
    expect(chunks.length).toBeGreaterThanOrEqual(4); // Should chunk by paragraphs
    expect(chunks[0].content).toContain('Paragraph 1');
  });

  it('gracefully fails and logs for malformed files', async () => {
    const buffer = Buffer.from('not a real PDF');
    const chunks = await smartFileChunking({ buffer, fileName: 'corrupt.pdf', userId, fileId });
    expect(Array.isArray(chunks)).toBe(true);
    expect(chunks.length).toBe(0);
  });

  it('chunks a DOCX file with paragraphs (skipped if no sample)', async () => {
    const docxPath = path.join(__dirname, 'assets', 'sample.docx');
    if (!fs.existsSync(docxPath)) return;
    const buffer = fs.readFileSync(docxPath);
    const chunks = await smartFileChunking({ buffer, fileName: 'sample.docx', userId, fileId });
    expect(chunks.length).toBeGreaterThanOrEqual(3);
    expect(chunks[0]).toHaveProperty('content');
  });

  it('chunks a PDF file with paragraphs (skipped if no sample)', async () => {
    const pdfPath = path.join(__dirname, 'assets', 'sample.pdf');
    if (!fs.existsSync(pdfPath)) return;
    const buffer = fs.readFileSync(pdfPath);
    const chunks = await smartFileChunking({ buffer, fileName: 'sample.pdf', userId, fileId });
    expect(chunks.length).toBeGreaterThanOrEqual(3);
    expect(chunks[0]).toHaveProperty('content');
  });
}); 
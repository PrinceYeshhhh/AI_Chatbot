import { parseFile } from '../utils/parseFile';
import fs from 'fs';
import path from 'path';

describe('parseFile', () => {
  it('parses TXT files correctly', async () => {
    const buffer = Buffer.from('Hello world!\nThis is a test file.');
    const result = await parseFile({ buffer, fileName: 'test.txt' });
    expect(result.file_type).toBe('txt');
    expect(result.text).toContain('Hello world!');
    expect(result.text).toContain('This is a test file.');
  });

  it('parses CSV files correctly', async () => {
    const buffer = Buffer.from('name,age\nAlice,30\nBob,25');
    const result = await parseFile({ buffer, fileName: 'test.csv' });
    expect(result.file_type).toBe('csv');
    expect(result.text).toContain('Alice, 30');
    expect(result.text).toContain('Bob, 25');
    expect(result.metadata?.rows).toBe(3);
  });

  it('parses PDF files correctly', async () => {
    // Use a small sample PDF from test assets
    const pdfPath = path.join(__dirname, 'assets', 'sample.pdf');
    if (!fs.existsSync(pdfPath)) return; // Skip if not present
    const buffer = fs.readFileSync(pdfPath);
    const result = await parseFile({ buffer, fileName: 'sample.pdf' });
    expect(result.file_type).toBe('pdf');
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.metadata?.numpages).toBeGreaterThan(0);
  });

  it('parses DOCX files correctly', async () => {
    // Use a small sample DOCX from test assets
    const docxPath = path.join(__dirname, 'assets', 'sample.docx');
    if (!fs.existsSync(docxPath)) return; // Skip if not present
    const buffer = fs.readFileSync(docxPath);
    const result = await parseFile({ buffer, fileName: 'sample.docx' });
    expect(result.file_type).toBe('docx');
    expect(result.text.length).toBeGreaterThan(0);
  });

  it('throws on unsupported file type', async () => {
    const buffer = Buffer.from('irrelevant');
    await expect(parseFile({ buffer, fileName: 'test.xyz' })).rejects.toThrow('Unsupported file type');
  });
}); 
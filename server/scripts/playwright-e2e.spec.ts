import { test, expect } from '@playwright/test';

test.describe('AI Chatbot SaaS E2E (All Modalities)', () => {
  const testCases = [
    { label: 'TXT', name: 'test.txt', mimeType: 'text/plain', buffer: Buffer.from('Playwright E2E test file content'), query: 'Playwright' },
    { label: 'PDF', name: 'test.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%EOF'), query: 'PDF' },
    { label: 'DOCX', name: 'test.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: Buffer.from('PK\x03\x04'), query: 'DOCX' },
    { label: 'CSV', name: 'test.csv', mimeType: 'text/csv', buffer: Buffer.from('a,b,c\n1,2,3'), query: 'CSV' },
    { label: 'XLSX', name: 'test.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: Buffer.from('UEsDBBQABgAIAAAAIQAAAAAAAAAAAAAAAAAJAAAAdGVzdC54bGz//////////8AAAAAUEsBAhQAFAAIAAgAAAAhAAAAAAAAAAAAAAAAAAkAAAAAAAAAAAAAAAAAAAAAAAB0ZXN0Lnhsc1BLAQIeAwoAAAAAAQAAAAEAAAAAAQAAAAAA', 'base64'), query: 'XLSX' },
    { label: 'JPG', name: 'test.jpg', mimeType: 'image/jpeg', buffer: Buffer.from([0xFF, 0xD8, 0xFF, 0xD9]), query: 'image' },
    { label: 'MP3', name: 'test.mp3', mimeType: 'audio/mp3', buffer: Buffer.from([0x49, 0x44, 0x33]), query: 'audio' },
    { label: 'MP4', name: 'test.mp4', mimeType: 'video/mp4', buffer: Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6D, 0x70, 0x34, 0x32]), query: 'video' },
  ];

  for (const testCase of testCases) {
    test(`Upload, preview, chat, and delete for ${testCase.label}`, async ({ page }) => {
      await page.goto('http://localhost:5173');
      // Upload file
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.click('button:has-text("Upload")');
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles({ name: testCase.name, mimeType: testCase.mimeType, buffer: testCase.buffer });
      await expect(page.locator('.progress-bar')).toBeVisible();
      await expect(page.locator('text=Complete!')).toBeVisible({ timeout: 20000 });
      // Preview (if image/audio/video, check for preview element)
      if (['JPG', 'PNG', 'MP3', 'MP4'].includes(testCase.label)) {
        await expect(page.locator('.file-preview')).toBeVisible({ timeout: 10000 });
      }
      // Ask a question
      await page.fill('input[placeholder="Type your message"]', `What is in the ${testCase.label} file?`);
      await page.click('button:has-text("Send")');
      await expect(page.locator('.chat-message')).toContainText(testCase.query, { timeout: 20000 });
      // Delete the file
      await page.click('button:has-text("Delete")');
      await expect(page.locator('text=File deleted')).toBeVisible({ timeout: 5000 });
    });
  }
}); 
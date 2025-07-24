import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import ChatWithFile from '../ChatWithFile';
import { AuthContext } from '../../context/AuthContext';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock encryption/decryption
vi.mock('../../lib/crypto', () => ({
  encryptData: vi.fn(async (_key, data) => `encrypted:${data}`),
  decryptData: vi.fn(async (_key, data) => data.replace('encrypted:', '')),
}));

// Mock useEncryptionKey
vi.mock('../../lib/useEncryptionKey', () => ({
  useEncryptionKey: () => 'mock-key',
}));

const mockUser = { id: 'user1', email: 'user1@example.com' };
const mockAuthContext = { user: mockUser };
const fileId = 'file123';
const onClose = vi.fn();

// MSW handlers
const server = setupServer(
  rest.post('/api/ask-file/:fileId', (req, res, ctx) => {
    return res(ctx.json({ encryptedResponse: 'encrypted:AI response', hallucination: { isHallucination: false }, detectedLang: 'en', translated: false }));
  }),
  rest.post('/api/feedback', (req, res, ctx) => {
    return res(ctx.status(200));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ChatWithFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderChat(props = {}) {
    return render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <ChatWithFile fileId={fileId} onClose={onClose} {...props} />
      </AuthContext.Provider>
    );
  }

  it('renders UI controls and empty state', () => {
    renderChat();
    expect(screen.getByText('Chat with File')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    expect(screen.getByText('No messages yet. Ask something about this file!')).toBeInTheDocument();
    expect(screen.getByLabelText('Model:')).toBeInTheDocument();
    expect(screen.getByDisplayValue('gpt-4o')).toBeInTheDocument();
    expect(screen.getByDisplayValue('single-shot')).toBeInTheDocument();
  });

  it('sends a message and displays AI response', async () => {
    renderChat();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Hello file!' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    const sendBtn = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendBtn);
    await waitFor(() => expect(screen.getByText('Hello file!')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('AI response')).toBeInTheDocument());
  });

  it('shows error on API failure', async () => {
    server.use(
      rest.post('/api/ask-file/:fileId', (_req, res, ctx) => res(ctx.status(500), ctx.json({ error: 'fail' })))
    );
    renderChat();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'fail' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    const sendBtn = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendBtn);
    await waitFor(() => expect(screen.getByText(/Error getting response/)).toBeInTheDocument());
  });

  it('does not send empty input', async () => {
    renderChat();
    const sendBtn = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendBtn);
    expect(screen.queryByText('AI response')).not.toBeInTheDocument();
  });

  it('handles feedback submission', async () => {
    renderChat();
    // Send a message first
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Feedback test' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    const sendBtn = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendBtn);
    await waitFor(() => expect(screen.getByText('AI response')).toBeInTheDocument());
    // Click feedback button
    const thumbsUp = screen.getByTitle('Helpful');
    fireEvent.click(thumbsUp);
    await waitFor(() => expect(screen.getByText('Thank you for your feedback!')).toBeInTheDocument());
  });

  it('shows feedback error on API failure', async () => {
    server.use(
      rest.post('/api/feedback', (_req, res, ctx) => res(ctx.status(500)))
    );
    renderChat();
    // Send a message first
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Feedback error' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    const sendBtn = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendBtn);
    await waitFor(() => expect(screen.getByText('AI response')).toBeInTheDocument());
    // Click feedback button
    const thumbsDown = screen.getByTitle('Not Helpful');
    fireEvent.click(thumbsDown);
    await waitFor(() => expect(screen.getByText('Failed to submit feedback.')).toBeInTheDocument());
  });

  it('handles no user (unauthenticated)', () => {
    render(
      <AuthContext.Provider value={{ user: null } as any}>
        <ChatWithFile fileId={fileId} onClose={onClose} />
      </AuthContext.Provider>
    );
    expect(screen.getByText('Chat with File')).toBeInTheDocument();
  });

  it('handles no encryption key', async () => {
    vi.mocked(require('../../lib/useEncryptionKey').useEncryptionKey).mockReturnValueOnce(null);
    renderChat();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'No key' } });
    const sendBtn = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendBtn);
    expect(screen.queryByText('No key')).not.toBeInTheDocument();
  });

  it('shows loading state', async () => {
    renderChat();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Loading test' } });
    const sendBtn = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendBtn);
    expect(screen.getByText(/Submitting/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('AI response')).toBeInTheDocument());
  });

  it('closes on close button click', () => {
    renderChat();
    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
}); 
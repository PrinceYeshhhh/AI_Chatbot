import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatInput } from '../../components/ChatInput';

// Mock chatService.uploadFiles to avoid real uploads
jest.mock('../../services/chatService', () => ({
  chatService: {
    uploadFiles: jest.fn(() => Promise.resolve({ summary: { totalChunks: 1 }, errors: [] }))
  }
}));

describe('ChatInput', () => {
  const onSendMessage = jest.fn(() => Promise.resolve());
  const onError = jest.fn();

  beforeEach(() => {
    onSendMessage.mockClear();
    onError.mockClear();
  });

  it('renders input and send button', () => {
    render(<ChatInput onSendMessage={onSendMessage} />);
    expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('allows typing and sending a message', async () => {
    render(<ChatInput onSendMessage={onSendMessage} />);
    const textarea = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });
    await waitFor(() => expect(onSendMessage).toHaveBeenCalledWith('Hello world'));
  });

  it('shows error for empty message', async () => {
    render(<ChatInput onSendMessage={onSendMessage} onError={onError} />);
    const textarea = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(textarea, { target: { value: '   ' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });
    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.stringMatching(/empty/)));
  });

  it('shows error for too long message', async () => {
    render(<ChatInput onSendMessage={onSendMessage} onError={onError} maxLength={10} />);
    const textarea = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(textarea, { target: { value: 'a'.repeat(20) } });
    fireEvent.keyDown(textarea, { key: 'Enter' });
    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.stringMatching(/too long/)));
  });

  it('handles loading state (isProcessing)', async () => {
    render(<ChatInput onSendMessage={() => new Promise(res => setTimeout(res, 100))} />);
    const textarea = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(textarea, { target: { value: 'Test' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });
    expect(textarea).toBeDisabled();
    await waitFor(() => expect(textarea).not.toBeDisabled());
  });

  it('supports keyboard navigation (Ctrl+Enter, Shift+Enter, Escape)', async () => {
    render(<ChatInput onSendMessage={onSendMessage} />);
    const textarea = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(textarea, { target: { value: 'Test' } });
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
    await waitFor(() => expect(onSendMessage).toHaveBeenCalledWith('Test'));
    fireEvent.change(textarea, { target: { value: 'Line1' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
    expect(textarea).toHaveValue('Line1');
    fireEvent.keyDown(textarea, { key: 'Escape' });
    expect(textarea).toHaveValue('');
  });

  it('shows and hides attachment panel', () => {
    render(<ChatInput onSendMessage={onSendMessage} />);
    const attachBtn = screen.getByRole('button', { name: /attach files or use voice input/i });
    fireEvent.click(attachBtn);
    expect(screen.getByText(/attachments/i)).toBeInTheDocument();
    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/attachments/i)).not.toBeInTheDocument();
  });

  it('handles file upload UI and errors', async () => {
    render(<ChatInput onSendMessage={onSendMessage} onError={onError} />);
    const attachBtn = screen.getByRole('button', { name: /attach files or use voice input/i });
    fireEvent.click(attachBtn);
    const fileInput = screen.getByLabelText(/file/i);
    const file = new File(['dummy'], 'test.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => expect(screen.getByText(/upload successful/i)).toBeInTheDocument());
  });

  it('is accessible (has aria-labels, can be tabbed)', () => {
    render(<ChatInput onSendMessage={onSendMessage} />);
    const textarea = screen.getByPlaceholderText(/type your message/i);
    expect(textarea).toHaveAttribute('aria-label');
    textarea.focus();
    expect(textarea).toHaveFocus();
  });

  it('shows mic button and handles voice input UI', async () => {
    render(<ChatInput onSendMessage={onSendMessage} />);
    const micBtn = screen.getByRole('button', { name: /mic: start voice input/i });
    expect(micBtn).toBeInTheDocument();
    fireEvent.click(micBtn);
    // Simulate Web Speech API not supported
    // Should show fallback error
    await waitFor(() => expect(screen.getByText(/not supported|fallback/i)).toBeInTheDocument());
  });

  it('shows language selection for voice input', () => {
    render(<ChatInput onSendMessage={onSendMessage} />);
    fireEvent.click(screen.getByRole('button', { name: /mic: start voice input/i }));
    expect(screen.getByRole('combobox', { name: /voice input language/i })).toBeInTheDocument();
  });
}); 
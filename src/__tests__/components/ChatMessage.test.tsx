import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatMessage } from '../../components/ChatMessage';

describe('ChatMessage', () => {
  it('renders user message with correct content and role', () => {
    render(<ChatMessage message={{ id: '1', content: 'Hello', sender: 'user', timestamp: new Date() }} isLastMessage={false} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByLabelText(/user message/i)).toBeInTheDocument();
  });

  it('renders bot message with correct content and role', () => {
    render(<ChatMessage message={{ id: '2', content: 'Hi there!', sender: 'bot', timestamp: new Date() }} isLastMessage={false} />);
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
    expect(screen.getByLabelText(/bot message/i)).toBeInTheDocument();
  });

  it('renders markdown content', () => {
    render(<ChatMessage message={{ id: '3', content: '**Bold** _italic_', sender: 'bot', timestamp: new Date() }} isLastMessage={false} />);
    expect(screen.getByText(/bold/i)).toBeInTheDocument();
    expect(screen.getByText(/italic/i)).toBeInTheDocument();
  });

  it('is accessible (has aria-labels, can be tabbed)', () => {
    render(<ChatMessage message={{ id: '4', content: 'Accessible', sender: 'user', timestamp: new Date() }} isLastMessage={false} />);
    const msg = screen.getByLabelText(/user message/i);
    expect(msg).toBeInTheDocument();
    msg.focus();
    expect(msg).toHaveFocus();
  });

  it('shows speaker button for bot message and handles TTS', () => {
    render(<ChatMessage message={{ id: '5', content: 'Speak this', sender: 'bot', timestamp: new Date(), lang: 'en' }} isLastMessage={false} />);
    const speakerBtn = screen.getByRole('button', { name: /read message aloud/i });
    expect(speakerBtn).toBeInTheDocument();
  });

  it('shows translation tooltip if translated', () => {
    render(<ChatMessage message={{ id: '6', content: 'Hola', sender: 'bot', timestamp: new Date(), translatedFrom: 'es' }} isLastMessage={false} />);
    expect(screen.getByText(/translated from es/i)).toBeInTheDocument();
  });
}); 
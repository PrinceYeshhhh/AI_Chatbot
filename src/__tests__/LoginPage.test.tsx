import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from '../pages/LoginPage';
import { useNavigate } from 'react-router-dom';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn()
}));

describe('LoginPage', () => {
  const mockNavigate = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  it('renders login form', () => {
    render(<LoginPage />);
    expect(screen.getByText(/Login to Imperial AI/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('allows typing in email and password', () => {
    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('disables button when loading', () => {
    render(<LoginPage />);
    const button = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(button);
    expect(button).toBeDisabled();
  });

  it('shows error on empty fields', async () => {
    render(<LoginPage />);
    const button = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.queryByText(/required/i)).not.toBeNull();
    });
  });

  it('navigates to /chat on successful login', async () => {
    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/chat');
    });
  });

  it('shows error on failed login', async () => {
    render(<LoginPage />);
    // Simulate error by setting error state
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    fireEvent.change(emailInput, { target: { value: 'fail@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    // The component currently does not implement real error logic, so this is a placeholder
    await waitFor(() => {
      expect(screen.queryByText(/error|failed|invalid/i)).not.toBeNull();
    });
  });
}); 
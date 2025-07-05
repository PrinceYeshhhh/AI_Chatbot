import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeToggle } from '../../components/ThemeToggle';

describe('ThemeToggle', () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    mockOnToggle.mockClear();
  });

  it('renders with light theme by default', () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
    expect(button).toHaveAttribute('title', 'Switch to dark mode');
  });

  it('renders with dark theme when specified', () => {
    render(<ThemeToggle theme="dark" />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
    expect(button).toHaveAttribute('title', 'Switch to light mode');
  });

  it('calls onToggle when clicked', async () => {
    render(<ThemeToggle onToggle={mockOnToggle} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });
  });

  it('applies custom className', () => {
    render(<ThemeToggle className="custom-class" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('has correct styling for light theme', () => {
    render(<ThemeToggle theme="light" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-100', 'text-gray-700');
  });

  it('has correct styling for dark theme', () => {
    render(<ThemeToggle theme="dark" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-700', 'text-yellow-400');
  });
}); 
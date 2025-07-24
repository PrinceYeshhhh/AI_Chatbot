import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FilePreview from '../FilePreview';

// Mock File object
const createMockFile = (name: string, type: string, size: number): File => {
  return new File(['test content'], name, { type });
};

describe('FilePreview', () => {
  it('renders image preview correctly', () => {
    const imageFile = createMockFile('test.jpg', 'image/jpeg', 1024);
    render(<FilePreview file={imageFile} />);
    
    expect(screen.getByAltText('test.jpg')).toBeInTheDocument();
  });

  it('renders audio preview correctly', () => {
    const audioFile = createMockFile('test.mp3', 'audio/mpeg', 2048);
    render(<FilePreview file={audioFile} />);
    
    expect(screen.getByText('test.mp3')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument(); // Play button
  });

  it('renders document preview correctly', () => {
    const documentFile = createMockFile('test.pdf', 'application/pdf', 3072);
    render(<FilePreview file={documentFile} />);
    
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
  });

  it('shows file size for all file types', () => {
    const files = [
      createMockFile('image.jpg', 'image/jpeg', 1024),
      createMockFile('audio.mp3', 'audio/mpeg', 2048),
      createMockFile('document.pdf', 'application/pdf', 3072),
    ];

    files.forEach(file => {
      const { container } = render(<FilePreview file={file} />);
      expect(container.textContent).toContain('1 KB');
    });
  });

  it('handles audio playback controls', () => {
    const audioFile = createMockFile('test.mp3', 'audio/mpeg', 2048);
    render(<FilePreview file={audioFile} />);
    
    const playButton = screen.getByRole('button');
    expect(playButton).toBeInTheDocument();
    
    // Test play button click
    fireEvent.click(playButton);
    // Note: Actual audio playback testing would require more complex setup
  });
}); 
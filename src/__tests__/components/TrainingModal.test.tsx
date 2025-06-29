import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TrainingModal from '../../components/TrainingModal';
import { chatService } from '../../services/chatService';
import { TrainingData } from '../../types';

// Mock the chatService
jest.mock('../../services/chatService', () => ({
  chatService: {
    getTrainingStats: jest.fn(),
    getTrainingData: jest.fn(),
    addTrainingData: jest.fn(),
    removeTrainingData: jest.fn(),
    exportTrainingData: jest.fn(),
  },
}));

// Mock the icons
jest.mock('lucide-react', () => ({
  Brain: () => <div data-testid="brain-icon">Brain</div>,
  X: () => <div data-testid="x-icon">X</div>,
  Upload: () => <div data-testid="upload-icon">Upload</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  Database: () => <div data-testid="database-icon">Database</div>,
  FileText: () => <div data-testid="file-text-icon">FileText</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  Trash2: () => <div data-testid="trash-icon">Trash2</div>,
  CheckCircle: () => <div data-testid="check-circle-icon">CheckCircle</div>,
  AlertCircle: () => <div data-testid="alert-circle-icon">AlertCircle</div>,
}));

const mockChatService = chatService as jest.Mocked<typeof chatService>;

describe('TrainingModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockChatService.getTrainingStats.mockResolvedValue({
      total: 0,
      validated: 0,
      pending: 0,
      rejected: 0,
      validationRate: 0,
    });
    
    mockChatService.getTrainingData.mockReturnValue([]);
    mockChatService.addTrainingData.mockResolvedValue({
      id: '1',
      input: 'test input',
      expectedOutput: 'test output',
      intent: 'test intent',
      confidence: 0.98,
      dateAdded: new Date(),
      validationStatus: 'pending' as const,
    });
    mockChatService.removeTrainingData.mockResolvedValue();
    mockChatService.exportTrainingData.mockResolvedValue([]);
  });

  describe('Rendering', () => {
    test('should render when open', () => {
      render(<TrainingModal isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('AI Training Center')).toBeTruthy();
      expect(screen.getByText('Import Files')).toBeTruthy();
      expect(screen.getByText('Training Examples')).toBeTruthy();
      expect(screen.getByText('Statistics')).toBeTruthy();
    });

    test('should not render when closed', () => {
      render(<TrainingModal isOpen={false} onClose={mockOnClose} />);
      
      expect(screen.queryByText('AI Training Center')).toBeNull();
    });

    test('should display training examples count', () => {
      mockChatService.getTrainingStats.mockResolvedValue({
        total: 5,
        validated: 3,
        pending: 1,
        rejected: 1,
        validationRate: 60,
      });

      render(<TrainingModal isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('AI Training Portal')).toBeTruthy();
    });
  });

  describe('Tab Navigation', () => {
    test('should switch to training tab', async () => {
      render(<TrainingModal isOpen={true} onClose={mockOnClose} />);
      
      const trainingTab = screen.getByText('Add Training Data');
      fireEvent.click(trainingTab);
      
      await waitFor(() => {
        expect(screen.getByText('Upload Training Files')).toBeTruthy();
      });
    });

    test('should switch to data tab', async () => {
      render(<TrainingModal isOpen={true} onClose={mockOnClose} />);
      
      const dataTab = screen.getByText('Trained Data');
      fireEvent.click(dataTab);
      
      await waitFor(() => {
        expect(screen.getByText('Search training data...')).toBeTruthy();
      });
    });
  });

  describe('File Upload', () => {
    test('should handle file selection', async () => {
      render(<TrainingModal isOpen={true} onClose={mockOnClose} />);
      
      const fileInput = screen.getByRole('button', { name: /choose file/i });
      expect(fileInput).toBeTruthy();
    });

    test('should display supported file formats', async () => {
      render(<TrainingModal isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('Supports: TXT, CSV, JSON, PDF, DOC')).toBeTruthy();
    });
  });

  describe('Training Examples', () => {
    test('should add training example', async () => {
      const user = userEvent.setup();
      
      render(<TrainingModal isOpen={true} onClose={mockOnClose} />);
      
      // Fill in the form
      const inputField = screen.getByPlaceholderText(/question or input/i);
      const outputField = screen.getByPlaceholderText(/expected response/i);
      
      await user.type(inputField, 'test input');
      await user.type(outputField, 'test output');
      
      // Submit the form
      const addButton = screen.getByRole('button', { name: /add training example/i });
      await user.click(addButton);
      
      await waitFor(() => {
        expect(mockChatService.addTrainingData).toHaveBeenCalledWith(
          'test input',
          'test output',
          'custom'
        );
      });
    });

    test('should display existing training examples', async () => {
      const mockTrainingData: TrainingData[] = [
        {
          id: '1',
          input: 'hello',
          expectedOutput: 'Hello! How can I help you?',
          intent: 'greeting',
          confidence: 0.98,
          dateAdded: new Date(),
          validationStatus: 'validated',
        },
      ];

      mockChatService.getTrainingData.mockReturnValue(mockTrainingData);

      render(<TrainingModal isOpen={true} onClose={mockOnClose} />);
      
      // Switch to data tab
      fireEvent.click(screen.getByText('Trained Data'));
      
      await waitFor(() => {
        expect(screen.getByText('hello')).toBeTruthy();
        expect(screen.getByText('Hello! How can I help you?')).toBeTruthy();
        expect(screen.getByText('greeting')).toBeTruthy();
      });
    });

    test('should delete training example', async () => {
      const user = userEvent.setup();
      
      const mockTrainingData: TrainingData[] = [
        {
          id: '1',
          input: 'hello',
          expectedOutput: 'Hello! How can I help you?',
          intent: 'greeting',
          confidence: 0.98,
          dateAdded: new Date(),
          validationStatus: 'validated',
        },
      ];

      mockChatService.getTrainingData.mockReturnValue(mockTrainingData);

      render(<TrainingModal isOpen={true} onClose={mockOnClose} />);
      
      // Switch to data tab
      fireEvent.click(screen.getByText('Trained Data'));
      
      await waitFor(() => {
        const deleteButton = screen.getByTestId('trash-icon');
        expect(deleteButton).toBeTruthy();
      });

      const deleteButton = screen.getByTestId('trash-icon');
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(mockChatService.removeTrainingData).toHaveBeenCalledWith('1');
      });
    });
  });

  describe('Close Functionality', () => {
    test('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<TrainingModal isOpen={true} onClose={mockOnClose} />);
      
      const closeButton = screen.getByTestId('x-icon');
      await user.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Export Functionality', () => {
    test('should export training data', async () => {
      const user = userEvent.setup();
      
      const mockTrainingData: TrainingData[] = [
        {
          id: '1',
          input: 'hello',
          expectedOutput: 'Hello! How can I help you?',
          intent: 'greeting',
          confidence: 0.98,
          dateAdded: new Date(),
          validationStatus: 'validated',
        },
      ];

      mockChatService.getTrainingData.mockReturnValue(mockTrainingData);

      render(<TrainingModal isOpen={true} onClose={mockOnClose} />);
      
      // Switch to data tab
      fireEvent.click(screen.getByText('Trained Data'));
      
      await waitFor(() => {
        const exportButton = screen.getByRole('button', { name: /export/i });
        expect(exportButton).toBeTruthy();
      });

      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);
      
      expect(mockChatService.exportTrainingData).toHaveBeenCalled();
    });
  });
}); 
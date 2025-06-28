import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TrainingModal from '../../components/TrainingModal';
import { chatService } from '../../services/chatService';

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
    mockChatService.getTrainingStats.mockReturnValue({
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
      validationStatus: 'pending',
    });
    mockChatService.removeTrainingData.mockImplementation();
    mockChatService.exportTrainingData.mockReturnValue([]);
  });

  describe('Rendering', () => {
    test('should render when open', () => {
      render(<TrainingModal isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('AI Training Center')).toBeInTheDocument();
      expect(screen.getByText('Import Files')).toBeInTheDocument();
      expect(screen.getByText('Training Examples')).toBeInTheDocument();
      expect(screen.getByText('Statistics')).toBeInTheDocument();
    });

    test('should not render when closed', () => {
      render(<TrainingModal isOpen={false} onClose={mockOnClose} />);
      
      expect(screen.queryByText('AI Training Center')).not.toBeInTheDocument();
    });

    test('should display training examples count', () => {
      mockChatService.getTrainingStats.mockReturnValue({
        total: 5,
        validated: 3,
        pending: 1,
        rejected: 1,
        validationRate: 60,
      });

      render(<TrainingModal isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText(/5 examples trained/)).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    test('should switch to files tab', async () => {
      render(<TrainingModal isOpen={true} onClose={mockOnClose} />);
      
      const filesTab = screen.getByText('Import Files');
      fireEvent.click(filesTab);
      
      await waitFor(() => {
        expect(screen.getByText('Upload Training Documents')).toBeInTheDocument();
      });
    });

    test('should switch to examples tab', async () => {
      render(<TrainingModal isOpen={true} onClose={mockOnClose} />);
      
      const examplesTab = screen.getByText('Training Examples');
      fireEvent.click(examplesTab);
      
      await waitFor(() => {
        expect(screen.getByText('Add Training Example')).toBeInTheDocument();
      });
    });

    test('should switch to stats tab', async () => {
      render(<TrainingModal isOpen={true} onClose={mockOnClose} />);
      
      const statsTab = screen.getByText('Statistics');
      fireEvent.click(statsTab);
      
      await waitFor(() => {
        expect(screen.getByText('Training Examples')).toBeInTheDocument();
        expect(screen.getByText('Intent Categories')).toBeInTheDocument();
        expect(screen.getByText('Avg Confidence')).toBeInTheDocument();
      });
    });
  });

  describe('File Upload', () => {
    test('should handle file selection', async () => {
      render(<TrainingModal isOpen={true} onClose={mockOnClose} />);
      
      // Switch to files tab
      fireEvent.click(screen.getByText('Import Files'));
      
      const fileInput = screen.getByRole('button', { name: /choose files/i });
      expect(fileInput).toBeInTheDocument();
    });

    test('should display supported file formats', async () => {
      render(<TrainingModal isOpen={true} onClose={mockOnClose} />);
      
      // Switch to files tab
      fireEvent.click(screen.getByText('Import Files'));
      
      await waitFor(() => {
        expect(screen.getByText('PDF')).toBeInTheDocument();
        expect(screen.getByText('TXT')).toBeInTheDocument();
        expect(screen.getByText('CSV')).toBeInTheDocument();
        expect(screen.getByText('MD')).toBeInTheDocument();
        expect(screen.getByText('JSON')).toBeInTheDocument();
        expect(screen.getByText('DOCX')).toBeInTheDocument();
      });
    });
  });

  describe('Training Examples', () => {
    test('should add training example', async () => {
      const user = userEvent.setup();
      
      render(<TrainingModal isOpen={true} onClose={mockOnClose} />);
      
      // Switch to examples tab
      fireEvent.click(screen.getByText('Training Examples'));
      
      await waitFor(() => {
        expect(screen.getByText('Add Training Example')).toBeInTheDocument();
      });

      // Fill in the form
      const inputField = screen.getByPlaceholderText(/user input/i);
      const outputField = screen.getByPlaceholderText(/expected response/i);
      const intentField = screen.getByPlaceholderText(/intent category/i);
      
      await user.type(inputField, 'test input');
      await user.type(outputField, 'test output');
      await user.type(intentField, 'test intent');
      
      // Submit the form
      const addButton = screen.getByRole('button', { name: /add example/i });
      await user.click(addButton);
      
      await waitFor(() => {
        expect(mockChatService.addTrainingData).toHaveBeenCalledWith(
          'test input',
          'test output',
          'test intent'
        );
      });
    });

    test('should display existing training examples', async () => {
      const mockTrainingData = [
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
      
      // Switch to examples tab
      fireEvent.click(screen.getByText('Training Examples'));
      
      await waitFor(() => {
        expect(screen.getByText('hello')).toBeInTheDocument();
        expect(screen.getByText('Hello! How can I help you?')).toBeInTheDocument();
        expect(screen.getByText('greeting')).toBeInTheDocument();
      });
    });

    test('should delete training example', async () => {
      const user = userEvent.setup();
      
      const mockTrainingData = [
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
      
      // Switch to examples tab
      fireEvent.click(screen.getByText('Training Examples'));
      
      await waitFor(() => {
        const deleteButton = screen.getByTestId('trash-icon');
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByTestId('trash-icon');
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(mockChatService.removeTrainingData).toHaveBeenCalledWith('1');
      });
    });
  });

  describe('Statistics', () => {
    test('should display training statistics', async () => {
      const mockTrainingData = [
        {
          id: '1',
          input: 'hello',
          expectedOutput: 'Hello! How can I help you?',
          intent: 'greeting',
          confidence: 0.98,
          dateAdded: new Date(),
          validationStatus: 'validated',
        },
        {
          id: '2',
          input: 'goodbye',
          expectedOutput: 'Goodbye! Have a great day!',
          intent: 'farewell',
          confidence: 0.95,
          dateAdded: new Date(),
          validationStatus: 'validated',
        },
      ];

      mockChatService.getTrainingData.mockReturnValue(mockTrainingData);

      render(<TrainingModal isOpen={true} onClose={mockOnClose} />);
      
      // Switch to stats tab
      fireEvent.click(screen.getByText('Statistics'));
      
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // totalExamples
        expect(screen.getByText('2')).toBeInTheDocument(); // uniqueIntents
        expect(screen.getByText('97%')).toBeInTheDocument(); // averageConfidence
      });
    });

    test('should display intent distribution', async () => {
      const mockTrainingData = [
        {
          id: '1',
          input: 'hello',
          expectedOutput: 'Hello! How can I help you?',
          intent: 'greeting',
          confidence: 0.98,
          dateAdded: new Date(),
          validationStatus: 'validated',
        },
        {
          id: '2',
          input: 'goodbye',
          expectedOutput: 'Goodbye! Have a great day!',
          intent: 'farewell',
          confidence: 0.95,
          dateAdded: new Date(),
          validationStatus: 'validated',
        },
      ];

      mockChatService.getTrainingData.mockReturnValue(mockTrainingData);

      render(<TrainingModal isOpen={true} onClose={mockOnClose} />);
      
      // Switch to stats tab
      fireEvent.click(screen.getByText('Statistics'));
      
      await waitFor(() => {
        expect(screen.getByText('greeting')).toBeInTheDocument();
        expect(screen.getByText('farewell')).toBeInTheDocument();
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

    test('should call onClose when close button in footer is clicked', async () => {
      const user = userEvent.setup();
      
      render(<TrainingModal isOpen={true} onClose={mockOnClose} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Export Functionality', () => {
    test('should export training data', async () => {
      const user = userEvent.setup();
      
      const mockTrainingData = [
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
      
      // Switch to examples tab
      fireEvent.click(screen.getByText('Training Examples'));
      
      await waitFor(() => {
        const exportButton = screen.getByRole('button', { name: /export training data/i });
        expect(exportButton).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /export training data/i });
      await user.click(exportButton);
      
      expect(mockChatService.exportTrainingData).toHaveBeenCalled();
    });
  });
}); 
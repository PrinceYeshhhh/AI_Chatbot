import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AnalyticsDashboard from '../../pages/admin/AnalyticsDashboard';
import * as api from '../../services/analyticsService';

jest.mock('../../services/analyticsService');

const mockData = {
  fileUploads: [
    { date: '2024-01-01', count: 5 },
    { date: '2024-01-02', count: 3 }
  ],
  tokenUsage: [
    { date: '2024-01-01', tokens: 1000 },
    { date: '2024-01-02', tokens: 2000 }
  ]
};

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders charts with test data', async () => {
    api.fetchAnalyticsSummary.mockResolvedValueOnce(mockData);
    render(<AnalyticsDashboard />);
    expect(screen.getByText(/Analytics Dashboard/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/File Uploads/i)).toBeInTheDocument();
      expect(screen.getByText(/Token Usage/i)).toBeInTheDocument();
    });
  });

  it('shows loading indicator', async () => {
    api.fetchAnalyticsSummary.mockReturnValue(new Promise(() => {}));
    render(<AnalyticsDashboard />);
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('shows empty state if no data', async () => {
    api.fetchAnalyticsSummary.mockResolvedValueOnce({ fileUploads: [], tokenUsage: [] });
    render(<AnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/No analytics data available/i)).toBeInTheDocument();
    });
  });

  it('shows error message on API failure', async () => {
    api.fetchAnalyticsSummary.mockRejectedValueOnce(new Error('API error'));
    render(<AnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Failed to load analytics/i)).toBeInTheDocument();
    });
  });
}); 
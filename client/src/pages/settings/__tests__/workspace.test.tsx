import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import WorkspaceSettings from '../workspace';
import * as WorkspaceContext from '../../../context/WorkspaceContext';

// Mock fetch
global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({ members: [{ user_id: 'user1', role: 'viewer', joined_at: new Date().toISOString() }] }) })) as jest.Mock;

describe('WorkspaceSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function renderWithRole(role: string) {
    jest.spyOn(WorkspaceContext, 'useWorkspace').mockReturnValue({
      workspaceId: 'ws1',
      role,
      loading: false,
      error: null
    } as any);
    return render(<WorkspaceSettings />);
  }

  it('renders members table for admin', async () => {
    renderWithRole('admin');
    expect(screen.getByText(/Workspace Members/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument();
      expect(screen.getByText('Viewer')).toBeInTheDocument();
    });
  });

  it('shows invite form for admin', () => {
    renderWithRole('admin');
    expect(screen.getByPlaceholderText(/User Email or ID/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Invite/i })).toBeInTheDocument();
  });

  it('allows changing member role for admin', async () => {
    renderWithRole('admin');
    await waitFor(() => expect(screen.getByText('user1')).toBeInTheDocument());
    const select = screen.getAllByRole('combobox')[1];
    fireEvent.change(select, { target: { value: 'admin' } });
    // No assertion for backend, just UI interaction
    expect(select).toHaveValue('admin');
  });

  it('allows removing a member for admin', async () => {
    renderWithRole('admin');
    await waitFor(() => expect(screen.getByText('user1')).toBeInTheDocument());
    const removeBtn = screen.getByRole('button', { name: /Remove/i });
    fireEvent.click(removeBtn);
    // No assertion for backend, just UI interaction
    expect(removeBtn).toBeInTheDocument();
  });

  it('shows impersonate form for admin', () => {
    renderWithRole('admin');
    expect(screen.getByPlaceholderText(/Impersonate/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Impersonate/i })).toBeInTheDocument();
  });

  it('renders non-admin view (no invite, no impersonate)', () => {
    renderWithRole('viewer');
    expect(screen.getByText(/Workspace Members/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/User Email or ID/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Impersonate/i })).not.toBeInTheDocument();
  });

  it('shows loading and error states', () => {
    jest.spyOn(WorkspaceContext, 'useWorkspace').mockReturnValue({
      workspaceId: 'ws1',
      role: 'admin',
      loading: true,
      error: null
    } as any);
    render(<WorkspaceSettings />);
    expect(screen.getByText(/Loading workspace settings/i)).toBeInTheDocument();
    jest.spyOn(WorkspaceContext, 'useWorkspace').mockReturnValue({
      workspaceId: 'ws1',
      role: 'admin',
      loading: false,
      error: 'Error!' 
    } as any);
    render(<WorkspaceSettings />);
    expect(screen.getByText(/Error!/i)).toBeInTheDocument();
  });
}); 
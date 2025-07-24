import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WorkspaceContextType {
  user: any;
  workspaceId: string;
  role: string;
  setWorkspace: (id: string, role: string) => void;
  loading: boolean;
  error: string | null;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [workspaceId, setWorkspaceId] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/profile');
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        setUser({ id: data.id, email: data.email });
        // Use first workspace as default
        const ws = (data.workspaces && data.workspaces[0]) || {};
        setWorkspaceId(ws.workspace_id || '');
        setRole(ws.role || data.role || '');
      } catch (e: any) {
        setError(e.message || 'Failed to load profile');
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  const setWorkspace = (id: string, role: string) => {
    setWorkspaceId(id);
    setRole(role);
    // Optionally, send update to backend if needed
  };

  return (
    <WorkspaceContext.Provider value={{ user, workspaceId, role, setWorkspace, loading, error }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within a WorkspaceProvider');
  return ctx;
} 
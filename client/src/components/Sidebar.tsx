import { useWorkspace } from '../context/WorkspaceContext';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const { workspaceId, role, loading, error } = useWorkspace();
  const [workspaceName, setWorkspaceName] = useState('');

  useEffect(() => {
    // Optionally, fetch workspace name from backend if workspaceId changes
    async function fetchWorkspaceName() {
      if (!workspaceId) {
        setWorkspaceName('');
        return;
      }
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}`);
        if (!res.ok) throw new Error('Failed to fetch workspace');
        const data = await res.json();
        setWorkspaceName(data.name || '');
      } catch {
        setWorkspaceName('');
      }
    }
    fetchWorkspaceName();
  }, [workspaceId]);

  if (loading) {
    return <aside className="sidebar min-h-screen w-64 bg-gradient-to-b from-white via-blue-50 to-blue-100 shadow-xl flex flex-col"><div className="p-5">Loading workspace...</div></aside>;
  }
  if (error) {
    return <aside className="sidebar min-h-screen w-64 bg-gradient-to-b from-white via-blue-50 to-blue-100 shadow-xl flex flex-col"><div className="p-5 text-red-600">{error}</div></aside>;
  }

  return (
    <aside className="sidebar min-h-screen w-64 bg-gradient-to-b from-white via-blue-50 to-blue-100 shadow-xl flex flex-col">
      <div className="p-5 border-b bg-gradient-to-r from-blue-100 to-blue-200 flex flex-col gap-2 items-start">
        <span className="font-extrabold text-xl text-blue-900 tracking-tight truncate" title={workspaceName}>{workspaceName || 'Workspace'}</span>
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold shadow-sm mt-1 capitalize ${role === 'admin' ? 'bg-blue-600 text-white' : role === 'editor' ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}>{role}</span>
      </div>
      <nav className="flex-1 flex flex-col gap-1 p-4">
        <a href="#" className="block px-4 py-2 rounded-lg text-blue-900 font-medium hover:bg-blue-200 focus:bg-blue-300 focus:outline-none transition-all duration-150 min-w-[48px] min-h-[48px]" aria-label="Dashboard" tabIndex={0}>Dashboard</a>
        <a href="#" className="block px-4 py-2 rounded-lg text-blue-900 font-medium hover:bg-blue-200 focus:bg-blue-300 focus:outline-none transition-all duration-150 min-w-[48px] min-h-[48px]" aria-label="Files" tabIndex={0}>Files</a>
        <a href="#" className="block px-4 py-2 rounded-lg text-blue-900 font-medium hover:bg-blue-200 focus:bg-blue-300 focus:outline-none transition-all duration-150 min-w-[48px] min-h-[48px]" aria-label="Chat" tabIndex={0}>Chat</a>
        {role === 'admin' && (
          <a href="/admin/analytics" className="block px-4 py-2 rounded-lg text-blue-900 font-medium hover:bg-blue-200 focus:bg-blue-300 focus:outline-none transition-all duration-150 min-w-[48px] min-h-[48px]" aria-label="Analytics" tabIndex={0}>Analytics</a>
        )}
        {/* ...rest of sidebar nav... */}
      </nav>
      <div className="p-4 border-t bg-gradient-to-r from-blue-100 to-blue-200 text-xs text-blue-800 font-semibold tracking-wide shadow-inner">
        &copy; {new Date().getFullYear()} AI Chatbot SaaS
      </div>
    </aside>
  );
} 
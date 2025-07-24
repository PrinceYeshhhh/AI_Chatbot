import React from 'react';

interface ToolCallLog {
  id: string;
  function_name: string;
  arguments: any;
  response: any;
  created_at: string;
  tool_call_id?: string;
}

interface ToolCallDebugPanelProps {
  logs: ToolCallLog[];
  visible: boolean;
  onToggle: () => void;
}

const ToolCallDebugPanel: React.FC<ToolCallDebugPanelProps> = ({ logs, visible, onToggle }) => {
  return (
    <div className="my-4">
      <button onClick={onToggle} className="text-xs text-blue-700 font-bold mb-2">
        {visible ? 'Hide' : 'Show'} Tool Call Debug Panel
      </button>
      {visible && (
        <div className="bg-gray-100 border border-gray-300 rounded p-3 max-h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500 text-xs">No tool calls yet.</div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="mb-3 p-2 bg-white rounded shadow-sm">
                <div className="font-mono text-xs text-blue-900">⚙ <b>{log.function_name}</b> <span className="text-gray-400">({new Date(log.created_at).toLocaleTimeString()})</span></div>
                <div className="text-xs text-gray-700">🧾 Args: <pre className="bg-gray-50 p-1 rounded overflow-x-auto">{JSON.stringify(log.arguments, null, 2)}</pre></div>
                <div className="text-xs text-green-700">✅ Result: <pre className="bg-gray-50 p-1 rounded overflow-x-auto">{JSON.stringify(log.response, null, 2)}</pre></div>
                {log.tool_call_id && <div className="text-xs text-gray-400">ID: {log.tool_call_id}</div>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ToolCallDebugPanel; 
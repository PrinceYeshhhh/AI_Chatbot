import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { LogOut, User, Upload, Files } from 'lucide-react'
import FileUpload from '../components/FileUpload'
import FileList from '../components/FileList'
import ChatWithFile from '../components/ChatWithFile'
import AgentSwitcher from '../components/AgentSwitcher';
import ToolCallDebugPanel from '../components/ToolCallDebugPanel';
import Badge from '../components/Badge';
import InfoCard from '../components/InfoCard';
import Tooltip from '../components/Tooltip';
import { Zap, Layers, Database } from 'lucide-react';
import { E2EEProvider } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspace } from '../context/WorkspaceContext';
import ImageUpload from '../components/ImageUpload';
import AudioUpload from '../components/AudioUpload';
import VideoUpload from '../components/VideoUpload';

type Agent = {
  agent_id: string;
  name: string;
  role: string;
  avatar?: string;
  description?: string;
};

type Message = {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  thoughtProcess?: string;
  finalAnswer?: string;
  toolCall?: { name: string; input: any; output?: any };
  timestamp: number;
};

const ChatPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { workspaceId, role, loading: wsLoading, error: wsError } = useWorkspace();
  const [activeTab, setActiveTab] = useState<'upload' | 'files'>('upload')
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const [activeAgent, setActiveAgent] = useState<string>(''); // agent_id
  const [agents, setAgents] = useState<Agent[]>([]);
  const [chatHistories, setChatHistories] = useState<{ [agent_id: string]: Message[] }>({});
  const [userLang, setUserLang] = useState('en');
  const [devMode, setDevMode] = useState(false);
  const [toolLogs, setToolLogs] = useState<any[]>([]);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showContextPreview, setShowContextPreview] = useState(false);
  const [contextChunks, setContextChunks] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<any[]>([]); // or your message type

  const chatContainerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let interval: any;
    async function fetchLogs() {
      if (!user?.id) return;
      const { data } = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tool-usage-logs?user_id=${user.id}`)
        .then(res => res.json());
      setToolLogs(data || []);
    }
    if (showDebugPanel && user?.id) {
      fetchLogs();
      interval = setInterval(fetchLogs, 3000);
    }
    return () => interval && clearInterval(interval);
  }, [showDebugPanel, user]);

  // Fetch context chunks for the latest response when preview is enabled
  React.useEffect(() => {
    async function fetchContextChunks() {
      if (!user?.id || !showContextPreview) return;
      // Example: fetch from tool_usage_logs or a dedicated endpoint
      const { data } = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tool-usage-logs?user_id=${user.id}&limit=1`)
        .then(res => res.json());
      if (data && data.length > 0 && data[0].response?.context_chunks) {
        setContextChunks(data[0].response.context_chunks);
      } else {
        setContextChunks([]);
      }
    }
    fetchContextChunks();
  }, [showContextPreview, user]);

  // Fetch agents for AgentSwitcher
  React.useEffect(() => {
    async function fetchAgents() {
      if (!workspaceId) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/agent-tool/agents/${workspaceId}`);
      const data = await res.json();
      setAgents(data.agents || []);
      if (!activeAgent && data.agents && data.agents.length > 0) {
        setActiveAgent(data.agents[0].agent_id);
      }
    }
    fetchAgents();
  }, [workspaceId]);

  // Handler for sending a message
  async function handleSendMessage(text: string) {
    if (!activeAgent || !user?.id) return;
    const msg: Message = {
      id: Math.random().toString(36).slice(2),
      sender: 'user',
      text,
      timestamp: Date.now(),
    };
    setChatHistories(h => ({
      ...h,
      [activeAgent]: [...(h[activeAgent] || []), msg],
    }));
    // Call backend for agent response
    const history = (chatHistories[activeAgent] || []).map(m => ({
      sender: m.sender,
      text: m.text,
      thoughtProcess: m.thoughtProcess,
      finalAnswer: m.finalAnswer,
      toolCall: m.toolCall,
      timestamp: m.timestamp,
    }));
    setIsTyping(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/agent-tool/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: activeAgent,
          user_id: user.id,
          message: text,
          history,
        }),
      });
      const data = await res.json();
      const agentMsg: Message = {
        id: Math.random().toString(36).slice(2),
        sender: 'agent',
        text: '',
        thoughtProcess: data.thoughtProcess,
        finalAnswer: data.finalAnswer,
        toolCall: data.toolCalls && data.toolCalls.length > 0 ? data.toolCalls[0] : undefined,
        timestamp: Date.now(),
      };
      setChatHistories(h => ({
        ...h,
        [activeAgent]: [...(h[activeAgent] || []), agentMsg],
      }));
    } catch (err) {
      // Optionally show error in chat
    } finally {
      setIsTyping(false);
    }
  }

  const handleImageResult = (result: { ocrText: string; caption: string }) => {
    setMessages((msgs) => [
      ...msgs,
      {
        id: `img-${Date.now()}`,
        role: 'assistant',
        content: `**Image OCR:** ${result.ocrText}\n**Caption:** ${result.caption}`,
        type: 'image-result',
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleAudioResult = (result: { transcript: string }) => {
    setMessages((msgs) => [
      ...msgs,
      {
        id: `audio-${Date.now()}`,
        role: 'assistant',
        content: `**Audio Transcript:** ${result.transcript}`,
        type: 'audio-result',
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleVideoResult = (result: { transcript: string; summary: string }) => {
    setMessages((msgs) => [
      ...msgs,
      {
        id: `video-${Date.now()}`,
        role: 'assistant',
        content: `**Video Transcript:** ${result.transcript}\n**Summary:** ${result.summary}`,
        type: 'video-result',
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  // Get current agent info
  const agent = agents.find(a => a.agent_id === activeAgent);
  const chat = chatHistories[activeAgent] || [];

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chat]);

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (wsLoading) return <div className="p-8">Loading workspace...</div>;
  if (wsError) return <div className="p-8 text-red-600">{wsError}</div>;

  return (
    <E2EEProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          {/* Constraint InfoCard */}
          <InfoCard
            title="Chat Constraints"
            description="Your current plan, context window, and memory usage."
            color="primary"
            icon={<Zap />}
            action={<Tooltip content="Upgrade plan or manage memory in settings."><span className="underline text-primary-600 cursor-pointer">Manage</span></Tooltip>}
          >
            <div className="flex flex-wrap gap-2 mb-2">
              <Tooltip content="Your current subscription plan">
                <Badge color="primary" icon={<Zap />} pulse={role === 'free'}>{role.charAt(0).toUpperCase() + role.slice(1)} Plan</Badge>
              </Tooltip>
              <Tooltip content="Maximum context window (tokens) for your plan">
                <Badge color="secondary" icon={<Layers />}>{workspaceId ? 'N/A' : 'N/A'} tokens</Badge>
              </Tooltip>
              <Tooltip content="Current memory usage (files, chunks, embeddings)">
                <Badge color="primary" icon={<Database />}>{workspaceId ? 'N/A' : 'N/A'} used</Badge>
              </Tooltip>
            </div>
            <div className="text-xs text-gray-500">Upgrade your plan or manage memory for higher limits.</div>
          </InfoCard>
          {/* Header with user info and logout */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Smart Brain AI Chatbot
              </h1>
              <p className="text-lg text-gray-600">
                Instant File Learning & RAG Technology
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-700">
                <User className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {user?.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
          {/* Dev Mode Toggle */}
          <div className="flex justify-end mb-2">
            <label className="flex items-center gap-2 text-xs text-blue-900 font-semibold cursor-pointer">
              <input type="checkbox" checked={devMode} onChange={e => setDevMode(e.target.checked)} />
              Dev Mode
            </label>
            <label className="flex items-center gap-2 text-xs text-purple-900 font-semibold cursor-pointer ml-4">
              <input type="checkbox" checked={showContextPreview} onChange={e => setShowContextPreview(e.target.checked)} />
              Show Context Preview
            </label>
          </div>

          {/* Main Content */}
          <div className="max-w-6xl mx-auto">
            {/* Language Switcher */}
            <div className="flex justify-end mb-2">
              <select value={userLang} onChange={e => setUserLang(e.target.value)} className="border rounded px-2 py-1">
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="zh">中文</option>
                <option value="hi">हिन्दी</option>
                <option value="ar">العربية</option>
                <option value="ru">Русский</option>
                <option value="ja">日本語</option>
                <option value="pt">Português</option>
                {/* Add more as needed */}
              </select>
            </div>
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm mb-6">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'upload'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Upload className="w-4 h-4" />
                Upload Files
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'files'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Files className="w-4 h-4" />
                My Files
              </button>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <AgentSwitcher activeAgent={activeAgent} setActiveAgent={setActiveAgent} workspaceId={workspaceId || ''} />
              {agent && (
                <div className="flex items-center gap-3 mb-2">
                  {agent.avatar && <img src={agent.avatar} alt="avatar" className="w-8 h-8 rounded-full" />}
                  <div>
                    <div className="font-bold text-blue-900">{agent.name} <span className="text-xs text-gray-500">({agent.role})</span></div>
                    <div className="text-xs text-gray-600">{agent.description}</div>
                  </div>
                </div>
              )}
              {/* Chat history */}
              <div ref={chatContainerRef} className="mb-4 max-h-96 overflow-y-auto bg-gray-50 rounded p-4">
                <AnimatePresence initial={false}>
                  {chat.map(msg => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.3 }}
                      className={`mb-3 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}
                    >
                      <div className={`inline-block px-3 py-2 rounded-lg ${msg.sender === 'user' ? 'bg-blue-100' : 'bg-green-50'}`}>
                        {msg.sender === 'user' ? (
                          <span>{msg.text}</span>
                        ) : (
                          <>
                            {msg.thoughtProcess && <div className="text-xs text-gray-500 mb-1"><b>Thought Process:</b> {msg.thoughtProcess}</div>}
                            {msg.finalAnswer && <div><b>Final Answer:</b> {msg.finalAnswer}</div>}
                            {/* Tool call visualization */}
                            {msg.toolCall && (
                              <div className="mt-2 p-2 bg-yellow-50 border-l-4 border-yellow-400 text-xs">
                                <b>Tool Used:</b> {msg.toolCall.name}<br />
                                <b>Input:</b> {JSON.stringify(msg.toolCall.input)}<br />
                                {msg.toolCall.output && <><b>Output:</b> {JSON.stringify(msg.toolCall.output)}</>}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {isTyping && (
                    <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-3 text-left">
                      <div className="inline-block px-3 py-2 rounded-lg bg-green-50">
                        <span className="inline-block w-8 h-4 align-middle">
                          <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce mr-1" style={{ animationDelay: '0ms' }}></span>
                          <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce mr-1" style={{ animationDelay: '150ms' }}></span>
                          <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* Message input */}
              <form onSubmit={e => { e.preventDefault(); const input = (e.target as any).elements.message.value; handleSendMessage(input); (e.target as any).reset(); }} className="flex gap-2">
                <input name="message" className="flex-1 border rounded px-2 py-1" placeholder="Type your message..." autoComplete="off" aria-label="Type your message" />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" aria-label="Send message">Send</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </E2EEProvider>
  )
}

export default ChatPage 
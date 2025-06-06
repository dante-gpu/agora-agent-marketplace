import React, { useState, useRef, useEffect } from 'react';
import { Send, FileText, Code, Download } from 'lucide-react';
import { format } from 'date-fns';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { useChatStore, Message } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from './LoadingSpinner';
import Button from './Button';

interface ChatWindowProps {
  agentId: string;
  agentName: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ agentId, agentName }) => {
  const { user } = useAuthStore();
  const { messages, loading, sendMessage, fetchMessages } = useChatStore();
  const [input, setInput] = useState('');
  const [isMarkdown, setIsMarkdown] = useState(false);
  const [usageHistory, setUsageHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Whenever the agent changes, clear UI state and reset history flag
  useEffect(() => {
    setShowHistory(false);
    fetchMessages(agentId);
  }, [agentId, fetchMessages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showHistory]);

  // Handle sending a message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    // hide usage view if visible
    setShowHistory(false);
    await sendMessage(input.trim(), isMarkdown, agentId);
    setInput('');
  };

  // File upload logic unchanged
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (file.type.startsWith('image/')) {
        console.log('Image upload:', content);
      } else {
        setInput(content);
        setIsMarkdown(file.name.endsWith('.md'));
      }
    };
    if (file.type.startsWith('image/')) reader.readAsDataURL(file);
    else reader.readAsText(file);
  };

  // Export chat unchanged
  const exportChat = () => {
    const chatContent = messages
      .map((msg) => {
        const ts = format(new Date(msg.created_at), 'yyyy-MM-dd HH:mm:ss');
        const sender = msg.is_bot ? agentName : 'You';
        return `[${ts}] ${sender}:\n${msg.content}\n`;
      })
      .join('\n');
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${agentName}-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Fetch usage history from server
  const fetchUsage = async () => {
    if (!showHistory) {
      const res = await fetch('/api/usage-history', {
        headers: {
          'x-user-role': 'admin',
          'x-user-id': user?.id || ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUsageHistory(data);
        setShowHistory(true);
      }
    } else {
      setShowHistory(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-20rem)] bg-gray-900 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h3 className="font-medium">Chat with {agentName}</h3>
        <div className="flex items-center gap-2">
          {user?.role === 'admin' && (
            <Button variant="outline" size="sm" onClick={fetchUsage}>
              {showHistory ? 'Hide Usage' : 'Usage History'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={Download}
            onClick={exportChat}
            title="Export chat"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {showHistory ? (
          <table className="w-full table-auto text-sm">
            <thead>
              <tr>
                <th className="px-2 py-1">User ID</th>
                <th className="px-2 py-1">Agent ID</th>
                <th className="px-2 py-1">Calls</th>
                <th className="px-2 py-1">Tokens</th>
                <th className="px-2 py-1">Last</th>
              </tr>
            </thead>
            <tbody>
              {usageHistory.map((h) => (
                <tr key={`${h.user_id}-${h.agent_id}`}>
                  <td className="px-2 py-1">{h.user_id}</td>
                  <td className="px-2 py-1">{h.agent_id}</td>
                  <td className="px-2 py-1">{h.total_interactions}</td>
                  <td className="px-2 py-1">{h.total_tokens}</td>
                  <td className="px-2 py-1">{new Date(h.last_interaction).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <>
            {messages.map((message: Message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.is_bot ? 'justify-start' : 'justify-end'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.is_bot ? 'bg-gray-800' : 'bg-[#e1ffa6] text-black'
                  }`}
                >
                  {message.content.startsWith('data:image') ||
                  message.content.startsWith('blob:') ? (
                    <img
                      src={message.content}
                      alt="Generated AI"
                      className="rounded-lg max-w-full max-h-[400px] object-contain"
                    />
                  ) : message.is_markdown ? (
                    <div className="prose prose-invert max-w-none">
                      <MarkdownPreview source={message.content} />
                    </div>
                  ) : (
                    <p className="break-words whitespace-pre-wrap">{message.content}</p>
                  )}
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>{format(new Date(message.created_at), 'HH:mm')}</span>
                    {message.is_markdown && (
                      <span className="px-2 py-0.5 rounded bg-gray-700 text-gray-300">
                        Markdown
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      {!showHistory && (
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="w-full bg-black border border-gray-800 rounded-lg py-3 px-4 pr-12 focus:outline-none focus:border-[#e1ffa6] min-h-[80px] max-h-[200px] resize-y"
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  title="Upload file"
                >
                  <FileText className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsMarkdown(!isMarkdown)}
                  className={`p-2 rounded-lg transition-colors ${
                    isMarkdown
                      ? 'text-[#e1ffa6] bg-[#e1ffa6]/10'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                  title="Toggle Markdown"
                >
                  <Code className="w-5 h-5" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              icon={loading ? undefined : Send}
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Send'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ChatWindow;

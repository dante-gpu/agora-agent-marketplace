import React, { useState, useRef, useEffect } from 'react';
import { Send, Image, FileText, Code, Download } from 'lucide-react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMessages(agentId);
  }, [agentId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    await sendMessage(agentId, input, isMarkdown);
    setInput('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Handle file upload
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (file.type.startsWith('image/')) {
        // Handle image upload
        console.log('Image upload:', content);
      } else {
        // Handle text file content
        setInput(content);
        setIsMarkdown(file.name.endsWith('.md'));
      }
    };

    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const exportChat = () => {
    const chatContent = messages
      .map((msg) => {
        const timestamp = format(new Date(msg.created_at), 'yyyy-MM-dd HH:mm:ss');
        const sender = msg.is_bot ? agentName : 'You';
        return `[${timestamp}] ${sender}:\n${msg.content}\n`;
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

  return (
    <div className="flex flex-col h-[calc(100vh-20rem)] bg-gray-900 rounded-xl overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h3 className="font-medium">Chat with {agentName}</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={Download}
            onClick={exportChat}
            title="Export chat"
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message: Message) => (
          <div
            key={message.id}
            className={`flex ${message.is_bot ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.is_bot
                  ? 'bg-gray-800'
                  : 'bg-[#e1ffa6] text-black'
              }`}
            >
              {message.is_markdown ? (
                <div className="prose prose-invert max-w-none">
                  <MarkdownPreview source={message.content} />
                </div>
              ) : (
                <p className="break-words whitespace-pre-wrap">{message.content}</p>
              )}
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span>{format(new Date(message.created_at), 'HH:mm')}</span>
                {message.is_markdown && (
                  <span className="px-2 py-0.5 rounded bg-gray-700 text-gray-300">Markdown</span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <div className="relative">
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
    </div>
  );
};

export default ChatWindow;
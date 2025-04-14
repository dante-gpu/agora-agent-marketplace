import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, Maximize2, Minimize2, Code, ChevronUp, Trash2, ExternalLink } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import Card from './Card';
import Button from './Button';
import Badge from './Badge';
import LoadingSpinner from './LoadingSpinner';
import { marked } from 'marked';

marked.setOptions({ async: false });

interface QuickChatProps {
  agentId?: string;
}

const QuickChat: React.FC<QuickChatProps> = ({ agentId }) => {
  const { showQuickChat, setShowQuickChat } = useUIStore();
  const { user } = useAuthStore();
  const { messages, loading, error, sendMessage, fetchMessages, clearMessages } = useChatStore();
  const [input, setInput] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [isMarkdown, setIsMarkdown] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (user) fetchMessages(agentId);
  }, [user, fetchMessages, agentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !user) return;

    try {
      await sendMessage(input.trim(), isMarkdown, agentId);
      setInput('');
      setIsCollapsed(false);
    } catch (err) {
      console.error('Chat error:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const openInNewWindow = () => {
    if (!user) {
      alert('Please sign in to use the chat feature');
      return;
    }

    const width = 400;
    const height = 600;
    const left = window.screen.width - width;
    const top = (window.screen.height - height) / 2;

    window.open(
      '/chat',
      'ChatWindow',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  const handleClearChat = async () => {
    if (!user) return;
    if (window.confirm('Are you sure you want to clear all chat messages? This cannot be undone.')) {
      await clearMessages();
    }
  };

  const handleClose = () => {
    setShowQuickChat(false);
    setIsCollapsed(false);
    setExpanded(false);
  };

  if (!showQuickChat) return null;

  return (
    <div className={`fixed ${expanded ? 'inset-4 md:inset-8' : 'bottom-4 left-4 max-w-xl w-full md:w-[400px]'} z-50 transition-all duration-300`}>
      {isCollapsed ? (
        <Button className="w-full" onClick={() => setIsCollapsed(false)}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#e1ffa6]/10 rounded-lg flex items-center justify-center text-lg">🌝</div>
            <span>Chat with Beatrice</span>
            <ChevronUp className="w-4 h-4" />
          </div>
        </Button>
      ) : (
        <Card glass glow className="h-full backdrop-blur-xl border border-[#e1ffa6]/20 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-800/50 flex items-center justify-between bg-black/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#e1ffa6]/10 rounded-lg flex items-center justify-center text-xl">🌝</div>
              <div>
                <h3 className="font-medium">Beatrice</h3>
                <div className="flex items-center gap-2">
                  <Badge size="sm" variant="success" glass>Online</Badge>
                  <span className="text-xs text-gray-400">AI Assistant</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user && (
                <>
                  <Button variant="ghost" size="sm" onClick={handleClearChat} className="text-gray-400 hover:text-red-500" title="Clear chat history">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={openInNewWindow} className="text-gray-400 hover:text-[#e1ffa6]" title="Open in new window">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
                {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!user ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-4">
                <div className="w-16 h-16 bg-[#e1ffa6]/5 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-[#e1ffa6]" />
                </div>
                <div>
                  <p className="font-medium text-white mb-1">Sign in to Chat</p>
                  <p className="text-sm">Please sign in to start chatting with Beatrice</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-4">
                <div className="w-16 h-16 bg-[#e1ffa6]/5 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-[#e1ffa6]" />
                </div>
                <div>
                  <p className="font-medium text-white mb-1">Chat with Beatrice</p>
                  <p className="text-sm">Ask me anything - I'm here to help with coding, research, analysis, or general questions</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex ${message.is_bot ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-4 ${message.is_bot ? 'bg-gray-900/50 border border-gray-800/50' : 'bg-[#e1ffa6] text-black'}`}>
                    {(() => {
                      const html = marked.parse(message.content) as string;
                      return (
                        <div
                          className="prose dark:prose-invert max-w-full"
                          dangerouslySetInnerHTML={{ __html: html }}
                        />
                      );
                    })()}
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <span className="text-xs opacity-50">{new Date(message.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-4">
                  <LoadingSpinner size="sm" />
                </div>
              </div>
            )}
            {error && (
              <div className="flex justify-center">
                <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg px-4 py-2 text-sm">{error}</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {user && (
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800/50 bg-black/20">
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Beatrice anything..."
                  className="w-full bg-gray-900/50 border border-gray-800/50 rounded-xl py-3 px-4 pr-24 focus:outline-none focus:border-[#e1ffa6] resize-none"
                  rows={1}
                  disabled={loading}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <Button type="button" variant="ghost" size="sm" className={isMarkdown ? 'text-[#e1ffa6]' : 'text-gray-400'} onClick={() => setIsMarkdown(!isMarkdown)}>
                    <Code className="w-4 h-4" />
                  </Button>
                  <Button type="submit" disabled={!input.trim() || loading} size="sm">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </form>
          )}
        </Card>
      )}
    </div>
  );
};

export default QuickChat;

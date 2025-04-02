import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, ThumbsUp, Reply, Flag, Search, Filter, TrendingUp, Clock, X, Edit2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import Input from '../components/Input';

interface Discussion {
  id: string;
  title: string;
  content: string;
  user_id: string;
  username: string;
  created_at: string;
  is_markdown: boolean;
  likes: number;
  replies_count: number;
  user_liked: boolean;
}

interface Reply {
  id: string;
  content: string;
  user_id: string;
  username: string;
  created_at: string;
  likes: number;
  is_markdown: boolean;
  user_liked: boolean;
}

const Discussions = () => {
  const { user } = useAuthStore();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState<string | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newDiscussion, setNewDiscussion] = useState({
    title: '',
    content: '',
    isMarkdown: false
  });
  const [newReply, setNewReply] = useState({
    content: '',
    isMarkdown: false
  });

  const fetchDiscussions = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('discussion_details')
        .select('*');

      // Apply search filter
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      // Apply sorting
      switch (sortBy) {
        case 'popular':
          query = query.order('likes', { ascending: false });
          break;
        case 'trending':
          query = query.order('replies_count', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Get likes and replies count for each discussion
      const discussionsWithDetails = await Promise.all(
        (data || []).map(async (discussion) => {
          // Get like count
          const { count: likes } = await supabase
            .from('discussion_likes')
            .select('*', { count: 'exact', head: true })
            .eq('discussion_id', discussion.id);

          // Get reply count
          const { count: replies_count } = await supabase
            .from('discussion_replies')
            .select('*', { count: 'exact', head: true })
            .eq('discussion_id', discussion.id);

          // Check if user has liked this discussion
          let user_liked = false;
          if (user) {
            const { data: likeData } = await supabase
              .from('discussion_likes')
              .select('*')
              .eq('discussion_id', discussion.id)
              .eq('user_id', user.id)
              .single();
            user_liked = !!likeData;
          }

          return {
            ...discussion,
            likes: likes || 0,
            replies_count: replies_count || 0,
            user_liked
          };
        })
      );

      setDiscussions(discussionsWithDetails);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async (discussionId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: repliesError } = await supabase
        .from('discussion_reply_details')
        .select('*')
        .eq('discussion_id', discussionId)
        .order('created_at', { ascending: true });

      if (repliesError) throw repliesError;

      // Get likes for each reply
      const repliesWithLikes = await Promise.all(
        (data || []).map(async (reply) => {
          const { count: likes } = await supabase
            .from('reply_likes')
            .select('*', { count: 'exact', head: true })
            .eq('reply_id', reply.id);

          // Check if user has liked this reply
          let user_liked = false;
          if (user) {
            const { data: likeData } = await supabase
              .from('reply_likes')
              .select('*')
              .eq('reply_id', reply.id)
              .eq('user_id', user.id)
              .single();
            user_liked = !!likeData;
          }

          return {
            ...reply,
            likes: likes || 0,
            user_liked
          };
        })
      );

      setReplies(repliesWithLikes);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('discussions')
        .insert({
          title: newDiscussion.title,
          content: newDiscussion.content,
          user_id: user.id,
          is_markdown: newDiscussion.isMarkdown
        })
        .select()
        .single();

      if (error) throw error;

      await fetchDiscussions();
      setNewDiscussion({ title: '', content: '', isMarkdown: false });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedDiscussion) return;

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('discussion_replies')
        .insert({
          discussion_id: selectedDiscussion,
          content: newReply.content,
          user_id: user.id,
          is_markdown: newReply.isMarkdown
        });

      if (error) throw error;

      await fetchReplies(selectedDiscussion);
      setNewReply({ content: '', isMarkdown: false });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (type: 'discussion' | 'reply', id: string) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from(`${type}_likes`)
        .insert({
          [`${type}_id`]: id,
          user_id: user.id
        });

      if (error) throw error;

      if (type === 'discussion') {
        await fetchDiscussions();
      } else {
        await fetchReplies(selectedDiscussion!);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlike = async (type: 'discussion' | 'reply', id: string) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from(`${type}_likes`)
        .delete()
        .eq(`${type}_id`, id)
        .eq('user_id', user.id);

      if (error) throw error;

      if (type === 'discussion') {
        await fetchDiscussions();
      } else {
        await fetchReplies(selectedDiscussion!);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async (type: 'discussion' | 'reply', id: string) => {
    if (!user) return;

    try {
      const reason = prompt('Please provide a reason for reporting this content:');
      if (!reason) return;

      const { error } = await supabase
        .from('content_reports')
        .insert({
          reporter_id: user.id,
          target_type: type,
          target_id: id,
          reason
        });

      if (error) throw error;

      alert('Content reported successfully. Our moderators will review it.');
    } catch (err) {
      console.error('Error reporting content:', err);
      alert('Failed to report content. Please try again.');
    }
  };

  useEffect(() => {
    fetchDiscussions();
  }, [sortBy, searchQuery, user?.id]);

  useEffect(() => {
    if (selectedDiscussion) {
      fetchReplies(selectedDiscussion);
    }
  }, [selectedDiscussion]);

  if (loading && !discussions.length) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Community Discussions</h1>
            <p className="text-gray-400">Join the conversation with fellow developers</p>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <Button
                onClick={() => setSelectedDiscussion(null)}
                icon={MessageSquare}
              >
                New Discussion
              </Button>
            ) : (
              <Link to="/signin">
                <Button>Sign in to Participate</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search discussions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-5 h-5" />}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={sortBy === 'latest' ? 'primary' : 'outline'}
                size="sm"
                icon={Clock}
                onClick={() => setSortBy('latest')}
              >
                Latest
              </Button>
              <Button
                variant={sortBy === 'popular' ? 'primary' : 'outline'}
                size="sm"
                icon={Star}
                onClick={() => setSortBy('popular')}
              >
                Popular
              </Button>
              <Button
                variant={sortBy === 'trending' ? 'primary' : 'outline'}
                size="sm"
                icon={TrendingUp}
                onClick={() => setSortBy('trending')}
              >
                Trending
              </Button>
            </div>
          </div>
        </Card>

        {/* Create Discussion Form */}
        {user && !selectedDiscussion && (
          <Card>
            <form onSubmit={handleCreateDiscussion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={newDiscussion.title}
                  onChange={(e) => setNewDiscussion(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-black border border-gray-800 rounded-lg p-3 focus:outline-none focus:border-[#e1ffa6]"
                  placeholder="What's on your mind?"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <div className="relative">
                  <textarea
                    value={newDiscussion.content}
                    onChange={(e) => setNewDiscussion(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full bg-black border border-gray-800 rounded-lg p-3 focus:outline-none focus:border-[#e1ffa6] min-h-[200px]"
                    placeholder="Share your thoughts..."
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setNewDiscussion(prev => ({ ...prev, isMarkdown: !prev.isMarkdown }))}
                    className={`absolute bottom-2 right-2 p-2 rounded-lg transition-colors ${
                      newDiscussion.isMarkdown
                        ? 'text-[#e1ffa6] bg-[#e1ffa6]/10'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" loading={loading}>
                  Create Discussion
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Discussions List */}
        {!selectedDiscussion && (
          <div className="space-y-4">
            {discussions.map((discussion) => (
              <Card key={discussion.id} hover>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h2 
                      className="text-xl font-bold mb-2 cursor-pointer hover:text-[#e1ffa6]"
                      onClick={() => setSelectedDiscussion(discussion.id)}
                    >
                      {discussion.title}
                    </h2>
                    <div className="text-sm text-gray-400 mb-4">
                      Posted by {discussion.username} • {formatDistanceToNow(new Date(discussion.created_at))} ago
                    </div>
                    {discussion.is_markdown ? (
                      <div className="prose prose-invert max-w-none mb-4">
                        <MarkdownPreview source={discussion.content} />
                      </div>
                    ) : (
                      <p className="text-gray-300 mb-4">{discussion.content}</p>
                    )}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => discussion.user_liked 
                          ? handleUnlike('discussion', discussion.id)
                          : handleLike('discussion', discussion.id)
                        }
                        className={`flex items-center gap-1 ${
                          discussion.user_liked 
                            ? 'text-[#e1ffa6]' 
                            : 'text-gray-400 hover:text-[#e1ffa6]'
                        }`}
                        disabled={!user}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        {discussion.likes}
                      </button>
                      <button
                        onClick={() => setSelectedDiscussion(discussion.id)}
                        className="flex items-center gap-1 text-gray-400 hover:text-[#e1ffa6]"
                      >
                        <MessageSquare className="w-4 h-4" />
                        {discussion.replies_count} replies
                      </button>
                      {user && (
                        <button
                          onClick={() => handleReport('discussion', discussion.id)}
                          className="flex items-center gap-1 text-gray-400 hover:text-red-500"
                        >
                          <Flag className="w-4 h-4" />
                          Report
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {discussions.length === 0 && (
              <Card>
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No discussions yet</h3>
                  <p className="text-gray-400 mb-4">
                    Be the first to start a discussion in the community
                  </p>
                  {user ? (
                    <Button onClick={() => setSelectedDiscussion(null)}>
                      Create Discussion
                    </Button>
                  ) : (
                    <Link to="/signin">
                      <Button>Sign in to Start Discussion</Button>
                    </Link>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Selected Discussion with Replies */}
        {selectedDiscussion && (
          <div className="space-y-4">
            <button
              onClick={() => setSelectedDiscussion(null)}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Discussions
            </button>

            {/* Original Discussion */}
            <Card>
              {discussions.find(d => d.id === selectedDiscussion) && (
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {discussions.find(d => d.id === selectedDiscussion)?.title}
                  </h2>
                  <div className="text-sm text-gray-400 mb-4">
                    Posted by {discussions.find(d => d.id === selectedDiscussion)?.username}
                  </div>
                  {discussions.find(d => d.id === selectedDiscussion)?.is_markdown ? (
                    <div className="prose prose-invert max-w-none mb-4">
                      <MarkdownPreview source={discussions.find(d => d.id === selectedDiscussion)?.content || ''} />
                    </div>
                  ) : (
                    <p className="text-gray-300 mb-4">
                      {discussions.find(d => d.id === selectedDiscussion)?.content}
                    </p>
                  )}
                </div>
              )}
            </Card>

            {/* Replies */}
            <div className="space-y-4 ml-8">
              {replies.map((reply) => (
                <Card key={reply.id}>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="text-sm text-gray-400 mb-2">
                        {reply.username} • {formatDistanceToNow(new Date(reply.created_at))} ago
                      </div>
                      {reply.is_markdown ? (
                        <div className="prose prose-invert max-w-none mb-4">
                          <MarkdownPreview source={reply.content} />
                        </div>
                      ) : (
                        <p className="text-gray-300 mb-4">{reply.content}</p>
                      )}
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => reply.user_liked 
                            ? handleUnlike('reply', reply.id)
                            : handleLike('reply', reply.id)
                          }
                          className={`flex items-center gap-1 ${
                            reply.user_liked 
                              ? 'text-[#e1ffa6]' 
                              : 'text-gray-400 hover:text-[#e1ffa6]'
                          }`}
                          disabled={!user}
                        >
                          <ThumbsUp className="w-4 h-4" />
                          {reply.likes}
                        </button>
                        {user && (
                          <button
                            onClick={() => handleReport('reply', reply.id)}
                            className="flex items-center gap-1 text-gray-400 hover:text-red-500"
                          >
                            <Flag className="w-4 h-4" />
                            Report
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Reply Form */}
            {user && (
              <Card className="ml-8">
                <form onSubmit={handleCreateReply} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Your Reply</label>
                    <div className="relative">
                      <textarea
                        value={newReply.content}
                        onChange={(e) => setNewReply(prev => ({ ...prev, content: e.target.value }))}
                        className="w-full bg-black border border-gray-800 rounded-lg p-3 focus:outline-none focus:border-[#e1ffa6] min-h-[100px]"
                        placeholder="What are your thoughts?"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setNewReply(prev => ({ ...prev, isMarkdown: !prev.isMarkdown }))}
                        className={`absolute bottom-2 right-2 p-2 rounded-lg transition-colors ${
                          newReply.isMarkdown
                            ? 'text-[#e1ffa6] bg-[#e1ffa6]/10'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                        }`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" icon={Reply} loading={loading}>
                      Post Reply
                    </Button>
                  </div>
                </form>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Discussions;
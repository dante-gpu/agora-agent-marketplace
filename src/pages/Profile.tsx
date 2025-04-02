import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Star, Calendar, Settings, Bookmark, Clock, Globe, Twitter, Github as GitHub, Linkedin as LinkedIn, Edit, Trash2, ExternalLink, MessageSquare, Wallet } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useAgentStore } from '../store/agentStore';
import { useProfileStore } from '../store/profileStore';
import { useWallet } from '@solana/wallet-adapter-react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import ImageUpload from '../components/ImageUpload';
import { WalletButton } from '../components/WalletButton';
import { supabase } from '../lib/supabase';
import { format, formatDistanceToNow } from 'date-fns';

interface UserProfile {
  user_id: string;
  username: string;
  created_at: string;
}

function Profile() {
  const { username } = useParams();
  const { user } = useAuthStore();
  const { agents } = useAgentStore();
  const { 
    settings, bookmarks, history,
    fetchSettings, updateSettings,
    fetchBookmarks, removeBookmark, updateBookmarkNotes,
    fetchHistory, clearHistory,
    disconnectWallet
  } = useProfileStore();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingBookmark, setEditingBookmark] = useState<string | null>(null);
  const [bookmarkNotes, setBookmarkNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'agents' | 'bookmarks' | 'history'>('agents');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    bio: '',
    website: '',
    twitter: '',
    github: '',
    linkedin: '',
    show_email: false
  });

  const isOwnProfile = user && profile && user.id === profile.user_id;

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      
      let profileData;
      if (username) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('username', username)
          .single();
          
        if (error) throw error;
        profileData = data;
      } else if (user) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (error) throw error;
        profileData = data;
      } else {
        throw new Error('No user specified');
      }

      setProfile(profileData);

      if (user && profileData.user_id === user.id) {
        await Promise.all([
          fetchSettings(),
          fetchBookmarks(),
          fetchHistory()
        ]);

        if (settings) {
          setProfileForm({
            bio: settings.bio || '',
            website: settings.website || '',
            twitter: settings.social_links?.twitter || '',
            github: settings.social_links?.github || '',
            linkedin: settings.social_links?.linkedin || '',
            show_email: settings.show_email
          });
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [username, user, fetchSettings, fetchBookmarks, fetchHistory, settings]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdateProfile = async () => {
    try {
      await updateSettings({
        bio: profileForm.bio,
        website: profileForm.website,
        show_email: profileForm.show_email,
        social_links: {
          twitter: profileForm.twitter,
          github: profileForm.github,
          linkedin: profileForm.linkedin
        }
      });
      setEditingProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleImageUpload = async (url: string) => {
    try {
      await updateSettings({ avatar_url: url });
    } catch (error) {
      console.error('Error updating profile image:', error);
    }
  };

  const handleImageError = (error: string) => {
    console.error('Image upload error:', error);
  };

  const userAgents = agents.filter(agent => agent.creator === profile?.user_id);
  const totalRating = userAgents.reduce((sum, agent) => sum + agent.rating, 0);
  const averageRating = userAgents.length > 0 ? totalRating / userAgents.length : 0;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4">
          {error || 'Profile not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <div className="flex flex-col items-center text-center">
              <div className="relative group mb-6">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-800">
                  {settings?.avatar_url ? (
                    <img
                      src={settings.avatar_url}
                      alt={profile.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {isOwnProfile && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ImageUpload
                      currentImage={settings?.avatar_url}
                      onUpload={handleImageUpload}
                      onError={handleImageError}
                    />
                  </div>
                )}
              </div>

              <h1 className="text-2xl font-bold mb-2">{profile.username}</h1>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{userAgents.length}</div>
                  <div className="text-sm text-gray-400">Agents</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold flex items-center gap-1">
                    <Star className="w-4 h-4 text-[#e1ffa6]" fill="#e1ffa6" />
                    {averageRating.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-400">Avg Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {history.reduce((sum, h) => sum + h.total_interactions, 0)}
                  </div>
                  <div className="text-sm text-gray-400">Interactions</div>
                </div>
              </div>

              {!editingProfile ? (
                <div className="w-full text-left">
                  {settings?.bio && (
                    <p className="text-gray-300 mb-4">{settings.bio}</p>
                  )}
                  
                  <div className="space-y-2">
                    {settings?.show_email && user?.email && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <MessageSquare className="w-4 h-4" />
                        {user.email}
                      </div>
                    )}
                    {settings?.website && (
                      <a
                        href={settings.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-400 hover:text-white"
                      >
                        <Globe className="w-4 h-4" />
                        {new URL(settings.website).hostname}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {settings?.social_links?.twitter && (
                      <a
                        href={`https://twitter.com/${settings.social_links.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-400 hover:text-white"
                      >
                        <Twitter className="w-4 h-4" />
                        @{settings.social_links.twitter}
                      </a>
                    )}
                    {settings?.social_links?.github && (
                      <a
                        href={`https://github.com/${settings.social_links.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-400 hover:text-white"
                      >
                        <GitHub className="w-4 h-4" />
                        {settings.social_links.github}
                      </a>
                    )}
                    {settings?.social_links?.linkedin && (
                      <a
                        href={`https://linkedin.com/in/${settings.social_links.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-400 hover:text-white"
                      >
                        <LinkedIn className="w-4 h-4" />
                        {settings.social_links.linkedin}
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleUpdateProfile(); }} className="w-full space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Bio</label>
                    <textarea
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm(p => ({ ...p, bio: e.target.value }))}
                      className="w-full bg-black border border-gray-800 rounded-lg p-3 focus:outline-none focus:border-[#e1ffa6]"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Website</label>
                    <input
                      type="url"
                      value={profileForm.website}
                      onChange={(e) => setProfileForm(p => ({ ...p, website: e.target.value }))}
                      className="w-full bg-black border border-gray-800 rounded-lg p-3 focus:outline-none focus:border-[#e1ffa6]"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Twitter Username</label>
                    <input
                      type="text"
                      value={profileForm.twitter}
                      onChange={(e) => setProfileForm(p => ({ ...p, twitter: e.target.value }))}
                      className="w-full bg-black border border-gray-800 rounded-lg p-3 focus:outline-none focus:border-[#e1ffa6]"
                      placeholder="username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">GitHub Username</label>
                    <input
                      type="text"
                      value={profileForm.github}
                      onChange={(e) => setProfileForm(p => ({ ...p, github: e.target.value }))}
                      className="w-full bg-black border border-gray-800 rounded-lg p-3 focus:outline-none focus:border-[#e1ffa6]"
                      placeholder="username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">LinkedIn Username</label>
                    <input
                      type="text"
                      value={profileForm.linkedin}
                      onChange={(e) => setProfileForm(p => ({ ...p, linkedin: e.target.value }))}
                      className="w-full bg-black border border-gray-800 rounded-lg p-3 focus:outline-none focus:border-[#e1ffa6]"
                      placeholder="username"
                    />
                  </div>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={profileForm.show_email}
                      onChange={(e) => setProfileForm(p => ({ ...p, show_email: e.target.checked }))}
                      className="rounded border-gray-800 text-[#e1ffa6] focus:ring-[#e1ffa6]"
                    />
                    <span className="text-sm">Show email on profile</span>
                  </label>

                  <div className="flex gap-2">
                    <Button type="submit">Save Changes</Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingProfile(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              {isOwnProfile && !editingProfile && (
                <Button
                  variant="outline"
                  icon={Settings}
                  onClick={() => setEditingProfile(true)}
                  className="mt-4"
                >
                  Edit Profile
                </Button>
              )}

              <div className="w-full border-t border-gray-800 mt-6 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Wallet</h3>
                  {settings?.wallet_address && (
                    <Badge variant="success" size="sm">Connected</Badge>
                  )}
                </div>
                
                {settings?.wallet_address ? (
                  <div className="space-y-4">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <Wallet className="w-4 h-4" />
                        <span>Connected Address</span>
                      </div>
                      <p className="font-mono text-sm break-all">
                        {settings.wallet_address}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Connected {formatDistanceToNow(new Date(settings.wallet_connected_at || ''))} ago
                      </p>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        if (confirm('Are you sure you want to disconnect your wallet?')) {
                          disconnectWallet();
                        }
                      }}
                    >
                      Disconnect Wallet
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-400">
                      Connect your Solana wallet to enable crypto features
                    </p>
                    <WalletButton />
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 text-gray-400 mb-4">
              <Calendar className="w-4 h-4" />
              <span>Joined {format(new Date(profile.created_at), 'MMMM yyyy')}</span>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('agents')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'agents'
                  ? 'bg-[#e1ffa6] text-black'
                  : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              <User className="w-4 h-4" />
              Agents
            </button>
            {isOwnProfile && (
              <>
                <button
                  onClick={() => setActiveTab('bookmarks')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'bookmarks'
                      ? 'bg-[#e1ffa6] text-black'
                      : 'text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                  Bookmarks
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'history'
                      ? 'bg-[#e1ffa6] text-black'
                      : 'text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  History
                </button>
              </>
            )}
          </div>

          {activeTab === 'agents' && (
            <div className="grid md:grid-cols-2 gap-6">
              {userAgents.length === 0 ? (
                <Card>
                  <p className="text-center text-gray-400">No agents created yet</p>
                </Card>
              ) : (
                userAgents.map((agent) => (
                  <Link to={`/agent/${agent.slug}`} key={agent.id}>
                    <Card hover>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-bold">{agent.name}</h3>
                          <Badge size="sm">{agent.category}</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-[#e1ffa6]" fill="#e1ffa6" />
                          <span>{agent.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {agent.description}
                      </p>
                      <div className="text-sm text-gray-500">
                        {agent.deployments} uses
                      </div>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          )}

          {activeTab === 'bookmarks' && isOwnProfile && (
            <div className="space-y-4">
              {bookmarks.length === 0 ? (
                <Card>
                  <p className="text-center text-gray-400">No bookmarked agents yet</p>
                </Card>
              ) : (
                bookmarks.map((bookmark) => (
                  <Card key={bookmark.id}>
                    <div className="flex items-start gap-4">
                      <Link
                        to={`/agent/${bookmark.agent.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className="flex-1"
                      >
                        <div className="flex items-center gap-4 group">
                          {bookmark.agent.image_url ? (
                            <img
                              src={bookmark.agent.image_url}
                              alt={bookmark.agent.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center">
                              <MessageSquare className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-bold group-hover:text-[#e1ffa6] transition-colors">
                              {bookmark.agent.name}
                            </h3>
                            <Badge size="sm">{bookmark.agent.category}</Badge>
                            <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                              {bookmark.agent.description}
                            </p>
                          </div>
                        </div>
                      </Link>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Edit}
                          onClick={() => {
                            setEditingBookmark(bookmark.id);
                            setBookmarkNotes(bookmark.notes || '');
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => removeBookmark(bookmark.id)}
                        />
                      </div>
                    </div>

                    {editingBookmark === bookmark.id && (
                      <div className="mt-4 space-y-4">
                        <textarea
                          value={bookmarkNotes}
                          onChange={(e) => setBookmarkNotes(e.target.value)}
                          className="w-full bg-black border border-gray-800 rounded-lg p-3 focus:outline-none focus:border-[#e1ffa6]"
                          placeholder="Add notes about this agent..."
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={async () => {
                              await updateBookmarkNotes(bookmark.id, bookmarkNotes);
                              setEditingBookmark(null);
                            }}
                          >
                            Save Notes
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingBookmark(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {bookmark.notes && editingBookmark !== bookmark.id && (
                      <div className="mt-4 text-sm text-gray-400">
                        <p className="whitespace-pre-wrap">{bookmark.notes}</p>
                      </div>
                    )}

                    <div className="mt-4 text-sm text-gray-500">
                      Bookmarked {formatDistanceToNow(new Date(bookmark.created_at))} ago
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'history' && isOwnProfile && (
            <div className="space-y-4">
              {history.length === 0 ? (
                <Card>
                  <p className="text-center text-gray-400">No interaction history yet</p>
                </Card>
              ) : (
                <>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Trash2}
                      onClick={() => {
                        if (confirm('Are you sure you want to clear your history?')) {
                          clearHistory();
                        }
                      }}
                    >
                      Clear History
                    </Button>
                  </div>

                  {history.map((item) => (
                    <Link
                      to={`/agent/${item.agent.name.toLowerCase().replace(/\s+/g, '-')}`}
                      key={item.id}
                    >
                      <Card hover>
                        <div className="flex items-center gap-4">
                          {item.agent.image_url ? (
                            <img
                              src={item.agent.image_url}
                              alt={item.agent.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center">
                              <MessageSquare className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-bold group-hover:text-[#e1ffa6] transition-colors">
                              {item.agent.name}
                            </h3>
                            <Badge size="sm">{item.agent.category}</Badge>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                              <span>{item.total_interactions} interactions</span>
                              <span>•</span>
                              <span>
                                Last used {formatDistanceToNow(new Date(item.last_interaction_at))} ago
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
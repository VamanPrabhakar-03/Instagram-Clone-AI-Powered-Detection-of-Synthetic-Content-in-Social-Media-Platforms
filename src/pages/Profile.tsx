import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Settings, Grid, Bookmark, User as UserIcon, Film, Heart, MessageCircle, Trash2 } from 'lucide-react';

interface UserProfile {
  id: number;
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  posts: any[];
  followers_count: number;
  following_count: number;
  is_following: boolean;
}

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser, token, setUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'saved' | 'tagged'>('posts');
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', bio: '', avatar_url: '' });

  useEffect(() => {
    fetch(`/api/users/${username}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('User not found');
        return res.json();
      })
      .then(data => {
        setProfile(data);
        setEditForm({ full_name: data.full_name, bio: data.bio || '', avatar_url: data.avatar_url || '' });
        setIsLoading(false);
      })
      .catch(() => {
        setProfile(null);
        setIsLoading(false);
      });
  }, [username, token]);

  useEffect(() => {
    if (activeTab === 'saved' && username === currentUser?.username) {
      fetch(`/api/users/${username}/saved`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setSavedPosts(data));
    }
  }, [activeTab, username, currentUser, token]);

  const handleFollow = async () => {
    if (!profile) return;
    const res = await fetch(`/api/users/${profile.id}/follow`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setProfile({
      ...profile,
      is_following: data.following,
      followers_count: data.following ? profile.followers_count + 1 : profile.followers_count - 1
    });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/me', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(editForm)
    });
    if (res.ok) {
      setProfile(prev => prev ? { ...prev, ...editForm } : null);
      if (currentUser) {
        setUser({ ...currentUser, ...editForm });
      }
      setIsEditModalOpen(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, postId: number) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this post?')) return;
    const res = await fetch(`/api/posts/${postId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok && profile) {
      setProfile({
        ...profile,
        posts: profile.posts.filter(p => p.id !== postId)
      });
    }
  };

  if (isLoading) return <div className="flex justify-center py-20">Loading...</div>;
  if (!profile) return <div className="text-center py-20">User not found</div>;

  const isOwnProfile = currentUser?.username === username;

  const displayedPosts = activeTab === 'posts'
    ? profile.posts.filter(p => p.type === 'image')
    : activeTab === 'reels'
      ? profile.posts.filter(p => p.type === 'video')
      : activeTab === 'saved'
        ? savedPosts
        : [];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-12 mb-12">
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-zinc-900 border border-zinc-800">
          <img
            src={profile.avatar_url || `https://picsum.photos/seed/${profile.username}/200/200`}
            alt={profile.username}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
            <h1 className="text-xl font-light">{profile.username}</h1>
            <div className="flex space-x-2">
              {isOwnProfile ? (
                <>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-sm font-semibold border border-zinc-800"
                  >
                    Edit profile
                  </button>
                  <button
                    onClick={() => alert('Archive feature coming soon!')}
                    className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-sm font-semibold border border-zinc-800"
                  >
                    View archive
                  </button>
                  <Settings
                    onClick={() => alert('Settings feature coming soon!')}
                    className="w-6 h-6 cursor-pointer hover:opacity-70"
                  />
                </>
              ) : (
                <>
                  <button
                    onClick={handleFollow}
                    className={`px-6 py-1.5 rounded-lg text-sm font-semibold ${profile.is_following ? 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-800' : 'bg-sky-500 hover:bg-sky-600 text-white'}`}
                  >
                    {profile.is_following ? 'Following' : 'Follow'}
                  </button>
                  <button
                    onClick={() => alert('Messaging feature coming soon!')}
                    className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-sm font-semibold border border-zinc-800"
                  >
                    Message
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-center md:justify-start space-x-8">
            <div className="text-sm"><span className="font-semibold">{profile.posts?.length || 0}</span> posts</div>
            <div className="text-sm"><span className="font-semibold">{profile.followers_count || 0}</span> followers</div>
            <div className="text-sm"><span className="font-semibold">{profile.following_count || 0}</span> following</div>
          </div>

          <div className="text-center md:text-left">
            <div className="font-semibold text-sm">{profile.full_name}</div>
            <div className="text-sm whitespace-pre-wrap text-zinc-300">{profile.bio || 'No bio yet.'}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-t border-zinc-800">
        <div className="flex justify-center space-x-12">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center space-x-2 py-4 border-t -mt-px text-xs font-semibold uppercase tracking-widest ${activeTab === 'posts' ? 'border-white text-white' : 'border-transparent text-zinc-500'}`}
          >
            <Grid className="w-3 h-3" />
            <span>Posts</span>
          </button>
          <button
            onClick={() => setActiveTab('reels')}
            className={`flex items-center space-x-2 py-4 border-t -mt-px text-xs font-semibold uppercase tracking-widest ${activeTab === 'reels' ? 'border-white text-white' : 'border-transparent text-zinc-500'}`}
          >
            <Film className="w-3 h-3" />
            <span>Reels</span>
          </button>
          {isOwnProfile && (
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center space-x-2 py-4 border-t -mt-px text-xs font-semibold uppercase tracking-widest ${activeTab === 'saved' ? 'border-white text-white' : 'border-transparent text-zinc-500'}`}
            >
              <Bookmark className="w-3 h-3" />
              <span>Saved</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('tagged')}
            className={`flex items-center space-x-2 py-4 border-t -mt-px text-xs font-semibold uppercase tracking-widest ${activeTab === 'tagged' ? 'border-white text-white' : 'border-transparent text-zinc-500'}`}
          >
            <UserIcon className="w-3 h-3" />
            <span>Tagged</span>
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-1 md:gap-8">
          {displayedPosts.map((post) => (
            <div key={post.id} className="aspect-square bg-zinc-900 relative group cursor-pointer border border-zinc-800">
              {post.type === 'video' ? (
                <video src={post.url} className="w-full h-full object-cover" />
              ) : (
                <img src={post.url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-6 text-white font-semibold">
                <div className="flex items-center space-x-1">
                  <Heart className="w-5 h-5 fill-white" />
                  <span>{post.likes_count || 0}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-5 h-5 fill-white" />
                  <span>0</span>
                </div>
                {isOwnProfile && activeTab !== 'saved' && (
                  <button
                    onClick={(e) => handleDelete(e, post.id)}
                    className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-white" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {displayedPosts.length === 0 && (
          <div className="text-center py-20 text-zinc-500">
            <p>No {activeTab} yet.</p>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-white">Edit Profile</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Full Name</label>
                <input
                  type="text"
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Bio</label>
                <textarea
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all resize-none"
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Avatar URL</label>
                <input
                  type="text"
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all"
                  value={editForm.avatar_url}
                  onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 rounded-lg transition-all shadow-lg shadow-sky-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

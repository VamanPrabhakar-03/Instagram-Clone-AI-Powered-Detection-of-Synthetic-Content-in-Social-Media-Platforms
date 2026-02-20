import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Link } from 'react-router-dom';

interface Post {
  id: number;
  user_id: number;
  username: string;
  avatar_url: string;
  type: 'image' | 'video';
  url: string;
  caption: string;
  likes_count: number;
  is_liked: number;
  is_saved: number;
  comments_count: number;
  created_at: string;
}

interface User {
  id: number;
  username: string;
  avatar_url: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeComments, setActiveComments] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [activeMenuPostId, setActiveMenuPostId] = useState<number | null>(null);
  const { token, user: currentUser } = useAuth();

  useEffect(() => {
    // Fetch Posts
    fetch('/api/posts', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) return [];
        return res.json();
      })
      .then(data => {
        const allPosts = Array.isArray(data) ? data : [];
        setPosts(allPosts);
      })
      .catch(() => setPosts([]));

    // Fetch Users for Stories
    fetch('/api/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(() => setUsers([]));
  }, [token]);

  const handleLike = async (postId: number) => {
    const res = await fetch(`/api/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          is_liked: data.liked ? 1 : 0,
          likes_count: data.liked ? p.likes_count + 1 : p.likes_count - 1
        };
      }
      return p;
    }));
  };

  const handleSave = async (postId: number) => {
    const res = await fetch(`/api/posts/${postId}/save`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return { ...p, is_saved: data.saved ? 1 : 0 };
      }
      return p;
    }));
  };

  const fetchComments = async (postId: number) => {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setComments(data);
    setActiveComments(postId);
  };

  const handleAddComment = async (postId: number) => {
    if (!commentText.trim()) return;
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: commentText })
    });
    if (res.ok) {
      setCommentText('');
      fetchComments(postId);
      setPosts(posts.map(p => {
        if (p.id === postId) return { ...p, comments_count: p.comments_count + 1 };
        return p;
      }));
    }
  };

  const handleShare = (postId: number) => {
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const handleDelete = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    const res = await fetch(`/api/posts/${postId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      setPosts(posts.filter(p => p.id !== postId));
    }
  };

  return (
    <div className="flex justify-center max-w-6xl mx-auto py-4 px-4 relative bg-black min-h-screen">
      <div className="max-w-xl w-full pb-20 md:pb-8">
        {/* Header Tabs Removed */}
        {/* Stories */}
        <div className="relative mb-12">
          <div className="flex space-x-4 overflow-x-auto pb-4 no-scrollbar">
            {users.map((user) => (
              <Link key={user.id} to={`/${user.username}`} className="flex flex-col items-center space-y-2 flex-shrink-0 group">
                <div className="w-[72px] h-[72px] rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-fuchsia-600 to-purple-600">
                  <div className="w-full h-full rounded-full border-2 border-black overflow-hidden bg-zinc-900">
                    <img src={user.avatar_url || `https://picsum.photos/seed/${user.username}/100/100`} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                  </div>
                </div>
                <span className="text-xs text-zinc-400 truncate w-20 text-center">{user.username}</span>
              </Link>
            ))}
            {users.length === 0 && [...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col items-center space-y-2 flex-shrink-0 animate-pulse">
                <div className="w-[72px] h-[72px] rounded-full bg-zinc-900 border border-zinc-800"></div>
                <div className="w-12 h-2 bg-zinc-900 rounded"></div>
              </div>
            ))}
          </div>
          <button className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white/10 hover:bg-white/20 p-1 rounded-full backdrop-blur-sm transition-colors hidden md:block">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="space-y-12">
          {posts.map((post) => (
            <article key={post.id} className="max-w-[470px] mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Link to={`/${post.username}`} className="w-8 h-8 rounded-full p-[1px] bg-gradient-to-tr from-yellow-400 to-fuchsia-600">
                    <div className="w-full h-full rounded-full border border-black overflow-hidden bg-zinc-900">
                      <img src={post.avatar_url || `https://picsum.photos/seed/${post.username}/100/100`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  </Link>
                  <div className="flex items-center space-x-1">
                    <Link to={`/${post.username}`} className="font-semibold text-sm hover:text-zinc-400 transition-colors">{post.username}</Link>
                    <CheckCircle2 className="w-3 h-3 text-sky-500 fill-sky-500" />
                    <span className="text-zinc-500 text-sm">•</span>
                    <span className="text-zinc-500 text-sm">{formatDistanceToNow(new Date(post.created_at), { addSuffix: false }).replace('about ', '').replace(' hours', 'h').replace(' minutes', 'm').replace(' seconds', 's')}</span>
                  </div>
                </div>
                <button onClick={() => setActiveMenuPostId(post.id)} className="text-white hover:opacity-60 transition-opacity">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="aspect-square bg-zinc-900 rounded-sm overflow-hidden border border-zinc-800 relative group">
                {post.type === 'video' ? (
                  <video
                    src={post.url}
                    className="w-full h-full object-cover"
                    controls
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <img src={post.url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                )}

                {/* Navigation Arrows (Carousel Placeholder) */}
                <button className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-1 rounded-full backdrop-blur-sm transition-opacity opacity-0 group-hover:opacity-100">
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-1 rounded-full backdrop-blur-sm transition-opacity opacity-0 group-hover:opacity-100">
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Actions */}
              <div className="py-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <button onClick={() => handleLike(post.id)}>
                      <Heart className={`w-6 h-6 transition-all active:scale-125 ${post.is_liked ? 'fill-red-500 text-red-500' : 'hover:text-zinc-500'}`} />
                    </button>
                    <button onClick={() => fetchComments(post.id)}>
                      <MessageCircle className="w-6 h-6 hover:text-zinc-500 transition-colors" />
                    </button>
                    <button onClick={() => handleShare(post.id)}>
                      <Send className="w-6 h-6 hover:text-zinc-500 transition-colors" />
                    </button>
                  </div>
                  <button onClick={() => handleSave(post.id)}>
                    <Bookmark className={`w-6 h-6 transition-all active:scale-125 ${post.is_saved ? 'fill-white text-white' : 'hover:text-zinc-500'}`} />
                  </button>
                </div>

                <div className="font-semibold text-sm mb-2">{post.likes_count.toLocaleString()} likes</div>

                <div className="text-sm leading-relaxed">
                  <span className="font-semibold mr-2">{post.username}</span>
                  {post.caption}
                </div>

                {post.comments_count > 0 && (
                  <button
                    onClick={() => fetchComments(post.id)}
                    className="text-sm text-zinc-500 mt-2 hover:text-zinc-400 transition-colors"
                  >
                    View all {post.comments_count} comments
                  </button>
                )}

                {/* Comments Section */}
                {activeComments === post.id && (
                  <div className="mt-4 space-y-3 max-h-60 overflow-y-auto border-t border-zinc-800 pt-4">
                    {comments.map((c: any) => (
                      <div key={c.id} className="text-sm flex items-start space-x-2">
                        <span className="font-semibold">{c.username}</span>
                        <span className="text-zinc-300">{c.content}</span>
                      </div>
                    ))}
                    <div className="flex items-center space-x-3 mt-4 border-t border-zinc-800 pt-4">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        className="flex-1 text-sm bg-transparent border-none focus:ring-0 p-0 placeholder:text-zinc-600"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        className="text-sky-500 text-sm font-semibold disabled:opacity-50 hover:text-sky-400 transition-colors"
                        disabled={!commentText.trim()}
                      >
                        Post
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))}
          {posts.length === 0 && (
            <div className="text-center py-20 text-zinc-500">
              <p className="font-semibold text-lg">No posts yet</p>
              <p className="text-sm">Follow some users or create your first post!</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Messages Widget */}
      <div className="fixed bottom-4 right-4 z-50 hidden md:block">
        <button className="bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 flex items-center space-x-3 shadow-2xl hover:bg-zinc-800 transition-colors">
          <div className="relative">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="font-semibold text-sm">Messages</span>
          <div className="flex -space-x-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-black overflow-hidden bg-zinc-800">
                <img src={`https://picsum.photos/seed/${i + 50}/50/50`} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            <div className="w-6 h-6 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
              ...
            </div>
          </div>
        </button>
      </div>

      {/* Post Options Modal */}
      {activeMenuPostId !== null && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setActiveMenuPostId(null)}>
          <div className="bg-zinc-900 w-full max-w-sm rounded-xl overflow-hidden text-center shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            {posts.find(p => p.id === activeMenuPostId)?.username !== currentUser?.username && (
              <>
                <button className="w-full p-3.5 text-sm font-bold text-red-500 border-b border-zinc-800 hover:bg-zinc-800 transition-colors">Report</button>
                <button className="w-full p-3.5 text-sm font-bold text-red-500 border-b border-zinc-800 hover:bg-zinc-800 transition-colors">Unfollow</button>
              </>
            )}

            {posts.find(p => p.id === activeMenuPostId)?.username === currentUser?.username && (
              <button
                onClick={() => {
                  handleDelete(activeMenuPostId);
                  setActiveMenuPostId(null);
                }}
                className="w-full p-3.5 text-sm font-bold text-red-500 border-b border-zinc-800 hover:bg-zinc-800 transition-colors"
              >
                Delete
              </button>
            )}

            <button className="w-full p-3.5 text-sm text-white border-b border-zinc-800 hover:bg-zinc-800 transition-colors">Add to favorites</button>
            <button className="w-full p-3.5 text-sm text-white border-b border-zinc-800 hover:bg-zinc-800 transition-colors">Go to post</button>
            <button className="w-full p-3.5 text-sm text-white border-b border-zinc-800 hover:bg-zinc-800 transition-colors">Share to...</button>
            <button className="w-full p-3.5 text-sm text-white border-b border-zinc-800 hover:bg-zinc-800 transition-colors">Copy link</button>
            <button className="w-full p-3.5 text-sm text-white border-b border-zinc-800 hover:bg-zinc-800 transition-colors">Embed</button>
            <button className="w-full p-3.5 text-sm text-white border-b border-zinc-800 hover:bg-zinc-800 transition-colors">About this account</button>
            <button
              className="w-full p-3.5 text-sm text-white hover:bg-zinc-800 transition-colors"
              onClick={() => setActiveMenuPostId(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

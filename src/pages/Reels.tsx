import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Film, Heart, MessageCircle, Send, MoreVertical, Music, Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Reel {
  id: number;
  user_id: number;
  username: string;
  avatar_url: string;
  url: string;
  caption: string;
  likes_count: number;
  is_liked: number;
  is_saved: number;
  comments_count: number;
  is_following: boolean;
}

interface ReelItemProps {
  reel: Reel;
  token: string | null;
  key?: any;
  onUpdate: (updatedReel: Partial<Reel>) => void;
}

function ReelItem({ reel, token, onUpdate }: ReelItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {});
            setIsPlaying(true);
          } else {
            videoRef.current?.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.6 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLike = async () => {
    if (!token) return;
    const res = await fetch(`/api/posts/${reel.id}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    onUpdate({
      is_liked: data.liked ? 1 : 0,
      likes_count: data.liked ? reel.likes_count + 1 : reel.likes_count - 1
    });
  };

  const handleSave = async () => {
    if (!token) return;
    const res = await fetch(`/api/posts/${reel.id}/save`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    onUpdate({ is_saved: data.saved ? 1 : 0 });
  };

  const handleFollow = async () => {
    if (!token) return;
    const res = await fetch(`/api/users/${reel.user_id}/follow`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    onUpdate({ is_following: data.following });
  };

  const fetchComments = async () => {
    if (!token) return;
    const res = await fetch(`/api/posts/${reel.id}/comments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setComments(data);
    setShowComments(true);
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !token) return;
    const res = await fetch(`/api/posts/${reel.id}/comments`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: commentText })
    });
    if (res.ok) {
      setCommentText('');
      const commentsRes = await fetch(`/api/posts/${reel.id}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const commentsData = await commentsRes.json();
      setComments(commentsData);
      onUpdate({ comments_count: reel.comments_count + 1 });
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="h-full w-full snap-start relative flex flex-col justify-end bg-black">
      <video 
        ref={videoRef}
        src={reel.url} 
        className="absolute inset-0 w-full h-full object-contain cursor-pointer"
        loop
        muted
        playsInline
        onClick={togglePlay}
      />
      
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

      <div className="relative p-4 flex justify-between items-end z-10">
        <div className="flex-1 text-white space-y-3 pr-12">
          <div className="flex items-center space-x-3">
            <Link to={`/${reel.username}`} className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
              <img 
                src={reel.avatar_url || `https://picsum.photos/seed/${reel.username}/100/100`} 
                alt="" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer" 
              />
            </Link>
            <Link to={`/${reel.username}`} className="font-semibold text-sm">{reel.username}</Link>
            <button 
              onClick={handleFollow}
              className={`text-xs font-semibold border px-3 py-1 rounded-md transition-colors ${reel.is_following ? 'bg-white/20 border-white/40' : 'bg-transparent border-white/40 hover:bg-white/10'}`}
            >
              {reel.is_following ? 'Following' : 'Follow'}
            </button>
          </div>
          
          <p className="text-sm line-clamp-2 leading-relaxed">{reel.caption}</p>
          
          <div className="flex items-center space-x-2 text-xs opacity-90">
            <Music className="w-3 h-3" />
            <span className="truncate">Original audio • {reel.username}</span>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-6 text-white">
          <div className="flex flex-col items-center">
            <button onClick={handleLike} className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-125 duration-200">
              <Heart className={`w-7 h-7 ${reel.is_liked ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
            <span className="text-xs font-semibold mt-1">{reel.likes_count}</span>
          </div>
          
          <div className="flex flex-col items-center">
            <button onClick={fetchComments} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <MessageCircle className="w-7 h-7" />
            </button>
            <span className="text-xs font-semibold mt-1">{reel.comments_count}</span>
          </div>
          
          <div className="flex flex-col items-center">
            <button onClick={handleSave} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <Bookmark className={`w-7 h-7 ${reel.is_saved ? 'fill-white text-white' : ''}`} />
            </button>
            <span className="text-xs font-semibold mt-1">Save</span>
          </div>

          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <MoreVertical className="w-6 h-6" />
          </button>

          <div className="w-8 h-8 rounded-md border-2 border-white/40 overflow-hidden animate-spin-slow">
            <img 
              src={reel.avatar_url || `https://picsum.photos/seed/${reel.username}/50/50`} 
              alt="" 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer" 
            />
          </div>
        </div>
      </div>

      {/* Comments Drawer */}
      {showComments && (
        <div className="absolute inset-0 bg-black/60 z-50 flex flex-col justify-end">
          <div className="bg-zinc-900 rounded-t-2xl h-[70%] flex flex-col p-4 animate-slide-up border-t border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Comments</h3>
              <button onClick={() => setShowComments(false)} className="text-zinc-400 hover:text-white transition-colors">Close</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
              {comments.map((c: any) => (
                <div key={c.id} className="flex space-x-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-black flex-shrink-0 border border-zinc-800">
                    <img src={c.avatar_url || `https://picsum.photos/seed/${c.username}/50/50`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{c.username}</div>
                    <div className="text-sm text-zinc-300">{c.content}</div>
                  </div>
                </div>
              ))}
              {comments.length === 0 && <p className="text-center text-zinc-500 py-10">No comments yet.</p>}
            </div>
            <div className="border-t border-zinc-800 pt-4 flex items-center space-x-3">
              <input 
                type="text" 
                placeholder="Add a comment..." 
                className="flex-1 bg-black border border-zinc-800 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-sky-500 transition-all text-white placeholder:text-zinc-600"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <button 
                onClick={handleAddComment}
                className="text-sky-500 font-semibold text-sm disabled:opacity-50 hover:text-sky-400 transition-colors"
                disabled={!commentText.trim()}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Reels() {
  const [reels, setReels] = useState<Reel[]>([]);
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/posts', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) return [];
      return res.json();
    })
    .then(data => {
      const posts = Array.isArray(data) ? data : [];
      setReels(posts.filter((p: any) => p.type === 'video'));
      setIsLoading(false);
    })
    .catch(() => {
      setReels([]);
      setIsLoading(false);
    });
  }, [token]);

  const updateReel = (id: number, updates: Partial<Reel>) => {
    setReels(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-white">
        <div className="animate-pulse flex flex-col items-center">
          <Film className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-sm font-medium opacity-50">Loading Reels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-black md:max-w-[400px] md:mx-auto md:h-[calc(100vh-40px)] md:mt-5 md:rounded-xl shadow-2xl">
      {reels.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-white p-8 text-center">
          <Film className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg font-semibold">No reels yet</p>
          <p className="text-sm opacity-60">Upload a video to see it here!</p>
        </div>
      ) : (
        reels.map((reel) => (
          <ReelItem 
            key={reel.id} 
            reel={reel} 
            token={token} 
            onUpdate={(updates) => updateReel(reel.id, updates)} 
          />
        ))
      )}
    </div>
  );
}

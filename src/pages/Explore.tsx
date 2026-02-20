import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Search, Heart, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Post {
  id: number;
  url: string;
  type: 'image' | 'video';
  likes_count: number;
}

interface User {
  id: number;
  username: string;
  full_name: string;
  avatar_url: string;
}

export default function Explore() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetch('/api/explore', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setPosts(data);
      setIsLoading(false);
    });
  }, [token]);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      fetch(`/api/users/search?q=${searchQuery}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setSearchResults(data));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, token]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 text-white">
      {/* Search Bar */}
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-zinc-500" />
        </div>
        <input
          type="text"
          className="block w-full pl-11 pr-4 py-2.5 border border-transparent rounded-xl bg-zinc-900 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-all placeholder:text-zinc-500"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute z-50 mt-2 w-full bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-h-60 overflow-y-auto backdrop-blur-xl bg-opacity-95">
            {searchResults.map((user) => (
              <Link
                key={user.id}
                to={`/${user.username}`}
                className="flex items-center space-x-3 p-4 hover:bg-zinc-800 transition-colors border-b border-zinc-800/50 last:border-none"
                onClick={() => setSearchQuery('')}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-black border border-zinc-800">
                  <img src={user.avatar_url || `https://picsum.photos/seed/${user.username}/100/100`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-white">{user.username}</div>
                  <div className="text-xs text-zinc-500">{user.full_name}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-1 md:gap-1">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-square bg-zinc-900 animate-pulse border border-black"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 md:gap-1">
          {posts.map((post) => (
            <div key={post.id} className="aspect-square bg-zinc-900 relative group cursor-pointer overflow-hidden border border-black">
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

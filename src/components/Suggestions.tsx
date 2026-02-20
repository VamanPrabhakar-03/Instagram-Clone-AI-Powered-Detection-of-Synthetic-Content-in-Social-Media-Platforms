import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface Suggestion {
  id: number;
  username: string;
  full_name: string;
  avatar_url: string;
}

export default function Suggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const { user: currentUser, token } = useAuth();

  useEffect(() => {
    fetch('/api/users/suggestions', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setSuggestions(data));
  }, [token]);

  const handleFollow = async (userId: number) => {
    const res = await fetch(`/api/users/${userId}/follow`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      setSuggestions(suggestions.filter(s => s.id !== userId));
    }
  };

  if (suggestions.length === 0) return null;

  return (
    <div className="hidden lg:block w-80 fixed right-[calc(50%-580px)] top-12 space-y-4">


      {/* Suggestions Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-zinc-500">Suggested for you</span>
        <button className="text-xs font-semibold text-white hover:text-zinc-300">See All</button>
      </div>

      {/* Suggestions List */}
      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <div key={suggestion.id} className="flex items-center justify-between">
            <Link to={`/${suggestion.username}`} className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-900 border border-zinc-800">
                <img src={suggestion.avatar_url || `https://picsum.photos/seed/${suggestion.username}/100/100`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div>
                <div className="font-semibold text-sm text-white">{suggestion.username}</div>
                <div className="text-[10px] text-zinc-500">Suggested for you</div>
              </div>
            </Link>
            <button
              onClick={() => handleFollow(suggestion.id)}
              className="text-xs font-semibold text-sky-500 hover:text-sky-400"
            >
              Follow
            </button>
          </div>
        ))}
      </div>

      {/* Footer Links */}
      <div className="pt-4 text-[10px] text-zinc-500 uppercase space-y-4">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <span>About</span><span>Help</span><span>Press</span><span>API</span><span>Jobs</span><span>Privacy</span><span>Terms</span><span>Locations</span><span>Language</span><span>Meta Verified</span>
        </div>
        <div className="font-semibold text-zinc-600">© 2026 INSTAGRAM FROM META</div>
      </div>
    </div>
  );
}

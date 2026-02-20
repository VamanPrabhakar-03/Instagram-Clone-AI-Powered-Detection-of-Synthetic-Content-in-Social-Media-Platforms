import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Instagram } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const body = isLogin ? { username, password } : { username, password, full_name: fullName };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      
      if (res.ok) {
        login(data.token, data.user);
        navigate('/');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a141a] text-white flex flex-col md:flex-row">
      {/* Left Side - Branding & Visuals */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center p-12 bg-gradient-to-br from-[#0a141a] to-[#0d1b24]">
        <div className="max-w-md w-full space-y-8">
          <div className="w-20 h-20 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] rounded-2xl flex items-center justify-center shadow-lg">
            <Instagram className="w-12 h-12 text-white" strokeWidth={1.5} />
          </div>
          
          <h1 className="text-5xl font-bold leading-tight tracking-tight">
            See everyday moments from your <span className="bg-gradient-to-r from-[#ee2a7b] to-[#6228d7] bg-clip-text text-transparent">close friends</span>.
          </h1>

          <div className="relative h-80 w-full">
            <div className="absolute top-0 left-0 w-48 h-64 rounded-2xl overflow-hidden shadow-2xl transform -rotate-6 border-2 border-white/10">
              <img src="https://picsum.photos/seed/insta1/300/400" alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="absolute top-10 left-32 w-48 h-64 rounded-2xl overflow-hidden shadow-2xl transform rotate-3 z-10 border-2 border-white/10">
              <img src="https://picsum.photos/seed/insta2/300/400" alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="absolute top-20 left-16 w-48 h-64 rounded-2xl overflow-hidden shadow-2xl transform rotate-12 z-20 border-2 border-white/10">
              <img src="https://picsum.photos/seed/insta3/300/400" alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16">
        <div className="max-w-sm w-full space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">{isLogin ? 'Log into Instagram' : 'Create your account'}</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full px-4 py-3 bg-[#121f26] border border-zinc-800 rounded-xl text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all placeholder:text-zinc-500"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-1">
              <input
                type="text"
                placeholder="Mobile number, username or email"
                className="w-full px-4 py-3 bg-[#121f26] border border-zinc-800 rounded-xl text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all placeholder:text-zinc-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-3 bg-[#121f26] border border-zinc-800 rounded-xl text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all placeholder:text-zinc-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-red-500 text-xs text-center">{error}</p>}

            <button
              type="submit"
              className="w-full bg-[#0064e0] hover:bg-[#0056c1] text-white font-semibold py-3 rounded-full text-sm transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
            >
              {isLogin ? 'Log in' : 'Sign up'}
            </button>
          </form>

          <div className="text-center">
            <button className="text-sm text-zinc-400 hover:text-white transition-colors">
              Forgot password?
            </button>
          </div>

          <div className="space-y-3 pt-4">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="w-full border border-zinc-800 hover:bg-zinc-800/50 py-3 rounded-full text-sm font-semibold transition-all"
            >
              {isLogin ? 'Create new account' : 'Log in instead'}
            </button>
          </div>

          <div className="pt-12 flex flex-col items-center space-y-2 opacity-60">
            <div className="flex items-center space-x-1 text-xs font-semibold tracking-widest uppercase">
              <span className="text-lg">∞</span>
              <span>Meta</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

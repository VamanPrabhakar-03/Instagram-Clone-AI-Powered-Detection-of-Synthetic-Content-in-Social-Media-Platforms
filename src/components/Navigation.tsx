import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Search, Home, PlusSquare, User, LogOut, MessageCircle, Clapperboard, Instagram, Compass, Menu } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  type MenuItem = {
  icon: any;
  label: string;
  path: string;
  badge?: number;   // ⭐ optional badge
};

 const menuItems: MenuItem[] = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Clapperboard, label: 'Reels', path: '/reels' },
  { icon: MessageCircle, label: 'Messages', path: '/messages' },
  { icon: Search, label: 'Search', path: '/explore' },
  { icon: Compass, label: 'Explore', path: '/explore' },
  { icon: Heart, label: 'Notifications', path: '/notifications', badge: 3 }, // example
  { icon: PlusSquare, label: 'Create', path: '/create' },
];

  return (
    <div className="fixed left-0 top-0 h-screen w-20 hover:w-64 bg-black p-4 flex flex-col hidden md:flex z-50 transition-all duration-300 group/sidebar border-none overflow-hidden">
      <div className="mb-10 px-2">
        <Instagram className="w-7 h-7" />
      </div>
      
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className="flex items-center space-x-4 p-3 rounded-lg hover:bg-zinc-900 transition-colors group relative"
          >
            <div className="min-w-[24px] flex justify-center">
              <item.icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-base font-medium opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              {item.label}
            </span>
            {item.badge && (
              <span className="absolute left-7 top-2 bg-red-500 text-white text-[10px] font-bold px-1 rounded-full min-w-[16px] text-center border-2 border-black">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
        <Link
          to={`/${user?.username}`}
          className="flex items-center space-x-4 p-3 rounded-lg hover:bg-zinc-900 transition-colors group"
        >
          <div className="min-w-[24px] flex justify-center">
            <div className="w-6 h-6 rounded-full overflow-hidden border border-zinc-700">
              <img src={user?.avatar_url || `https://picsum.photos/seed/${user?.username}/100/100`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          </div>
          <span className="text-base font-medium opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Profile
          </span>
        </Link>
      </nav>

      <div className="mt-auto space-y-2">
        <button className="flex items-center space-x-4 p-3 rounded-lg hover:bg-zinc-900 transition-colors w-full">
          <div className="min-w-[24px] flex justify-center">
            <Menu className="w-6 h-6" />
          </div>
          <span className="text-base font-medium opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            More
          </span>
        </button>
        <button className="flex items-center space-x-4 p-3 rounded-lg hover:bg-zinc-900 transition-colors w-full opacity-60">
          <div className="min-w-[24px] flex justify-center">
            <div className="w-6 h-6 flex items-center justify-center">
              <span className="text-xl font-bold">∞</span>
            </div>
          </div>
          <span className="text-sm font-medium opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Also from Meta
          </span>
        </button>
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="flex items-center space-x-4 p-3 rounded-lg hover:bg-zinc-900 transition-colors w-full text-red-500"
        >
          <div className="min-w-[24px] flex justify-center">
            <LogOut className="w-6 h-6" />
          </div>
          <span className="text-base font-medium opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Logout
          </span>
        </button>
      </div>
    </div>
  );
}

export function MobileNav() {
  const { user } = useAuth();
  return (
    <div className="fixed bottom-0 left-0 w-full bg-black border-none flex justify-around p-3 md:hidden z-50">
      <Link to="/"><Home className="w-6 h-6" /></Link>
      <Link to="/explore"><Search className="w-6 h-6" /></Link>
      <Link to="/reels"><Clapperboard className="w-6 h-6" /></Link>
      <Link to="/create"><PlusSquare className="w-6 h-6" /></Link>
      <Link to={`/${user?.username}`}>
        <div className="w-6 h-6 rounded-full overflow-hidden border border-zinc-700">
          <img src={user?.avatar_url || `https://picsum.photos/seed/${user?.username}/100/100`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
      </Link>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, LogOut, Menu, X, Gift, User as UserIcon } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Simple base64 decoding of the JWT payload
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        setUser(decoded);
      } catch (err) {
        console.error('Failed to parse user JWT:', err);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full glass border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center transition-all duration-300">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-[#5865F2] flex items-center justify-center shadow-lg shadow-[#5865F2]/20 group-hover:scale-105 transition-transform">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent group-hover:text-white transition-colors">
            InviteRewards
          </span>
        </Link>
      </div>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center gap-6">
        {user ? (
          <>
            <Link
              href="/dashboard"
              className="text-zinc-300 hover:text-white text-sm font-medium transition-colors"
            >
              Dashboard
            </Link>
            
            {user.isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                Admin Panel
              </Link>
            )}

            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="flex items-center gap-2.5">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-8 h-8 rounded-full border border-white/10 shadow"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center border border-white/10">
                    <UserIcon className="w-4 h-4 text-zinc-400" />
                  </div>
                )}
                <span className="text-sm font-semibold text-white">{user.username}</span>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
          ) : (
          <Link
            href="/api/auth/login"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] hover:shadow-lg hover:shadow-[#5865F2]/20 text-white font-semibold text-sm transition-all duration-300 hover:-translate-y-0.5"
          >
            Connect Discord
          </Link>
        )}
      </div>

      {/* Mobile Trigger */}
      <div className="md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-zinc-400 hover:text-white transition-colors"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="absolute top-[73px] left-0 w-full glass border-b border-white/5 p-6 flex flex-col gap-4 animate-in slide-in-from-top duration-300 md:hidden">
          {user ? (
            <>
              <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-zinc-400" />
                  </div>
                )}
                <div>
                  <div className="font-semibold text-white">{user.username}</div>
                  <div className="text-xs text-zinc-400">Claimant Account</div>
                </div>
              </div>

              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="text-zinc-300 hover:text-white text-sm font-medium transition-colors"
              >
                Dashboard
              </Link>

              {user.isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Admin Panel
                </Link>
              )}

              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium pt-3 border-t border-white/5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/api/auth/login"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-sm transition-all"
            >
              Connect Discord
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}

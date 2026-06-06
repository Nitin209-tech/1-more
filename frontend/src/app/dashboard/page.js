'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { 
  Users, CheckCircle2, UserX, AlertTriangle, RefreshCw, 
  PlusCircle, Award, Ticket, Loader2, ArrowRight, Star
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      router.replace('/dashboard');
      return;
    }

    const loadStats = async () => {
      const activeToken = localStorage.getItem('token');
      if (!activeToken) {
        router.push('/');
        return;
      }

      try {
        const response = await axios.get('/api/dashboard/stats', {
          headers: { Authorization: `Bearer ${activeToken}` }
        });
        setData(response.data);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
        setError('Session expired or server unreachable. Please reconnect.');
        localStorage.removeItem('token');
        setTimeout(() => router.push('/'), 3000);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#05060A] text-[#F6F8FC]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-[#5865F2] animate-spin" />
          <p className="text-zinc-400 font-bold font-space-grotesk tracking-wide">Fetching ecosystem profile...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-[#05060A] text-[#F6F8FC]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
          <AlertTriangle className="w-12 h-12 text-[#FF007A] animate-bounce" />
          <h2 className="text-xl font-extrabold text-white font-space-grotesk">Authentication Failed</h2>
          <p className="text-zinc-400 max-w-sm mt-1">{error}</p>
        </div>
        <Footer />
      </div>
    );
  }

  const { invites, activeClaim, claimsHistory } = data;
  const activeToken = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const statCards = [
    { label: 'Total Invites', value: invites.total, icon: Users, color: 'text-blue-400', border: 'border-blue-500/10', glow: 'shadow-blue-500/5', bg: 'bg-blue-500/5' },
    { label: 'Valid Invites', value: invites.valid, icon: CheckCircle2, color: 'text-[#00F0FF]', border: 'border-[#00F0FF]/10', glow: 'shadow-[#00F0FF]/5', bg: 'bg-[#00F0FF]/5' },
    { label: 'Leaves', value: invites.leaves, icon: UserX, color: 'text-orange-400', border: 'border-orange-500/10', glow: 'shadow-orange-500/5', bg: 'bg-orange-500/5' },
    { label: 'Fake / Alts', value: invites.fake, icon: AlertTriangle, color: 'text-[#FF007A]', border: 'border-[#FF007A]/10', glow: 'shadow-[#FF007A]/5', bg: 'bg-[#FF007A]/5' },
    { label: 'Rejoins', value: invites.rejoins, icon: RefreshCw, color: 'text-purple-400', border: 'border-purple-500/10', glow: 'shadow-purple-500/5', bg: 'bg-purple-500/5' },
    { label: 'Bonus Invites', value: invites.bonus, icon: PlusCircle, color: 'text-pink-400', border: 'border-pink-500/10', glow: 'shadow-pink-500/5', bg: 'bg-pink-500/5' }
  ];

  return (
    <>
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto py-12 px-6 flex flex-col gap-10 relative overflow-hidden bg-[#05060A] cyber-grid">
        
        {/* Glow Blobs */}
        <div className="glow-blob w-[350px] h-[350px] bg-[#5865F2]/10 top-0 left-[-100px]" />
        <div className="glow-blob w-[300px] h-[300px] bg-[#00F0FF]/5 bottom-0 right-0" />

        {/* Header Summary */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-8 z-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white font-space-grotesk flex items-center gap-3">
              <Award className="w-8 h-8 text-[#00F0FF]" />
              Welcome Back, {data.username}
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Verify server invite stats, review claim tickets, and secure premium codes.
            </p>
          </div>
          <div className="px-6 py-4 rounded-2xl glass-panel border-[#00F0FF]/25 shadow-lg shadow-[#00F0FF]/5 flex items-center gap-5">
            <div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-black">Net Invites</div>
              <div className="text-3xl font-black text-[#00F0FF] tracking-tight">{invites.net}</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-xs text-zinc-400 leading-normal font-semibold">
              Valid: <span className="text-[#00F0FF]">{invites.valid}</span> <br />
              Bonus: <span className="text-purple-400">+{invites.bonus}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 z-10">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                className={`glass-panel p-5 rounded-2xl flex flex-col gap-4 shadow ${stat.border} ${stat.glow} hover:border-white/20 hover:scale-[1.02] transition-all duration-300`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-3xl font-black text-white tracking-tight">{stat.value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-1">{stat.label}</div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Active Claim / Action Section */}
        {activeClaim ? (
          <div className="glass-panel p-6 md:p-8 rounded-2xl border-l-4 border-amber-500 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 z-10">
            <div className="flex flex-col gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25 w-fit uppercase tracking-wider">
                <Star className="w-3.5 h-3.5 fill-current" />
                {activeClaim.status} Status
              </span>
              <h3 className="text-xl font-bold text-white font-space-grotesk">
                Claim Verification Needed: {activeClaim.rewardName}
              </h3>
              <p className="text-zinc-400 text-sm max-w-xl">
                {activeClaim.status === 'Pending' 
                  ? 'Complete the secure web survey verification steps to register Roblox identifier and deliver instructions.'
                  : 'Moderation review underway. Staff will update the ticket channel. Refresh below to fetch updates.'
                }
              </p>
            </div>
            
            {activeClaim.status === 'Pending' && (
              <button
                onClick={() => router.push(`/claim?token=${activeToken}`)}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20 hover:scale-[1.02]"
              >
                Start Verification Survey
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {activeClaim.status === 'Processing' && (
              <button
                onClick={() => router.push(`/redeem?claimId=${activeClaim.claimId}&token=${activeToken}`)}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm transition-all duration-300 hover:scale-[1.02]"
              >
                Redeem Tracker
                <Ticket className="w-4 h-4 text-zinc-400" />
              </button>
            )}
          </div>
        ) : (
          <div className="glass-panel p-8 rounded-2xl text-center py-12 flex flex-col items-center gap-4 border-white/5 z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-center text-zinc-400">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg font-space-grotesk">No Active Claims</h3>
              <p className="text-zinc-400 text-sm max-w-sm mt-1 mx-auto leading-relaxed">
                Unlock active claims by clicking **Claim Reward** in the Discord channel once you meet the invite count criteria.
              </p>
            </div>
          </div>
        )}

        {/* Claim History Table */}
        <div className="flex flex-col gap-4 z-10">
          <h2 className="text-xl font-bold text-white font-space-grotesk flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#00F0FF]" />
            Claim History & Logs
          </h2>
          <div className="w-full glass-panel rounded-2xl overflow-hidden border border-white/5 shadow-xl">
            {claimsHistory.length === 0 ? (
              <div className="p-10 text-center text-zinc-500 text-sm">
                No past claims cataloged.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01] text-zinc-400 font-semibold text-xs uppercase tracking-wider">
                      <th className="p-4">Claim ID</th>
                      <th className="p-4">Reward Name</th>
                      <th className="p-4">Invites</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claimsHistory.map((claim, index) => {
                      const date = new Date(claim.createdAt).toLocaleDateString();
                      
                      let badgeColor = 'bg-zinc-500/10 text-zinc-400 border-zinc-500/25';
                      if (claim.status === 'Approved') badgeColor = 'bg-green-500/10 text-green-400 border-green-500/25';
                      if (claim.status === 'Processing') badgeColor = 'bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/25';
                      if (claim.status === 'Rejected') badgeColor = 'bg-[#FF007A]/10 text-[#FF007A] border-[#FF007A]/25';
                      if (claim.status === 'Completed') badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/25';

                      return (
                        <tr key={index} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                          <td className="p-4 font-mono text-xs text-[#00F0FF]">{claim.claimId}</td>
                          <td className="p-4 font-semibold text-white">{claim.rewardName}</td>
                          <td className="p-4">{claim.inviteCount}</td>
                          <td className="p-4 text-zinc-400">{date}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}`}>
                              {claim.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => router.push(`/redeem?claimId=${claim.claimId}&token=${activeToken}`)}
                              className="text-xs font-bold uppercase tracking-wider text-[#00F0FF] hover:text-[#00c8ff] hover:underline"
                            >
                              Track Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </main>
      <Footer />
    </>
  );
}

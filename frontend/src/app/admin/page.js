'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { 
  Shield, Users, Ticket, ListFilter, ClipboardList, 
  Settings, Check, X, Search, Info, PlusCircle, 
  Trash2, Loader2, Award, Star
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('claims');
  
  const [stats, setStats] = useState(null);
  const [claims, setClaims] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [logs, setLogs] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showRewardModal, setShowRewardModal] = useState(false);
  const [editingRewardId, setEditingRewardId] = useState(null);
  const [rewardForm, setRewardForm] = useState({
    name: '',
    emoji: '',
    requiredInvites: 0,
    description: '',
    rewardType: 'nitro',
    stock: 0
  });

  const [rejectReasonPrompt, setRejectReasonPrompt] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [expandedClaimId, setExpandedClaimId] = useState(null);

  const loadAdminData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(atob(base64));
      
      if (!decoded.isAdmin) {
        setError('Forbidden: Administrator permissions required.');
        setLoading(false);
        return;
      }

      const statsRes = await axios.get('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(statsRes.data);

      const claimsRes = await axios.get('/api/admin/claims', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClaims(claimsRes.data);

      const rewardsRes = await axios.get('/api/admin/rewards', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRewards(rewardsRes.data);

      const logsRes = await axios.get('/api/admin/logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(logsRes.data);

      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to sync administrative variables.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [router]);

  const handleApproveClaim = async (claimId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(`/api/admin/claims/${claimId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadAdminData();
    } catch (err) {
      alert('Failed to approve claim.');
    }
  };

  const handleRejectClaim = async () => {
    if (!rejectReason.trim()) return;
    const token = localStorage.getItem('token');
    try {
      await axios.post(`/api/admin/claims/${rejectReasonPrompt}/reject`, {
        reason: rejectReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRejectReasonPrompt(null);
      setRejectReason('');
      loadAdminData();
    } catch (err) {
      alert('Failed to reject claim.');
    }
  };

  const handleSaveReward = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const emojiRegex = /^<a?:[a-zA-Z0-9_]+:[0-9]+>$/;
    if (!emojiRegex.test(rewardForm.emoji)) {
      alert('Invalid emoji! Must be custom/animated format like <a:nitro:1234567890>.');
      return;
    }

    try {
      if (editingRewardId) {
        await axios.put(`/api/admin/rewards/${editingRewardId}`, rewardForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('/api/admin/rewards', rewardForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowRewardModal(false);
      setEditingRewardId(null);
      setRewardForm({ name: '', emoji: '', requiredInvites: 0, description: '', rewardType: 'nitro', stock: 0 });
      loadAdminData();
    } catch (err) {
      alert('Failed to save reward: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditRewardClick = (reward) => {
    setEditingRewardId(reward._id);
    setRewardForm({
      name: reward.name,
      emoji: reward.emoji,
      requiredInvites: reward.requiredInvites,
      description: reward.description,
      rewardType: reward.rewardType,
      stock: reward.stock
    });
    setShowRewardModal(true);
  };

  const handleToggleReward = async (reward) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`/api/admin/rewards/${reward._id}`, {
        ...reward,
        isActive: !reward.isActive
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadAdminData();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleDeleteReward = async (id) => {
    if (!confirm('Permanently delete reward listing?')) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`/api/admin/rewards/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadAdminData();
    } catch (err) {
      alert('Failed to delete reward.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#05060A] text-[#F6F8FC]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-[#5865F2] animate-spin" />
          <p className="text-zinc-400 font-bold font-space-grotesk tracking-wide">Bootstrapping moderation console...</p>
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
          <Shield className="w-12 h-12 text-[#FF007A] animate-pulse" />
          <h2 className="text-xl font-extrabold text-white font-space-grotesk">Access Blocked</h2>
          <p className="text-zinc-400 max-w-sm mt-1">{error}</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="mt-6 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-sm transition-all"
          >
            Dashboard
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = 
      claim.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.discordId.includes(searchQuery) ||
      claim.claimId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === '' || claim.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto py-10 px-6 flex flex-col gap-8 relative overflow-hidden bg-[#05060A] cyber-grid">
        
        {/* Glow Blobs */}
        <div className="glow-blob w-[400px] h-[400px] bg-[#5865F2]/5 top-[10%] left-[-150px]" />
        <div className="glow-blob w-[300px] h-[300px] bg-[#00F0FF]/5 bottom-[10%] right-[-100px]" />

        {/* Header Summary */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-white/5 pb-8 z-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white font-space-grotesk flex items-center gap-3">
              <Shield className="w-8 h-8 text-amber-500" />
              Administrative Operations Control
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Verify claims, audit joins, monitor alts, and coordinate reward listings.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 bg-zinc-950/80 p-1.5 rounded-xl border border-white/5 shadow">
            {[
              { id: 'claims', label: 'Claims', icon: Ticket },
              { id: 'rewards', label: 'Reward Catalog', icon: Settings },
              { id: 'logs', label: 'Ecosystem Logs', icon: ClipboardList },
              { id: 'stats', label: 'Analytics', icon: Award }
            ].map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    activeTab === tab.id 
                      ? 'bg-[#5865F2] text-white shadow-md shadow-[#5865F2]/10' 
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab 1: Claims List */}
        {activeTab === 'claims' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200 z-10">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-950/50 p-4 rounded-xl border border-white/5">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search User ID, Username, or Claim ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-white/5 focus:border-[#00F0FF] focus:outline-none text-white text-sm"
                />
              </div>

              <div className="flex gap-2.5 items-center w-full sm:w-auto">
                <ListFilter className="w-4 h-4 text-zinc-500" />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/5 focus:border-[#00F0FF] focus:outline-none text-white text-sm cursor-pointer font-bold"
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
              {filteredClaims.length === 0 ? (
                <div className="p-10 text-center text-zinc-500 text-sm">
                  No claims found matching filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.01] text-zinc-400 font-semibold text-xs uppercase tracking-wider">
                        <th className="p-4">Claim ID</th>
                        <th className="p-4">User</th>
                        <th className="p-4">Reward</th>
                        <th className="p-4">Invites</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClaims.map((claim) => {
                        const date = new Date(claim.createdAt).toLocaleDateString();
                        const isExpanded = expandedClaimId === claim.claimId;
                        
                        let badgeColor = 'bg-zinc-500/10 text-zinc-400 border-zinc-500/25';
                        if (claim.status === 'Approved') badgeColor = 'bg-green-500/10 text-green-400 border-green-500/25';
                        if (claim.status === 'Processing') badgeColor = 'bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/25';
                        if (claim.status === 'Rejected') badgeColor = 'bg-[#FF007A]/10 text-[#FF007A] border-[#FF007A]/25';
                        if (claim.status === 'Completed') badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/25';

                        return (
                          <>
                            <tr key={claim.claimId} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                              <td className="p-4 font-mono text-xs text-[#00F0FF]">
                                <button 
                                  onClick={() => setExpandedClaimId(isExpanded ? null : claim.claimId)}
                                  className="hover:underline flex items-center gap-1.5 text-left font-bold"
                                >
                                  <Info className="w-3.5 h-3.5 text-zinc-500" />
                                  {claim.claimId}
                                </button>
                              </td>
                              <td className="p-4 font-bold text-white">
                                <div className="flex flex-col">
                                  <span>{claim.username}</span>
                                  <span className="text-[10px] text-zinc-500 font-medium">{claim.discordId}</span>
                                </div>
                              </td>
                              <td className="p-4 font-medium">{claim.rewardName}</td>
                              <td className="p-4 font-black text-[#00F0FF]">{claim.inviteCount}</td>
                              <td className="p-4 text-zinc-400">{date}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}`}>
                                  {claim.status}
                                </span>
                              </td>
                              <td className="p-4 text-right flex justify-end gap-1.5">
                                {['Pending', 'Processing'].includes(claim.status) && (
                                  <>
                                    <button
                                      onClick={() => handleApproveClaim(claim.claimId)}
                                      className="p-2 rounded-xl bg-green-500/10 hover:bg-green-500 border border-green-500/20 text-green-400 hover:text-white transition-all duration-200"
                                      title="Approve"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setRejectReasonPrompt(claim.claimId)}
                                      className="p-2 rounded-xl bg-[#FF007A]/10 hover:bg-[#FF007A] border border-[#FF007A]/20 text-[#FF007A] hover:text-white transition-all duration-200"
                                      title="Reject"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                            
                            {isExpanded && (
                              <tr className="bg-zinc-950/60 border-b border-white/5">
                                <td colSpan="7" className="p-6">
                                  <div className="flex flex-col gap-4 text-xs">
                                    <h4 className="font-extrabold text-[#00F0FF] text-xs uppercase tracking-wider border-b border-white/5 pb-2">
                                      Claim Survey Profile Details
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed">
                                      <div className="flex flex-col gap-2">
                                        <div className="text-zinc-500 font-bold uppercase tracking-wider">Step 1: Contact Information</div>
                                        <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex flex-col gap-1.5 text-zinc-300 font-semibold">
                                          <div>Full Name: <span className="text-white">{claim.surveyData?.basicInfo?.fullName || 'N/A'}</span></div>
                                          <div>Roblox Username: <span className="text-white">{claim.surveyData?.basicInfo?.robloxUsername || 'N/A'}</span></div>
                                          <div>Email: <span className="text-white">{claim.surveyData?.basicInfo?.email || 'N/A'}</span></div>
                                        </div>
                                      </div>
                                      
                                      <div className="flex flex-col gap-2">
                                        <div className="text-zinc-500 font-bold uppercase tracking-wider">Step 2: Answers & Policies</div>
                                        <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex flex-col gap-1.5 text-zinc-300 font-semibold">
                                          <div>How heard: <span className="text-white">{claim.surveyData?.verificationQuestions?.source || 'N/A'}</span></div>
                                          <div>Invite strategy: <span className="text-white">{claim.surveyData?.verificationQuestions?.method || 'N/A'}</span></div>
                                          <div>Terms Confirmed: <span className="text-white">{claim.surveyData?.termsAccepted ? 'Yes' : 'No'}</span></div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Reward Catalog */}
        {activeTab === 'rewards' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200 z-10">
            <div className="flex justify-between items-center w-full">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 font-space-grotesk">
                <Settings className="w-5 h-5 text-[#00F0FF]" />
                Rewards Management
              </h2>
              <button
                onClick={() => {
                  setEditingRewardId(null);
                  setRewardForm({ name: '', emoji: '', requiredInvites: 0, description: '', rewardType: 'nitro', stock: 0 });
                  setShowRewardModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold uppercase tracking-wider transition-all duration-300"
              >
                <PlusCircle className="w-4 h-4" />
                Add Reward
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewards.map(reward => (
                <div key={reward._id} className="glass-panel p-6 rounded-2xl flex flex-col justify-between gap-5 relative overflow-hidden border border-white/5">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <span className="text-2xl">{reward.emoji}</span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-[#00F0FF] font-bold uppercase tracking-wider">
                        {reward.requiredInvites} Invites
                      </span>
                    </div>

                    <h3 className="text-lg font-extrabold text-white mt-2 font-space-grotesk">{reward.name}</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed">{reward.description}</p>
                    <div className="mt-2 text-xs text-zinc-500 font-medium">
                      Type: <span className="text-zinc-300 font-semibold">{reward.rewardType}</span> | Stock: <span className="text-zinc-300 font-semibold">{reward.stock}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 border-t border-white/5 pt-4 mt-2">
                    <button
                      onClick={() => handleEditRewardClick(reward)}
                      className="flex-1 text-center py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-white transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleReward(reward)}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                        reward.isActive 
                          ? 'border-green-500/20 text-green-400 bg-green-500/5 hover:bg-green-500/10' 
                          : 'border-[#FF007A]/20 text-[#FF007A] bg-[#FF007A]/5 hover:bg-[#FF007A]/10'
                      }`}
                    >
                      {reward.isActive ? 'Active' : 'Disabled'}
                    </button>
                    <button
                      onClick={() => handleDeleteReward(reward._id)}
                      className="p-2.5 rounded-xl bg-[#FF007A]/10 hover:bg-[#FF007A] border border-[#FF007A]/25 text-[#FF007A] hover:text-white transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Logs */}
        {activeTab === 'logs' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200 z-10">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4 font-space-grotesk">
              <ClipboardList className="w-5 h-5 text-amber-500" />
              Ecosystem Audit logs
            </h2>

            <div className="glass-panel rounded-2xl border border-white/5 max-h-[520px] overflow-y-auto p-4 flex flex-col gap-3">
              {logs.length === 0 ? (
                <div className="text-center text-zinc-500 py-10 text-sm">
                  No log entries cataloged.
                </div>
              ) : (
                logs.map((log, index) => {
                  const timestamp = new Date(log.createdAt).toLocaleString();
                  let badge = 'bg-zinc-500/10 text-zinc-400';
                  if (log.type === 'INVITE_JOIN') badge = 'bg-green-500/10 text-green-400 border-green-500/20';
                  if (log.type === 'INVITE_LEAVE') badge = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
                  if (log.type === 'CLAIM_CREATE') badge = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                  if (log.type === 'CLAIM_STATUS') badge = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
                  
                  return (
                    <div key={index} className="p-4 rounded-xl bg-zinc-950/60 border border-white/5 flex flex-col gap-2 text-xs">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${badge}`}>
                          {log.type}
                        </span>
                        <span className="text-zinc-500 font-semibold">{timestamp}</span>
                      </div>
                      
                      <div className="text-zinc-300 font-medium">
                        User: <span className="text-white font-bold">{log.username || 'System'}</span> (ID: <span className="font-mono text-zinc-400">{log.userId || 'N/A'}</span>)
                        <div className="bg-black/35 p-3 rounded-lg border border-white/5 mt-2 text-[10px] text-zinc-400 font-mono overflow-x-auto">
                          {JSON.stringify(log.details)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Analytics */}
        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-200 z-10">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <h3 className="text-lg font-bold text-white border-b border-white/5 pb-3 font-space-grotesk">Redemption Statistics</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                {[
                  { label: 'Total Claims', value: stats.claims.total, color: 'text-zinc-400' },
                  { label: 'Pending Survey', value: stats.claims.pending, color: 'text-amber-400' },
                  { label: 'Under Review', value: stats.claims.processing, color: 'text-[#00F0FF]' },
                  { label: 'Approved Claims', value: stats.claims.approved, color: 'text-green-400' },
                  { label: 'Completed Deliveries', value: stats.claims.completed, color: 'text-blue-400' },
                  { label: 'Rejected Claims', value: stats.claims.rejected, color: 'text-[#FF007A]' }
                ].map((stat, i) => (
                  <div key={i} className="glass-panel p-5 rounded-2xl flex flex-col gap-2">
                    <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{stat.label}</div>
                    <div className={`text-3xl font-black ${stat.color} tracking-tight`}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <h3 className="text-lg font-bold text-white border-b border-white/5 pb-3 font-space-grotesk">Top Inviters Leaders</h3>
              <div className="glass-panel p-5 rounded-2xl border border-white/5 shadow-2xl flex flex-col gap-4">
                {stats.topInviters.length === 0 ? (
                  <div className="text-zinc-500 text-xs text-center py-6">
                    No inviters recorded.
                  </div>
                ) : (
                  stats.topInviters.map((user, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-white/5 pb-3 last:border-b-0 last:pb-0 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-[#00F0FF] font-black text-center leading-5 text-[10px]">
                          {i + 1}
                        </div>
                        <span className="font-bold text-white">{user.username}</span>
                      </div>
                      <span className="font-mono text-zinc-400 font-semibold">
                        {user.invites.valid} valid (+{user.invites.bonus})
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Reject Modal */}
      {rejectReasonPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
          <div className="glass-panel p-6 md:p-8 rounded-2xl max-w-sm w-full border border-white/10 flex flex-col gap-4">
            <h3 className="font-bold text-lg text-white font-space-grotesk">Log Rejection Details</h3>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Explain why this claim was rejected..."
              className="w-full px-4 py-3 rounded-xl bg-zinc-950/60 border border-white/5 focus:border-red-500 focus:outline-none text-white text-sm transition-colors resize-none"
            />
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => {
                  setRejectReasonPrompt(null);
                  setRejectReason('');
                }}
                className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white font-bold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectClaim}
                disabled={!rejectReason.trim()}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all disabled:opacity-40"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Reward Modal */}
      {showRewardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6 overflow-y-auto py-8">
          <div className="glass-panel p-6 md:p-8 rounded-2xl max-w-md w-full border border-white/10 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-xl text-white font-space-grotesk">
              {editingRewardId ? 'Edit Reward Listing' : 'Register New Reward'}
            </h3>
            
            <form onSubmit={handleSaveReward} className="flex flex-col gap-4 text-xs font-semibold">
              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 uppercase tracking-wider">Reward Name</label>
                <input
                  type="text"
                  required
                  value={rewardForm.name}
                  onChange={e => setRewardForm({ ...rewardForm, name: e.target.value })}
                  placeholder="e.g. Nitro Boost Monthly"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950/60 border border-white/5 focus:border-[#00F0FF] focus:outline-none text-white text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 uppercase tracking-wider">Custom Emoji (Discord Format)</label>
                <input
                  type="text"
                  required
                  value={rewardForm.emoji}
                  onChange={e => setRewardForm({ ...rewardForm, emoji: e.target.value })}
                  placeholder="e.g. <a:nitro:1234567890>"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950/60 border border-white/5 focus:border-[#00F0FF] focus:outline-none text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-400 uppercase tracking-wider">Invites Required</label>
                  <input
                    type="number"
                    required
                    value={rewardForm.requiredInvites}
                    onChange={e => setRewardForm({ ...rewardForm, requiredInvites: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950/60 border border-white/5 focus:border-[#00F0FF] focus:outline-none text-white text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-400 uppercase tracking-wider">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={rewardForm.stock}
                    onChange={e => setRewardForm({ ...rewardForm, stock: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950/60 border border-white/5 focus:border-[#00F0FF] focus:outline-none text-white text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 uppercase tracking-wider">Category Type</label>
                <select
                  value={rewardForm.rewardType}
                  onChange={e => setRewardForm({ ...rewardForm, rewardType: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950/60 border border-white/5 focus:border-[#00F0FF] focus:outline-none text-white text-sm cursor-pointer"
                >
                  <option value="nitro">Discord Nitro</option>
                  <option value="robux">Robux Gift Card</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 uppercase tracking-wider">Description</label>
                <textarea
                  required
                  rows={2}
                  value={rewardForm.description}
                  onChange={e => setRewardForm({ ...rewardForm, description: e.target.value })}
                  placeholder="Short description of the reward..."
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950/60 border border-white/5 focus:border-[#00F0FF] focus:outline-none text-white text-sm resize-none"
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRewardModal(false);
                    setEditingRewardId(null);
                  }}
                  className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white font-bold text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-sm btn-glow-blurple transition-all"
                >
                  Save Reward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

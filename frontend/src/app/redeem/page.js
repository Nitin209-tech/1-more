'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { 
  Ticket, CheckCircle2, Clock, XCircle, Loader2, 
  ArrowLeft, RefreshCw 
} from 'lucide-react';

export default function Redeem() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claim, setClaim] = useState(null);

  const loadClaim = async () => {
    setLoading(true);
    const claimId = searchParams.get('claimId');
    const token = searchParams.get('token') || localStorage.getItem('token');
    
    if (!claimId) {
      setError('Missing Claim ID parameters.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`/api/claims/status/${claimId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClaim(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch claim tracking. Token may have expired.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClaim();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#05060A] text-[#F6F8FC]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-[#5865F2] animate-spin" />
          <p className="text-zinc-400 font-bold font-space-grotesk tracking-wide">Fetching redemption profile...</p>
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
          <XCircle className="w-12 h-12 text-[#FF007A] animate-pulse" />
          <h2 className="text-xl font-black text-white font-space-grotesk">Tracking Session Failed</h2>
          <p className="text-zinc-400 max-w-sm mt-1">{error}</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="mt-6 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-sm transition-all"
          >
            Go to Dashboard
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  let currentStep = 1;
  if (claim.status === 'Processing') currentStep = 2;
  if (claim.status === 'Approved') currentStep = 3;
  if (claim.status === 'Completed') currentStep = 4;
  if (claim.status === 'Rejected') currentStep = 3;

  const statusMeta = {
    Pending: { label: 'Pending Survey', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-amber-500/5', icon: Clock },
    Processing: { label: 'Under Review', color: 'text-[#00F0FF] bg-[#00F0FF]/10 border-[#00F0FF]/25 shadow-[#00F0FF]/5', icon: Loader2 },
    Approved: { label: 'Approved', color: 'text-green-400 bg-green-500/10 border-green-500/20 shadow-green-500/5', icon: CheckCircle2 },
    Rejected: { label: 'Rejected', color: 'text-[#FF007A] bg-[#FF007A]/10 border-[#FF007A]/25 shadow-[#FF007A]/5', icon: XCircle },
    Completed: { label: 'Completed', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-blue-500/5', icon: CheckCircle2 }
  };

  const Meta = statusMeta[claim.status] || statusMeta['Pending'];
  const StatusIcon = Meta.icon;

  const timelineSteps = [
    { number: 1, title: 'Claim Created', desc: 'Ticket channel initialized in Discord' },
    { number: 2, title: 'Survey Submitted', desc: 'Verification survey questions recorded' },
    { number: 3, title: 'Ecosystem Review', desc: 'Invites scanned and approved by bots/staff' },
    { number: 4, title: 'Reward Issued', desc: 'Code dispatched inside the claim ticket' }
  ];

  return (
    <>
      <Navbar />
      <main className="flex-1 w-full max-w-xl mx-auto py-12 px-6 flex flex-col gap-8 justify-center relative overflow-hidden bg-[#05060A] cyber-grid">
        {/* Glow Blobs */}
        <div className="glow-blob w-[300px] h-[300px] bg-[#5865F2]/10 top-10 left-[-50px]" />
        <div className="glow-blob w-[300px] h-[300px] bg-[#FF007A]/5 bottom-10 right-[-50px]" />

        <div className="flex justify-between items-center w-full z-10">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={loadClaim}
            className="p-2.5 rounded-xl glass-panel border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Claim Info Header Card */}
        <div className="glass-panel p-6 md:p-8 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden flex flex-col gap-5 z-10">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#00F0FF] to-purple-500 opacity-5 blur-xl" />
          
          <div className="flex justify-between items-start gap-4 border-b border-white/5 pb-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">CLAIM ID: {claim.claimId}</span>
              <h2 className="text-2xl font-black text-white font-space-grotesk tracking-tight">{claim.rewardName}</h2>
              <span className="text-[10px] text-zinc-500 font-semibold uppercase mt-0.5">Created: {new Date(claim.createdAt).toLocaleString()}</span>
            </div>
            
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border badge-neon shadow ${Meta.color}`}>
              <StatusIcon className={`w-3.5 h-3.5 ${claim.status === 'Processing' ? 'animate-spin' : ''}`} />
              {Meta.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-zinc-500 uppercase font-black tracking-wider">Claimant Account</div>
              <div className="text-zinc-200 mt-1 font-semibold">{claim.username}</div>
            </div>
            <div>
              <div className="text-zinc-500 uppercase font-black tracking-wider">Verified Invites</div>
              <div className="text-[#00F0FF] mt-1 font-black text-sm">{claim.inviteCount} Invites</div>
            </div>
          </div>

          {claim.status === 'Rejected' && (
            <div className="p-4 rounded-xl bg-[#FF007A]/10 border border-[#FF007A]/25 text-[#FF007A] flex flex-col gap-1.5 animate-pulse">
              <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                Claim Rejected By Moderator
              </h4>
              <p className="text-xs leading-normal">
                **Reason:** {claim.rejectReason || 'No feedback logged.'}
              </p>
              <p className="text-[10px] text-zinc-500 font-semibold mt-1">
                Please visit the claim channel in the server to resolve.
              </p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="flex flex-col gap-6 z-10">
          <h3 className="font-black text-white text-base font-space-grotesk flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#00F0FF]" />
            Redemption Stage Progression
          </h3>

          <div className="flex flex-col gap-8 relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-900 border-white/5">
            {timelineSteps.map((stepMeta, index) => {
              const isActive = claim.status !== 'Rejected' && currentStep >= stepMeta.number;
              const isCompleted = claim.status !== 'Rejected' && currentStep > stepMeta.number;
              const isRejectedHere = claim.status === 'Rejected' && stepMeta.number === 3;
              
              let bubbleStyle = 'border-zinc-800 bg-[#05060A] text-zinc-600';
              let lineTitleStyle = 'text-zinc-500';
              let lineDescStyle = 'text-zinc-600';
              
              if (isActive) {
                bubbleStyle = 'border-[#00F0FF] bg-[#00F0FF]/10 text-[#00F0FF] shadow-lg shadow-[#00F0FF]/15';
                lineTitleStyle = 'text-white font-bold';
                lineDescStyle = 'text-zinc-400';
              }
              if (isCompleted) {
                bubbleStyle = 'border-green-500 bg-green-500 text-black';
              }
              if (isRejectedHere) {
                bubbleStyle = 'border-[#FF007A] bg-[#FF007A] text-black';
                lineTitleStyle = 'text-[#FF007A] font-black';
                lineDescStyle = 'text-[#FF007A]/75';
              }

              return (
                <div key={index} className="flex gap-4 relative group">
                  <div className={`absolute -left-[27px] w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-extrabold transition-all duration-300 z-10 ${bubbleStyle}`}>
                    {isCompleted ? '✓' : isRejectedHere ? '✗' : stepMeta.number}
                  </div>
                  
                  <div className="flex flex-col gap-0.5">
                    <h4 className={`text-sm transition-colors ${lineTitleStyle}`}>
                      {stepMeta.title}
                    </h4>
                    <p className={`text-xs transition-colors ${lineDescStyle}`}>
                      {stepMeta.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>
      <Footer />
    </>
  );
}

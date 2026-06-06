'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { 
  FileText, ShieldCheck, User, Sparkles, Loader2, 
  HelpCircle, ArrowLeft, ArrowRight, CheckCircle 
} from 'lucide-react';

export default function ClaimReward() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claimId, setClaimId] = useState('');
  const [rewardName, setRewardName] = useState('');
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [basicInfo, setBasicInfo] = useState({
    fullName: '',
    discordTag: '',
    robloxUsername: '',
    email: ''
  });
  
  const [verificationQuestions, setVerificationQuestions] = useState({
    source: '',
    method: '',
    antiBotAnswer: ''
  });

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [mathProblem, setMathProblem] = useState({ a: 0, b: 0, answer: 0 });

  useEffect(() => {
    const num1 = Math.floor(Math.random() * 9) + 2;
    const num2 = Math.floor(Math.random() * 9) + 2;
    setMathProblem({ a: num1, b: num2, answer: num1 + num2 });

    const token = searchParams.get('token');
    if (!token) {
      setError('Invalid or expired claim token. Please launch again from Discord.');
      setLoading(false);
      return;
    }

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const decoded = JSON.parse(jsonPayload);
      
      if (!decoded.claimId) {
        setError('Missing claim session variables.');
      } else {
        setClaimId(decoded.claimId);
        setRewardName(decoded.rewardName || 'Ecosystem Reward');
        setBasicInfo(prev => ({
          ...prev,
          discordTag: decoded.username || ''
        }));
      }
    } catch (err) {
      setError('Corrupted session credentials.');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  const validateStep1 = () => {
    const { fullName, robloxUsername, email } = basicInfo;
    if (!fullName.trim() || !robloxUsername.trim() || !email.trim()) return false;
    return email.includes('@') && email.includes('.');
  };

  const validateStep2 = () => {
    const { source, method, antiBotAnswer } = verificationQuestions;
    if (!source.trim() || !method.trim()) return false;
    return parseInt(antiBotAnswer) === mathProblem.answer;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!termsAccepted) return;
    setSubmitting(true);
    const token = searchParams.get('token');

    try {
      await axios.post(
        `/api/claims/submit-survey/${claimId}`,
        { basicInfo, verificationQuestions, termsAccepted },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      router.push(`/redeem?claimId=${claimId}&token=${token}`);
    } catch (err) {
      console.error(err);
      alert('Failed to submit survey details. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#05060A] text-[#F6F8FC]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-[#5865F2] animate-spin" />
          <p className="text-zinc-400 font-bold font-space-grotesk tracking-wide">Decoding secure session...</p>
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
          <div className="w-14 h-14 rounded-2xl bg-[#FF007A]/10 border border-[#FF007A]/25 flex items-center justify-center text-[#FF007A] animate-pulse">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-white font-space-grotesk">Verification Session Blocked</h2>
          <p className="text-zinc-400 max-w-sm mt-1">{error}</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="mt-6 px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-[#5865F2] hover:border-[#5865F2] text-white font-bold text-sm transition-all"
          >
            Back to Dashboard
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 w-full max-w-xl mx-auto py-12 px-6 flex flex-col gap-8 justify-center relative overflow-hidden bg-[#05060A] cyber-grid">
        {/* Glow Blobs */}
        <div className="glow-blob w-[300px] h-[300px] bg-[#9D00FF]/10 top-[20%] left-[-50px]" />
        <div className="glow-blob w-[300px] h-[300px] bg-[#00F0FF]/5 bottom-[20%] right-[-50px]" />

        <div className="text-center flex flex-col items-center gap-3 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-[#00F0FF] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Claim Session: {claimId}
          </div>
          <h1 className="text-3xl font-black text-white font-space-grotesk tracking-tight">
            Redemption Survey Form
          </h1>
          <p className="text-zinc-400 text-xs">
            Reward: <span className="text-white font-bold">{rewardName}</span>
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full flex items-center gap-3 z-10">
          <div className="flex-1 h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#00F0FF] via-[#5865F2] to-purple-500"
              initial={{ width: '0%' }}
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-xs text-zinc-500 font-black tracking-wider">
            {step}/3
          </span>
        </div>

        {/* Form Card */}
        <div className="glass-panel p-6 md:p-8 rounded-2xl border border-white/5 shadow-2xl min-h-[380px] flex flex-col justify-between z-10 relative">
          
          <AnimatePresence mode="wait">
            
            {/* Step 1 */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -30, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <User className="w-5 h-5 text-[#00F0FF]" />
                  <h3 className="font-bold text-white text-base font-space-grotesk">Step 1: Contact Details</h3>
                </div>

                <div className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    value={basicInfo.fullName}
                    onChange={e => setBasicInfo({ ...basicInfo, fullName: e.target.value })}
                    placeholder="e.g. Nitin Kumar"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950/60 border border-white/5 focus:border-[#00F0FF] focus:outline-none text-white text-sm font-medium transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  <label>Roblox Username</label>
                  <input
                    type="text"
                    required
                    value={basicInfo.robloxUsername}
                    onChange={e => setBasicInfo({ ...basicInfo, robloxUsername: e.target.value })}
                    placeholder="Required for Robux transfers"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950/60 border border-white/5 focus:border-[#00F0FF] focus:outline-none text-white text-sm font-medium transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  <label>Contact Email</label>
                  <input
                    type="email"
                    required
                    value={basicInfo.email}
                    onChange={e => setBasicInfo({ ...basicInfo, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950/60 border border-white/5 focus:border-[#00F0FF] focus:outline-none text-white text-sm font-medium transition-colors"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -30, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <HelpCircle className="w-5 h-5 text-purple-400" />
                  <h3 className="font-bold text-white text-base font-space-grotesk">Step 2: Security Validation</h3>
                </div>

                <div className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  <label>How did you hear about us?</label>
                  <input
                    type="text"
                    required
                    value={verificationQuestions.source}
                    onChange={e => setVerificationQuestions({ ...verificationQuestions, source: e.target.value })}
                    placeholder="TikTok, Server Search, Friend recommendation..."
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950/60 border border-white/5 focus:border-[#00F0FF] focus:outline-none text-white text-sm font-medium transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  <label>Briefly describe invite strategy</label>
                  <textarea
                    required
                    rows={2}
                    value={verificationQuestions.method}
                    onChange={e => setVerificationQuestions({ ...verificationQuestions, method: e.target.value })}
                    placeholder="Where or how did you share code links?"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950/60 border border-white/5 focus:border-[#00F0FF] focus:outline-none text-white text-sm font-medium transition-colors resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  <label>
                    Anti-Bot Solve: {mathProblem.a} + {mathProblem.b}
                  </label>
                  <input
                    type="number"
                    required
                    value={verificationQuestions.antiBotAnswer}
                    onChange={e => setVerificationQuestions({ ...verificationQuestions, antiBotAnswer: e.target.value })}
                    placeholder="Solve addition"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950/60 border border-white/5 focus:border-[#00F0FF] focus:outline-none text-white text-sm font-medium transition-colors"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -30, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-5"
              >
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <FileText className="w-5 h-5 text-[#FF007A]" />
                  <h3 className="font-bold text-white text-base font-space-grotesk">Step 3: Confirm Policies</h3>
                </div>

                <p className="text-zinc-400 text-xs leading-relaxed bg-white/[0.01] p-4 rounded-xl border border-white/5">
                  Confirm all values are complete. Attempting to claim rewards with self-invites, fake accounts, or by exploiting invite tracker bots will result in immediate disqualification and a ban.
                </p>

                <div className="flex flex-col gap-3">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={e => setTermsAccepted(e.target.checked)}
                      className="mt-1 rounded border-zinc-700 bg-zinc-950 text-[#5865F2] focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs text-zinc-300 font-semibold leading-relaxed">
                      I agree that invite farming or fake alt accounts will result in immediate claim rejection and a potential server ban.
                    </span>
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          <div className="flex gap-4 border-t border-white/5 pt-6 mt-8">
            {step > 1 && (
              <button
                onClick={handleBack}
                disabled={submitting}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-zinc-300 hover:text-white font-bold text-sm transition-all duration-300 disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={handleNext}
                disabled={
                  (step === 1 && !validateStep1()) || 
                  (step === 2 && !validateStep2())
                }
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-sm btn-glow-blurple transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next Step
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!termsAccepted || submitting}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm transition-all duration-300 disabled:opacity-40"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting Responses...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Submit Survey
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

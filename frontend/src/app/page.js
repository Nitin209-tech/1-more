'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Gift, Zap, ShieldCheck, Users, Sparkles, Star, Bot } from 'lucide-react';

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 }
    }
  };

  const itemVariants = {
    hidden: { y: 40, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 90, damping: 15 }
    }
  };

  const rewardsPreview = [
    { name: 'Nitro Basic Monthly', cost: '3 Invites', desc: 'Custom emojis, badge profile & 50MB uploads.', badge: 'Popular', color: 'from-[#00F0FF]/20 to-[#9D00FF]/5', border: 'border-[#00F0FF]/30', textGlow: 'text-[#00F0FF]' },
    { name: 'Nitro Boost Monthly', cost: '6 Invites', desc: 'Ultimate chat perks, 1080p stream & 2 boosts.', badge: 'Premium', color: 'from-[#FF007A]/20 to-[#9D00FF]/5', border: 'border-[#FF007A]/30', textGlow: 'text-[#FF007A]' },
    { name: '3000 Robux Card', cost: '3 Invites', desc: 'Dispatched digital gift card pin for catalog items.', badge: 'Best Seller', color: 'from-[#5865F2]/20 to-zinc-950', border: 'border-[#5865F2]/30', textGlow: 'text-[#5865F2]' },
    { name: '6000 Robux Card', cost: '6 Invites', desc: 'Double value gift pin for builders and gamers.', badge: 'High Tier', color: 'from-amber-500/20 to-zinc-950', border: 'border-amber-500/30', textGlow: 'text-amber-400' }
  ];

  return (
    <>
      <Navbar />
      
      <main className="flex-1 w-full flex flex-col items-center py-20 px-6 relative overflow-hidden bg-[#05060A] cyber-grid">
        {/* Neon Backdrop Blobs */}
        <div className="glow-blob w-[500px] h-[500px] bg-[#5865F2] top-[-100px] left-[-100px]" />
        <div className="glow-blob w-[450px] h-[450px] bg-[#00F0FF] bottom-[10%] right-[-50px]" style={{ animationDelay: '-5s' }} />
        <div className="glow-blob w-[350px] h-[350px] bg-[#FF007A] top-[30%] right-[20%]" style={{ animationDelay: '-10s' }} />

        <div className="w-full max-w-6xl z-10 flex flex-col items-center">
          
          {/* Hero Header */}
          <motion.div 
            className="text-center max-w-3xl flex flex-col items-center gap-6 mb-20"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 text-[#00F0FF] text-xs font-semibold uppercase tracking-widest shadow-md">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-[#00F0FF]" />
              EXECUTIVE ECOSYSTEM v14
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none font-space-grotesk text-white">
              Unlock Premium Rewards <br />
              <span className="gradient-text-cyber drop-shadow-sm">
                By Inviting Friends
              </span>
            </h1>

            <p className="text-zinc-400 text-base md:text-lg max-w-2xl leading-relaxed mt-2">
              Connect your Discord, share invite codes, and claim monthly Nitro subscription bundles or digital Roblox pins. Automated security validation checks yield instant payouts.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 mt-6 w-full sm:w-auto">
              <Link
                href="/api/auth/login"
                className="flex justify-center items-center gap-2 px-8 py-4 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-sm btn-glow-blurple transition-all duration-300 hover:-translate-y-0.5"
              >
                <Bot className="w-5 h-5" />
                Connect with Discord
              </Link>
              <a
                href="#rewards-catalog"
                className="flex justify-center items-center px-8 py-4 rounded-xl glass-panel hover:bg-white/5 text-white font-bold text-sm border-white/10 transition-all duration-300 hover:border-[#00F0FF]/30"
              >
                Browse Catalog
              </a>
            </div>
          </motion.div>

          {/* Core Feature Grids */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-32"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants} className="glass-panel glass-panel-hover p-8 rounded-2xl flex flex-col gap-4 border border-white/5">
              <div className="w-12 h-12 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center text-[#00F0FF]">
                <Zap className="w-6 h-6 drop-shadow-[0_0_8px_#00F0FF]" />
              </div>
              <h3 className="text-lg font-bold text-white font-space-grotesk">10s Instant Verification</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Our bot computes inviter caches in under 10 seconds. Clicking Claim starts an interactive DM verification queue with visual progress metrics.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="glass-panel glass-panel-hover p-8 rounded-2xl flex flex-col gap-4 border border-white/5">
              <div className="w-12 h-12 rounded-xl bg-[#FF007A]/10 border border-[#FF007A]/20 flex items-center justify-center text-[#FF007A]">
                <ShieldCheck className="w-6 h-6 drop-shadow-[0_0_8px_#FF007A]" />
              </div>
              <h3 className="text-lg font-bold text-white font-space-grotesk">Alt & Abuse Interceptor</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Advanced join/leave filters, account age check thresholds, rejoin metrics, and duplicate claim protections guarantee fair distributions.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="glass-panel glass-panel-hover p-8 rounded-2xl flex flex-col gap-4 border border-white/5">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[#9D00FF]">
                <Users className="w-6 h-6 drop-shadow-[0_0_8px_#9D00FF]" />
              </div>
              <h3 className="text-lg font-bold text-white font-space-grotesk">Live Metrics Dashboard</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Track valid counts, leaves, alts, and bonus points on the web dashboard. Open private ticket channels to chat with moderators directly.
              </p>
            </motion.div>
          </motion.div>

          {/* Overhauled Rewards Section */}
          <div id="rewards-catalog" className="w-full mb-16 flex flex-col items-center">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-white font-space-grotesk">
                Claimable Reward Systems
              </h2>
              <p className="text-zinc-400 text-sm mt-2 max-w-sm">
                Gather invites to unlock Nitro and Robux items dynamically parsed from MongoDB.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
              {rewardsPreview.map((reward, index) => (
                <motion.div
                  key={index}
                  className={`glass-panel p-6 rounded-2xl flex flex-col justify-between gap-6 relative overflow-hidden group border ${reward.border} transition-all duration-300 hover:-translate-y-1 bg-gradient-to-b ${reward.color}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                >
                  {/* Decorative glowing lines */}
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-300 uppercase">
                        {reward.cost}
                      </span>
                      <span className={`text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 ${reward.textGlow}`}>
                        <Star className="w-3 h-3 fill-current" />
                        {reward.badge}
                      </span>
                    </div>
                    
                    <h4 className="text-xl font-extrabold text-white mt-4 font-space-grotesk">
                      {reward.name}
                    </h4>
                    <p className="text-zinc-400 text-xs leading-relaxed mt-1">
                      {reward.desc}
                    </p>
                  </div>

                  <Link
                    href="/api/auth/login"
                    className="w-full text-center py-3 rounded-xl bg-white/5 hover:bg-[#5865F2] border border-white/10 hover:border-[#5865F2] text-xs font-bold uppercase text-white tracking-wider transition-all duration-300 btn-glow-blurple"
                  >
                    Claim Reward
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

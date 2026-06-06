'use client';

import { useEffect, useState } from 'react';

/**
 * Maps notification type to a glow color and accent class.
 */
const TYPE_CONFIG = {
  CLAIM_APPROVED: {
    border: '#00ff88',
    glow: '0 0 20px rgba(0,255,136,0.45)',
    bg: 'rgba(0,255,136,0.07)',
    icon: '✦',
    iconColor: '#00ff88',
    label: 'Approved',
    labelBg: 'rgba(0,255,136,0.15)',
    labelColor: '#00ff88',
  },
  CLAIM_REJECTED: {
    border: '#ff4466',
    glow: '0 0 20px rgba(255,68,102,0.45)',
    bg: 'rgba(255,68,102,0.07)',
    icon: '✕',
    iconColor: '#ff4466',
    label: 'Rejected',
    labelBg: 'rgba(255,68,102,0.15)',
    labelColor: '#ff4466',
  },
  SURVEY_SUBMITTED: {
    border: '#a78bfa',
    glow: '0 0 20px rgba(167,139,250,0.45)',
    bg: 'rgba(167,139,250,0.07)',
    icon: '◈',
    iconColor: '#a78bfa',
    label: 'Processing',
    labelBg: 'rgba(167,139,250,0.15)',
    labelColor: '#a78bfa',
  },
  DEFAULT: {
    border: '#5865f2',
    glow: '0 0 20px rgba(88,101,242,0.45)',
    bg: 'rgba(88,101,242,0.07)',
    icon: '◆',
    iconColor: '#5865f2',
    label: 'Notice',
    labelBg: 'rgba(88,101,242,0.15)',
    labelColor: '#5865f2',
  },
};

const AUTO_DISMISS_MS = 7000;

export default function ToastNotification({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const config = TYPE_CONFIG[toast.type] || TYPE_CONFIG.DEFAULT;

  // Entry animation
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  // Auto-dismiss after timeout
  useEffect(() => {
    const t = setTimeout(() => handleDismiss(), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setLeaving(true);
    setTimeout(() => onDismiss(toast.id), 400);
  };

  // Convert markdown **bold** to <strong>
  const parseMessage = (msg) =>
    msg.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#fff">$1</strong>');

  return (
    <div
      onClick={handleDismiss}
      style={{
        position: 'relative',
        background: `linear-gradient(135deg, ${config.bg}, rgba(10,11,18,0.95))`,
        border: `1px solid ${config.border}`,
        boxShadow: `${config.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
        backdropFilter: 'blur(16px)',
        borderRadius: '12px',
        padding: '14px 16px',
        cursor: 'pointer',
        overflow: 'hidden',
        width: '340px',
        maxWidth: 'calc(100vw - 32px)',
        transform: visible && !leaving ? 'translateX(0) scale(1)' : 'translateX(110%) scale(0.9)',
        opacity: visible && !leaving ? 1 : 0,
        transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease',
      }}
    >
      {/* Scan-line shimmer */}
      <div style={{
        position: 'absolute',
        top: 0, left: '-100%',
        width: '60%', height: '100%',
        background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent)',
        animation: 'toast-scan 3s ease infinite',
        pointerEvents: 'none',
      }} />

      {/* Corner accent */}
      <div style={{
        position: 'absolute',
        top: 0, right: 0,
        width: '40px', height: '40px',
        background: `linear-gradient(225deg, ${config.border}30, transparent)`,
        borderBottomLeftRadius: '8px',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* Icon */}
        <div style={{
          width: '36px', height: '36px',
          borderRadius: '8px',
          border: `1px solid ${config.border}50`,
          background: config.labelBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          fontSize: '18px',
          color: config.iconColor,
          fontWeight: 'bold',
        }}>
          {config.icon}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              fontSize: '13px', fontWeight: '700',
              color: '#f0f0f0', letterSpacing: '0.3px',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {toast.title}
            </span>
            <span style={{
              fontSize: '10px', fontWeight: '600',
              background: config.labelBg,
              color: config.labelColor,
              border: `1px solid ${config.border}60`,
              padding: '1px 7px',
              borderRadius: '20px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}>
              {config.label}
            </span>
          </div>

          {/* Message */}
          <p
            style={{ fontSize: '12px', color: '#a0aec0', margin: 0, lineHeight: '1.5' }}
            dangerouslySetInnerHTML={{ __html: parseMessage(toast.message) }}
          />

          {/* Claim ID */}
          {toast.claimId && (
            <div style={{
              marginTop: '8px',
              fontSize: '10px',
              color: '#4a5568',
              fontFamily: 'monospace',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              <span style={{ color: config.iconColor, opacity: 0.7 }}>◈</span>
              Claim: {toast.claimId}
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#4a5568', fontSize: '14px', padding: '2px 4px',
            lineHeight: 1, flexShrink: 0,
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.target.style.color = '#fff'}
          onMouseLeave={e => e.target.style.color = '#4a5568'}
        >
          ×
        </button>
      </div>

      {/* Progress bar */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0,
        height: '2px',
        width: '100%',
        background: `linear-gradient(90deg, ${config.border}, ${config.border}40)`,
        animation: `toast-progress ${AUTO_DISMISS_MS}ms linear forwards`,
        transformOrigin: 'left',
      }} />
    </div>
  );
}

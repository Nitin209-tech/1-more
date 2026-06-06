'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const MAX_TOASTS = 5;
const RETRY_DELAY_MS = 5000;

/**
 * useNotifications
 *
 * Connects to the backend SSE stream via Next.js API proxy (/api/notifications/stream).
 * Manages a queue of animated toast notifications to display in the UI.
 *
 * Flow:
 *  1. On mount, read JWT from localStorage ('token' key).
 *  2. Open an EventSource to /api/notifications/stream?token=<jwt>.
 *  3. On "notification" events, push to the toasts queue (max 5).
 *  4. Auto-retry on connection failure (every 5 seconds).
 *  5. Clean up on unmount.
 */
export function useNotifications() {
  const [toasts, setToasts] = useState([]);
  const esRef = useRef(null);
  const retryRef = useRef(null);

  const addToast = useCallback((notification) => {
    setToasts(prev => {
      if (prev.find(t => t.id === notification.id)) return prev;
      return [notification, ...prev].slice(0, MAX_TOASTS);
    });
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    let mounted = true;

    const connect = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        // Not logged in — retry later in case user logs in on same tab
        retryRef.current = setTimeout(connect, RETRY_DELAY_MS);
        return;
      }

      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }

      // Use the Next.js proxy path to avoid CORS issues
      const url = `/api/notifications/stream?token=${encodeURIComponent(token)}`;
      const es = new EventSource(url);
      esRef.current = es;

      es.addEventListener('connected', (e) => {
        console.info('[Notifications] SSE stream connected ✓');
      });

      es.addEventListener('notification', (e) => {
        if (!mounted) return;
        try {
          const data = JSON.parse(e.data);
          addToast(data);
        } catch (err) {
          console.error('[Notifications] Failed to parse event:', err);
        }
      });

      es.onerror = () => {
        if (!mounted) return;
        console.warn('[Notifications] Stream error — reconnecting in 5s...');
        es.close();
        esRef.current = null;
        retryRef.current = setTimeout(connect, RETRY_DELAY_MS);
      };
    };

    connect();

    return () => {
      mounted = false;
      clearTimeout(retryRef.current);
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [addToast]);

  return { toasts, dismiss };
}

'use client';

import { useNotifications } from '@/hooks/useNotifications';
import ToastNotification from './ToastNotification';

/**
 * NotificationContainer - Mounts at the top of the layout.
 * Renders a fixed stack of real-time toast notifications in the
 * bottom-right corner of the screen.
 */
export default function NotificationContainer() {
  const { toasts, dismiss } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '12px',
        alignItems: 'flex-end',
        pointerEvents: 'none',
      }}
    >
      {toasts.map(toast => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <ToastNotification toast={toast} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  );
}

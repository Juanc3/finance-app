import { useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { isSameDay, addDays, parseISO } from 'date-fns';

export function useReminders() {
  const { transactions, currentUser } = useStore();

  useEffect(() => {
    if (!currentUser || transactions.length === 0) return;

    // Check permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    if (Notification.permission !== 'granted') return;

    const checkReminders = () => {
      const now = new Date();
      const tomorrow = addDays(now, 1);
      const lastRun = localStorage.getItem('last_reminder_check');

      // Prevent spamming: only run once every 4 hours or if it's been a while
      if (lastRun && new Date().getTime() - new Date(lastRun).getTime() < 4 * 60 * 60 * 1000) {
        return;
      }

      const upcoming = transactions.filter((t) => {
        if (t.status === 'paid') return false; // Ignore paid transactions

        const tDate = parseISO(t.date);
        // Check if it's today or tomorrow
        // And it's an expense or saving (income is usually good news, maybe notify too?)
        // Let's notify for all.
        const isToday = isSameDay(tDate, now);
        const isTomorrow = isSameDay(tDate, tomorrow);

        return isToday || isTomorrow;
      });

      if (upcoming.length > 0) {
        // Send a generic notification or specific ones
        const count = upcoming.length;
        const title = `📅 Tienes ${count} movimientos próximos`;
        const body = `Revisa tu calendario. Tienes ${upcoming
          .map((u) => u.description)
          .slice(0, 2)
          .join(', ')}${count > 2 ? '...' : ''} pendientes.`;

        new Notification(title, {
          body,
          icon: '/icon.png', // Optional
        });

        localStorage.setItem('last_reminder_check', new Date().toISOString());
      }
    };

    // Run check on mount
    checkReminders();

    // Setup interval (e.g., check every hour)
    const interval = setInterval(checkReminders, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [transactions, currentUser]);
}

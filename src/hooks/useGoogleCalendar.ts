import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';

export type GoogleEvent = {
  id: string;
  summary: string;
  start: { date?: string; dateTime?: string };
  end: { date?: string; dateTime?: string };
  htmlLink: string;
};

export function useGoogleCalendar(currentMonth: Date) {
  const { session } = useAuth();
  const [events, setEvents] = useState<GoogleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      if (!session) {
        return;
      }

      if (!session.provider_token) {
        console.warn('No provider token found in session. User might need to re-login with Google.');
        setEvents([]);
        return;
      }

      setLoading(true);
      setError(null);

      // Widen the range to cover the 6-week grid view (which often includes days from prev/next months)
      const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0, 23, 59, 59);

      try {
        const queryParams = new URLSearchParams({
          timeMin: start.toISOString(),
          timeMax: end.toISOString(),
          singleEvents: 'true',
          orderBy: 'startTime',
        });

        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?${queryParams.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${session.provider_token}`,
            },
          },
        );

        if (!response.ok) {
          console.error('Google Calendar API Error:', response.status, response.statusText);
          const errorBody = await response.text();
          console.error('Error Body:', errorBody);

          if (response.status === 401) {
            console.warn('Token expired or invalid');
          }
          throw new Error(`Failed to fetch events: ${response.status}`);
        }

        const data = await response.json();
        setEvents(data.items || []);
      } catch (err: any) {
        console.error('Error fetching Google Calendar:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [session?.provider_token, currentMonth]);

  return { events, loading, error };
}

import { Transaction } from '@/context/StoreContext';

export async function createGoogleEvent(provider_token: string, transaction: Omit<Transaction, 'id'>) {
  if (!provider_token) {
    console.error('No provider token found');
    return;
  }

  const startDateTime = new Date(transaction.date);
  // Default to 1 hour duration
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

  const eventBody: any = {
    summary: `${transaction.description} | $${transaction.amount} (${transaction.category})`,
    description: `Información cargada vía LumaFlux`,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    colorId: transaction.type === 'saving' ? '9' : transaction.type === 'income' ? '10' : '11', // 9=Blue, 10=Green, 11=Red
  };

  if (transaction.isRecurring) {
    // RRULE for Monthly on the same day
    eventBody.recurrence = ['RRULE:FREQ=MONTHLY'];
  }

  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${provider_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Calendar API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to create Google Event:', error);
    throw error;
  }
}

export async function updateGoogleEvent(provider_token: string, eventId: string, transaction: Omit<Transaction, 'id'>) {
  if (!provider_token) return;

  const startDateTime = new Date(transaction.date);
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

  const eventBody: any = {
    summary: `${transaction.description} | $${transaction.amount} (${transaction.category})`,
    description: `Información cargada vía LumaFlux`,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    colorId: transaction.type === 'saving' ? '9' : transaction.type === 'income' ? '10' : '11',
  };

  if (transaction.isRecurring) {
    eventBody.recurrence = ['RRULE:FREQ=MONTHLY'];
  } else {
    eventBody.recurrence = []; // Clear recurrence if disabled
  }

  try {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${provider_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventBody),
    });

    if (!response.ok) {
      console.error(`Failed to update Google Event: ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to update Google Event:', error);
  }
}

export async function deleteGoogleEvent(provider_token: string, eventId: string) {
  if (!provider_token) return;

  try {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${provider_token}`,
      },
    });

    if (!response.ok && response.status !== 410) {
      // 410 means already deleted
      console.error(`Failed to delete Google Event: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting Google Event:', error);
  }
}

import { Transaction } from "@/context/StoreContext";

export async function createGoogleEvent(provider_token: string, transaction: Omit<Transaction, "id">) {
  if (!provider_token) {
    console.error("No provider token found");
    return;
  }

  const startDateTime = new Date(transaction.date);
  // Default to 1 hour duration
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

  const eventBody: any = {
    summary: transaction.description,
    description: `Category: ${transaction.category} | Amount: $${transaction.amount}`,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    colorId: transaction.type === "expense" ? "11" : "10", // 11=Red, 10=Green (approx)
  };

  if (transaction.isRecurring) {
    // RRULE for Monthly on the same day
    eventBody.recurrence = ["RRULE:FREQ=MONTHLY"];
  }

  try {
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${provider_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Calendar API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Google Event Created:", data);
    return data;
  } catch (error) {
    console.error("Failed to create Google Event:", error);
    throw error;
  }
}

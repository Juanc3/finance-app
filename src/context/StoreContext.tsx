/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";

export type User = {
  id: string;
  name: string;
  color: string; // Tailwind class
  hexColor: string; // Hex for charts
  groupId?: string;
};

export type Transaction = {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string; // ISO string
  paidBy: string; // User ID
  isShared: boolean; // If true, splits 50/50 (for simplicity initially)
  isRecurring?: boolean; // If true, repeats monthly
  currency: string;
  type: 'income' | 'expense' | 'saving';
  groupId?: string;
  status?: 'pending' | 'paid'; // New field
  google_event_id?: string; // New field for sync
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export type StoreContextType = {
  users: User[];
  currentUser: User | null;
  switchUser: (userId: string) => void;
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, "id"> & { syncToGoogle?: boolean }) => void;
  editTransaction: (id: string, transaction: Partial<Omit<Transaction, "id">>) => void;
  deleteTransaction: (id: string) => void;
  markAsPaid: (id: string) => void;
  getFormattedCurrency: (amount: number, currency?: string) => string;
  categories: Category[];
  addCategory: (category: Omit<Category, "id">) => void;
  editCategory: (id: string, updates: Partial<Omit<Category, "id">>) => void;
  deleteCategory: (id: string) => void;
  updateGroup: (newGroupId: string) => Promise<void>;
  loading: boolean;
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    if (!session?.user) return;

    const fetchData = async () => {
      setLoading(true);
      
      // 1. Fetch Current User's Group
      const { data: myProfile, error: myProfileError } = await supabase
        .from("profiles")
        .select("group_id")
        .eq("id", session.user.id)
        .single();
        
      if (myProfileError && myProfileError.code !== 'PGRST116') {
          console.error("Error fetching my profile group:", myProfileError);
      }
        
      const myGroupId = myProfile?.group_id;

      // 2. Fetch Users (Profiles) - Filter by Group
      let profilesQuery = supabase.from("profiles").select("*");
      
      if (myGroupId) {
        profilesQuery = profilesQuery.eq("group_id", myGroupId);
      } else {
        profilesQuery = profilesQuery.eq("id", session.user.id);
      }

      const { data: profiles, error: profilesError } = await profilesQuery;
      
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      } else {
        const mappedUsers = profiles.map((p: any) => ({
          id: p.id,
          name: p.name,
          color: p.color,
          hexColor: p.hex_color,
          groupId: p.group_id,
        }));
        setUsers(mappedUsers);
        
        const me = mappedUsers.find((u: any) => u.id === session.user.id);
        setCurrentUser(me || mappedUsers[0]);
      }

      // 3. Fetch Transactions
      // We want: (group_id == myGroupId) OR (group_id IS NULL AND paid_by == me)
      let txQuery = supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });
        
      if (myGroupId) {
        // Syntax for OR in Supabase: .or(`group_id.eq.${myGroupId},and(group_id.is.null,paid_by.eq.${session.user.id})`)
        txQuery = txQuery.or(`group_id.eq.${myGroupId},and(group_id.is.null,paid_by.eq.${session.user.id})`);
      } else {
        txQuery = txQuery.eq("paid_by", session.user.id); 
      }

      const { data: txs, error: txsError } = await txQuery;

      if (txsError) {
          console.error("Error fetching transactions:", JSON.stringify(txsError, null, 2));
      } else {
        const mappedTxs = txs.map((t: any) => ({
          id: t.id,
          amount: t.amount,
          description: t.description,
          category: t.category,
          date: t.date,
          paidBy: t.paid_by,
          isShared: t.is_shared,
          isRecurring: t.is_recurring,
          currency: t.currency || "USD",
          type: t.type || 'expense',
          groupId: t.group_id,
          status: t.status || 'pending', // Map status
          google_event_id: t.google_event_id, // Map google ID
        }));
        setTransactions(mappedTxs);
      }

      // 3. Fetch Categories
      // STRICT: Only fetch my group's categories
      let catsQuery = supabase
        .from("categories")
        .select("*")
        .order("name");
        
      if (myGroupId) {
         catsQuery = catsQuery.eq("group_id", myGroupId);
      } else {
         // Should not happen really if everyone has a group, but fallback to empty or specific user
         // Use a nil UUID to avoid syntax error, effectively returning nothing
         catsQuery = catsQuery.eq("id", "00000000-0000-0000-0000-000000000000"); 
      }

      const { data: cats, error: catsError } = await catsQuery;

      if (catsError) {
        console.error("Error fetching categories:", catsError);
      } else if (!cats || cats.length === 0) {
        // Optimization: If no categories exist for this group, seed defaults!
        // This handles "New Group" creation nicely.
        if (myGroupId) {
             const defaultCats = [
                { name: "Comida", icon: "Alimentación", color: "bg-orange-500", group_id: myGroupId },
                { name: "Casa", icon: "Casa", color: "bg-blue-500", group_id: myGroupId },
                { name: "Servicios", icon: "Servicios", color: "bg-yellow-500", group_id: myGroupId },
                { name: "Entretenimiento", icon: "Entretenimiento", color: "bg-purple-500", group_id: myGroupId },
                { name: "Transporte", icon: "Transporte", color: "bg-red-500", group_id: myGroupId },
                { name: "Compras", icon: "Compras", color: "bg-pink-500", group_id: myGroupId },
                { name: "Viajes", icon: "Viajes", color: "bg-sky-500", group_id: myGroupId },
                { name: "Salud", icon: "Salud", color: "bg-emerald-500", group_id: myGroupId },
             ];
             
             // Insert into DB
             const { data: newCats } = await supabase.from("categories").insert(defaultCats).select();
             
             if (newCats) {
                 const mappedCats = newCats.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    icon: c.icon,
                    color: c.color,
                  }));
                  setCategories(mappedCats);
             }
        }
      } else {
        setCategories(cats);
      }

      setLoading(false);
    };

    fetchData();

    // Real-time Subscription
    const channel = supabase
      .channel("db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => fetchData()
      )
      .on(
        "postgres_changes", 
        { event: "*", schema: "public", table: "profiles" },
        () => fetchData()
      )
      .on(
        "postgres_changes", 
        { event: "*", schema: "public", table: "categories" },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const updateGroup = async (newGroupId: string) => {
    if (!session?.user) return;
    
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({ group_id: newGroupId })
      .eq("id", session.user.id);
      
    if (error) {
      console.error("Error updating group:", error);
    } else {
        // Refresh page/data effectively by triggering effect or calling fetchData if it was extracted
        // But since useEffect depends on session, we can just reload window or refetch. 
        // For better UX, let's just create a fetchData function outside/useCallback or reload.
        // Easiest is to reload to ensure clean state or refetch manually.
        window.location.reload();
    }
  };

  const switchUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) setCurrentUser(user);
  };

  // Extended transaction type for internal use (includes sync flag)
  type TransactionInput = Omit<Transaction, "id"> & { syncToGoogle?: boolean };

  const addTransaction = async (t: TransactionInput) => {
    // Optimistic update
    const tempId = uuidv4();
    const newTx = { ...t, id: tempId };
    delete (newTx as any).syncToGoogle; // Remove flag before saving to state/db

    setTransactions((prev) => [newTx, ...prev]);

    // Get current group
    const myUser = users.find(u => u.id === session?.user?.id);
    const myGroupId = myUser?.groupId;

    // IMPORTANT: If explicit 'isShared' is false (meaning Individual), force group_id to null.
    // If it is true (or undefined), use the user's group.
    
    // Note: t.isShared comes from the form. 
    // If t.isShared is true -> Group Transaction -> group_id = myGroupId
    // If t.isShared is false -> Individual Transaction -> group_id = null
    const targetGroupId = t.isShared ? myGroupId : null;

    const { data: insertedData, error } = await supabase.from("transactions").insert({
      amount: t.amount,
      description: t.description,
      category: t.category,
      paid_by: t.paidBy,
      date: t.date,
      is_shared: t.isShared,
      is_recurring: t.isRecurring,
      currency: t.currency,
      type: t.type,
      group_id: targetGroupId || null,
    }).select().single();

    if (error) {
      console.error("Error adding transaction:", error);
      // Revert optimistic update
      setTransactions((prev) => prev.filter((x) => x.id !== tempId));
    } else {
        // Sync to Google Calendar if requested        
        if (t.syncToGoogle && session?.provider_token) {
            import("@/lib/googleCalendar").then(async ({ createGoogleEvent }) => {
                const event = await createGoogleEvent(session.provider_token!, t)
                    .catch(err => console.error("❌ Failed to sync to Google:", err));
                
                // If created successfully, save the Google Event ID
                if (event && event.id && insertedData) {
                    await supabase.from("transactions")
                        .update({ google_event_id: event.id })
                        .eq("id", insertedData.id);

                    // Update local state immediately to show badge
                    setTransactions((prev) => 
                        prev.map((tx) => 
                            // Update both the tempId version (if still there) or the real ID version
                           (tx.id === tempId || tx.id === insertedData.id) 
                                ? { ...tx, google_event_id: event.id, id: insertedData.id } // Ensure ID is real too
                                : tx
                        )
                    );
                }
            });
        } else if (t.syncToGoogle && !session?.provider_token) {
            // OFFLINE SYNC: Mark as pending
             console.log("⚠️ Offline Sync requested. Marking as PENDING_SYNC.");
             
             if (insertedData) {
                 await supabase.from("transactions")
                    .update({ google_event_id: 'PENDING_SYNC' })
                    .eq("id", insertedData.id);
                 
                  setTransactions((prev) => 
                        prev.map((tx) => 
                           (tx.id === tempId || tx.id === insertedData.id) 
                                ? { ...tx, google_event_id: 'PENDING_SYNC', id: insertedData.id }
                                : tx
                        )
                    );
             }
        }
    }
  };

  // 4. Auto-Process Pending Syncs when Token becomes available
  useEffect(() => {
    if (!session?.provider_token || loading) return;

    const processPendingSyncs = async () => {
        // Find transactions waiting for sync
        const pendingTxs = transactions.filter(t => t.google_event_id === 'PENDING_SYNC');

        if (pendingTxs.length === 0) return;

        console.log(`🔄 Found ${pendingTxs.length} pending transactions to sync with Google...`);

        const { createGoogleEvent } = await import("@/lib/googleCalendar");
        
        for (const tx of pendingTxs) {
            try {
                const event = await createGoogleEvent(session.provider_token!, tx);
                 if (event && event.id) {
                     // Update DB
                     await supabase.from("transactions")
                        .update({ google_event_id: event.id })
                        .eq("id", tx.id);
                     
                     // Update Local State
                     setTransactions(prev => prev.map(t => t.id === tx.id ? { ...t, google_event_id: event.id } : t));
                 }
            } catch (err) {
                console.error(`❌ Failed to auto-sync transaction ${tx.id}:`, err);
            }
        }
    };

    processPendingSyncs();
  }, [session?.provider_token, loading, transactions.length]); // Dependency on transactions.length to retry if list grows/changes, but careful with loops.

    // 5. Auto-Fix Past Transactions (One-time check on load)
    useEffect(() => {
        if (loading || transactions.length === 0) return;

        const fixPastTransactions = async () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const pastPending = transactions.filter(t => {
                const tDate = new Date(t.date);
                // If date is before today AND status is not paid (i.e. pending or undefined)
                return tDate < today && t.status !== 'paid';
            });

            if (pastPending.length === 0) return;

            // Update local state immediately
            setTransactions(prev => prev.map(t => {
                const tDate = new Date(t.date);
                if (tDate < today && t.status !== 'paid') {
                    return { ...t, status: 'paid' };
                }
                return t;
            }));

            // Batch update in DB (or loop if batch not supported easily, simple loop is fine for now)
            for (const tx of pastPending) {
                 await supabase.from("transactions")
                    .update({ status: 'paid' })
                    .eq("id", tx.id);
            }
        };

        fixPastTransactions();
    }, [loading, transactions.length]); // Run when loaded

  const markAsPaid = async (id: string) => {
      // Optimistic update
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: 'paid' } : t));

      const { error } = await supabase
          .from("transactions")
          .update({ status: 'paid' })
          .eq("id", id);
      
      if (error) {
          console.error("Error marking as paid:", error);
          // Revert
          setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: 'pending' } : t));
      }
  };

  const editTransaction = async (id: string, updates: Partial<Omit<Transaction, "id"> & { syncToGoogle?: boolean }>) => {
    // Determine sync behavior logic BEFORE optimistic updates
    const existingTx = transactions.find(t => t.id === id);
    const syncToGoogle = updates.syncToGoogle;
    // Strip syncToGoogle from updates object for DB
    const { syncToGoogle: _, ...dbUpdates } = updates;

    // Optimistic
    const prevTxs = [...transactions];
    setTransactions((prev) => 
      prev.map((t) => (t.id === id ? { ...t, ...dbUpdates } : t))
    );

    const { error } = await supabase
      .from("transactions")
      .update({
        amount: dbUpdates.amount,
        description: dbUpdates.description,
        category: dbUpdates.category,
        paid_by: dbUpdates.paidBy,
        date: dbUpdates.date,
        is_shared: dbUpdates.isShared,
        is_recurring: dbUpdates.isRecurring,
        currency: dbUpdates.currency,
        type: dbUpdates.type,
        google_event_id: dbUpdates.google_event_id,
      })
      .eq("id", id);

    if (error) {
      console.error("Error editing transaction:", error);
      setTransactions(prevTxs);
    } else {
        // Handle Google Sync
        if (session?.provider_token && existingTx) {
            import("@/lib/googleCalendar").then(async ({ createGoogleEvent, updateGoogleEvent }) => {
                
                // Case 1: Already has ID -> Update it
                if (existingTx.google_event_id) {
                     // MERGE updates with existing data to ensure full object
                     const fullTxData = { ...existingTx, ...dbUpdates };
                     await updateGoogleEvent(session.provider_token!, existingTx.google_event_id, fullTxData);
                } 
                // Case 2: No ID, but Sync toggled ON -> Create it
                else if (syncToGoogle) {
                    const fullTxData = { ...existingTx, ...dbUpdates };
                    
                    // Check token again just in case (though we checked outside)
                    // Actually, the outside check `if (session?.provider_token && existingTx)` prevents us from reaching here if no token!
                    // We need to move the logic or change the condition.
                    // Wait, existing structure is: 
                    // if (session?.provider_token && existingTx) { ... } 
                    
                    // We need to handle the NO TOKEN case for edit too. 
                    // See below.
                     const event = await createGoogleEvent(session.provider_token!, fullTxData);
                     
                     if (event && event.id) {
                        await supabase.from("transactions")
                            .update({ google_event_id: event.id })
                            .eq("id", id);
                        
                        // Update local state immediately
                        setTransactions((prev) => 
                            prev.map((tx) => 
                                tx.id === id ? { ...tx, google_event_id: event.id } : tx
                            )
                        );
                     }
                }
            });
        } else if (!session?.provider_token && existingTx && syncToGoogle && !existingTx.google_event_id) {
             // Case 3: Offline Sync Request on Edit
             console.log("⚠️ Offline Sync requested on Edit. Marking as PENDING_SYNC.");
             
             await supabase.from("transactions")
                .update({ google_event_id: 'PENDING_SYNC' })
                .eq("id", id);
             
             setTransactions((prev) => 
                prev.map((tx) => 
                    tx.id === id ? { ...tx, google_event_id: 'PENDING_SYNC' } : tx
                )
             );
        }
    }
  };

  const deleteTransaction = async (id: string) => {
    const existingTx = transactions.find(t => t.id === id);

    // Optimistic
    const prevTxs = [...transactions];
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    const { error } = await supabase.from("transactions").delete().eq("id", id);

    if (error) {
      console.error("Error deleting transaction:", error);
      setTransactions(prevTxs);
    } else {
        // Delete from Google Calendar if linked
        if (existingTx?.google_event_id && session?.provider_token) {
            import("@/lib/googleCalendar").then(({ deleteGoogleEvent }) => {
                deleteGoogleEvent(session.provider_token!, existingTx.google_event_id!)
                    .catch(err => console.error("Failed to delete Google Event", err));
            });
        }
    }
  };

  const addCategory = async (c: Omit<Category, "id">) => {
    // Optimistic
    const tempId = uuidv4();
    const newCat = { ...c, id: tempId };
    setCategories((prev) => [...prev, newCat]);

    // Find my group ID from users list (since currentUser might be switched)
    const myUser = users.find(u => u.id === session?.user?.id);
    const myGroupId = myUser?.groupId;

    const { error } = await supabase.from("categories").insert({
      name: c.name,
      icon: c.icon,
      color: c.color,
      group_id: myGroupId || null,
    });

    if (error) {
      console.error("Error adding category:", error);
      setCategories((prev) => prev.filter((cat) => cat.id !== tempId));
    }
  };

  const editCategory = async (id: string, updates: Partial<Omit<Category, "id">>) => {
    // Optimistic
    const prevCats = [...categories];
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );

    const { error } = await supabase
      .from("categories")
      .update({
        name: updates.name,
        icon: updates.icon,
        color: updates.color,
      })
      .eq("id", id);
      
    if (error) {
      console.error("Error editing category:", error);
      setCategories(prevCats);
    }
  };

  const deleteCategory = async (id: string) => {
    // Optimistic
    const prevCats = [...categories];
    setCategories((prev) => prev.filter((c) => c.id !== id));

    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      console.error("Error deleting category:", error);
      setCategories(prevCats);
    }
  };

  const getFormattedCurrency = (amount: number, currency: string = "ARS") => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  return (
    <StoreContext.Provider
      value={{
        users,
        currentUser,
        switchUser,
        transactions,
        addTransaction,
        editTransaction,
        deleteTransaction,
        markAsPaid,
        getFormattedCurrency,
        categories,
        addCategory,
        editCategory,
        deleteCategory,
        updateGroup,
        loading,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}

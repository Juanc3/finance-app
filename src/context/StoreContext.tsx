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
  markAsPaid: (id: string) => void; // New function
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
  }, [session]);

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

    const { error } = await supabase.from("transactions").insert({
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
    });

    if (error) {
      console.error("Error adding transaction:", error);
      // Revert optimistic update
      setTransactions((prev) => prev.filter((x) => x.id !== tempId));
    } else {
        // Sync to Google Calendar if requested
        console.log("Transaction added. Sync to Google?", t.syncToGoogle);
        console.log("Provider Token Present?", !!session?.provider_token);
        
        if (t.syncToGoogle && session?.provider_token) {
            console.log("Attempting to sync with Google Calendar...");
            import("@/lib/googleCalendar").then(({ createGoogleEvent }) => {
                createGoogleEvent(session.provider_token!, t)
                    .then((data) => console.log("✅ Synced to Google Calendar:", data))
                    .catch(err => console.error("❌ Failed to sync to Google:", err));
            });
        } else if (t.syncToGoogle && !session?.provider_token) {
            console.warn("⚠️ Sync requested but no Google Token found. Please re-login.");
        }
    }
  };

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

  const editTransaction = async (id: string, updates: Partial<Omit<Transaction, "id">>) => {
    // Optimistic
    const prevTxs = [...transactions];
    setTransactions((prev) => 
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );

    const { error } = await supabase
      .from("transactions")
      .update({
        amount: updates.amount,
        description: updates.description,
        category: updates.category,
        paid_by: updates.paidBy,
        date: updates.date,
        is_shared: updates.isShared,
        is_recurring: updates.isRecurring,
        currency: updates.currency,
        type: updates.type,
      })
      .eq("id", id);

    if (error) {
      console.error("Error editing transaction:", error);
      setTransactions(prevTxs);
    }
  };

  const deleteTransaction = async (id: string) => {
    // Optimistic
    const prevTxs = [...transactions];
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    const { error } = await supabase.from("transactions").delete().eq("id", id);

    if (error) {
      console.error("Error deleting transaction:", error);
      setTransactions(prevTxs);
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

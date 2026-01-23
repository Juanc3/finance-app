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
  currency: string;
  type: 'income' | 'expense' | 'saving';
  groupId?: string;
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
  addTransaction: (transaction: Omit<Transaction, "id">) => void;
  editTransaction: (id: string, transaction: Partial<Omit<Transaction, "id">>) => void;
  deleteTransaction: (id: string) => void;
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
        
      if (myProfileError && myProfileError.code !== 'PGRST116') { // PGRST116 is "Row not found" (no profile yet), which is fine
          console.error("Error fetching my profile group:", myProfileError);
      }
        
      const myGroupId = myProfile?.group_id;

      // 2. Fetch Users (Profiles) - Filter by Group
      let profilesQuery = supabase.from("profiles").select("*");
      
      if (myGroupId) {
        profilesQuery = profilesQuery.eq("group_id", myGroupId);
      } else {
        // Fallback: If no group, only show self
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
        
        // Set current user logic
        const me = mappedUsers.find((u: any) => u.id === session.user.id);
        setCurrentUser(me || mappedUsers[0]);
      }

      // 3. Fetch Transactions - Filter by Group ID (Strict)
      let txQuery = supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });
        
      if (myGroupId) {
        txQuery = txQuery.eq("group_id", myGroupId);
      } else {
        // Fallback
        txQuery = txQuery.eq("paid_by", "none"); 
      }

      const { data: txs, error: txsError } = await txQuery;

      if (txsError) {
          // Ignore lint disable here, it's fine for debugging
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
          currency: t.currency || "USD",
          type: t.type || 'expense',
          groupId: t.group_id,
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
         catsQuery = catsQuery.eq("id", "none"); 
      }

      const { data: cats, error: catsError } = await catsQuery;

      if (catsError) {
        console.error("Error fetching categories:", catsError);
      } else if (!cats || cats.length === 0) {
        // Optimization: If no categories exist for this group, seed defaults!
        // This handles "New Group" creation nicely.
        if (myGroupId) {
             const defaultCats = [
                { name: "Comida", icon: "🍔", color: "bg-orange-500", group_id: myGroupId },
                { name: "Casa", icon: "🏠", color: "bg-blue-500", group_id: myGroupId },
                { name: "Servicios", icon: "💡", color: "bg-yellow-500", group_id: myGroupId },
                { name: "Entretenimiento", icon: "🎬", color: "bg-purple-500", group_id: myGroupId },
                { name: "Transporte", icon: "🚗", color: "bg-red-500", group_id: myGroupId },
                { name: "Compras", icon: "🛍️", color: "bg-pink-500", group_id: myGroupId },
                { name: "Viajes", icon: "✈️", color: "bg-sky-500", group_id: myGroupId },
                { name: "Otros", icon: "📝", color: "bg-gray-500", group_id: myGroupId },
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

  const addTransaction = async (t: Omit<Transaction, "id">) => {
    // Optimistic update
    const tempId = uuidv4();
    const newTx = { ...t, id: tempId };
    setTransactions((prev) => [newTx, ...prev]);

    // Get current group
    const myUser = users.find(u => u.id === session?.user?.id);
    const myGroupId = myUser?.groupId;

    const { error } = await supabase.from("transactions").insert({
      amount: t.amount,
      description: t.description,
      category: t.category,
      paid_by: t.paidBy,
      date: t.date,
      is_shared: t.isShared,
      currency: t.currency,
      type: t.type,
      group_id: myGroupId || null,
    });

    if (error) {
      console.error("Error adding transaction:", error);
      // Revert optimistic update
      setTransactions((prev) => prev.filter((x) => x.id !== tempId));
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

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
  deleteCategory: (id: string) => void;
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
      
      // 1. Fetch Users (Profiles)
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");
      
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      } else {
        const mappedUsers = profiles.map((p: any) => ({
          id: p.id,
          name: p.name,
          color: p.color,
          hexColor: p.hex_color,
        }));
        setUsers(mappedUsers);
        
        // Set current user logic
        const me = mappedUsers.find((u: any) => u.id === session.user.id);
        setCurrentUser(me || mappedUsers[0]);
      }

      // 2. Fetch Transactions
      const { data: txs, error: txsError } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (txsError) {
        console.error("Error fetching transactions:", txsError);
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
        }));
        setTransactions(mappedTxs);
      }

      // 3. Fetch Categories
      const { data: cats, error: catsError } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (catsError) {
        // Fallback to defaults if table missing
        // Fallback to defaults if table missing
        setCategories([
          { id: "1", name: "Comida", icon: "🍔", color: "bg-orange-500" },
          { id: "2", name: "Casa", icon: "🏠", color: "bg-blue-500" },
          { id: "3", name: "Servicios", icon: "💡", color: "bg-yellow-500" },
          { id: "4", name: "Entretenimiento", icon: "🎬", color: "bg-purple-500" },
          { id: "5", name: "Transporte", icon: "🚗", color: "bg-red-500" },
          { id: "6", name: "Compras", icon: "🛍️", color: "bg-pink-500" },
          { id: "7", name: "Viajes", icon: "✈️", color: "bg-sky-500" },
          { id: "8", name: "Otros", icon: "📝", color: "bg-gray-500" },
        ]);
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

  const switchUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) setCurrentUser(user);
  };

  const addTransaction = async (t: Omit<Transaction, "id">) => {
    // Optimistic update
    const tempId = uuidv4();
    const newTx = { ...t, id: tempId };
    setTransactions((prev) => [newTx, ...prev]);

    const { error } = await supabase.from("transactions").insert({
      amount: t.amount,
      description: t.description,
      category: t.category,
      paid_by: t.paidBy,
      date: t.date,
      is_shared: t.isShared,
      currency: t.currency,
      type: t.type,
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

    const { error } = await supabase.from("categories").insert({
      name: c.name,
      icon: c.icon,
      color: c.color,
    });

    if (error) {
      console.error("Error adding category:", error);
      setCategories((prev) => prev.filter((cat) => cat.id !== tempId));
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
        deleteCategory,
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

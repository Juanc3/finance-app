"use client";

import { useStore } from "@/context/StoreContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Trash2, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Simple emoji picker list
const ICONS = ["🍔", "🏠", "💡", "🎬", "🚗", "🛍️", "✈️", "📝", "🏋️", "🏥", "📚", "🎮", "🍷", "🎁", "👶", "🐶"];
const COLORS = [
  "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500", "bg-lime-500", 
  "bg-green-500", "bg-emerald-500", "bg-teal-500", "bg-cyan-500", "bg-sky-500", 
  "bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-purple-500", "bg-fuchsia-500", 
  "bg-pink-500", "bg-rose-500", "bg-slate-500"
];

export default function CategoriesPage() {
  const { categories, addCategory, deleteCategory } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState(ICONS[0]);
  const [newCatColor, setNewCatColor] = useState(COLORS[0]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;

    addCategory({
      name: newCatName,
      icon: newCatIcon,
      color: newCatColor,
    });

    setNewCatName("");
    setIsAdding(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
           <Link href="/" className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-2">
             <ArrowLeft className="h-4 w-4" /> Back to Dashboard
           </Link>
          <h1 className="text-3xl font-bold text-white">Categories</h1>
          <p className="text-slate-400">Manage your expense categories</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Category
          </Button>
        )}
      </div>

      {isAdding && (
        <GlassCard className="p-6 border-violet-500/30">
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="glass-input w-full rounded-lg px-4 py-2"
                placeholder="e.g. Gym"
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Icon</label>
              <div className="flex flex-wrap gap-2">
                {ICONS.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setNewCatIcon(icon)}
                    className={cn(
                      "h-10 w-10 flex items-center justify-center rounded-lg text-xl hover:bg-slate-800 transition-colors",
                      newCatIcon === icon ? "bg-slate-800 ring-2 ring-violet-500" : "bg-slate-900/50"
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewCatColor(color)}
                    className={cn(
                      "h-8 w-8 rounded-full hover:scale-110 transition-transform",
                      color,
                      newCatColor === color ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900" : ""
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit">Save Category</Button>
              <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </form>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <GlassCard key={cat.id} className="p-4 flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className={cn("h-10 w-10 flex items-center justify-center rounded-lg text-lg", cat.color)}>
                {cat.icon}
              </div>
              <span className="font-medium text-white">{cat.name}</span>
            </div>
            <button
               // Prevent deleting if it's a default one without ID? StoreContext assigns ID.
               // Assuming user can delete anything. formatting might break if transactions need it.
               onClick={() => {
                 if(confirm(`Delete category "${cat.name}"?`)) deleteCategory(cat.id);
               }}
               className="p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

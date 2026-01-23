"use client";

import { useStore, Category } from "@/context/StoreContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { CategoryFormModal } from "@/components/features/CategoryFormModal";
import { useToast } from "@/context/ToastContext";
import { Trash2, Plus, ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function CategoriesPage() {
  const { categories, addCategory, editCategory, deleteCategory } = useStore();
  const { toast } = useToast();
  
  // State for Add/Edit Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<{name: string, icon: string, color: string} | null>(null);

  // State for Confirm Modal
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAddNew = () => {
    setInitialData(null);
    setEditingId(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (cat: Category) => {
    setInitialData({ name: cat.name, icon: cat.icon, color: cat.color });
    setEditingId(cat.id);
    setIsFormOpen(true);
  };

  const handleSubmit = (data: { name: string, icon: string, color: string }) => {
    if (editingId) {
        editCategory(editingId, data);
        toast({ title: "Categoría actualizada", message: `Se ha modificado "${data.name}" correctamente.` });
    } else {
        addCategory(data);
        toast({ title: "Categoría creada", message: `Se ha creado "${data.name}" correctamente.` });
    }
    setIsFormOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
        deleteCategory(deleteId);
        setDeleteId(null);
        toast({ type: "error", title: "Categoría eliminada", message: "La categoría ha sido eliminada." });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 lg:pb-0">
        
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
           <Link href="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
             <ArrowLeft className="h-4 w-4" /> Volver al Panel
           </Link>
          <h1 className="text-3xl font-bold text-foreground">Categorías</h1>
          <p className="text-muted-foreground">Administra tus categorías de gastos</p>
        </div>
        <Button onClick={handleAddNew} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-violet-900/20">
            <Plus className="h-4 w-4" /> Nueva Categoría
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <GlassCard key={cat.id} className="p-4 flex items-center justify-between group hover:border-border/80 transition-colors">
            <div className="flex items-center gap-4">
              <div className={cn("h-12 w-12 flex items-center justify-center rounded-xl text-2xl shadow-lg text-white", cat.color)}>
                {cat.icon}
              </div>
              <span className="font-bold text-foreground text-lg">{cat.name}</span>
            </div>
            
            <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                   onClick={() => handleEditClick(cat)}
                   className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                   onClick={() => setDeleteId(cat.id)}
                   className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Form Modal */}
      <CategoryFormModal 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        initialData={initialData}
        title={editingId ? "Editar Categoría" : "Nueva Categoría"}
      />

      {/* Confirmation Modal */}
      <ConfirmModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar categoría?"
        description="Esta acción eliminará la categoría permanentemente. Las transacciones existentes mantendrán el nombre pero perderán el vínculo."
        confirmText="Eliminar"
        variant="danger"
      />
      
    </div>
  );
}

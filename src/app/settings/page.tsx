"use client";

import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Copy, Plus, Users, ArrowRight, ShieldCheck, Check } from "lucide-react";
import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { users, currentUser, updateGroup, loading } = useStore();
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  
  const [joinGroupId, setJoinGroupId] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  
  // Modal States
  const [confirmAction, setConfirmAction] = useState<{
    type: "create" | "join";
    isOpen: boolean;
    data?: string;
  }>({ type: "create", isOpen: false });

  const myGroupId = currentUser?.groupId || "Sin grupo";

  const handleCopyGroupId = () => {
    if (currentUser?.groupId) {
      navigator.clipboard.writeText(currentUser.groupId);
      setIsCopied(true);
      toast({ title: "Copiado", message: "ID del grupo copiado al portapapeles.", type: "success", duration: 2000 });
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleCreateRequest = () => {
    setConfirmAction({
        type: "create",
        isOpen: true
    });
  };

  const handleJoinRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinGroupId) return;
    setConfirmAction({
        type: "join",
        isOpen: true,
        data: joinGroupId
    });
  };

  const executeAction = async () => {
    if (confirmAction.type === "create") {
        const newId = uuidv4();
        await updateGroup(newId);
        toast({ title: "Grupo Creado", message: "Te has movido a un nuevo grupo familiar." });
    } else if (confirmAction.type === "join" && confirmAction.data) {
        await updateGroup(confirmAction.data);
        toast({ title: "Grupo Actualizado", message: "Te has unido al grupo correctamente." });
    }
    setConfirmAction({ ...confirmAction, isOpen: false });
  };

  return (
    <div className="space-y-8 pb-20 lg:pb-0 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Configuración</h1>
        <p className="text-muted-foreground">Administra tu perfil y tu grupo familiar.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Profile Section */}
        <div className="space-y-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="text-primary" />
                Mi Perfil
            </h2>
            <GlassCard className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <div className={cn("h-16 w-16 rounded-full flex items-center justify-center text-2xl shadow-xl text-white", currentUser?.color || "bg-slate-700")}>
                        {/* Initials could go here */}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-foreground">{currentUser?.name}</h3>
                        <p className="text-muted-foreground">{authUser?.email}</p>
                    </div>
                </div>
                
                <div className="border-t border-border pt-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">ID de Usuario</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded text-foreground font-mono break-all block">
                        {currentUser?.id}
                    </code>
                </div>
            </GlassCard>
        </div>

        {/* Group Section */}
        <div className="space-y-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Users className="text-blue-500" />
                Grupo Familiar
            </h2>
            
            <GlassCard className="p-6 space-y-8">
                
                {/* Current Group Info */}
                <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                        ID de Grupo Actual
                    </label>
                    <div className="flex gap-2">
                        <code className="flex-1 bg-muted border border-border rounded-lg px-4 py-3 text-foreground font-mono text-sm flex items-center overflow-hidden">
                            <span className="truncate">{myGroupId}</span>
                        </code>
                        <Button 
                            onClick={handleCopyGroupId}
                            variant="secondary"
                            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground min-w-12.5"
                            title="Copiar ID"
                        >
                            {isCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Comparte este ID con las personas que quieras agregar a tu grupo.
                    </p>
                </div>

                {/* Members List */}
                <div>
                     <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
                        Miembros del Grupo ({users.length})
                    </label>
                    <div className="space-y-2">
                        {users.map((u) => (
                            <div key={u.id} className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg border border-border">
                                <div className={cn("h-8 w-8 rounded-full", u.color)}></div>
                                <span className="text-sm font-medium text-foreground">{u.name}</span>
                                {u.id === currentUser?.id && (
                                    <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-bold">Yo</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="h-px bg-border w-full my-4"></div>

                {/* Actions */}
                <div className="space-y-4">
                    
                    {/* Join Group Form */}
                    <form onSubmit={handleJoinRequest} className="space-y-3">
                         <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                            Unirse a otro grupo
                        </label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="Pega el ID del grupo aquí..." 
                                value={joinGroupId}
                                onChange={(e) => setJoinGroupId(e.target.value)}
                                className="flex-1 bg-muted border border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                            />
                            <Button disabled={!joinGroupId || loading} type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </form>

                    {/* Create New Group */}
                    <div className="pt-4 border-t border-border">
                        <Button 
                            onClick={handleCreateRequest}
                            disabled={loading}
                            variant="ghost" 
                            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Crear un nuevo grupo (Salir del actual)
                        </Button>
                    </div>

                </div>

            </GlassCard>
        </div>

      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmAction.isOpen}
        onClose={() => setConfirmAction({ ...confirmAction, isOpen: false })}
        onConfirm={executeAction}
        title={confirmAction.type === "create" ? "¿Crear nuevo grupo?" : "¿Unirse al grupo?"}
        description={
            confirmAction.type === "create" 
            ? "Esto te separará de tu grupo actual. Tus transacciones anteriores ya no serán visibles para tu nuevo grupo (pero seguirán existiendo)."
            : `Estás a punto de unirte al grupo "${confirmAction.data}". Verás las transacciones y usuarios de ese grupo.`
        }
        confirmText={confirmAction.type === "create" ? "Crear Grupo" : "Unirse"}
        variant={confirmAction.type === "create" ? "warning" : "info"}
      />

    </div>
  );
}

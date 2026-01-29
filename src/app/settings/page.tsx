'use client';

import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Copy, LogOut, Users, ArrowRight, ShieldCheck, Check, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { users, currentUser, updateGroup, loading, approveMember, removeMember } = useStore();
  const { user: authUser } = useAuth();
  const { toast } = useToast();

  const [joinGroupId, setJoinGroupId] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Modal States
  const [confirmAction, setConfirmAction] = useState<{
    type: 'leave' | 'join' | 'remove' | 'reject';
    isOpen: boolean;
    data?: string;
    userName?: string;
  }>({ type: 'leave', isOpen: false });

  const myGroupId = currentUser?.groupId || 'Sin grupo';

  const handleCopyGroupId = () => {
    if (currentUser?.groupId) {
      navigator.clipboard.writeText(currentUser.groupId);
      setIsCopied(true);
      toast({ title: 'Copiado', message: 'ID del grupo copiado al portapapeles.', type: 'success', duration: 2000 });
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleLeaveRequest = () => {
    setConfirmAction({
      type: 'leave',
      isOpen: true,
    });
  };

  const handleJoinRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinGroupId) return;
    setConfirmAction({
      type: 'join',
      isOpen: true,
      data: joinGroupId,
    });
  };

  const executeAction = async () => {
    if (confirmAction.type === 'leave') {
      await updateGroup(null); // Leave group
      // AppLayout will handle redirect to /onboarding
    } else if (confirmAction.type === 'join' && confirmAction.data) {
      await updateGroup(confirmAction.data);
      toast({ title: 'Grupo Actualizado', message: 'Te has unido al grupo correctamente.' });
    } else if ((confirmAction.type === 'remove' || confirmAction.type === 'reject') && confirmAction.data) {
      await removeMember(confirmAction.data);
      toast({
        title: confirmAction.type === 'remove' ? 'Miembro Eliminado' : 'Solicitud Rechazada',
        message: `${confirmAction.userName || 'El usuario'} ha sido removido.`,
        type: 'success',
      });
    }
    setConfirmAction({ ...confirmAction, isOpen: false });
  };

  const getConfirmTitle = () => {
    switch (confirmAction.type) {
      case 'leave':
        return '¿Salir del grupo?';
      case 'join':
        return '¿Unirse al grupo?';
      case 'remove':
        return '¿Eliminar miembro?';
      case 'reject':
        return '¿Rechazar solicitud?';
    }
  };

  const getConfirmDesc = () => {
    switch (confirmAction.type) {
      case 'leave':
        return 'Al salir, serás redirigido a la pantalla de bienvenida donde podrás crear uno nuevo o unirte a otro. Si eres el último miembro, los datos del grupo se eliminarán.';
      case 'join':
        return `Estás a punto de unirte al grupo "${confirmAction.data}". Verás las transacciones y usuarios de ese grupo.`;
      case 'remove':
        return `¿Estás seguro de que quieres eliminar a ${confirmAction.userName} del grupo? Perderá acceso a los datos compartidos.`;
      case 'reject':
        return `¿Estás seguro de que quieres rechazar a ${confirmAction.userName}?`;
    }
  };

  const getConfirmButtonText = () => {
    switch (confirmAction.type) {
      case 'leave':
        return 'Salir del Grupo';
      case 'join':
        return 'Unirse';
      case 'remove':
        return 'Eliminar';
      case 'reject':
        return 'Rechazar';
    }
  };

  const getConfirmVariant = () => {
    if (confirmAction.type === 'remove' || confirmAction.type === 'reject' || confirmAction.type === 'leave')
      return 'danger';
    return 'info';
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
              <div
                className={cn(
                  'h-16 w-16 rounded-full flex items-center justify-center text-2xl shadow-xl text-white',
                  currentUser?.color || 'bg-slate-700',
                )}
              >
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
                Miembros del Grupo ({users.filter((u) => u.status === 'active').length})
              </label>
              <div className="space-y-2">
                {users
                  .filter((u) => u.status !== 'pending')
                  .map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg border border-border group"
                    >
                      <div className={cn('h-8 w-8 rounded-full', u.color)}></div>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-foreground block">{u.name}</span>
                        {u.role === 'admin' && (
                          <span className="text-[10px] bg-purple-500/10 text-purple-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                            Admin
                          </span>
                        )}
                      </div>

                      {u.id === currentUser?.id ? (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-bold">Yo</span>
                      ) : (
                        currentUser?.role === 'admin' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                            title="Eliminar del grupo"
                            onClick={() =>
                              setConfirmAction({ type: 'remove', isOpen: true, data: u.id, userName: u.name })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )
                      )}
                    </div>
                  ))}
              </div>

              {/* Pending Requests - ONLY VISIBLE TO ADMINS */}
              {currentUser?.role === 'admin' && users.some((u) => u.status === 'pending') && (
                <div className="mt-6 animate-in slide-in-from-top-2 fade-in">
                  <label className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    Solicitudes Pendientes
                  </label>
                  <div className="space-y-2">
                    {users
                      .filter((u) => u.status === 'pending')
                      .map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center gap-3 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20"
                        >
                          <div className={cn('h-8 w-8 rounded-full opacity-50', u.color)}></div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-bold text-foreground block">{u.name}</span>
                            <span className="text-xs text-muted-foreground">Solicita unirse</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="hover:bg-red-500/10 text-red-500 hover:text-red-600 h-8 w-8 p-0 rounded-full"
                              title="Rechazar"
                              onClick={() =>
                                setConfirmAction({ type: 'reject', isOpen: true, data: u.id, userName: u.name })
                              }
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              className="bg-emerald-500 hover:bg-emerald-600 text-white h-8 px-3 rounded-full shadow-lg shadow-emerald-500/20"
                              onClick={async () => {
                                await approveMember(u.id);
                                toast({
                                  title: 'Aprobado',
                                  message: `${u.name} ahora es miembro del grupo.`,
                                  type: 'success',
                                });
                              }}
                            >
                              <Check className="h-4 w-4" /> Aceptar
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
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
                  <Button
                    disabled={!joinGroupId || loading}
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>

              {/* Leave Group Action */}
              <div className="pt-4 border-t border-border">
                <Button
                  onClick={handleLeaveRequest}
                  disabled={loading}
                  variant="ghost"
                  className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-500/10 gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Salir del Grupo
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
        title={getConfirmTitle()}
        description={getConfirmDesc()}
        confirmText={getConfirmButtonText()}
        variant={getConfirmVariant()}
      />
    </div>
  );
}

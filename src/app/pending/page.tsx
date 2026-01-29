'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Copy, Clock } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';

export default function PendingPage() {
  const { currentUser, loading, updateGroup } = useStore();
  const { toast } = useToast();

  const handleCopyId = () => {
    if (currentUser?.groupId) {
      navigator.clipboard.writeText(currentUser.groupId);
      toast({ title: 'Copiado', message: 'ID del grupo copiado al portapapeles', type: 'success' });
    }
  };

  // We can handle leave group logic here if needed, but for now just display info.

  if (loading) return null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center animate-pulse">
          <Clock className="w-12 h-12 text-amber-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Solicitud Enviada</h1>
          <p className="text-muted-foreground">
            Tu solicitud para unirte al grupo ha sido enviada. Un administrador debe aprobarte para que puedas ver los
            datos.
          </p>
        </div>

        <div className="p-4 bg-secondary/50 rounded-xl border border-border/50">
          <p className="text-xs uppercase font-bold text-muted-foreground mb-2 tracking-wider">ID del Grupo</p>
          <div className="flex items-center justify-center gap-2 font-mono text-lg bg-background p-2 rounded-lg border">
            {currentUser?.groupId || '...'}
            <button onClick={handleCopyId} className="hover:text-primary transition-colors">
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Comparte este ID con el administrador si no lo tiene.</p>
        </div>

        <p className="text-sm text-muted-foreground/50">Recarga la página una vez que te hayan aceptado.</p>
        <div className="flex gap-4 justify-center">
          <Button
            variant="ghost"
            onClick={() => updateGroup(null)}
            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
          >
            Cancelar Solicitud
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Verificar Estado
          </Button>
        </div>
      </div>
    </div>
  );
}

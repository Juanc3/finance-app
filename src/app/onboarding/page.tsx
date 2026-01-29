'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { Button } from '@/components/ui/Button'; // Check casing, used Button previously
import { GlassCard } from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/Input'; // Fixed Import Casing
import { Users, Link as LinkIcon, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { v4 as uuidv4, validate as validateUUID } from 'uuid';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';

export default function OnboardingPage() {
  const { updateGroup, currentUser, loading, checkGroupExists } = useStore();
  const [joinId, setJoinId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();

  const { toast } = useToast();

  // Handle redirects safely - MUST be at top level, before any returns
  React.useEffect(() => {
    if (currentUser?.groupId && currentUser.status === 'pending') {
      router.push('/pending');
    }
  }, [currentUser, router]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background text-muted-foreground">
        Cargando...
      </div>
    );
  }

  // If user already has a group, they shouldn't be here ideally,
  // but we can offer a "Go to Dashboard" just in case.
  if (currentUser?.groupId) {
    if (currentUser.status === 'pending') {
      // Redirect handled by useEffect, just return null to avoid flash
      return null;
    }

    return (
      <div className="h-screen w-full flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">¡Ya tienes un grupo!</h1>
        <Button onClick={() => router.push('/')}>Ir al Panel Principal</Button>
      </div>
    );
  }

  const handleCreateGroup = async () => {
    setIsCreating(true);
    try {
      const newGroupId = uuidv4();
      await updateGroup(newGroupId, true); // Create as Active
      // Page triggers reload/redirect in updateGroup or we push here (updateGroup does reload currently)
      toast({ title: '¡Grupo Creado!', message: 'Tu espacio está listo. Invita a otros con tu ID.', type: 'success' });
    } catch (error) {
      console.error('Failed to create group', error);
      toast({ title: 'Error', message: 'No se pudo crear el grupo.', type: 'error' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!joinId.trim()) return;

    if (!validateUUID(joinId.trim())) {
      toast({
        title: 'ID Inválido',
        message: 'El formato del ID no es válido. Debe ser un código UUID.',
        type: 'error',
      });
      return;
    }

    setIsJoining(true);
    try {
      // 1. Check if group exists
      const exists = await checkGroupExists(joinId.trim());

      if (!exists) {
        toast({
          title: 'Grupo no encontrado',
          message: 'El ID ingresado no corresponde a ningún grupo activo.',
          type: 'error',
        });
        return;
      }

      // 2. Join Group
      await updateGroup(joinId.trim());
      toast({ title: '¡Te uniste!', message: 'Sincronizando datos...', type: 'success' });
    } catch (error) {
      console.error('Failed to join group', error);
      toast({ title: 'Error', message: 'Hubo un problema al unirte al grupo.', type: 'error' });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8 bg-background relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] right-[-10%] w-150 h-150 bg-primary/20 blur-[100px] rounded-full opacity-50 animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-125 h-125 bg-blue-500/10 blur-[100px] rounded-full opacity-50" />

      <div className="max-w-4xl w-full space-y-12 z-20 relative">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4 ring-1 ring-primary/20 shadow-lg shadow-primary/10">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
            Bienvenido a <span className="text-primary">A&B Finance</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Para comenzar a organizar tus finanzas compartidas, necesitas configurar tu espacio de trabajo.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Create Group Option */}
          <GlassCard className="p-8 flex flex-col gap-6 relative group hover:scale-[1.02] transition-all duration-300 border-primary/20 z-30">
            <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2 shadow-inner relative z-10">
              <Users className="h-7 w-7" />
            </div>

            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-2">Crear Nuevo Grupo</h2>
              <p className="text-muted-foreground leading-relaxed">
                Empieza una nueva contabilidad desde cero. Generaremos un ID único para que invites a otros miembros más
                tarde.
              </p>
            </div>

            <div className="mt-auto pt-4 relative z-10">
              <Button
                size="lg"
                onClick={handleCreateGroup}
                disabled={isCreating || isJoining}
                className="w-full text-lg h-14 font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all rounded-xl"
              >
                {isCreating ? 'Creando...' : 'Crear Grupo'} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </GlassCard>

          {/* Join Group Option */}
          <GlassCard className="p-8 flex flex-col gap-6 relative group hover:scale-[1.02] transition-all duration-300 z-30">
            <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-2 shadow-inner relative z-10">
              <LinkIcon className="h-7 w-7" />
            </div>

            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-2">Unirme a un Grupo</h2>
              <p className="text-muted-foreground leading-relaxed">
                Si ya tienes un código de invitación de tu familia o pareja, ingrésalo aquí para sincronizarte.
              </p>
            </div>

            <div className="mt-auto pt-4 space-y-4 relative z-10">
              <div className="relative">
                <Input
                  placeholder="Pega el ID del grupo aquí..."
                  value={joinId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJoinId(e.target.value)}
                  className="h-14 text-lg px-4 bg-background/50 border-border/50 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-xl transition-all"
                />
                <ShieldCheck className="absolute right-4 top-4 h-6 w-6 text-muted-foreground/30" />
              </div>

              <Button
                size="lg"
                variant="secondary"
                onClick={handleJoinGroup}
                disabled={!joinId.trim() || isCreating || isJoining}
                className="w-full text-lg h-14 font-bold border border-border/50 hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/30 transition-all rounded-xl"
              >
                {isJoining ? 'Uniéndome...' : 'Unirme al Grupo'}
              </Button>
            </div>
          </GlassCard>
        </div>

        <p className="text-center text-sm text-muted-foreground/50">
          Podrás cambiar esta configuración más tarde desde tu perfil.
        </p>
      </div>
    </div>
  );
}

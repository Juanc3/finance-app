"use client";

import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { supabase } from "@/lib/supabase";
import { Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(""); // For sign up
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Sign Up logic
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
              // Random color assignment for fun
              color: Math.random() > 0.5 ? "bg-violet-500" : "bg-emerald-500",
              hexColor: Math.random() > 0.5 ? "#8b5cf6" : "#10b981",
            },
          },
        });
        if (data.user && !data.session) {
          router.push(`/verify-email?email=${encodeURIComponent(email)}`);
          return;
        }

        if (error) throw error;
        // Auto sign in happens if email confirmation is disabled, otherwise show message
      } else {
        // Sign In logic
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-violet-600/20 mb-4">
            <Wallet className="h-6 w-6 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">
            {isSignUp ? "Crear una cuenta" : "Bienvenido"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignUp
              ? "Empieza a registrar tus finanzas compartidas hoy"
              : "Ingresa tus datos para acceder a tu panel"}
          </p>
        </div>

        <GlassCard className="border-border bg-card/50 backdrop-blur-xl">
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass-input w-full rounded-lg px-4 py-2"
                  placeholder="Juan Perez"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full rounded-lg px-4 py-2"
                placeholder="tu@ejemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input w-full rounded-lg px-4 py-2"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Cargando..." : isSignUp ? "Registrarse" : "Iniciar Sesión"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isSignUp ? "¿Ya tienes una cuenta?" : "¿No tienes una cuenta?"}{" "}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {isSignUp ? "Inicia sesión" : "Regístrate"}
              </button>
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

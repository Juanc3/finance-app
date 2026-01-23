/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import React, { useEffect, useState } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
}: ConfirmModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) setIsClosing(false);
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  };

  const handleConfirm = () => {
    onConfirm();
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 transition-all duration-200",
      isClosing ? "opacity-0" : "animate-in fade-in"
    )}>
      <div 
        className="absolute inset-0" 
        onClick={handleClose}
      />
      <GlassCard className={cn(
        "w-full max-w-sm overflow-hidden shadow-2xl relative transition-all duration-200",
        isClosing ? "scale-95 opacity-0" : "animate-in zoom-in-95 fade-in",
        variant === "danger" && "border-destructive/20 bg-destructive/10",
        variant === "warning" && "border-yellow-500/20 bg-yellow-500/10"
      )}>
        <div className="p-6 text-center space-y-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2",
             variant === "danger" && "bg-destructive/10 text-destructive",
             variant === "warning" && "bg-yellow-500/10 text-yellow-500",
             variant === "info" && "bg-blue-500/10 text-blue-500",
          )}>
            <AlertTriangle className="h-6 w-6" />
          </div>

          <div>
             <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
             <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
                variant="ghost" 
                onClick={handleClose}
                className="flex-1 text-muted-foreground hover:text-foreground"
            >
                {cancelText}
            </Button>
            <Button 
                onClick={handleConfirm}
                className={cn(
                    "flex-1 font-bold",
                    variant === "danger" && "bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/20",
                    variant === "warning" && "bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg shadow-yellow-900/20",
                    variant === "info" && "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
                )}
            >
                {confirmText}
            </Button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

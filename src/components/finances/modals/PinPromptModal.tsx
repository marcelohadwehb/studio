'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PinPromptModalProps {
  isOpen: boolean;
  onClose: (success: boolean) => void;
}

const CORRECT_PIN = process.env.NEXT_PUBLIC_PIN_CODE;

export function PinPromptModal({ isOpen, onClose }: PinPromptModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const { toast } = useToast();

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 4) {
      setPin(value);
      setError(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === CORRECT_PIN) {
      toast({ title: 'PIN Correcto', description: 'Acción autorizada.' });
      onClose(true);
    } else {
      setError(true);
      setPin('');
      toast({ variant: 'destructive', title: 'PIN Incorrecto' });
      onClose(false);
    }
  };
  
  const handleDialogClose = (open: boolean) => {
    if(!open){
      onClose(false);
      setPin('');
      setError(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Verificación Requerida</DialogTitle>
          <DialogDescription>
            Estás intentando modificar datos de un mes pasado. Por favor, ingresa tu PIN para confirmar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="pin-prompt"
            type="password"
            value={pin}
            onChange={handlePinChange}
            maxLength={4}
            className="text-center text-xl font-mono tracking-[0.5em] h-12"
            placeholder="----"
            autoFocus
          />
          {error && (
            <Alert variant="destructive" className="p-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                PIN incorrecto. Inténtalo de nuevo.
              </AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pin.length !== 4}>
              Confirmar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

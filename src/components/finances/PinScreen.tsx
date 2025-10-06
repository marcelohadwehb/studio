'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

interface PinScreenProps {
  onUnlock: () => void;
}

const CORRECT_PIN = process.env.NEXT_PUBLIC_PIN_CODE;

export function PinScreen({ onUnlock }: PinScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

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
      onUnlock();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl mt-4">Verificación Requerida</CardTitle>
          <CardDescription>Ingresa tu PIN de 4 dígitos para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Input
                id="pin"
                type="password"
                value={pin}
                onChange={handlePinChange}
                maxLength={4}
                className="text-center text-2xl font-mono tracking-[1em] h-14"
                placeholder="----"
                autoFocus
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  PIN incorrecto. Inténtalo de nuevo.
                </AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={pin.length !== 4}>
              Desbloquear
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

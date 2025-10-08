'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AppTheme, applyTheme, getDefaultTheme } from '@/lib/theme';


interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThemeModal({ isOpen, onClose }: ThemeModalProps) {
  const [theme, setTheme] = useState<AppTheme>(getDefaultTheme());
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const savedTheme = localStorage.getItem('app-theme');
      if (savedTheme) {
        setTheme(JSON.parse(savedTheme));
      } else {
        setTheme(getDefaultTheme());
      }
    }
  }, [isOpen]);

  const handleColorChange = (key: keyof AppTheme, value: string) => {
    const newTheme = { ...theme, [key]: value };
    setTheme(newTheme);
    applyTheme(newTheme);
  };
  
  const handleSaveTheme = () => {
    localStorage.setItem('app-theme', JSON.stringify(theme));
    toast({ title: 'Tema guardado', description: 'Tu nuevo tema se ha guardado correctamente.' });
    onClose();
  };

  const handleResetTheme = () => {
    const defaultTheme = getDefaultTheme();
    setTheme(defaultTheme);
    applyTheme(defaultTheme);
    localStorage.removeItem('app-theme');
    toast({ title: 'Tema restablecido', description: 'Se ha cargado el tema por defecto.' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Personalizar Tema</DialogTitle>
          <DialogDescription className="text-center pt-2">
            Elige los colores que más te gusten para la aplicación.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
            <div className="flex items-center justify-between gap-4">
                <Label htmlFor="primary-color" className="font-semibold">Color Primario</Label>
                <div className="flex items-center gap-2 border rounded-md p-1">
                    <Input 
                        id="primary-color-picker" 
                        type="color" 
                        value={theme.primary}
                        onChange={(e) => handleColorChange('primary', e.target.value)}
                        className="h-8 w-8 p-0 border-none"
                    />
                    <Input 
                        id="primary-color"
                        type="text" 
                        value={theme.primary}
                        onChange={(e) => handleColorChange('primary', e.target.value)}
                        className="h-8 w-24 border-none focus:ring-0"
                    />
                </div>
            </div>
            <div className="flex items-center justify-between gap-4">
                <Label htmlFor="background-color" className="font-semibold">Color de Fondo</Label>
                 <div className="flex items-center gap-2 border rounded-md p-1">
                    <Input 
                        id="background-color-picker" 
                        type="color" 
                        value={theme.background}
                        onChange={(e) => handleColorChange('background', e.target.value)}
                        className="h-8 w-8 p-0 border-none"
                    />
                    <Input 
                        id="background-color"
                        type="text" 
                        value={theme.background}
                        onChange={(e) => handleColorChange('background', e.target.value)}
                        className="h-8 w-24 border-none"
                    />
                </div>
            </div>
            <div className="flex items-center justify-between gap-4">
                <Label htmlFor="accent-color" className="font-semibold">Color de Acento</Label>
                 <div className="flex items-center gap-2 border rounded-md p-1">
                    <Input 
                        id="accent-color-picker" 
                        type="color" 
                        value={theme.accent}
                        onChange={(e) => handleColorChange('accent', e.target.value)}
                        className="h-8 w-8 p-0 border-none"
                    />
                    <Input 
                        id="accent-color"
                        type="text" 
                        value={theme.accent}
                        onChange={(e) => handleColorChange('accent', e.target.value)}
                        className="h-8 w-24 border-none"
                    />
                </div>
            </div>
        </div>

        <DialogFooter className="pt-4 justify-between sm:justify-between">
          <Button type="button" variant="ghost" onClick={handleResetTheme}>Restablecer</Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="button" onClick={handleSaveTheme}>Guardar Tema</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

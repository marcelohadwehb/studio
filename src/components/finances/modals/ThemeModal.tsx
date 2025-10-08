'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AppTheme, applyTheme, getDefaultTheme, presetThemes, PresetTheme } from '@/lib/theme';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Paintbrush, Check } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  
  const handleSelectPreset = (preset: PresetTheme) => {
    const newTheme = { ...preset.colors };
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
  
  const ColorInput = ({ label, id, value, onChange }: { label: string, id: keyof AppTheme, value: string, onChange: (id: keyof AppTheme, value: string) => void }) => (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor={`${id}-color`} className="font-semibold text-sm">{label}</Label>
      <div className="flex items-center gap-2 border rounded-md p-1">
        <Input 
          id={`${id}-color-picker`} 
          type="color" 
          value={value}
          onChange={(e) => onChange(id, e.target.value)}
          className="h-7 w-7 p-0 border-none cursor-pointer"
        />
        <Input 
          id={`${id}-color`}
          type="text" 
          value={value}
          onChange={(e) => onChange(id, e.target.value)}
          className="h-7 w-20 border-none focus:ring-0 text-sm"
        />
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <Paintbrush className="h-6 w-6" /> Personalizar Tema
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Elige una paleta predefinida o personaliza cada color a tu gusto.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Preview Section */}
          <div className="space-y-4">
            <h3 className="font-bold text-center text-lg">Previsualización de Componentes</h3>
            <Card className="p-4" style={{ 
                backgroundColor: `hsl(var(--background))`, 
                borderColor: `hsl(var(--border))` 
            }}>
              <h4 className="font-bold mb-2" style={{ color: `hsl(var(--foreground))`}}>Título de Ejemplo</h4>
              <p className="text-sm mb-4" style={{ color: `hsl(var(--muted-foreground))`}}>Este es un texto de párrafo de ejemplo.</p>
              <div className="flex flex-wrap gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button style={{ 
                        backgroundColor: `hsl(var(--button-primary))`, 
                        color: `hsl(var(--button-primary-foreground))`
                      }}>Botón Principal</Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Botón con estilo primario</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                 <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="secondary">Botón Secundario</Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Botón con estilo secundario</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex gap-2 mt-4">
                <div className="w-full h-4 rounded" style={{backgroundColor: `hsl(var(--chart-1))`}}></div>
                <div className="w-full h-4 rounded" style={{backgroundColor: `hsl(var(--chart-2))`}}></div>
                <div className="w-full h-4 rounded" style={{backgroundColor: `hsl(var(--chart-3))`}}></div>
              </div>
            </Card>
          </div>

          {/* Customization Section */}
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-center text-lg mb-3">Paletas Predefinidas</h3>
              <div className="grid grid-cols-3 gap-2">
                {presetThemes.map(preset => (
                  <TooltipProvider key={preset.name}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="h-10 w-full p-0 border-2" 
                          onClick={() => handleSelectPreset(preset)}
                        >
                          <div className="flex w-full h-full">
                            {Object.values(preset.colors).slice(0,4).map((color, index) => (
                              <div key={index} style={{ backgroundColor: color }} className="h-full w-1/4 first:rounded-l-sm last:rounded-r-sm"></div>
                            ))}
                          </div>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>{preset.name}</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                 <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                         <Button
                          variant="outline"
                          onClick={handleResetTheme}
                          className="h-10 w-full"
                        >
                          Original
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Restablecer al tema original</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
              </div>
            </div>
            
            <div>
               <h3 className="font-bold text-center text-lg mb-3">Personalización Manual</h3>
               <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                <ColorInput label="Principal (títulos, íconos)" id="primary" value={theme.primary} onChange={handleColorChange} />
                <ColorInput label="Fondo de la App" id="background" value={theme.background} onChange={handleColorChange} />
                <ColorInput label="Acento (resaltados sutiles)" id="accent" value={theme.accent} onChange={handleColorChange} />
                <ColorInput label="Botón Principal" id="buttonPrimary" value={theme.buttonPrimary} onChange={handleColorChange} />
               </div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="button" onClick={handleSaveTheme}><Check className="mr-2 h-4 w-4" /> Guardar Tema</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AppTheme, applyTheme, getDefaultTheme, presetThemes, PresetTheme } from '@/lib/theme';
import { Card, CardContent } from '@/components/ui/card';
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

  useEffect(() => {
    if (isOpen) {
      applyTheme(theme);
    }
  }, [theme, isOpen]);
  
  const handleColorChange = (key: keyof AppTheme, value: string) => {
    const newTheme = { ...theme, [key]: value };
    setTheme(newTheme);
  };
  
  const handleSelectPreset = (preset: PresetTheme) => {
    setTheme({ ...preset.colors });
  };
  
  const handleSaveTheme = () => {
    localStorage.setItem('app-theme', JSON.stringify(theme));
    toast({ title: 'Tema guardado', description: 'Tu nuevo tema se ha guardado correctamente.' });
    onClose();
  };

  const handleResetTheme = () => {
    setTheme(getDefaultTheme());
    toast({ title: 'Tema restablecido', description: 'Se ha cargado el tema por defecto.' });
  };
  
  const ColorInput = ({ label, id, value, onChange }: { label: string, id: keyof AppTheme, value: string, onChange: (id: keyof AppTheme, value: string) => void }) => {
    const quickColors = presetThemes.map(p => p.colors[id]).filter((c, i, a) => a.indexOf(c) === i).slice(0, 5);
    
    return (
      <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_auto] items-center gap-2 sm:gap-4">
        <Label htmlFor={`${id}-color`} className="font-semibold text-sm truncate">{label}</Label>
        <div className="flex items-center gap-2 border rounded-md p-1 bg-background">
          <Input 
            id={`${id}-color-picker`} 
            type="color" 
            value={value}
            onChange={(e) => onChange(id, e.target.value)}
            className="h-7 w-7 p-0 border-none cursor-pointer"
            aria-label={`Seleccionar color para ${label}`}
          />
        </div>
        <div className="hidden sm:flex items-center gap-1.5">
          {quickColors.map((color, index) => (
             <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="h-6 w-6 rounded-full border cursor-pointer"
                    style={{ backgroundColor: color }}
                    onClick={() => onChange(id, color)}
                    aria-label={`Seleccionar color predefinido ${color}`}
                  />
                </TooltipTrigger>
                <TooltipContent><p>{color}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <Paintbrush className="h-6 w-6" /> Personalizar Tema
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Elige una paleta predefinida o personaliza cada color a tu gusto.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Preview Column */}
            <div className="space-y-4">
              <h3 className="font-bold text-center text-lg">Previsualización de Componentes</h3>
              <Card className="p-4 space-y-4" style={{ 
                  backgroundColor: `hsl(var(--background))`, 
                  borderColor: `hsl(var(--border))` 
              }}>
                <div>
                  <h4 className="font-bold mb-2" style={{ color: `hsl(var(--foreground))`}}>Botones Principales</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button style={{ 
                      backgroundColor: `hsl(var(--button-primary))`, 
                      color: `hsl(var(--button-primary-foreground))`
                    }}>Guardar</Button>
                    <Button variant="secondary">Cancelar</Button>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold mb-2" style={{ color: `hsl(var(--foreground))`}}>Botones de Acción</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button style={{ backgroundColor: 'hsl(var(--button-income))', color: 'hsl(var(--button-income-foreground))' }}>Ingreso</Button>
                    <Button style={{ backgroundColor: 'hsl(var(--button-expense))', color: 'hsl(var(--button-expense-foreground))' }}>Gasto</Button>
                    <Button style={{ backgroundColor: 'hsl(var(--button-chart))', color: 'hsl(var(--button-chart-foreground))' }}>Gráficos</Button>
                    <Button style={{ backgroundColor: 'hsl(var(--button-budget))', color: 'hsl(var(--button-budget-foreground))' }}>Presupuestos</Button>
                    <Button style={{ backgroundColor: 'hsl(var(--button-records))', color: 'hsl(var(--button-records-foreground))' }}>Registros</Button>
                    <Button style={{ backgroundColor: 'hsl(var(--button-categories))', color: 'hsl(var(--button-categories-foreground))' }}>Categorías</Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Preset Palettes Column */}
            <div className="space-y-4">
              <h3 className="font-bold text-center text-lg">Paletas Predefinidas</h3>
              <Card>
                <CardContent className="p-4">
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
                                {Object.values(preset.colors).slice(0, 4).map((color, index) => (
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
                          <Button variant="outline" onClick={handleResetTheme} className="h-10 w-full">Original</Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Restablecer al tema original</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
            
          {/* Manual Customization Full Width Section */}
          <div className="space-y-4">
            <h3 className="font-bold text-center text-lg">Personalización Manual</h3>
            <Card>
              <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                <ColorInput label="Principal (títulos, íconos)" id="primary" value={theme.primary} onChange={handleColorChange} />
                <ColorInput label="Borde del Balance" id="balanceBorder" value={theme.balanceBorder} onChange={handleColorChange} />
                <ColorInput label="Fondo de la App" id="background" value={theme.background} onChange={handleColorChange} />
                <ColorInput label="Acento (resaltados sutiles)" id="accent" value={theme.accent} onChange={handleColorChange} />
                <div className="sm:col-span-2 my-1"><hr className="border-border" /></div>
                <ColorInput label="Botón Principal (Guardar)" id="buttonPrimary" value={theme.buttonPrimary} onChange={handleColorChange} />
                <ColorInput label="Botón Gráfico" id="buttonChart" value={theme.buttonChart} onChange={handleColorChange} />
                <ColorInput label="Botón Ingreso" id="buttonIncome" value={theme.buttonIncome} onChange={handleColorChange} />
                <ColorInput label="Botón Gasto" id="buttonExpense" value={theme.buttonExpense} onChange={handleColorChange} />
                <ColorInput label="Botón Presupuesto" id="buttonBudget" value={theme.buttonBudget} onChange={handleColorChange} />
                <ColorInput label="Botón Registros" id="buttonRecords" value={theme.buttonRecords} onChange={handleColorChange} />
                <ColorInput label="Botón Categorías" id="buttonCategories" value={theme.buttonCategories} onChange={handleColorChange} />
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="pt-4 justify-end sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="button" onClick={handleSaveTheme}><Check className="mr-2 h-4 w-4" /> Guardar Tema</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

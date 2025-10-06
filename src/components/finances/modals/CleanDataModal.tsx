'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';

interface CleanDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClean: (year: number) => void;
}

export function CleanDataModal({ isOpen, onClose, onClean }: CleanDataModalProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const { toast } = useToast();

  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const handleClean = () => {
    if (selectedYear) {
      onClean(selectedYear);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor, selecciona un año para limpiar.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Limpiar Datos de Transacciones</DialogTitle>
           <DialogDescription className="text-center pt-2">
            Esta acción eliminará permanentemente todas las transacciones del año seleccionado.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
                Selecciona el año del cual deseas eliminar todas las transacciones. Esta acción no se puede deshacer.
            </p>
             <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Selecciona un año" />
                </SelectTrigger>
                <SelectContent>
                    {years.map(year => (
                        <SelectItem key={year} value={year.toString()}>
                            {year}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="button" variant="destructive" onClick={handleClean}>Limpiar Año {selectedYear}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
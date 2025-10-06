'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

interface CleanDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClean: (startDate: Date, endDate: Date) => void;
}

export function CleanDataModal({ isOpen, onClose, onClean }: CleanDataModalProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [startMonth, setStartMonth] = useState<number>(currentMonth);
  const [startYear, setStartYear] = useState<number>(currentYear);
  const [endMonth, setEndMonth] = useState<number>(currentMonth);
  const [endYear, setEndYear] = useState<number>(currentYear);
  
  const { toast } = useToast();

  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const handleClean = () => {
    const startDate = new Date(startYear, startMonth, 1);
    const endDate = new Date(endYear, endMonth + 1, 0, 23, 59, 59); // End of the selected month

    if (startDate > endDate) {
      toast({
        variant: 'destructive',
        title: 'Error de Fechas',
        description: 'La fecha de inicio no puede ser posterior a la fecha de fin.',
      });
      return;
    }
    
    onClean(startDate, endDate);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Limpiar Transacciones por Período</DialogTitle>
           <DialogDescription className="text-center pt-2">
            Esta acción eliminará permanentemente todas las transacciones dentro del rango de fechas seleccionado.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 grid grid-cols-2 gap-6">
          <div className='space-y-2'>
            <Label className="font-semibold">Desde</Label>
            <div className='flex gap-2'>
              <Select value={startMonth.toString()} onValueChange={(v) => setStartMonth(parseInt(v))}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                      {months.map((m, i) => <SelectItem key={i} value={i.toString()}>{m}</SelectItem>)}
                  </SelectContent>
              </Select>
              <Select value={startYear.toString()} onValueChange={(v) => setStartYear(parseInt(v))}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                      {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                  </SelectContent>
              </Select>
            </div>
          </div>
          <div className='space-y-2'>
            <Label className="font-semibold">Hasta</Label>
             <div className='flex gap-2'>
              <Select value={endMonth.toString()} onValueChange={(v) => setEndMonth(parseInt(v))}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                      {months.map((m, i) => <SelectItem key={i} value={i.toString()}>{m}</SelectItem>)}
                  </SelectContent>
              </Select>
              <Select value={endYear.toString()} onValueChange={(v) => setEndYear(parseInt(v))}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                      {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                  </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="button" variant="destructive" onClick={handleClean}>Eliminar Transacciones</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, Trash2 } from "lucide-react"
import { useMemo } from "react";

interface HeaderProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  onExport: (exportType: 'month' | 'year' | 'last5years') => void;
  onOpenCleanDataModal: () => void;
}

export function Header({ currentDate, setCurrentDate, onExport, onOpenCleanDataModal }: HeaderProps) {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const handleMonthChange = (monthValue: string) => {
    const newDate = new Date(currentYear, parseInt(monthValue), 1);
    setCurrentDate(newDate);
  };

  const handleYearChange = (yearValue: string) => {
    const newDate = new Date(parseInt(yearValue), currentMonth, 1);
    setCurrentDate(newDate);
  };

  const months = useMemo(() => ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"], []);
  const years = useMemo(() => Array.from({ length: 10 }, (_, i) => 2024 + i), []);

  return (
    <header className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-4 sm:p-6 rounded-t-2xl">
      <h1 className="text-2xl sm:text-3xl font-bold text-center">Finanzas Familiares</h1>
      <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm font-medium">
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1 sm:gap-2 shadow-md w-full sm:w-auto">
          <Select value={currentMonth.toString()} onValueChange={handleMonthChange}>
            <SelectTrigger className="bg-transparent text-gray-800 outline-none border-none focus:ring-0 w-full sm:w-auto text-xs sm:text-sm">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => (
                <SelectItem key={index} value={index.toString()}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={currentYear.toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="bg-transparent text-gray-800 outline-none border-none focus:ring-0 w-full sm:w-auto text-xs sm:text-sm">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="bg-white hover:bg-gray-200 text-blue-500 rounded-full shadow-md transition-transform duration-200 transform hover:scale-105 border-0 h-9 w-9 sm:h-10 sm:w-10">
                <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sr-only">Exportar</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExport('month')}>
                Exportar Mes Actual
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('year')}>
                Exportar Año Actual
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('last5years')}>
                Exportar Últimos 5 Años
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            variant="outline" 
            size="icon" 
            className="bg-white hover:bg-gray-200 text-red-500 rounded-full shadow-md transition-transform duration-200 transform hover:scale-105 border-0 h-9 w-9 sm:h-10 sm:w-10"
            onClick={onOpenCleanDataModal}
          >
            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="sr-only">Limpiar Datos</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

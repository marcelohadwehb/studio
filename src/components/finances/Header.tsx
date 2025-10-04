'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Download, Info } from "lucide-react"
import { useMemo } from "react";

interface HeaderProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  onExport: (fullYear: boolean) => void;
}

export function Header({ currentDate, setCurrentDate, onExport }: HeaderProps) {
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
  const years = useMemo(() => Array.from({ length: 37 }, (_, i) => 2024 + i), []);

  return (
    <header className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-t-2xl">
      <h1 className="text-3xl font-bold text-center">Finanzas Familiares</h1>
      <div className="mt-4 flex justify-between items-center text-sm font-medium">
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-2 shadow-md">
          <Select value={currentMonth.toString()} onValueChange={handleMonthChange}>
            <SelectTrigger className="bg-transparent text-gray-800 outline-none border-none focus:ring-0 w-auto">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => (
                <SelectItem key={index} value={index.toString()}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={currentYear.toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="bg-transparent text-gray-800 outline-none border-none focus:ring-0 w-auto">
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
          <Button onClick={() => onExport(false)} variant="outline" size="icon" className="bg-white hover:bg-gray-200 text-blue-500 rounded-full shadow-md transition-transform duration-200 transform hover:scale-105 border-0">
            <Download className="h-5 w-5" />
            <span className="sr-only">Exportar Mes</span>
          </Button>
          <Button onClick={() => onExport(true)} variant="outline" size="icon" className="bg-white hover:bg-gray-200 text-blue-500 rounded-full shadow-md transition-transform duration-200 transform hover:scale-105 border-0">
            <Info className="h-5 w-5" />
            <span className="sr-only">Exportar Año</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

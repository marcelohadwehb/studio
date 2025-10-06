'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from "date-fns";
import { es } from 'date-fns/locale';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn, formatNumber, parseFormattedNumber } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

import { Transaction, Categories } from '@/lib/types';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const formSchema = z.object({
  date: z.date({ required_error: "La fecha es requerida." }),
  amount: z.string().refine(val => parseFormattedNumber(val) > 0, { message: "El monto debe ser mayor a 0."}),
  description: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
});

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'income' | 'expense';
  transaction?: Transaction | null;
  categories: Categories;
  appId: string;
}

export function TransactionModal({ isOpen, onClose, type, transaction, categories, appId }: TransactionModalProps) {
  const isEditing = !!transaction;
  const { toast } = useToast();

  const sortedCategories = useMemo(() => Object.keys(categories).sort((a, b) => a.localeCompare(b)), [categories]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: transaction ? new Date(transaction.timestamp) : new Date(),
      amount: transaction ? formatNumber(transaction.amount) : '0',
      description: transaction?.description || '',
      category: transaction?.category || (type === 'expense' ? sortedCategories[0] : undefined),
      subcategory: transaction?.subcategory || (type === 'expense' ? categories[sortedCategories[0]]?.[0] : undefined),
    }
  });
  
  const selectedCategory = form.watch('category');

  const sortedSubcategories = useMemo(() => {
    if (selectedCategory && categories[selectedCategory]) {
      return [...categories[selectedCategory]].sort((a, b) => a.localeCompare(b));
    }
    return [];
  }, [selectedCategory, categories]);

  useEffect(() => {
    if (transaction) {
      form.reset({
        date: new Date(transaction.timestamp),
        amount: formatNumber(transaction.amount),
        description: transaction.description || '',
        category: transaction.category,
        subcategory: transaction.subcategory,
      });
    } else {
      const defaultCategory = type === 'expense' ? sortedCategories[0] : undefined;
      form.reset({
        date: new Date(),
        amount: '0',
        description: '',
        category: defaultCategory,
        subcategory: defaultCategory ? categories[defaultCategory]?.sort((a,b) => a.localeCompare(b))[0] : undefined
      });
    }
  }, [transaction, isOpen, form, categories, type, sortedCategories]);

  useEffect(() => {
    if (type === 'expense' && selectedCategory && !transaction) {
      form.setValue('subcategory', sortedSubcategories[0]);
    }
  }, [selectedCategory, form, type, transaction, sortedSubcategories]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const data = {
      type,
      amount: parseFormattedNumber(values.amount),
      date: format(values.date, 'yyyy-MM-dd'),
      timestamp: values.date.getTime(),
      ...(type === 'income' ? { description: values.description } : { category: values.category, subcategory: values.subcategory, description: values.subcategory })
    };

    try {
      if (isEditing) {
        const transRef = doc(db, "artifacts", appId, "public", "data", "transactions", transaction.id);
        await updateDoc(transRef, data);
        toast({ title: 'Éxito', description: 'Transacción actualizada correctamente.' });
      } else {
        await addDoc(collection(db, "artifacts", appId, "public", "data", "transactions"), data);
        toast({ title: 'Éxito', description: 'Transacción agregada correctamente.' });
      }
      onClose();
    } catch (error) {
      console.error("Error al guardar la transacción: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la transacción.' });
    }
  }
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      const formattedValue = formatNumber(parseFormattedNumber(value));
      form.setValue('amount', formattedValue);
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {isEditing ? 'Editar' : 'Registrar'} {type === 'income' ? 'Ingreso' : 'Gasto'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? format(field.value, "d 'de' MMMM 'de' yyyy", { locale: es }) : <span>Elige una fecha</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        locale={es}
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField control={form.control} name="amount" render={({ field }) => (
              <FormItem>
                <FormLabel>Monto</FormLabel>
                <FormControl>
                    <Input {...field} onChange={handleAmountChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}/>

            {type === 'expense' ? (
              <>
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {sortedCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}/>
                {selectedCategory && categories[selectedCategory] && (
                    <FormField control={form.control} name="subcategory" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Subcategoría</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una subcategoría" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {sortedSubcategories.map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}/>
                )}
              </>
            ) : (
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
            )}
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PlusCircle, Trash2, Edit, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmationDialog } from '../ConfirmationDialog';
import { formatNumber, parseFormattedNumber } from '@/lib/utils';

import type { RecordItem, RecordEntry } from '@/lib/types';
import { addDoc, collection, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface RecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: RecordItem[];
  appId: string;
  formatCurrency: (amount: number) => string;
}

export function RecordsModal({ isOpen, onClose, records, appId, formatCurrency }: RecordsModalProps) {
  const [newRecordName, setNewRecordName] = useState('');
  const [newEntry, setNewEntry] = useState<{ [key: string]: { description: string, amount: string } }>({});
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean, onConfirm: () => void, message: string }>({ open: false, onConfirm: () => {}, message: '' });
  
  const [editingRecord, setEditingRecord] = useState<{ id: string; name: string } | null>(null);
  const [editingEntry, setEditingEntry] = useState<{ recordId: string; index: number; description: string; amount: string } | null>(null);

  const { toast } = useToast();

  const handleAddRecord = async () => {
    if (newRecordName.trim()) {
      try {
        await addDoc(collection(db, "artifacts", appId, "public", "data", "records"), {
          name: newRecordName,
          entries: '[]'
        });
        setNewRecordName('');
        toast({ title: 'Registro agregado.' });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error al agregar registro.' });
      }
    }
  };

  const handleDeleteRecord = (recordId: string) => {
    setConfirmDialog({
      open: true,
      message: '¿Seguro que quieres eliminar este registro y todas sus entradas?',
      onConfirm: async () => {
        await deleteDoc(doc(db, "artifacts", appId, "public", "data", "records", recordId));
        setConfirmDialog({ open: false, onConfirm: () => {}, message: '' });
        toast({ title: 'Registro eliminado.' });
      }
    });
  };

  const handleUpdateRecordName = async () => {
    if (editingRecord && editingRecord.name.trim()) {
      await updateDoc(doc(db, "artifacts", appId, "public", "data", "records", editingRecord.id), { name: editingRecord.name });
      setEditingRecord(null);
      toast({ title: "Registro actualizado." });
    }
  };
  
  const handleAddEntry = async (record: RecordItem) => {
    const entry = newEntry[record.id];
    if (entry?.description.trim() && parseFormattedNumber(entry.amount) > 0) {
      const currentEntries: RecordEntry[] = JSON.parse(record.entries);
      const updatedEntries = [...currentEntries, { description: entry.description, amount: parseFormattedNumber(entry.amount) }];
      await updateDoc(doc(db, "artifacts", appId, "public", "data", "records", record.id), { entries: JSON.stringify(updatedEntries) });
      setNewEntry(prev => ({ ...prev, [record.id]: { description: '', amount: '0' } }));
    }
  };

  const handleDeleteEntry = async (record: RecordItem, entryIndex: number) => {
      const currentEntries: RecordEntry[] = JSON.parse(record.entries);
      const updatedEntries = currentEntries.filter((_, index) => index !== entryIndex);
      await updateDoc(doc(db, "artifacts", appId, "public", "data", "records", record.id), { entries: JSON.stringify(updatedEntries) });
  };
  
  const handleUpdateEntry = async (record: RecordItem) => {
    if (!editingEntry) return;

    const currentEntries: RecordEntry[] = JSON.parse(record.entries);
    const updatedEntries = [...currentEntries];
    updatedEntries[editingEntry.index] = {
      description: editingEntry.description,
      amount: parseFormattedNumber(editingEntry.amount),
    };
    
    await updateDoc(doc(db, "artifacts", appId, "public", "data", "records", record.id), { entries: JSON.stringify(updatedEntries) });
    setEditingEntry(null);
    toast({ title: "Entrada actualizada." });
  };


  const getRecordTotal = (record: RecordItem) => {
    try {
      const entries: RecordEntry[] = JSON.parse(record.entries);
      return entries.reduce((sum, entry) => sum + entry.amount, 0);
    } catch {
      return 0;
    }
  };

  const handleNewEntryAmountChange = (recordId: string, value: string) => {
    const formattedValue = formatNumber(parseFormattedNumber(value));
     setNewEntry(prev => ({
      ...prev,
      [recordId]: { ...(prev[recordId] || { description: '' }), amount: formattedValue },
    }));
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Gestión de Registros</DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 my-4">
            <Input
              placeholder="Nombre del nuevo registro"
              value={newRecordName}
              onChange={(e) => setNewRecordName(e.target.value)}
            />
            <Button onClick={handleAddRecord}>Agregar</Button>
          </div>

          <div className="max-h-[50vh] overflow-y-auto pr-2">
            <Accordion type="multiple" className="w-full">
              {records.map(record => (
                <AccordionItem value={record.id} key={record.id}>
                  <AccordionTrigger>
                    <div className="flex justify-between items-center w-full">
                      {editingRecord?.id === record.id ? (
                        <div className="flex gap-2 items-center flex-grow" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={editingRecord.name}
                            onChange={(e) => setEditingRecord({ ...editingRecord, name: e.target.value })}
                            className="h-8"
                          />
                          <Button size="icon" className="h-8 w-8" onClick={handleUpdateRecordName}><Save className="h-4 w-4"/></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingRecord(null)}><X className="h-4 w-4"/></Button>
                        </div>
                      ) : (
                        <span className="font-semibold">{record.name}</span>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-muted-foreground">{formatCurrency(getRecordTotal(record))}</span>
                        {editingRecord?.id !== record.id && (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-700" onClick={(e) => { e.stopPropagation(); setEditingRecord({ id: record.id, name: record.name }); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteRecord(record.id); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-4 space-y-2">
                    {JSON.parse(record.entries).map((entry: RecordEntry, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        {editingEntry?.recordId === record.id && editingEntry.index === index ? (
                           <div className="flex gap-2 items-center flex-grow" onClick={(e) => e.stopPropagation()}>
                             <Input
                                value={editingEntry.description}
                                onChange={(e) => setEditingEntry({ ...editingEntry, description: e.target.value })}
                                className="h-8 flex-grow"
                                placeholder="Descripción"
                             />
                             <Input
                                value={editingEntry.amount}
                                onChange={(e) => setEditingEntry({ ...editingEntry, amount: formatNumber(parseFormattedNumber(e.target.value)) })}
                                className="h-8 w-28"
                                placeholder="Monto"
                             />
                             <Button size="icon" className="h-8 w-8" onClick={() => handleUpdateEntry(record)}><Save className="h-4 w-4"/></Button>
                             <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingEntry(null)}><X className="h-4 w-4"/></Button>
                           </div>
                        ) : (
                          <>
                            <span>{entry.description}</span>
                            <div className="flex items-center gap-2">
                                <span>{formatCurrency(entry.amount)}</span>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500 hover:text-blue-700" onClick={() => setEditingEntry({ recordId: record.id, index, description: entry.description, amount: formatNumber(entry.amount) })}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteEntry(record, index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                    <div className="flex gap-2 items-center pt-2">
                      <Input
                        placeholder="Nueva descripción"
                        className="h-8"
                        value={newEntry[record.id]?.description || ''}
                        onChange={(e) => setNewEntry(prev => ({...prev, [record.id]: { ...(prev[record.id] || {amount: '0'}), description: e.target.value }}))}
                      />
                       <Input
                        placeholder="Monto"
                        className="h-8 w-28"
                        value={newEntry[record.id]?.amount || '0'}
                        onChange={(e) => handleNewEntryAmountChange(record.id, e.target.value)}
                      />
                      <Button size="icon" className="h-8 w-8" onClick={() => handleAddEntry(record)}>
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              onClose();
              setEditingRecord(null);
              setEditingEntry(null);
            }}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => !open && setConfirmDialog({ open: false, onConfirm: () => {}, message: '' })}
        onConfirm={confirmDialog.onConfirm}
        message={confirmDialog.message}
      />
    </>
  );
}

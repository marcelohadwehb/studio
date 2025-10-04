'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmationDialog } from '../ConfirmationDialog';

import type { Categories } from '@/lib/types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Categories;
  appId: string;
}

export function CategoriesModal({ isOpen, onClose, categories, appId }: CategoriesModalProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategory, setNewSubcategory] = useState<{ [key: string]: string }>({});
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean, onConfirm: () => void, message: string }>({ open: false, onConfirm: () => {}, message: '' });
  const { toast } = useToast();

  const saveCategories = async (updatedCategories: Categories) => {
    try {
      const categoriesRef = doc(db, "artifacts", appId, "public", "data", "categories", "categories");
      await setDoc(categoriesRef, updatedCategories);
      toast({ title: 'Categorías guardadas.' });
    } catch (error) {
      console.error("Error saving categories:", error);
      toast({ variant: 'destructive', title: 'Error al guardar.' });
    }
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim() && !categories[newCategoryName.trim()]) {
      const updated = { ...categories, [newCategoryName.trim()]: [] };
      saveCategories(updated);
      setNewCategoryName('');
    }
  };

  const handleDeleteCategory = (catName: string) => {
    setConfirmDialog({
      open: true,
      message: `¿Seguro que quieres eliminar la categoría "${catName}" y todas sus subcategorías?`,
      onConfirm: () => {
        const updated = { ...categories };
        delete updated[catName];
        saveCategories(updated);
        setConfirmDialog({ open: false, onConfirm: () => {}, message: '' });
      }
    });
  };

  const handleAddSubcategory = (catName: string) => {
    const subcatName = newSubcategory[catName]?.trim();
    if (subcatName && !categories[catName].includes(subcatName)) {
      const updated = { ...categories, [catName]: [...categories[catName], subcatName] };
      saveCategories(updated);
      setNewSubcategory(prev => ({ ...prev, [catName]: '' }));
    }
  };
  
  const handleDeleteSubcategory = (catName: string, subcatName: string) => {
    const updated = { ...categories, [catName]: categories[catName].filter(s => s !== subcatName) };
    saveCategories(updated);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Gestión de Categorías</DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 my-4">
            <Input
              placeholder="Nueva categoría"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <Button onClick={handleAddCategory}>Agregar</Button>
          </div>

          <div className="max-h-[50vh] overflow-y-auto pr-2">
            <Accordion type="multiple" className="w-full">
              {Object.keys(categories).map(cat => (
                <AccordionItem value={cat} key={cat}>
                  <AccordionTrigger>
                    <div className="flex justify-between items-center w-full">
                      <span>{cat}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-4 space-y-2">
                    {categories[cat].map(subcat => (
                      <div key={subcat} className="flex items-center justify-between text-sm">
                        <span>{subcat}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteSubcategory(cat, subcat)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2 items-center pt-2">
                      <Input
                        placeholder="Nueva subcategoría"
                        className="h-8"
                        value={newSubcategory[cat] || ''}
                        onChange={(e) => setNewSubcategory(prev => ({...prev, [cat]: e.target.value}))}
                      />
                      <Button size="icon" className="h-8 w-8" onClick={() => handleAddSubcategory(cat)}>
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cerrar</Button>
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

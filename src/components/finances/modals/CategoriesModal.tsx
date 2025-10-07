'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2, Edit, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmationDialog } from '../ConfirmationDialog';

import type { Categories, TemporaryCategories } from '@/lib/types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Categories;
  tempCategories: TemporaryCategories;
  appId: string;
}

export function CategoriesModal({ isOpen, onClose, categories, tempCategories, appId }: CategoriesModalProps) {
  const [categoryType, setCategoryType] = useState<'permanent' | 'temporary'>('permanent');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategory, setNewSubcategory] = useState<{ [key: string]: string }>({});
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean, onConfirm: () => void, message: string }>({ open: false, onConfirm: () => {}, message: '' });
  
  const [editingCategory, setEditingCategory] = useState<{ oldName: string; newName: string } | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<{ category: string; oldName: string; newName: string } | null>(null);

  const { toast } = useToast();

  const currentCategories = categoryType === 'permanent' ? categories : tempCategories;

  const saveCategories = async (updatedCategories: Categories | TemporaryCategories) => {
    try {
      const docId = categoryType === 'permanent' ? 'categories' : 'temp_categories';
      const collectionPath = categoryType === 'permanent' ? 'categories' : 'temp_categories';
      
      const categoriesRef = doc(db, "artifacts", appId, "public", "data", collectionPath, docId);
      await setDoc(categoriesRef, updatedCategories);
      toast({ title: 'Categorías guardadas.' });
    } catch (error) {
      console.error("Error saving categories:", error);
      toast({ variant: 'destructive', title: 'Error al guardar.' });
    }
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim() && !currentCategories[newCategoryName.trim()]) {
      const updated = { ...currentCategories, [newCategoryName.trim()]: [] };
      saveCategories(updated);
      setNewCategoryName('');
    }
  };

  const handleUpdateCategoryName = () => {
    if (!editingCategory || !editingCategory.newName.trim() || editingCategory.newName === editingCategory.oldName) {
      setEditingCategory(null);
      return;
    }

    const { oldName, newName } = editingCategory;
    
    const updatedCategories = { ...currentCategories };
    if (updatedCategories[newName] !== undefined) {
      toast({ variant: 'destructive', title: 'Error', description: 'La categoría ya existe.'});
      return;
    }

    updatedCategories[newName] = updatedCategories[oldName];
    delete updatedCategories[oldName];
    
    saveCategories(updatedCategories);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (catName: string) => {
    setConfirmDialog({
      open: true,
      message: `¿Seguro que quieres eliminar la categoría "${catName}" y todas sus subcategorías?`,
      onConfirm: () => {
        const updated = { ...currentCategories };
        delete updated[catName];
        saveCategories(updated);
        setConfirmDialog({ open: false, onConfirm: () => {}, message: '' });
      }
    });
  };

  const handleAddSubcategory = (catName: string) => {
    const subcatName = newSubcategory[catName]?.trim();
    if (subcatName && !currentCategories[catName].includes(subcatName)) {
      const updated = { ...currentCategories, [catName]: [...currentCategories[catName], subcatName] };
      saveCategories(updated);
      setNewSubcategory(prev => ({ ...prev, [catName]: '' }));
    }
  };
  
  const handleDeleteSubcategory = (catName: string, subcatName: string) => {
    const updated = { ...currentCategories, [catName]: currentCategories[catName].filter(s => s !== subcatName) };
    saveCategories(updated);
  };
  
  const handleUpdateSubcategoryName = () => {
    if (!editingSubcategory || !editingSubcategory.newName.trim() || editingSubcategory.newName === editingSubcategory.oldName) {
      setEditingSubcategory(null);
      return;
    }
    
    const { category, oldName, newName } = editingSubcategory;
    const subcategories = currentCategories[category];

    if (subcategories.includes(newName)) {
      toast({ variant: 'destructive', title: 'Error', description: 'La subcategoría ya existe.'});
      return;
    }

    const updatedSubcategories = subcategories.map(s => s === oldName ? newName : s);
    
    const updatedCategories = { ...currentCategories, [category]: updatedSubcategories };
    saveCategories(updatedCategories);
    setEditingSubcategory(null);
  };
  
  const handleDialogClose = () => {
    onClose();
    setEditingCategory(null);
    setEditingSubcategory(null);
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Gestión de Categorías</DialogTitle>
          </DialogHeader>

          <RadioGroup
            defaultValue="permanent"
            onValueChange={(value: 'permanent' | 'temporary') => setCategoryType(value)}
            className="flex justify-center gap-4 my-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="permanent" id="r-permanent" />
              <Label htmlFor="r-permanent">Presupuesto Permanente</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="temporary" id="r-temporary" />
              <Label htmlFor="r-temporary">Presupuesto Temporal</Label>
            </div>
          </RadioGroup>

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
              {Object.keys(currentCategories).sort((a, b) => a.localeCompare(b)).map(cat => (
                <AccordionItem value={cat} key={cat}>
                  <AccordionTrigger>
                    <div className="flex justify-between items-center w-full">
                       {editingCategory?.oldName === cat ? (
                        <div className="flex gap-2 items-center flex-grow" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={editingCategory.newName}
                            onChange={(e) => setEditingCategory({ ...editingCategory, newName: e.target.value })}
                            className="h-8"
                          />
                          <Button size="icon" className="h-8 w-8" onClick={handleUpdateCategoryName}><Save className="h-4 w-4"/></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingCategory(null)}><X className="h-4 w-4"/></Button>
                        </div>
                      ) : (
                        <span className="font-semibold">{cat}</span>
                      )}
                      <div className="flex items-center">
                        {editingCategory?.oldName !== cat && (
                           <>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-700" onClick={(e) => { e.stopPropagation(); setEditingCategory({ oldName: cat, newName: cat }); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-4 space-y-2">
                    {currentCategories[cat].sort((a, b) => a.localeCompare(b)).map(subcat => (
                      <div key={subcat} className="flex items-center justify-between text-sm">
                         {editingSubcategory?.oldName === subcat && editingSubcategory?.category === cat ? (
                           <div className="flex gap-2 items-center flex-grow" onClick={(e) => e.stopPropagation()}>
                             <Input
                                value={editingSubcategory.newName}
                                onChange={(e) => setEditingSubcategory({ ...editingSubcategory, newName: e.target.value })}
                                className="h-8"
                             />
                             <Button size="icon" className="h-8 w-8" onClick={handleUpdateSubcategoryName}><Save className="h-4 w-4"/></Button>
                             <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingSubcategory(null)}><X className="h-4 w-4"/></Button>
                           </div>
                        ) : (
                          <>
                            <span>{subcat}</span>
                            <div className="flex items-center">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500 hover:text-blue-700" onClick={() => setEditingSubcategory({ category: cat, oldName: subcat, newName: subcat })}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteSubcategory(cat, subcat)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                          </>
                        )}
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
            <Button type="button" variant="outline" onClick={handleDialogClose}>Cerrar</Button>
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

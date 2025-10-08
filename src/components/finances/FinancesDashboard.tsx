'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { db, auth, signIn } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, query, where, getDocs, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import type { Transaction, Categories, Budgets, RecordItem, ModalState, TemporaryBudgets, TemporaryCategories } from '@/lib/types';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";

import { Header } from './Header';
import { BalanceSummary } from './BalanceSummary';
import { ActionButtons } from './ActionButtons';
import { TransactionList } from './TransactionList';
import { TransactionModal } from './modals/TransactionModal';
import { BudgetsModal } from './modals/BudgetsModal';
import { CategoriesModal } from './modals/CategoriesModal';
import { RecordsModal } from './modals/RecordsModal';
import { ConfirmationDialog } from './ConfirmationDialog';
import { PinScreen } from './PinScreen';
import { CleanDataModal } from './modals/CleanDataModal';
import { ChartsModal } from './modals/ChartsModal';
import { ThemeModal } from './modals/ThemeModal';
import { applyTheme } from '@/lib/theme';


const appId = 'default-app-id';

export function FinancesDashboard() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Categories>({});
  const [budgets, setBudgets] = useState<Budgets>({});
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [tempCategories, setTempCategories] = useState<TemporaryCategories>({});
  const [tempBudgets, setTempBudgets] = useState<TemporaryBudgets>({});
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [isUnlocked, setIsUnlocked] = useState(false);


  const [modalState, setModalState] = useState<ModalState>({ type: null });
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean, onConfirm: () => void, message: string }>({ open: false, onConfirm: () => {}, message: '' });
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'income' | 'expense'>('all');

  const { toast } = useToast();

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme) {
      applyTheme(JSON.parse(savedTheme));
    }
  }, []);

  useEffect(() => {
    const initAuthAndListeners = async () => {
      try {
        await signIn();
        const user = auth.currentUser;
        if (user) {
          setAuthStatus('success');
        } else {
          throw new Error("La autenticación falló.");
        }
      } catch (error) {
        setAuthStatus('error');
        setLoading(false);
      }
    };
    if (isUnlocked) {
        initAuthAndListeners();
    }
  }, [isUnlocked]);

  useEffect(() => {
    if (authStatus !== 'success' || !isUnlocked) return;

    const unsubscribes: (() => void)[] = [];
    setLoading(true);

    const setupListener = (coll: string, docId: string | null, setData: (data: any) => void, isCollection = !docId) => {
      const ref = isCollection ? collection(db, "artifacts", appId, "public", "data", coll) : doc(db, "artifacts", appId, "public", "data", coll, docId!);
      const unsubscribe = onSnapshot(ref as any, (snapshot: any) => {
        if (isCollection) {
          const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
          setData(data);
        } else {
          const data = snapshot.exists() ? snapshot.data() : {};
          setData(data);
        }
      });
      unsubscribes.push(unsubscribe);
    };

    const categoriesRef = doc(db, "artifacts", appId, "public", "data", "categories", "categories");
    unsubscribes.push(onSnapshot(categoriesRef, async (docSnapshot) => {
        if (docSnapshot.exists()) {
            setCategories(docSnapshot.data() as Categories);
        } else {
            const defaultCategories: Categories = {
                'Fijos del hogar': ['Dividendo', 'Luz', 'Agua', 'Gas', 'Basura', 'Wifi', 'Streaming', 'Mantención Aire', 'Plan móvil'],
                'Alimentación': ['Supermercado', 'Feria'],
                'Educación': ['Matrícula', 'Arancel'],
                'Salud': ['Seguro'],
                'Transporte': ['BIP', 'Combustible', 'Permiso circulación', 'Mantención', 'TAG'],
                'Gin': ['Comida', 'Salud'],
                'Eventos': ['Navidad', 'Vacaciones', 'Cumple hija', 'Cumple BR', 'Cumple DT', 'Cumpleaños'],
                'Presupuestos individuales': ['Presupuesto BR', 'Presupuesto Hija', 'Presupuesto DT']
            };
            await setDoc(categoriesRef, defaultCategories);
            setCategories(defaultCategories);
        }
    }));
    
    setupListener("budgets", "budgets", setBudgets);
    setupListener("records", null, setRecords);
    setupListener("temp_budgets", "temp_budgets", setTempBudgets);
    setupListener("temp_categories", "temp_categories", setTempCategories);
    
    const allTransQuery = collection(db, "artifacts", appId, "public", "data", "transactions");
    unsubscribes.push(onSnapshot(allTransQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
        setAllTransactions(data);
        setLoading(false);
    }));

    return () => unsubscribes.forEach(unsub => unsub());
  }, [authStatus, isUnlocked]);

  const transactionsForCurrentMonth = useMemo(() => {
    const startOfMonth = new Date(currentYear, currentMonth, 1).getTime();
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).getTime();
    return allTransactions.filter(t => t.timestamp >= startOfMonth && t.timestamp <= endOfMonth);
  }, [allTransactions, currentMonth, currentYear]);

  const { totalIncome, totalExpenses, balance } = useMemo(() => {
    return transactionsForCurrentMonth.reduce((acc, t) => {
      if (t.type === 'income') acc.totalIncome += t.amount;
      else acc.totalExpenses += t.amount;
      acc.balance = acc.totalIncome - acc.totalExpenses;
      return acc;
    }, { totalIncome: 0, totalExpenses: 0, balance: 0 });
  }, [transactionsForCurrentMonth]);
  
  const filteredTransactions = useMemo(() => {
    if (transactionFilter === 'all') {
      return transactionsForCurrentMonth;
    }
    return transactionsForCurrentMonth.filter(t => t.type === transactionFilter);
  }, [transactionsForCurrentMonth, transactionFilter]);

  const handleOpenModal = useCallback((type: ModalState['type'], transactionToEdit: Transaction | null = null) => {
    setModalState({ type, transactionToEdit });
  }, []);

  const handleCloseModal = () => setModalState({ type: null });

  const handleDeleteTransaction = useCallback((id: string) => {
    setConfirmDialog({
      open: true,
      message: '¿Estás seguro de que quieres eliminar esta transacción?',
      onConfirm: async () => {
        await deleteDoc(doc(db, "artifacts", appId, "public", "data", "transactions", id));
        toast({ title: "Transacción eliminada" });
        setConfirmDialog({ open: false, onConfirm: () => {}, message: '' });
      }
    });
  }, [toast]);
  
  const formatCurrency = (amount: number) => {
    return `$ ${new Intl.NumberFormat('es-CL').format(Math.trunc(amount))}`;
  };

  const handleExport = useCallback(async (exportType: 'month' | 'year' | 'last5years') => {
    toast({ title: `Exportando...` });

    let fileName = `Finanzas-Familiares`;
    const now = new Date();
    
    let startTimestamp: number, endTimestamp: number;

    if (exportType === 'month') {
        startTimestamp = new Date(currentYear, currentMonth, 1).getTime();
        endTimestamp = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).getTime();
        const monthName = currentDate.toLocaleString('es-CL', { month: 'long' });
        fileName += `-${monthName}-${currentYear}.csv`;
    } else {
        let start: Date;
        if (exportType === 'year') {
            start = new Date(currentYear, 0, 1);
            fileName += `-Año-${currentYear}.csv`;
        } else { // last5years
            start = new Date(now.getFullYear() - 5, 0, 1);
            fileName += `-Ultimos-5-Años.csv`;
        }
        startTimestamp = start.getTime();
        endTimestamp = now.getTime();
    }
    
    const transToExport = allTransactions.filter(t => t.timestamp >= startTimestamp && t.timestamp <= endTimestamp);

    const toCsv = (headers: string[], data: string[][]) => {
      return [headers.join(';'), ...data.map(row => row.join(';'))].join('\n');
    }

    // 1. Transactions CSV
    const transHeaders = ["Fecha", "Tipo", "Descripción", "Categoría", "Subcategoría", "Monto"];
    const transRows = transToExport.map(t => [
        t.date,
        t.type === 'income' ? 'Ingreso' : 'Gasto',
        `"${t.description || ''}"`,
        t.category || '',
        t.subcategory || '',
        t.amount.toString()
    ]);
    const transCsv = toCsv(transHeaders, transRows);

    const expensesBySubcategory = transToExport
        .filter(t => t.type === 'expense' && t.subcategory)
        .reduce((acc, t) => {
            if (!acc[t.subcategory!]) acc[t.subcategory!] = 0;
            acc[t.subcategory!] += t.amount;
            return acc;
        }, {} as { [key: string]: number });

    const budgetRows: string[][] = [];
    
    // Permanent Budgets
    Object.entries(categories).forEach(([cat, subcats]) => {
        subcats.forEach(subcat => {
            const budgetAmount = budgets[subcat] || 0;
            if (budgetAmount > 0) {
              const spent = expensesBySubcategory[subcat] || 0;
              const diff = budgetAmount - spent;
              budgetRows.push([cat, subcat, budgetAmount.toString(), spent.toString(), diff.toString()]);
            }
        });
    });

    // Temporary Budgets
    Object.entries(tempCategories).forEach(([cat, subcats]) => {
        subcats.forEach(subcat => {
            const tempBudget = tempBudgets[subcat];
            if (tempBudget && tempBudget.from && tempBudget.to && typeof tempBudget.from.year === 'number') {
                 const fromDate = new Date(tempBudget.from.year, tempBudget.from.month, 1);
                 const toDate = new Date(tempBudget.to.year, tempBudget.to.month + 1, 0);

                 if (fromDate.getTime() <= endTimestamp && toDate.getTime() >= startTimestamp) {
                    const budgetAmount = tempBudget.amount || 0;
                    const spent = expensesBySubcategory[subcat] || 0;
                    const diff = budgetAmount - spent;
                    budgetRows.push([cat, subcat, budgetAmount.toString(), spent.toString(), diff.toString()]);
                 }
            }
        });
    });

    const budgetHeaders = ["Categoría", "Subcategoría", "Presupuesto", "Gastado", "Diferencial"];
    const budgetsCsv = toCsv(budgetHeaders, budgetRows);

    // 3. Records CSV
    const recordsHeaders = ["Registro", "Descripción", "Monto"];
    const recordsRows = records.flatMap(record => {
      if (!record.entries) return [];
      try {
        const entries: { description: string, amount: number }[] = JSON.parse(record.entries);
        return entries.map(entry => [record.name, `"${entry.description}"`, entry.amount.toString()]);
      } catch (e) {
        console.error("Error parsing record entries", e);
        return [];
      }
    });
    const recordsCsv = toCsv(recordsHeaders, recordsRows);

    const csvContent = "\uFEFF" + 
      "TRANSACCIONES\n" + transCsv + "\n\n" +
      "PRESUPUESTOS\n" + budgetsCsv + "\n\n" +
      "REGISTROS\n" + recordsCsv;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: "¡Archivo exportado!" });
  }, [currentMonth, currentYear, currentDate, toast, allTransactions, records, budgets, tempBudgets, categories, tempCategories]);
  
  const handleCleanData = async (startDate: Date, endDate: Date) => {
    setConfirmDialog({
      open: true,
      message: `¿Estás seguro de que quieres eliminar las transacciones entre ${startDate.toLocaleDateString()} y ${endDate.toLocaleDateString()}? Esta acción es irreversible.`,
      onConfirm: async () => {
        toast({ title: 'Limpiando transacciones...' });
        
        const startTime = startDate.getTime();
        const endTime = endDate.getTime();
        
        const transQuery = query(
          collection(db, "artifacts", appId, "public", "data", "transactions"),
          where("timestamp", ">=", startTime),
          where("timestamp", "<=", endTime)
        );

        const transSnapshot = await getDocs(transQuery);
        
        if (transSnapshot.empty) {
            toast({ title: 'No hay transacciones para limpiar en el período seleccionado.', variant: 'default' });
        } else {
            const batch = writeBatch(db);
            transSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            toast({ title: `¡Limpieza completada! ${transSnapshot.size} transacciones eliminadas.` });
        }
        
        setConfirmDialog({ open: false, onConfirm: () => {}, message: '' });
        handleCloseModal();
      }
    });
  };


  if (!isUnlocked) {
    return <PinScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  if (authStatus === 'loading' || loading) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 md:p-8">
        <Skeleton className="h-24 w-full mb-6" />
        <Skeleton className="h-12 w-full mb-6" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (authStatus === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm text-center">
            <h3 className="text-2xl font-bold mb-4 text-destructive">Acceso Denegado</h3>
            <p className="text-muted-foreground">No tienes permiso para acceder a esta aplicación.</p>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-auto overflow-hidden transition-all duration-300">
      <Header 
        currentDate={currentDate} 
        setCurrentDate={setCurrentDate} 
        onExport={handleExport}
        onOpenCleanDataModal={() => handleOpenModal('cleanData')}
        onOpenThemeModal={() => handleOpenModal('theme')}
      />
      
      <main className="p-4 sm:p-6">
        <BalanceSummary 
          income={totalIncome}
          expenses={totalExpenses}
          balance={balance}
          formatCurrency={formatCurrency}
        />
        
        <ActionButtons onOpenModal={handleOpenModal} />
        
        <TransactionList 
          transactions={filteredTransactions}
          loading={loading}
          onEdit={(t) => handleOpenModal('expense', t)}
          onDelete={handleDeleteTransaction}
          formatCurrency={formatCurrency}
          filter={transactionFilter}
          setFilter={setTransactionFilter}
        />
      </main>

      {modalState.type && (
        <>
          {(modalState.type === 'income' || modalState.type === 'expense') && (
            <TransactionModal
              isOpen={true}
              onClose={handleCloseModal}
              type={modalState.type}
              transaction={modalState.transactionToEdit}
              categories={categories}
              tempCategories={tempCategories}
              appId={appId}
            />
          )}
          {modalState.type === 'budgets' && (
            <BudgetsModal
              isOpen={true}
              onClose={handleCloseModal}
              categories={categories}
              budgets={budgets}
              transactions={transactionsForCurrentMonth}
              appId={appId}
              formatCurrency={formatCurrency}
              currentDate={currentDate}
              tempBudgets={tempBudgets}
              tempCategories={tempCategories}
            />
          )}
          {modalState.type === 'categories' && (
            <CategoriesModal
              isOpen={true}
              onClose={handleCloseModal}
              categories={categories}
              tempCategories={tempCategories}
              appId={appId}
            />
          )}
          {modalState.type === 'records' && (
            <RecordsModal
              isOpen={true}
              onClose={handleCloseModal}
              records={records}
              appId={appId}
              formatCurrency={formatCurrency}
            />
          )}
           {modalState.type === 'cleanData' && (
            <CleanDataModal
              isOpen={true}
              onClose={handleCloseModal}
              onClean={handleCleanData}
            />
          )}
          {modalState.type === 'charts' && (
            <ChartsModal
              isOpen={true}
              onClose={handleCloseModal}
              allTransactions={allTransactions}
              currentDate={currentDate}
              formatCurrency={formatCurrency}
              categories={categories}
              budgets={budgets}
              tempCategories={tempCategories}
              tempBudgets={tempBudgets}
            />
          )}
          {modalState.type === 'theme' && (
            <ThemeModal
              isOpen={true}
              onClose={handleCloseModal}
            />
          )}
        </>
      )}

      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => !open && setConfirmDialog({ open: false, onConfirm: () => {}, message: '' })}
        onConfirm={confirmDialog.onConfirm}
        message={confirmDialog.message}
      />
      
      <footer className="text-center p-4 text-xs text-muted-foreground">
        Creado por Marcelo Hadweh Briceño
      </footer>
    </div>
  );
}

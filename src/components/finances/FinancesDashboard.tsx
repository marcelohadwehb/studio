'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { db, auth, signIn } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, query, where, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Transaction, Categories, Budgets, RecordItem, ModalState } from '@/lib/types';

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

const appId = 'default-app-id';

export function FinancesDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Categories>({});
  const [budgets, setBudgets] = useState<Budgets>({});
  const [records, setRecords] = useState<RecordItem[]>([]);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<'loading' | 'success' | 'error'>('loading');

  const [modalState, setModalState] = useState<ModalState>({ type: null });
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean, onConfirm: () => void, message: string }>({ open: false, onConfirm: () => {}, message: '' });
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'income' | 'expense'>('all');

  const { toast } = useToast();

  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    const initAuthAndListeners = async () => {
      try {
        await signIn();
        const user = auth.currentUser;
        if (user) {
          setAuthStatus('success');
        } else {
          throw new Error("Authentication failed.");
        }
      } catch (error) {
        setAuthStatus('error');
        setLoading(false);
      }
    };
    initAuthAndListeners();
  }, []);

  useEffect(() => {
    if (authStatus !== 'success') return;

    const unsubscribes: (() => void)[] = [];
    setLoading(true);

    const setupListener = (coll: string, docId: string | null, setData: (data: any) => void, isCollection = !docId) => {
      const ref = isCollection ? collection(db, "artifacts", appId, "public", "data", coll) : doc(db, "artifacts", appId, "public", "data", coll, docId!);
      const unsubscribe = onSnapshot(ref as any, (snapshot: any) => {
        if (isCollection) {
          const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
          setData(data);
        } else {
          setData(snapshot.exists() ? snapshot.data() : {});
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

    const startOfMonth = new Date(currentYear, currentMonth - 1, 1).getTime();
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59).getTime();
    const transQuery = query(collection(db, "artifacts", appId, "public", "data", "transactions"),
        where("timestamp", ">=", startOfMonth),
        where("timestamp", "<=", endOfMonth)
    );
    unsubscribes.push(onSnapshot(transQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
        setTransactions(data);
        setLoading(false);
    }));

    return () => unsubscribes.forEach(unsub => unsub());
  }, [authStatus, currentMonth, currentYear]);

  const { totalIncome, totalExpenses, balance } = useMemo(() => {
    return transactions.reduce((acc, t) => {
      if (t.type === 'income') acc.totalIncome += t.amount;
      else acc.totalExpenses += t.amount;
      acc.balance = acc.totalIncome - acc.totalExpenses;
      return acc;
    }, { totalIncome: 0, totalExpenses: 0, balance: 0 });
  }, [transactions]);
  
  const filteredTransactions = useMemo(() => {
    if (transactionFilter === 'all') {
      return transactions;
    }
    return transactions.filter(t => t.type === transactionFilter);
  }, [transactions, transactionFilter]);

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
  
  const formatCurrency = (amount: number) => `$${amount.toLocaleString('es-CL')}`;

  const handleExport = useCallback(async (fullYear: boolean) => {
    toast({ title: `Exportando ${fullYear ? 'año completo' : 'mes'}...` });
    
    let transToExport = transactions;
    if (fullYear) {
      const start = new Date(currentYear, 0, 1).getTime();
      const end = new Date(currentYear, 11, 31, 23, 59, 59).getTime();
      const q = query(collection(db, "artifacts", appId, "public", "data", "transactions"), where("timestamp", ">=", start), where("timestamp", "<=", end));
      const querySnapshot = await getDocs(q);
      transToExport = querySnapshot.docs.map(doc => doc.data() as Transaction);
    }
    
    const recordsSnapshot = await getDocs(collection(db, "artifacts", appId, "public", "data", "records"));
    const allRecords = recordsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecordItem));

    const toCsv = (headers: string[], data: string[][]) => {
      return [headers.join(';'), ...data.map(row => row.join(';'))].join('\n');
    }

    const transHeaders = ["Fecha", "Tipo", "Descripción", "Categoría", "Subcategoría", "Monto"];
    const transRows = transToExport.map(t => [
        t.date,
        t.type === 'income' ? 'Ingreso' : 'Gasto',
        `"${t.description || ''}"`,
        t.category || '',
        t.subcategory || '',
        t.amount.toString()
    ]);

    const recordsHeaders = ["Registro", "Descripción", "Monto"];
    const recordsRows = allRecords.flatMap(record => {
      const entries: { description: string, amount: number }[] = JSON.parse(record.entries);
      return entries.map(entry => [record.name, `"${entry.description}"`, entry.amount.toString()]);
    });

    const csvContent = "\uFEFF" + "TRANSACCIONES\n" + toCsv(transHeaders, transRows) + "\n\nREGISTROS\n" + toCsv(recordsHeaders, recordsRows);
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const monthName = currentDate.toLocaleString('es-CL', { month: 'long' });
    const fileName = fullYear ? `Finanzas-Familiares-Año-${currentYear}.csv` : `Finanzas-Familiares-${monthName}-${currentYear}.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: "¡Archivo exportado!" });
  }, [transactions, currentYear, currentDate, toast]);

  if (authStatus === 'loading') {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <Skeleton className="h-24 w-full mb-6" />
        <Skeleton className="h-12 w-full mb-6" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (authStatus === 'error') {
    return (
      <Card className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm text-center">
        <h3 className="text-2xl font-bold mb-4 text-destructive">Acceso Denegado</h3>
        <p className="text-muted-foreground">No tienes permiso para acceder a esta aplicación.</p>
      </Card>
    );
  }
  
  return (
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-auto overflow-hidden transition-all duration-300">
      <Header 
        currentDate={currentDate} 
        setCurrentDate={setCurrentDate} 
        onExport={handleExport}
      />
      
      <main className="p-6">
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
          onEdit={(t) => handleOpenModal(t.type, t)}
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
              appId={appId}
            />
          )}
          {modalState.type === 'budgets' && (
            <BudgetsModal
              isOpen={true}
              onClose={handleCloseModal}
              categories={categories}
              budgets={budgets}
              transactions={transactions}
              appId={appId}
              formatCurrency={formatCurrency}
            />
          )}
          {modalState.type === 'categories' && (
            <CategoriesModal
              isOpen={true}
              onClose={handleCloseModal}
              categories={categories}
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
        </>
      )}

      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => !open && setConfirmDialog({ open: false, onConfirm: () => {}, message: '' })}
        onConfirm={confirmDialog.onConfirm}
        message={confirmDialog.message}
      />
    </div>
  );
}

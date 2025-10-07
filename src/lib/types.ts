export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  date: string; // YYYY-MM-DD
  timestamp: number;
  description?: string;
  category?: string;
  subcategory?: string;
}

export interface Categories {
  [category: string]: string[];
}

export interface TemporaryBudget {
  id: string;
  startDate: number; // timestamp
  endDate: number; // timestamp
  amount: number;
}

export interface BudgetEntry {
  permanent: number;
  temporaries?: TemporaryBudget[];
}

export interface Budgets {
  [subcategory:string]: BudgetEntry;
}

export interface RecordEntry {
  description: string;
  amount: number;
}

export interface RecordItem {
  id: string;
  name: string;
  entries: string; // JSON string of RecordEntry[]
}

export interface ModalState {
  type: 'income' | 'expense' | 'budgets' | 'categories' | 'records' | 'cleanData' | null;
  transactionToEdit?: Transaction | null;
}

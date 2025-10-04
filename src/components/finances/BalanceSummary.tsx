'use client';

interface BalanceSummaryProps {
  income: number;
  expenses: number;
  balance: number;
  formatCurrency: (amount: number) => string;
}

export function BalanceSummary({ income, expenses, balance, formatCurrency }: BalanceSummaryProps) {
  const balanceColor = balance >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <section className="mb-6 bg-card rounded-lg p-4 shadow-sm border">
      <h2 className="text-lg font-semibold text-center mb-3 text-card-foreground">Balance Mensual</h2>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-muted-foreground text-sm">Ingresos</p>
          <p className="text-green-600 font-bold text-lg">{formatCurrency(income)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Gastos</p>
          <p className="text-red-600 font-bold text-lg">{formatCurrency(expenses)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Balance</p>
          <p className={`font-bold text-lg ${balanceColor}`}>{formatCurrency(balance)}</p>
        </div>
      </div>
    </section>
  );
}

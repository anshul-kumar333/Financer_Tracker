import { useQuery } from "@tanstack/react-query";
import TransactionList from "@/components/transaction-list";
import BalanceCard from "@/components/balance-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Transaction } from "@shared/schema";

export default function Home() {
  const { data: transactions, isLoading, error } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  if (isLoading) {
    return (
      <div className="space-y-4 pt-4">
        {/* Balance card skeleton */}
        <Skeleton className="h-36 w-full rounded-md" />
        <Skeleton className="h-8 w-48 mt-6 mb-2" /> {/* For the Transactions heading */}
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-4 text-red-500">
        Error loading transactions. Please try again.
      </div>
    );
  }

  return (
    <div className="pt-4">
      {/* Add the balance card at the top */}
      <BalanceCard transactions={transactions || []} />
      
      <h1 className="text-2xl font-bold text-[#202124] mb-6">Transactions</h1>
      {transactions && transactions.length > 0 ? (
        <TransactionList transactions={transactions} />
      ) : (
        <p className="text-gray-500 text-center py-8">No transactions yet</p>
      )}
    </div>
  );
}
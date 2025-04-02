import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import type { Transaction } from "@shared/schema";

interface BalanceCardProps {
  transactions: Transaction[];
  initialBalance?: number;
}

export default function BalanceCard({ transactions, initialBalance = 20000 }: BalanceCardProps) {
  // Calculate current balance based on transactions
  const balance = transactions.reduce((total, transaction) => {
    if (transaction.type === "receive") {
      return total + parseFloat(transaction.amount.toString());
    } else if (transaction.type === "give") {
      return total - parseFloat(transaction.amount.toString());
    }
    return total;
  }, initialBalance);

  // Get total income and expenses
  const income = transactions
    .filter(t => t.type === "receive")
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
  const expenses = transactions
    .filter(t => t.type === "give")
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

  return (
    <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white mb-6">
      <CardContent className="p-6">
        <h2 className="text-lg font-medium opacity-90">Current Balance</h2>
        <p className="text-3xl font-bold mt-1">₹{balance.toFixed(2)}</p>
        
        <div className="flex justify-between mt-4">
          <div className="flex items-center">
            <ArrowDownCircle className="h-5 w-5 mr-2 text-green-300" />
            <div>
              <p className="text-sm opacity-90">Income</p>
              <p className="font-medium">₹{income.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <ArrowUpCircle className="h-5 w-5 mr-2 text-red-300" />
            <div>
              <p className="text-sm opacity-90">Expenses</p>
              <p className="font-medium">₹{expenses.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
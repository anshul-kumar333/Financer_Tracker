import { type Transaction } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

const icons = {
  receive: ArrowUpRight,
  give: ArrowDownRight,
};

const colors = {
  receive: "text-[#34A853]",
  give: "text-[#EA4335]",
};

export default function TransactionList({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="space-y-4">
      {transactions.map((transaction) => {
        const Icon = icons[transaction.type];
        const color = colors[transaction.type];

        return (
          <Card key={transaction.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className={`p-2 rounded-full bg-gray-100 ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#202124]">{transaction.description}</h3>
                    <p className="text-sm text-gray-500 capitalize">
                      {transaction.category} • {transaction.paymentMethod}
                    </p>
                    <p className="text-sm text-gray-600">
                      To: {transaction.to}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(transaction.date), { addSuffix: true })}
                    </p>
                    {transaction.notes && (
                      <p className="text-sm text-gray-500 mt-2">
                        {transaction.notes}
                      </p>
                    )}
                  </div>
                </div>
                <p className={`font-medium ${color}`}>
                  {transaction.type === 'give' ? '-' : '+'}₹{Number(transaction.amount).toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
import { useMemo } from "react";
import { startOfMonth, format, eachDayOfInterval, subMonths } from "date-fns";
import type { Transaction } from "@shared/schema";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SpendingChartProps {
  transactions: Transaction[];
  months?: number; // Number of months to display, defaults to 1
}

export default function SpendingChart({ transactions, months = 1 }: SpendingChartProps) {
  const chartData = useMemo(() => {
    const end = new Date();
    const start = subMonths(startOfMonth(end), months - 1);

    // Create an array of all days in the interval
    const days = eachDayOfInterval({ start, end });

    // Initialize accumulator with all days set to 0
    const initialData = days.reduce<Record<string, number>>((acc, day) => {
      acc[format(day, "yyyy-MM-dd")] = 0;
      return acc;
    }, {});

    // Sum up expenses for each day
    const dailyTotals = transactions
      .filter(t => t.type === "expense" && new Date(t.date) >= start)
      .reduce<Record<string, number>>((acc, transaction) => {
        const day = format(new Date(transaction.date), "yyyy-MM-dd");
        acc[day] = (acc[day] || 0) + Number(transaction.amount);
        return acc;
      }, initialData);

    // Convert to array format needed for chart
    return Object.entries(dailyTotals).map(([date, amount]) => ({
      date,
      amount,
    }));
  }, [transactions, months]);

  const maxAmount = Math.max(...chartData.map(d => d.amount));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Spending</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1A73E8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#1A73E8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={str => format(new Date(str), "MMM d")}
                interval="preserveStartEnd"
                minTickGap={30}
              />
              <YAxis
                tickFormatter={value => 
                  new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(value)
                }
                domain={[0, maxAmount * 1.1]} // Add 10% padding to the top
              />
              <Tooltip
                formatter={(value: number) => 
                  new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 2,
                  }).format(value)
                }
                labelFormatter={str => format(new Date(str), "MMM d, yyyy")}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#1A73E8"
                fillOpacity={1}
                fill="url(#colorAmount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

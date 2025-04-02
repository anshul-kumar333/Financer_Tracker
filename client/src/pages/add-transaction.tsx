import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { insertTransactionSchema, type InsertTransaction, transactionTypes, paymentMethods } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CategorySelect from "@/components/category-select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

interface InsertReminder {
  amount: number;
  fromPerson: string;
  dueDate: Date;
  notes: string;
}

export default function AddTransaction() {
  const [_, setLocation] = useLocation();
  // Make sure the console outputs that help in debugging
  console.log("Add Transaction Page Loaded");
  const { toast } = useToast();
  const [addReminder, setAddReminder] = useState(false);

  const form = useForm<InsertTransaction & { dueDate?: Date }>({
    resolver: zodResolver(
      insertTransactionSchema.extend({
        dueDate: z.date().optional(),
      })
    ),
    defaultValues: {
      type: "give",
      amount: 0,
      description: "",
      category: "other",
      paymentMethod: "cash",
      to: "",
      notes: "",
      dueDate: undefined,
    },
  });

  // Handle empty amount field
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
    form.setValue('amount', value);
  };

  const reminderMutation = useMutation({
    mutationFn: async (data: InsertReminder) => {
      console.log("Creating reminder with data:", data);
      const response = await apiRequest("POST", "/api/reminders", data);
      const result = await response.json();
      console.log("Reminder created:", result);
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      return result;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertTransaction & { dueDate?: Date }) => {
      const { dueDate, ...transaction } = data;
      console.log("Creating transaction:", transaction);

      const response = await apiRequest("POST", "/api/transactions", transaction);
      const createdTransaction = await response.json();
      console.log("Created transaction:", createdTransaction);

      // Enhanced debugging for reminder creation
      console.log("Reminder data check - addReminder:", addReminder, "dueDate:", dueDate);
      
      // Show a warning toast if user checked reminder but didn't select a date
      if (addReminder && !dueDate) {
        toast({
          title: "Warning",
          description: "You checked 'Set payment reminder' but didn't select a due date. No reminder was created.",
          variant: "destructive", 
        });
      }
      
      if (dueDate && addReminder) {
        console.log("Creating reminder with date:", dueDate);
        console.log("Due date type:", typeof dueDate);
        console.log("Due date instanceof Date:", dueDate instanceof Date);
        console.log("Due date toString:", dueDate.toString());
        console.log("Due date toISOString:", dueDate.toISOString());
        
        try {
          const reminderData = {
            amount: parseFloat(createdTransaction.amount), // Parse from string to number
            fromPerson: createdTransaction.to,
            dueDate,
            notes: createdTransaction.notes || "",
          };
          console.log("Sending reminder data:", reminderData);
          
          const result = await reminderMutation.mutateAsync(reminderData);
          console.log("Reminder creation result:", result);
          
          // Invalidate reminders query to refresh reminders list
          queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
        } catch (error) {
          console.error("Error creating reminder:", error);
          toast({
            title: "Error",
            description: "Failed to create reminder, but transaction was saved",
            variant: "destructive",
          });
        }
      }

      // Invalidate transactions query to refresh home page
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      return createdTransaction;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transaction added successfully",
      });
      setLocation("/");
    },
    onError: (error) => {
      console.error("Error creating transaction:", error);
      toast({
        title: "Error",
        description: "Failed to create transaction",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="pt-4">
      <h1 className="text-2xl font-bold text-[#202124] mb-6">Add New Transaction</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="give">Give Money</SelectItem>
                    <SelectItem value="receive">Receive Money</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    value={field.value || ''}
                    onChange={handleAmountChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="to"
            render={({ field }) => (
              <FormItem>
                <FormLabel>To</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Person or organization name" />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Brief description of the transaction" />
                </FormControl>
              </FormItem>
            )}
          />

          <CategorySelect control={form.control} />

          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Method</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Notes</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Any additional information" />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex items-center space-x-2">
            <Checkbox
              id="addReminder"
              checked={addReminder}
              onCheckedChange={(checked) => {
                setAddReminder(checked as boolean);
                // Set a default due date (tomorrow) when checkbox is checked
                if (checked) {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  form.setValue('dueDate', tomorrow);
                }
              }}
            />
            <label
              htmlFor="addReminder"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Set payment reminder
            </label>
          </div>

          {addReminder && (
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date <span className="text-red-500">*</span></FormLabel>
                  {!field.value && (
                    <p className="text-xs text-red-500 mt-1">
                      Please select a date for the reminder
                    </p>
                  )}
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </FormItem>
              )}
            />
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Adding..." : "Add Transaction"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, isAfter } from "date-fns";
import type { Reminder } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Check, AlertCircle } from "lucide-react";
import { useState } from "react"; // Added missing import

export default function Reminders() {
  const { toast } = useToast();
  const { data: reminders, isLoading, error } = useQuery<Reminder[]>({
    queryKey: ["/api/reminders"]
  });
  
  // Handle error separately
  if (error) {
    console.error("Error fetching reminders:", error);
    toast({
      title: "Error",
      description: "Failed to load reminders",
      variant: "destructive",
    });
  }

  // For debugging
  console.log("Reminders data:", reminders);
  
  const updateMutation = useMutation({
    mutationFn: async ({ id, status, rescheduledDate }: { id: number, status: "completed" | "rescheduled", rescheduledDate?: Date }) => {
      console.log("Updating reminder:", { id, status, rescheduledDate });
      await apiRequest("PATCH", `/api/reminders/${id}`, { status, rescheduledDate });
    },
    onSuccess: () => {
      console.log("Successfully updated reminder");
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({
        title: "Success",
        description: "Reminder updated successfully",
      });
    },
    onError: (error: Error) => {
      console.error("Error updating reminder:", error);
      toast({
        title: "Error",
        description: "Failed to update reminder",
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const pendingReminders = reminders ? reminders.filter((r: Reminder) => r.status === "pending") : [];
  const overdueReminders = pendingReminders.filter((r: Reminder) => isAfter(new Date(), new Date(r.dueDate)));
  const upcomingReminders = pendingReminders.filter((r: Reminder) => !isAfter(new Date(), new Date(r.dueDate)));

  return (
    <div className="pt-4">
      <h1 className="text-2xl font-bold text-[#202124] mb-6">Payment Reminders</h1>

      {overdueReminders.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Overdue Payments
          </h2>
          <div className="space-y-4">
            {overdueReminders.map((reminder: Reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onComplete={() => updateMutation.mutate({ id: reminder.id, status: "completed" })}
                onReschedule={(date) => updateMutation.mutate({ id: reminder.id, status: "rescheduled", rescheduledDate: date })}
              />
            ))}
          </div>
        </div>
      )}

      {upcomingReminders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Upcoming Payments
          </h2>
          <div className="space-y-4">
            {upcomingReminders.map((reminder: Reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onComplete={() => updateMutation.mutate({ id: reminder.id, status: "completed" })}
                onReschedule={(date) => updateMutation.mutate({ id: reminder.id, status: "rescheduled", rescheduledDate: date })}
              />
            ))}
          </div>
        </div>
      )}

      {pendingReminders.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No pending payment reminders
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ReminderCard({ 
  reminder, 
  onComplete, 
  onReschedule 
}: { 
  reminder: Reminder;
  onComplete: () => void;
  onReschedule: (date: Date) => void;
}) {
  const [isRescheduling, setIsRescheduling] = useState(false);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-gray-900">₹{Number(reminder.amount).toFixed(2)} from {reminder.fromPerson}</h3>
            <p className="text-sm text-gray-500">
              Due: {format(new Date(reminder.dueDate), "PPP")}
            </p>
            {reminder.notes && (
              <p className="text-sm text-gray-600 mt-1">{reminder.notes}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Dialog open={isRescheduling} onOpenChange={setIsRescheduling}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">Reschedule</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Select New Due Date</DialogTitle>
                </DialogHeader>
                <Calendar
                  mode="single"
                  selected={new Date(reminder.dueDate)}
                  onSelect={(date) => {
                    if (date) {
                      onReschedule(date);
                      setIsRescheduling(false);
                    }
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </DialogContent>
            </Dialog>
            <Button size="sm" onClick={onComplete}>
              <Check className="h-4 w-4 mr-1" />
              Mark as Paid
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
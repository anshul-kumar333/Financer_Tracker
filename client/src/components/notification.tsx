import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Bell, Calendar as CalendarIcon, Check, X, Clock } from 'lucide-react';
import { format, isAfter, isBefore } from 'date-fns';
import { requestNotificationPermission, showNotificationWithSound } from '../pwa-utils';
import { Reminder } from '@shared/schema';

interface NotificationProps {
  onClose: () => void;
}

/**
 * Notification component for payment reminders
 */
export default function ReminderNotification({ reminders, onClose }: { reminders: Reminder[], onClose: () => void }) {
  const overdueReminders = reminders.filter(reminder => 
    reminder.status === 'pending' && isAfter(new Date(), new Date(reminder.dueDate))
  );
  
  const upcomingReminders = reminders.filter(reminder => 
    reminder.status === 'pending' && 
    isBefore(new Date(), new Date(reminder.dueDate)) && 
    isAfter(new Date(reminder.dueDate), new Date(Date.now() - 24 * 60 * 60 * 1000))
  );
  
  const hasNotifications = overdueReminders.length > 0 || upcomingReminders.length > 0;
  
  useEffect(() => {
    // Request notification permission when component mounts
    if (hasNotifications) {
      requestNotificationPermission();
    }
  }, [hasNotifications]);
  
  // If no notifications, don't render anything
  if (!hasNotifications) {
    return null;
  }
  
  return (
    <div className="fixed top-4 right-4 z-50 w-80 max-w-full">
      <Card className="shadow-lg border-primary/20 animate-in slide-in-from-top-5">
        <CardHeader className="bg-primary/10 pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center">
              <Bell className="h-5 w-5 mr-2 text-primary" />
              भुगतान रिमाइंडर
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4 pb-2">
          {overdueReminders.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center mb-2">
                <Badge variant="destructive" className="mr-2">बाकी</Badge>
                <span className="text-sm text-muted-foreground">जल्द भुगतान करें</span>
              </div>
              {overdueReminders.map(reminder => (
                <div key={reminder.id} className="mb-2 last:mb-0 text-sm">
                  <div className="font-medium">{reminder.fromPerson}</div>
                  <div className="flex justify-between">
                    <span>₹{reminder.amount.toLocaleString()}</span>
                    <span className="text-destructive">{format(new Date(reminder.dueDate), 'dd MMM')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {upcomingReminders.length > 0 && (
            <div>
              <div className="flex items-center mb-2">
                <Badge variant="outline" className="mr-2 border-primary text-primary">
                  आने वाला
                </Badge>
                <span className="text-sm text-muted-foreground">आज भुगतान करें</span>
              </div>
              {upcomingReminders.map(reminder => (
                <div key={reminder.id} className="mb-2 last:mb-0 text-sm">
                  <div className="font-medium">{reminder.fromPerson}</div>
                  <div className="flex justify-between">
                    <span>₹{reminder.amount.toLocaleString()}</span>
                    <span className="text-primary">{format(new Date(reminder.dueDate), 'dd MMM')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end pt-2">
          <Button variant="link" asChild className="h-8 px-2 text-xs">
            <a href="/reminders">सभी रिमाइंडर्स देखें</a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

/**
 * Container component to manage reminder notifications
 */
export function ReminderNotificationContainer() {
  const [showNotification, setShowNotification] = useState(false);
  const [notifiedReminders, setNotifiedReminders] = useState<Reminder[]>([]);
  
  const { data: reminders = [] } = useQuery<Reminder[]>({
    queryKey: ['/api/reminders'],
  });
  
  useEffect(() => {
    // Check for reminders that need notifications
    const overdueReminders = reminders.filter((reminder: Reminder) => 
      reminder.status === 'pending' && isAfter(new Date(), new Date(reminder.dueDate))
    );
    
    const todayReminders = reminders.filter((reminder: Reminder) => {
      const dueDate = new Date(reminder.dueDate);
      const today = new Date();
      
      return reminder.status === 'pending' && 
        dueDate.getDate() === today.getDate() &&
        dueDate.getMonth() === today.getMonth() &&
        dueDate.getFullYear() === today.getFullYear();
    });
    
    const notificationReminders: Reminder[] = [...overdueReminders, ...todayReminders];
    
    if (notificationReminders.length > 0) {
      // Check if we have already notified about these reminders
      const newReminders = notificationReminders.filter(
        reminder => !notifiedReminders.some(notified => notified.id === reminder.id)
      );
      
      if (newReminders.length > 0) {
        // Update the notified reminders list
        setNotifiedReminders(prev => [...prev, ...newReminders]);
        
        // Show the UI notification
        setShowNotification(true);
        
        // Show browser notification with sound if permission granted
        if (Notification.permission === 'granted') {
          const totalAmount = newReminders.reduce((sum, reminder) => sum + Number(reminder.amount), 0);
          
          showNotificationWithSound(
            'भुगतान रिमाइंडर',
            {
              body: `आपके पास ${newReminders.length} बाकी भुगतान हैं, कुल ₹${totalAmount.toLocaleString()}`,
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-72x72.png',
              vibrate: [100, 50, 100],
              data: {
                url: '/reminders'
              }
            } as NotificationOptions
          );
        }
      }
    }
  }, [reminders]);
  
  // Close notification handler
  const handleClose = () => {
    setShowNotification(false);
  };
  
  if (!showNotification) {
    return null;
  }
  
  return <ReminderNotification reminders={notifiedReminders} onClose={handleClose} />;
}
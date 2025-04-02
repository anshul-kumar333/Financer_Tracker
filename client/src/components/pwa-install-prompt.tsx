import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { showInstallPrompt, isPwaInstalled } from '../pwa-utils';
import { Download, X, RefreshCw } from 'lucide-react';

/**
 * Component to prompt users to install the PWA
 */
export function PwaInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  
  useEffect(() => {
    // Don't show the prompt if the app is already installed
    if (isPwaInstalled()) {
      setShowPrompt(false);
      return;
    }
    
    // Set up the beforeinstallprompt event handler
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 76+ from automatically showing the prompt
      e.preventDefault();
      // Save the event so it can be triggered later
      setInstallPromptEvent(e);
      // Show the install button
      setShowPrompt(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Handle app installed event
    const handleAppInstalled = () => {
      setShowPrompt(false);
    };
    
    window.addEventListener('appinstalled', handleAppInstalled);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);
  
  // Function to prompt for install when button is clicked
  const handleInstallClick = () => {
    showInstallPrompt(installPromptEvent);
  };
  
  // If the prompt should not be shown, don't render anything
  if (!showPrompt) {
    return null;
  }
  
  return (
    <Alert className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-white dark:bg-gray-800 shadow-lg border-primary/20">
      <div className="flex items-start">
        <div className="flex-1">
          <AlertTitle className="text-primary">इंस्टॉल ऐप</AlertTitle>
          <AlertDescription>
            इस ऐप को अपने फोन पर इंस्टॉल करें ताकि आप बिना इंटरनेट के भी इसका इस्तेमाल कर सकें।
          </AlertDescription>
          <div className="mt-3">
            <Button 
              size="sm" 
              onClick={handleInstallClick}
              className="mr-2"
            >
              <Download className="h-4 w-4 mr-1" />
              इंस्टॉल करें
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowPrompt(false)}
            >
              <X className="h-4 w-4 mr-1" />
              अभी नहीं
            </Button>
          </div>
        </div>
      </div>
    </Alert>
  );
}

/**
 * Component to notify users about an app update
 */
export function PwaUpdatePrompt() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  
  useEffect(() => {
    // Listen for app update events
    const handleAppUpdate = () => {
      setShowUpdatePrompt(true);
    };
    
    window.addEventListener('appupdate', handleAppUpdate);
    
    return () => {
      window.removeEventListener('appupdate', handleAppUpdate);
    };
  }, []);
  
  // If there's no update, don't render anything
  if (!showUpdatePrompt) {
    return null;
  }
  
  const handleRefresh = () => {
    // Reload the page to get the latest version
    window.location.reload();
  };
  
  return (
    <Alert className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-white dark:bg-gray-800 shadow-lg border-primary/20">
      <div className="flex items-start">
        <div className="flex-1">
          <AlertTitle className="text-primary">नया अपडेट उपलब्ध</AlertTitle>
          <AlertDescription>
            पैसा ट्रैकर का नया वर्शन उपलब्ध है। बेहतर अनुभव के लिए अपडेट करें।
          </AlertDescription>
          <div className="mt-3">
            <Button 
              size="sm" 
              onClick={handleRefresh}
              className="mr-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              अपडेट करें
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowUpdatePrompt(false)}
            >
              <X className="h-4 w-4 mr-1" />
              बाद में
            </Button>
          </div>
        </div>
      </div>
    </Alert>
  );
}
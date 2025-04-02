import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, DollarSign, TrendingUp, Bell, ChevronRight, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Financial mascot/guide component for पैसा ट्रैकर app
 * Provides helpful tips, animations, and micro-interactions
 */
function FinancialMascot() {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isTalking, setIsTalking] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [emotion, setEmotion] = useState<string>('neutral');
  const [animation, setAnimation] = useState<string>('idle');
  const [location, setLocation] = useLocation();

  // Show mascot after a short delay when app loads
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Change mascot behavior based on current page
  useEffect(() => {
    setIsTalking(false);
    
    // Wait a moment before showing a new message
    const timer = setTimeout(() => {
      handleLocationChange();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [location]);

  // Handle page changes
  const handleLocationChange = () => {
    switch (location) {
      case '/':
        setMessage('आपके वित्त का स्वागत है! मैं ध्यनेश हूँ और मैं आपकी मदद करूँगा।');
        setEmotion('happy');
        setAnimation('wave');
        break;
      case '/add':
        setMessage('नया लेनदेन जोड़ें। याद रखें, छोटे खर्च भी महत्वपूर्ण हैं!');
        setEmotion('excited');
        setAnimation('bounce');
        break;
      case '/analytics':
        setMessage('आपके वित्तीय आंकड़े। बचत पर ध्यान दें!');
        setEmotion('thoughtful');
        setAnimation('chart');
        break; 
      case '/reminders':
        setMessage('भुगतान याद रखना महत्वपूर्ण है! समय पर भुगतान करें।');
        setEmotion('alert');
        setAnimation('bell');
        break;
      case '/auth':
        setMessage('सुरक्षित लॉगिन करें। आपका डेटा सुरक्षित है!');
        setEmotion('secure');
        setAnimation('shield');
        break;
      default:
        setMessage('मैं आपकी कैसे मदद कर सकता हूँ?');
        setEmotion('neutral');
        setAnimation('idle');
    }
    
    setIsTalking(true);
  };

  // Mascot tips based on specific user actions or states
  const showTip = (type: string) => {
    switch (type) {
      case 'save':
        setMessage('टिप: हर महीने आय का 20% बचाने का प्रयास करें!');
        setEmotion('excited');
        break;
      case 'spend':
        setMessage('खर्च से पहले जरूरत और इच्छा में अंतर समझें।');
        setEmotion('thoughtful');
        break;
      case 'budget':
        setMessage('मासिक बजट बनाकर खर्चों पर नियंत्रण रखें।');
        setEmotion('neutral');
        break;
      case 'invest':
        setMessage('नियमित निवेश से बड़े लक्ष्य हासिल कर सकते हैं!');
        setEmotion('happy');
        break;
      case 'emergency':
        setMessage('आपातकालीन फंड रखें - कम से कम 3 महीने के खर्च जितना।');
        setEmotion('alert');
        break;
    }
    
    setIsTalking(true);
    // Auto hide tip after some time
    setTimeout(() => setIsTalking(false), 6000);
  };

  // Navigation suggestions based on current page
  const getNavigationSuggestion = () => {
    if (location === '/') return { text: 'लेनदेन जोड़ें', path: '/add', icon: <DollarSign className="h-4 w-4" /> };
    if (location === '/add') return { text: 'विश्लेषण देखें', path: '/analytics', icon: <TrendingUp className="h-4 w-4" /> };
    if (location === '/analytics') return { text: 'रिमाइंडर देखें', path: '/reminders', icon: <Bell className="h-4 w-4" /> };
    if (location === '/reminders') return { text: 'होम पेज', path: '/', icon: <Heart className="h-4 w-4" /> };
    
    return { text: 'होम पेज', path: '/', icon: <Heart className="h-4 w-4" /> };
  };

  // Render mascot animations based on current state
  const renderMascot = () => {
    return (
      <div className={`mascot-container ${emotion}`}>
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ 
            scale: animation === 'bounce' ? [0.8, 1.1, 0.9, 1] : 1,
            y: animation === 'wave' ? [0, -10, 0] : 0
          }}
          transition={{ 
            duration: 1, 
            repeat: animation === 'idle' ? Infinity : 0,
            repeatType: "reverse"
          }}
          className="mascot-body"
        >
          <svg 
            width="60" 
            height="70" 
            viewBox="0 0 60 70" 
            className="mascot-svg"
          >
            {/* Mascot body */}
            <circle cx="30" cy="25" r="20" className="mascot-head" />
            
            {/* Eyes */}
            <circle cx="22" cy="20" r="3" className="mascot-eye" />
            <circle cx="38" cy="20" r="3" className="mascot-eye" />
            
            {/* Eyebrows that change with emotion */}
            {emotion === 'happy' && (
              <>
                <path d="M19 16C20 14 24 15 25 17" className="mascot-eyebrow" />
                <path d="M35 16C36 14 40 15 41 17" className="mascot-eyebrow" />
              </>
            )}
            
            {emotion === 'thoughtful' && (
              <>
                <path d="M19 15C20 15 24 16 25 15" className="mascot-eyebrow" />
                <path d="M35 15C36 15 40 16 41 15" className="mascot-eyebrow" />
              </>
            )}
            
            {emotion === 'alert' && (
              <>
                <path d="M19 15C20 13 24 13 25 15" className="mascot-eyebrow" />
                <path d="M35 15C36 13 40 13 41 15" className="mascot-eyebrow" />
              </>
            )}
            
            {emotion === 'excited' && (
              <>
                <path d="M19 14C20 12 24 12 25 14" className="mascot-eyebrow" />
                <path d="M35 14C36 12 40 12 41 14" className="mascot-eyebrow" />
              </>
            )}
            
            {/* Mouth that changes with emotion */}
            {emotion === 'happy' && (
              <path d="M20 30C25 36 35 36 40 30" className="mascot-mouth" />
            )}
            
            {emotion === 'neutral' && (
              <path d="M25 32H35" className="mascot-mouth" />
            )}
            
            {emotion === 'thoughtful' && (
              <path d="M25 33C28 31 32 33 35 33" className="mascot-mouth" />
            )}
            
            {emotion === 'alert' && (
              <circle cx="30" cy="33" r="3" className="mascot-mouth-circle" />
            )}
            
            {emotion === 'excited' && (
              <path d="M25 33C28 37 32 37 35 33" className="mascot-mouth" />
            )}
            
            {emotion === 'secure' && (
              <path d="M25 33C28 35 32 35 35 33" className="mascot-mouth" />
            )}
            
            {/* Rupee symbol on belly or animation elements */}
            {animation === 'chart' && (
              <g className="mascot-chart">
                <path d="M15 50L25 45L35 48L45 40" className="mascot-chart-line" />
                <circle cx="15" cy="50" r="2" className="mascot-chart-dot" />
                <circle cx="25" cy="45" r="2" className="mascot-chart-dot" />
                <circle cx="35" cy="48" r="2" className="mascot-chart-dot" />
                <circle cx="45" cy="40" r="2" className="mascot-chart-dot" />
              </g>
            )}
            
            {animation === 'bell' && (
              <g className="mascot-bell">
                <path d="M25 45C25 40 35 40 35 45" className="mascot-bell-body" />
                <circle cx="30" cy="48" r="2" className="mascot-bell-clapper" />
              </g>
            )}
            
            {animation === 'shield' && (
              <path d="M20 45C20 55 30 55 40 45C40 40 30 35 20 45Z" className="mascot-shield" />
            )}
            
            {(animation === 'idle' || animation === 'bounce' || animation === 'wave') && (
              <text x="30" y="50" fontSize="16" textAnchor="middle" className="mascot-rupee">₹</text>
            )}
          </svg>
        </motion.div>
      </div>
    );
  };

  const suggestion = getNavigationSuggestion();

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isTalking && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="mb-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-[280px] border border-primary/20"
          >
            <div className="flex justify-between items-start">
              <p className="text-sm">{message}</p>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 ml-2 -mt-1 -mr-1"
                onClick={() => setIsTalking(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            {/* Navigation suggestion */}
            <div 
              className="mt-2 p-2 bg-primary/10 rounded-md flex items-center cursor-pointer hover:bg-primary/20 transition-colors"
              onClick={() => {
                setLocation(suggestion.path);
                setIsTalking(false);
              }}
            >
              <div className="flex items-center text-xs font-medium text-primary">
                {suggestion.icon}
                <span className="ml-1">{suggestion.text}</span>
              </div>
              <ChevronRight className="ml-auto h-3 w-3 text-primary" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex items-center">
        <div className="mr-2 flex space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20 border-primary/10"
                  onClick={() => showTip('save')}
                >
                  <DollarSign className="h-4 w-4 text-primary" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>बचत टिप्स</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20 border-primary/10"
                  onClick={() => showTip('invest')}
                >
                  <TrendingUp className="h-4 w-4 text-primary" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>निवेश सुझाव</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg cursor-pointer border-2 border-primary"
          onClick={() => setIsTalking(!isTalking)}
        >
          {renderMascot()}
        </motion.div>
      </div>
    </div>
  );
}

export default FinancialMascot;
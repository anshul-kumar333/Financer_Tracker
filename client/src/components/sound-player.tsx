import { useState, useEffect, useRef } from 'react';

/**
 * Audio player component for notification sounds
 * Usage: <SoundPlayer src="/sounds/notification.mp3" autoPlay />
 */
export default function SoundPlayer({ 
  src, 
  autoPlay = false,
  volume = 0.8,
  loop = false,
  onEnded
}: { 
  src: string;
  autoPlay?: boolean;
  volume?: number;
  loop?: boolean;
  onEnded?: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.loop = loop;
      
      if (autoPlay) {
        // We wrap in a user interaction handler to avoid autoplay restrictions
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn('Audio playback prevented by browser:', error);
          });
        }
      }
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [src, autoPlay, volume, loop]);
  
  return (
    <audio 
      ref={audioRef}
      src={src}
      className="hidden"
      preload="auto"
      onEnded={onEnded}
    />
  );
}

/**
 * Component to play sounds on demand via a global event system
 * Usage: 
 * 1. Add <GlobalSoundPlayer /> once in your app
 * 2. Trigger sounds with window.dispatchEvent(new CustomEvent('playsound', { detail: { src: '/sounds/notification.mp3' }}))
 */
export function GlobalSoundPlayer() {
  const [sound, setSound] = useState<{ src: string; id: number } | null>(null);
  
  useEffect(() => {
    const handlePlaySound = (event: CustomEvent) => {
      if (event.detail && event.detail.src) {
        // Generate a unique ID to force re-render 
        // (needed when playing the same sound multiple times)
        setSound({
          src: event.detail.src,
          id: Date.now()
        });
      }
    };
    
    // Add event listener with type assertion
    window.addEventListener('playsound', handlePlaySound as EventListener);
    
    return () => {
      window.removeEventListener('playsound', handlePlaySound as EventListener);
    };
  }, []);
  
  const handleEnded = () => {
    setSound(null);
  };
  
  if (!sound) return null;
  
  return <SoundPlayer key={sound.id} src={sound.src} autoPlay onEnded={handleEnded} />;
}
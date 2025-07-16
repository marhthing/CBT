
import React, { useEffect, useState, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

interface SecureTestEnvironmentProps {
  children: React.ReactNode;
  onSecurityViolation: (violation: string) => void;
  isTestActive: boolean;
}

const SecureTestEnvironment: React.FC<SecureTestEnvironmentProps> = ({
  children,
  onSecurityViolation,
  isTestActive
}) => {
  const [violations, setViolations] = useState<string[]>([]);
  const [isSecureMode, setIsSecureMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Detect if device is mobile
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isTestActive) {
      setIsSecureMode(true);
      enableSecurityMeasures();
    } else {
      setIsSecureMode(false);
      disableSecurityMeasures();
    }

    return () => {
      disableSecurityMeasures();
    };
  }, [isTestActive]);

  const logViolation = (violation: string) => {
    setViolations(prev => [...prev, violation]);
    onSecurityViolation(violation);
  };

  const enableSecurityMeasures = () => {
    // Disable right-click context menu
    document.addEventListener('contextmenu', handleContextMenu);
    
    // Disable common keyboard shortcuts
    document.addEventListener('keydown', handleKeyDown);
    
    // Disable text selection on non-input elements
    document.addEventListener('selectstart', handleSelectStart);
    
    // Detect window focus/blur (tab switching)
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    
    // Mobile-specific security measures
    if (isMobile) {
      document.addEventListener('touchstart', handleTouchStart, { passive: false });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
    }
    
    // Disable developer tools (limited effectiveness)
    setInterval(() => {
      if (isSecureMode) {
        const devtools = /./;
        devtools.toString = function() {
          logViolation('Developer tools detected');
          return 'devtools';
        };
        console.log('%c', devtools);
      }
    }, 1000);
  };

  const disableSecurityMeasures = () => {
    document.removeEventListener('contextmenu', handleContextMenu);
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('selectstart', handleSelectStart);
    window.removeEventListener('blur', handleWindowBlur);
    window.removeEventListener('focus', handleWindowFocus);
    
    if (isMobile) {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    }
  };

  const handleContextMenu = (e: MouseEvent) => {
    if (!isSecureMode) return;
    e.preventDefault();
    logViolation('Right-click attempted');
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isSecureMode) return;

    // Disable common shortcuts for copying, developer tools, etc.
    const forbiddenKeys = [
      'F12', // Developer tools
      'F11', // Fullscreen toggle
    ];

    const forbiddenCombos = [
      { key: 'c', ctrl: true }, // Ctrl+C (copy)
      { key: 'v', ctrl: true }, // Ctrl+V (paste)
      { key: 'a', ctrl: true }, // Ctrl+A (select all)
      { key: 'x', ctrl: true }, // Ctrl+X (cut)
      { key: 's', ctrl: true }, // Ctrl+S (save)
      { key: 'p', ctrl: true }, // Ctrl+P (print)
      { key: 'u', ctrl: true }, // Ctrl+U (view source)
      { key: 'i', ctrl: true, shift: true }, // Ctrl+Shift+I (dev tools)
      { key: 'j', ctrl: true, shift: true }, // Ctrl+Shift+J (console)
      { key: 'c', ctrl: true, shift: true }, // Ctrl+Shift+C (inspect)
      { key: 'r', ctrl: true }, // Ctrl+R (refresh)
      { key: 'F5', ctrl: false }, // F5 (refresh)
    ];

    if (forbiddenKeys.includes(e.key)) {
      e.preventDefault();
      logViolation(`Attempted to use forbidden key: ${e.key}`);
      return;
    }

    const matchesForbiddenCombo = forbiddenCombos.some(combo => {
      return (
        e.key.toLowerCase() === combo.key.toLowerCase() &&
        e.ctrlKey === combo.ctrl &&
        (!combo.shift || e.shiftKey === combo.shift)
      );
    });

    if (matchesForbiddenCombo) {
      e.preventDefault();
      logViolation(`Attempted forbidden key combination: ${e.ctrlKey ? 'Ctrl+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.key}`);
    }
  };

  const handleSelectStart = (e: Event) => {
    if (!isSecureMode) return;
    
    // Allow text selection in input fields and textareas
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }
    
    e.preventDefault();
  };

  const handleWindowBlur = () => {
    if (!isSecureMode) return;
    logViolation('Window lost focus (possible tab switch)');
  };

  const handleWindowFocus = () => {
    if (!isSecureMode || violations.length === 0) return;
    toast({
      title: "Security Warning",
      description: "Keep focus on the test window",
      variant: "destructive"
    });
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (!isSecureMode || !isMobile) return;

    // Allow all touch events on form inputs and their containers to prevent keyboard issues
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'BUTTON' ||
        target.closest('input, textarea, button, form, .question-container, .answer-option')) {
      return;
    }

    // Only prevent multi-touch outside of form areas
    if (e.touches.length > 1) {
      e.preventDefault();
      const violation = `Multi-touch detected at ${new Date().toLocaleTimeString()}`;
      logViolation(violation);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    // Allow all touch move on form elements and interactive areas
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'BUTTON' ||
        target.closest('input, textarea, button, form, .question-container, .answer-option')) {
      return;
    }

    // Prevent excessive scrolling or swiping
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative ${isSecureMode ? 'select-none' : ''}`}
      style={{
        userSelect: isSecureMode ? 'none' : 'auto',
        WebkitUserSelect: isSecureMode ? 'none' : 'auto',
        MozUserSelect: isSecureMode ? 'none' : 'auto',
        msUserSelect: isSecureMode ? 'none' : 'auto',
      }}
    >
      {children}
      
      {isSecureMode && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-3 py-1 rounded-md text-sm">
          🔒 Secure Mode Active
        </div>
      )}
      
      {violations.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 bg-yellow-500 text-white px-3 py-1 rounded-md text-sm">
          ⚠️ {violations.length} violation(s)
        </div>
      )}
    </div>
  );
};

export { SecureTestEnvironment };
export default SecureTestEnvironment;

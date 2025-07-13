
import { useEffect, useState, useRef } from 'react';
import { AlertTriangle, Shield, Eye, Smartphone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violations, setViolations] = useState<string[]>([]);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [isSecureMode, setIsSecureMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     window.innerWidth <= 768 ||
                     'ontouchstart' in window;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Enter fullscreen and secure mode
  const enterSecureMode = async () => {
    try {
      if (!isMobile && containerRef.current) {
        // Only try fullscreen on desktop
        try {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        } catch (error) {
          console.warn('Fullscreen not available:', error);
        }
      }
      
      setIsSecureMode(true);

      // For mobile, add viewport meta tag to prevent zooming
      if (isMobile) {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
      }
    } catch (error) {
      console.error('Failed to enter secure mode:', error);
      onSecurityViolation('Failed to enter secure mode');
    }
  };

  // Exit secure mode
  const exitSecureMode = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    setIsFullscreen(false);
    setIsSecureMode(false);

    // Restore viewport for mobile
    if (isMobile) {
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1');
      }
    }
  };

  // Monitor tab switching and window focus
  useEffect(() => {
    if (!isTestActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden && isSecureMode) {
        const violation = `Tab switched or window minimized at ${new Date().toLocaleTimeString()}`;
        setTabSwitchCount(prev => prev + 1);
        setViolations(prev => [...prev, violation]);
        onSecurityViolation(violation);
      }
    };

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
      
      if (!isCurrentlyFullscreen && isSecureMode && isTestActive && !isMobile) {
        const violation = `Exited fullscreen at ${new Date().toLocaleTimeString()}`;
        setViolations(prev => [...prev, violation]);
        onSecurityViolation(violation);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSecureMode || isMobile) return; // Skip keyboard restrictions on mobile

      // Disable common shortcuts that could be used to cheat
      const blockedKeys = [
        'F12', // Developer tools
        'F5',  // Refresh
        'PrintScreen', // Screenshots
      ];

      const blockedCombinations = [
        { ctrl: true, key: 'u' }, // View source
        { ctrl: true, key: 'i' }, // Developer tools
        { ctrl: true, key: 'j' }, // Console
        { ctrl: true, key: 'r' }, // Refresh
        { ctrl: true, key: 'w' }, // Close tab
        { ctrl: true, key: 't' }, // New tab
        { ctrl: true, key: 'n' }, // New window
        { ctrl: true, shift: true, key: 'i' }, // Developer tools
        { ctrl: true, shift: true, key: 'j' }, // Console
        { alt: true, key: 'Tab' }, // Alt+Tab
        { cmd: true, key: 'Tab' }, // Cmd+Tab (Mac)
      ];

      if (blockedKeys.includes(e.key)) {
        e.preventDefault();
        const violation = `Attempted to use blocked key: ${e.key}`;
        setViolations(prev => [...prev, violation]);
        onSecurityViolation(violation);
        return;
      }

      const isBlocked = blockedCombinations.some(combo => {
        return (
          (!combo.ctrl || e.ctrlKey) &&
          (!combo.shift || e.shiftKey) &&
          (!combo.alt || e.altKey) &&
          (!combo.cmd || e.metaKey) &&
          e.key.toLowerCase() === combo.key.toLowerCase()
        );
      });

      if (isBlocked) {
        e.preventDefault();
        const keys = [];
        if (e.ctrlKey) keys.push('Ctrl');
        if (e.shiftKey) keys.push('Shift');
        if (e.altKey) keys.push('Alt');
        if (e.metaKey) keys.push('Cmd');
        keys.push(e.key);
        
        const violation = `Attempted blocked combination: ${keys.join('+')}`;
        setViolations(prev => [...prev, violation]);
        onSecurityViolation(violation);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (isSecureMode) {
        e.preventDefault();
        const violation = `Attempted to open context menu at ${new Date().toLocaleTimeString()}`;
        setViolations(prev => [...prev, violation]);
        onSecurityViolation(violation);
      }
    };

    // Mobile-specific touch handling
    const handleTouchStart = (e: TouchEvent) => {
      if (!isSecureMode || !isMobile) return;
      
      // Detect multi-touch (potential screenshot gesture)
      if (e.touches.length > 1) {
        e.preventDefault();
        const violation = `Multi-touch detected at ${new Date().toLocaleTimeString()}`;
        setViolations(prev => [...prev, violation]);
        onSecurityViolation(violation);
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    if (!isMobile) {
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('keydown', handleKeyDown);
    }
    document.addEventListener('contextmenu', handleContextMenu);
    
    if (isMobile) {
      document.addEventListener('touchstart', handleTouchStart, { passive: false });
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      if (isMobile) {
        document.removeEventListener('touchstart', handleTouchStart);
      }
    };
  }, [isSecureMode, isTestActive, isMobile, onSecurityViolation]);

  // Disable copy/paste
  useEffect(() => {
    if (!isSecureMode) return;

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      const violation = `Attempted to copy content at ${new Date().toLocaleTimeString()}`;
      setViolations(prev => [...prev, violation]);
      onSecurityViolation(violation);
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      const violation = `Attempted to paste content at ${new Date().toLocaleTimeString()}`;
      setViolations(prev => [...prev, violation]);
      onSecurityViolation(violation);
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
    };
  }, [isSecureMode, onSecurityViolation]);

  // Prevent zooming on mobile
  useEffect(() => {
    if (!isMobile || !isSecureMode) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const violation = `Attempted to zoom at ${new Date().toLocaleTimeString()}`;
        setViolations(prev => [...prev, violation]);
        onSecurityViolation(violation);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isMobile, isSecureMode, onSecurityViolation]);

  if (!isSecureMode && isTestActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              {isMobile ? <Smartphone className="h-8 w-8 text-red-600" /> : <Shield className="h-8 w-8 text-red-600" />}
            </div>
            <CardTitle className="text-2xl">
              {isMobile ? 'Mobile Test Environment' : 'Secure Test Environment'}
            </CardTitle>
            <CardDescription>
              {isMobile 
                ? 'Mobile security mode will be activated for test integrity.'
                : 'To ensure test integrity, you must enter secure mode before starting the test.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Security Features:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  {!isMobile && <li>• Fullscreen mode required</li>}
                  <li>• Tab switching monitoring</li>
                  <li>• Right-click disabled</li>
                  {!isMobile && <li>• Keyboard shortcuts blocked</li>}
                  <li>• Copy/paste disabled</li>
                  {isMobile && <li>• Multi-touch detection</li>}
                  {isMobile && <li>• Zoom prevention</li>}
                </ul>
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={enterSecureMode} 
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {isMobile ? 'Enter Mobile Test Mode' : 'Enter Secure Mode'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-white">
      {/* Security Status Bar */}
      {isSecureMode && (
        <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            {isMobile ? <Smartphone className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
            <span>{isMobile ? 'Mobile Test Mode Active' : 'Secure Test Mode Active'}</span>
          </div>
          <div className="flex items-center space-x-4">
            {tabSwitchCount > 0 && (
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Violations: </span>
                <span>{violations.length}</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={exitSecureMode}
              className="text-white hover:bg-red-700 h-6 text-xs"
            >
              Exit
            </Button>
          </div>
        </div>
      )}
      
      {/* Test Content */}
      <div className={`p-4 ${isMobile ? 'touch-manipulation' : ''}`}>
        {children}
      </div>
    </div>
  );
};

export default SecureTestEnvironment;

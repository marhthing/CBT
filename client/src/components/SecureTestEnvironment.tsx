
import React, { useEffect, useState } from 'react';

interface SecureTestEnvironmentProps {
  children: React.ReactNode;
  onSecurityViolation: (violation: string) => void;
  isActive: boolean;
}

const SecureTestEnvironment: React.FC<SecureTestEnvironmentProps> = ({
  children,
  onSecurityViolation,
  isActive
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    // Disable copy/paste/cut operations
    const preventCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      onSecurityViolation('Copy/paste operation blocked');
    };

    // Disable text selection
    const preventTextSelection = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Disable drag and drop
    const preventDragDrop = (e: DragEvent) => {
      e.preventDefault();
      onSecurityViolation('Drag/drop operation blocked');
    };

    // Disable print screen and screenshot shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block common shortcuts
      if (
        // Copy/paste/cut/select all
        (e.ctrlKey && ['c', 'v', 'x', 'a'].includes(e.key.toLowerCase())) ||
        (e.metaKey && ['c', 'v', 'x', 'a'].includes(e.key.toLowerCase())) ||
        // Developer tools
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.key === 'U') ||
        // Print screen
        e.key === 'PrintScreen' ||
        // Function keys that might be problematic
        ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11'].includes(e.key) ||
        // Alt+Tab (window switching)
        (e.altKey && e.key === 'Tab') ||
        // Windows key
        e.key === 'Meta' ||
        // Escape key
        e.key === 'Escape'
      ) {
        e.preventDefault();
        e.stopPropagation();
        onSecurityViolation(`Blocked key combination: ${e.key}`);
        return false;
      }
    };

    // Mobile-specific touch and gesture prevention
    const preventTouchActions = (e: TouchEvent) => {
      // Prevent long press (which can trigger context menu on mobile)
      if (e.touches.length > 1) {
        e.preventDefault();
        onSecurityViolation('Multi-touch gesture blocked');
      }
    };

    // Prevent right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      onSecurityViolation('Right-click context menu blocked');
    };

    // Prevent mouse selection
    const preventMouseSelection = (e: MouseEvent) => {
      if (e.detail > 1) { // Double-click or triple-click
        e.preventDefault();
        onSecurityViolation('Text selection attempt blocked');
      }
    };

    // Tab visibility change detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        onSecurityViolation('Tab/window switched - test visibility lost');
      }
    };

    // Window focus loss detection
    const handleBlur = () => {
      onSecurityViolation('Window focus lost - possible app switching');
    };

    // Prevent page refresh
    const preventRefresh = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      onSecurityViolation('Page refresh attempt blocked');
    };

    // Mobile screenshot prevention (iOS Safari)
    const preventScreenshot = () => {
      // Add a meta tag to prevent screenshots on iOS
      const metaTag = document.createElement('meta');
      metaTag.name = 'format-detection';
      metaTag.content = 'telephone=no';
      document.head.appendChild(metaTag);
      
      // Try to detect screenshot attempts
      if ('getDisplayMedia' in navigator.mediaDevices) {
        onSecurityViolation('Screen capture API access detected');
      }
    };

    // Disable image saving
    const preventImageSave = (e: Event) => {
      if (e.target instanceof HTMLImageElement) {
        e.preventDefault();
        onSecurityViolation('Image save attempt blocked');
      }
    };

    // Add event listeners
    document.addEventListener('copy', preventCopyPaste);
    document.addEventListener('paste', preventCopyPaste);
    document.addEventListener('cut', preventCopyPaste);
    document.addEventListener('selectstart', preventTextSelection);
    document.addEventListener('dragstart', preventDragDrop);
    document.addEventListener('drop', preventDragDrop);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('mousedown', preventMouseSelection);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('dragover', preventImageSave);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', preventRefresh);
    
    // Mobile-specific events
    document.addEventListener('touchstart', preventTouchActions);
    document.addEventListener('touchmove', preventTouchActions);
    
    // Prevent screenshot on mobile
    preventScreenshot();

    // Disable user selection via CSS
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.mozUserSelect = 'none';
    document.body.style.msUserSelect = 'none';
    
    // Disable highlighting
    document.body.style.webkitTouchCallout = 'none';
    document.body.style.webkitUserDrag = 'none';
    
    // Disable image dragging
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      img.draggable = false;
      img.style.pointerEvents = 'none';
    });

    // Hide content when dev tools might be open
    let devtools = {
      open: false,
      orientation: null as string | null
    };

    const threshold = 160;
    setInterval(() => {
      if (
        window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold
      ) {
        if (!devtools.open) {
          devtools.open = true;
          onSecurityViolation('Developer tools detected - hiding content');
          document.body.style.display = 'none';
        }
      } else {
        if (devtools.open) {
          devtools.open = false;
          document.body.style.display = 'block';
        }
      }
    }, 500);

    // Cleanup function
    return () => {
      document.removeEventListener('copy', preventCopyPaste);
      document.removeEventListener('paste', preventCopyPaste);
      document.removeEventListener('cut', preventCopyPaste);
      document.removeEventListener('selectstart', preventTextSelection);
      document.removeEventListener('dragstart', preventDragDrop);
      document.removeEventListener('drop', preventDragDrop);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('mousedown', preventMouseSelection);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('dragover', preventImageSave);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', preventRefresh);
      document.removeEventListener('touchstart', preventTouchActions);
      document.removeEventListener('touchmove', preventTouchActions);
      
      // Reset styles
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.mozUserSelect = '';
      document.body.style.msUserSelect = '';
      document.body.style.webkitTouchCallout = '';
      document.body.style.webkitUserDrag = '';
      document.body.style.display = '';
      
      // Re-enable image dragging
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        img.draggable = true;
        img.style.pointerEvents = '';
      });
    };
  }, [isActive, onSecurityViolation]);

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (error) {
      console.log('Fullscreen not supported');
    }
  };

  const exitFullscreen = async () => {
    try {
      await document.exitFullscreen();
      setIsFullscreen(false);
    } catch (error) {
      console.log('Exit fullscreen failed');
    }
  };

  if (!isActive) {
    return <>{children}</>;
  }

  return (
    <div 
      className="secure-test-environment"
      style={{
        position: 'relative',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserDrag: 'none',
        pointerEvents: 'auto'
      }}
    >
      {/* Security overlay for additional protection */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 9999,
          background: 'transparent'
        }}
      />
      
      {/* Watermark to discourage screenshots */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-45deg)',
          fontSize: '80px',
          color: 'rgba(255, 0, 0, 0.1)',
          pointerEvents: 'none',
          zIndex: 1000,
          fontWeight: 'bold',
          userSelect: 'none'
        }}
      >
        SECURE TEST - NO SCREENSHOTS
      </div>
      
      {children}
    </div>
  );
};

export default SecureTestEnvironment;

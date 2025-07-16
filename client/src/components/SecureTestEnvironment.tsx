
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

    const handleVisibilityChange = () => {
      if (document.hidden) {
        onSecurityViolation('Tab switch detected');
      }
    };

    const handleBlur = () => {
      onSecurityViolation('Window focus lost');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent common shortcuts that could be used to cheat
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'a' || e.key === 't')) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I')
      ) {
        e.preventDefault();
        onSecurityViolation('Restricted key combination detected');
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      onSecurityViolation('Right-click detected');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
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
    <div className="secure-test-environment">
      {children}
    </div>
  );
};

export default SecureTestEnvironment;

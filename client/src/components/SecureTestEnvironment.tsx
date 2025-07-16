
import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from './ui/alert';

interface SecureTestEnvironmentProps {
  children: React.ReactNode;
  isActive: boolean;
  onSecurityViolation?: () => void;
}

export default function SecureTestEnvironment({ 
  children, 
  isActive, 
  onSecurityViolation 
}: SecureTestEnvironmentProps) {
  const [violations, setViolations] = useState<string[]>([]);

  useEffect(() => {
    if (!isActive) return;

    let violationTimeout: NodeJS.Timeout;

    // Monitor for suspicious activity without blocking keyboard
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const violation = 'Tab switched or window minimized';
        setViolations(prev => [...prev, violation]);
        
        // Delay the violation callback to avoid immediate disruption
        violationTimeout = setTimeout(() => {
          onSecurityViolation?.();
        }, 2000);
      } else {
        // Clear timeout if user returns quickly
        if (violationTimeout) {
          clearTimeout(violationTimeout);
        }
      }
    };

    // Monitor context menu (right-click) without completely blocking it
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setViolations(prev => [...prev, 'Right-click attempted']);
    };

    // Monitor specific key combinations but allow normal typing
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only block developer tools and some problematic combinations
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || // Dev tools
        (e.ctrlKey && e.key === 'u') || // View source
        e.key === 'F12' // Dev tools
      ) {
        e.preventDefault();
        setViolations(prev => [...prev, `Blocked key combination: ${e.key}`]);
      }
      
      // Allow copy/paste operations
      if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'a')) {
        // Allow these operations - don't prevent them
        return;
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // Monitor for multiple tabs (less intrusive check)
    let tabCheckInterval: NodeJS.Timeout;
    if (typeof window !== 'undefined') {
      tabCheckInterval = setInterval(() => {
        // Simple check without blocking functionality
        if (document.hasFocus() === false && !document.hidden) {
          setViolations(prev => [...prev, 'Focus lost - possible tab switch']);
        }
      }, 5000); // Check every 5 seconds instead of constantly
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      
      if (violationTimeout) clearTimeout(violationTimeout);
      if (tabCheckInterval) clearInterval(tabCheckInterval);
    };
  }, [isActive, onSecurityViolation]);

  if (!isActive) {
    return <>{children}</>;
  }

  return (
    <div className="secure-test-environment">
      {violations.length > 0 && (
        <Alert className="mb-4 bg-yellow-50 border-yellow-200">
          <AlertDescription>
            Security monitoring active. Recent activity: {violations[violations.length - 1]}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="test-content">
        {children}
      </div>
      
      <style jsx>{`
        .secure-test-environment {
          min-height: 100vh;
          background: #f8f9fa;
        }
        
        .test-content {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        /* Prevent text selection on non-input elements */
        .secure-test-environment * {
          user-select: text; /* Allow text selection for better UX */
        }
        
        /* Allow selection in input areas */
        .secure-test-environment input,
        .secure-test-environment textarea,
        .secure-test-environment [contenteditable] {
          user-select: text !important;
        }
      `}</style>
    </div>
  );
}

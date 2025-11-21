import React from 'react';

interface DatabaseWrapperProps {
  children: React.ReactNode;
}

/**
 * DatabaseWrapper - Updated for Fresh Sync System
 * 
 * The old SQLite database wrapper has been replaced with the modern
 * fresh sync system. This component now simply passes through children
 * since database initialization is handled by NewSyncProvider.
 */
export const DatabaseWrapper: React.FC<DatabaseWrapperProps> = ({ children }) => {
  // Fresh sync system handles all database initialization
  // No need for loading states or error handling here
  return <>{children}</>;
};

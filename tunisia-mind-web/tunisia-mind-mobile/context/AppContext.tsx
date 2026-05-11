import React, { createContext, useContext, useState, useCallback } from 'react';

interface AppContextType {
  newChatTrigger: number;
  triggerNewChat: () => void;
  showSettings: boolean;
  setShowSettings: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [newChatTrigger, setNewChatTrigger] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const triggerNewChat = useCallback(() => {
    setNewChatTrigger(prev => prev + 1);
  }, []);

  return (
    <AppContext.Provider value={{ newChatTrigger, triggerNewChat, showSettings, setShowSettings }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

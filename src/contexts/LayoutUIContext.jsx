import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

const LayoutUIContext = createContext(null);

export const LayoutUIProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true); // 初期表示したいなら true

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);

  const value = useMemo(
    () => ({ sidebarOpen, openSidebar, closeSidebar, toggleSidebar }),
    [sidebarOpen, openSidebar, closeSidebar, toggleSidebar]
  );

  return <LayoutUIContext.Provider value={value}>{children}</LayoutUIContext.Provider>;
};

export const useLayoutUI = () => {
  const ctx = useContext(LayoutUIContext);
  if (!ctx) throw new Error("useLayoutUI must be used within LayoutUIProvider");
  return ctx;
};

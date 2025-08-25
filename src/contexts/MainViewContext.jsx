import { createContext, useContext, useState } from "react";

const MainViewContext = createContext();

export function MainViewProvider({ children }) {
  // 初期表示はアップロード画面
  const [view, setView] = useState("upload");

  return (
    <MainViewContext.Provider value={{ view, setView }}>
      {children}
    </MainViewContext.Provider>
  );
}

export const useMainView = () => useContext(MainViewContext);

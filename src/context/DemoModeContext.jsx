import React from "react";

const DemoModeContext = React.createContext({ demoMode: false, setDemoMode: () => {} });
const STORAGE_KEY = "terramind_demo_mode";

// Demo Mode: AI + market data hooks resolve from local fixtures instead of
// the network, so the app stays fully functional during an offline pitch.
export function DemoModeProvider({ children }) {
  const [demoMode, setDemoModeState] = React.useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  function setDemoMode(next) {
    setDemoModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // localStorage unavailable — toggle still works for this session
    }
  }

  return <DemoModeContext.Provider value={{ demoMode, setDemoMode }}>{children}</DemoModeContext.Provider>;
}

export function useDemoMode() {
  return React.useContext(DemoModeContext);
}

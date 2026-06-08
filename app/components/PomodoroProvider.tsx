"use client";

import React, { Suspense, createContext, useContext, useState } from "react";
import FocusFloatingIndicator from "./FocusFloatingIndicator";
import PomodoroWidget from "./PomodoroWidget";

type PomodoroContextValue = {
  openPomodoro: () => void;
  closePomodoro: () => void;
};

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

export function usePomodoro() {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error("usePomodoro must be used inside PomodoroProvider");
  }
  return context;
}

export default function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <PomodoroContext.Provider value={{ openPomodoro: () => setOpen(true), closePomodoro: () => setOpen(false) }}>
      <PomodoroWidget open={open} onOpenChange={setOpen} showLauncher={false} />
      {children}
      <Suspense fallback={null}>
        <FocusFloatingIndicator />
      </Suspense>
    </PomodoroContext.Provider>
  );
}

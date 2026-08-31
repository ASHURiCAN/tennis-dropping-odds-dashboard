import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TennisState {
  activeCohort: string | null;
  setActiveCohort: (label: string) => void;
  oosFilter: "all" | "oos1" | "oos2";
  setOosFilter: (f: "all" | "oos1" | "oos2") => void;
}

export const useTennis = create<TennisState>()(
  persist(
    (set) => ({
      activeCohort: null,
      setActiveCohort: (label) => set({ activeCohort: label }),
      oosFilter: "all",
      setOosFilter: (f) => set({ oosFilter: f }),
    }),
    { name: "tennis-dashboard" },
  ),
);

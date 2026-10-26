import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import type { RangeKey } from "../lib/api";

interface FilterState {
  range: RangeKey;
  channel: string;
  setRange: (range: RangeKey) => void;
  setChannel: (channel: string) => void;
}

const FilterContext = createContext<FilterState | null>(null);

const validRanges: RangeKey[] = ["today", "7d", "30d", "90d"];

export function FilterProvider({ children }: { children: ReactNode }) {
  const [params, setParams] = useSearchParams();
  const rawRange = params.get("range") as RangeKey | null;
  const range: RangeKey = rawRange && validRanges.includes(rawRange) ? rawRange : "7d";
  const channel = params.get("channel") || "all";

  const setRange = (next: RangeKey) => {
    const copy = new URLSearchParams(params);
    if (next === "7d") copy.delete("range");
    else copy.set("range", next);
    setParams(copy, { replace: true });
  };

  const setChannel = (next: string) => {
    const copy = new URLSearchParams(params);
    if (next === "all") copy.delete("channel");
    else copy.set("channel", next);
    setParams(copy, { replace: true });
  };

  const value = useMemo(() => ({ range, channel, setRange, setChannel }), [range, channel, params]);

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters(): FilterState {
  const context = useContext(FilterContext);
  if (!context) throw new Error("useFilters must be used inside FilterProvider");
  return context;
}

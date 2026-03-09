import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import type { ArbitrageFilters } from './queryKeys';
import { defaultArbitrageFilters } from './queryKeys';

interface ArbitrageFilterContextValue {
  filters: ArbitrageFilters;
  debouncedFilters: ArbitrageFilters;
  setFilters: (filters: Partial<ArbitrageFilters>) => void;
  resetFilters: () => void;
}

const ArbitrageFilterContext =
  createContext<ArbitrageFilterContextValue | null>(null);

const DEBOUNCE_MS = 300;

interface ArbitrageFilterProviderProps {
  children: ReactNode;
}

export function ArbitrageFilterProvider({
  children,
}: ArbitrageFilterProviderProps) {
  const [filters, setFiltersState] = useState<ArbitrageFilters>(
    defaultArbitrageFilters,
  );
  const [debouncedFilters, setDebouncedFilters] = useState<ArbitrageFilters>(
    defaultArbitrageFilters,
  );

  const setFilters = useCallback((newFilters: Partial<ArbitrageFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(defaultArbitrageFilters);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [filters]);

  return (
    <ArbitrageFilterContext.Provider
      value={{ filters, debouncedFilters, setFilters, resetFilters }}
    >
      {children}
    </ArbitrageFilterContext.Provider>
  );
}

export function useArbitrageFilters(): ArbitrageFilterContextValue {
  const context = useContext(ArbitrageFilterContext);
  if (!context) {
    throw new Error(
      'useArbitrageFilters must be used within an ArbitrageFilterProvider',
    );
  }
  return context;
}

export function useDebouncedArbitrageFilters(): ArbitrageFilters {
  const { debouncedFilters } = useArbitrageFilters();
  return debouncedFilters;
}

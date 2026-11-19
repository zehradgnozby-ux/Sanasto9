import { createContext, useContext, useEffect } from 'react';

const AppHeaderContext = createContext<(hidden: boolean) => void>(() => {});

export function AppHeaderProvider({
  value,
  children,
}: {
  value: (hidden: boolean) => void;
  children: React.ReactNode;
}) {
  return <AppHeaderContext.Provider value={value}>{children}</AppHeaderContext.Provider>;
}

export function useHideAppHeader(hidden: boolean) {
  const setHidden = useContext(AppHeaderContext);
  useEffect(() => {
    setHidden(hidden);
    return () => setHidden(false);
  }, [setHidden, hidden]);
}

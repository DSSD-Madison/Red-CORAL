import * as React from "react";

import { getData } from "./data";

type SyncProviderProps = { children: React.ReactNode };

export function SyncProvider({ children }: SyncProviderProps) {
  const [isBootstrapped, setIsBootstrapped] = React.useState<boolean>(() => {
    const storedValue = localStorage.getItem("isBootstrapped");
    return storedValue === "true";
  });

  React.useEffect(() => {
    if (!isBootstrapped) {
      const fetchData = async () => {
        await getData();
        setIsBootstrapped(true);
        localStorage.setItem("isBootstrapped", "true");
      };

      fetchData();
    }
  }, [isBootstrapped]);

  if (!isBootstrapped) return <>Loading...</>;

  return children;
}

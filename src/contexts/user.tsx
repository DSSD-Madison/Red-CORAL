import * as React from "react";
import { User } from "firebase/auth";

import { auth } from "../lib/firebase";

type UserContextType = User | null;

const UserContext = React.createContext<{ value: UserContextType } | undefined>(
  undefined,
);

export function useUser() {
  const context = React.useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context.value;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<UserContextType>(null);

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ value: user }}>
      {children}
    </UserContext.Provider>
  );
}

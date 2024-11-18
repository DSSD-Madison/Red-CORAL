import { Outlet, Navigate } from "react-router-dom";

import { useUser } from "../contexts/user";

export default function RequireAuth() {
  const user = useUser();

  return user ? <Outlet /> : <Navigate to="/signin" replace />;
}

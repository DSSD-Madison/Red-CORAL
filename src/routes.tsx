import { createBrowserRouter, RouterProvider } from "react-router-dom";

import RequireAuth from "./components/RequireAuth";

const router = createBrowserRouter([
  {
    path: "/signin",
    lazy: () => import("./routes/signin"),
  },
  {
    path: "/dashboard",
    element: <RequireAuth />,
    children: [
      {
        index: true,
        lazy: () => import("./routes/dashboard/home"),
      },
    ],
  },
]);

export default function Routes() {
  return <RouterProvider router={router} />;
}

import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    lazy: () => import("./routes/home"),
  },
]);

export default function Routes() {
  return <RouterProvider router={router} />;
}

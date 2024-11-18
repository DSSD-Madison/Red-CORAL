import { UserProvider } from "./contexts/user";
import Routes from "./routes";

export default function App() {
  return (
    <UserProvider>
      <Routes />
    </UserProvider>
  );
}

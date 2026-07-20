import AppRouter from "./router";
import ChatWidget from "./components/ChatWidget/ChatWidget";
import { useLocation } from "react-router-dom";

function ChatWidgetGate() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  if (isAdminRoute) return null;

  return <ChatWidget />;
}
function App() {
  return (
    <>
      <AppRouter />
      <ChatWidgetGate />
    </>
  );
}

export default App;

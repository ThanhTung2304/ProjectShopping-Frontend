// import { StrictMode } from "react";
// import ReactDOM from "react-dom/client";
// import AppRouter from "./router/index";
// import { AuthProvider } from "./context/AuthContext";
// import { CartProvider } from "./context/CartContext";
// import "./index.css";
// import App from "./App";

// ReactDOM.createRoot(document.getElementById("root")).render(
//   <StrictMode>
//     <AuthProvider>
//       <CartProvider>
//         <AppRouter />
//         <App />
//       </CartProvider>
//     </AuthProvider>
//   </StrictMode>
// );





import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </AuthProvider>
  </StrictMode>
);
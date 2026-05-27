import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import AuthPage from "./pages/Auth";
import HomePage from "./pages/HomePage/HomePage";
import ProductPage from "./pages/ProductPage/ProductPage";
import CollectionPage from "./pages/CollectionPage/CollectionPage";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/products" element={<ProductPage />} />
      <Route path="/collections" element={<CollectionPage />} />
    </Routes>
  </BrowserRouter>
);
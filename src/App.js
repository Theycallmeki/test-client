// App.js
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Scanner from "./components/Scanner";
import Item from "./components/Item";
import Checkout from "./components/Checkout";

function App() {
  const [cart, setCart] = useState([]);

  // Add item to cart
  const handleAddToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.barcode === product.barcode
      );
      if (existingItem) {
        return prevCart.map((item) =>
          item.barcode === product.barcode
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  // Handle quantity change
  const handleQuantityChange = (barcode, newQuantity) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.barcode === barcode ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  return (
    <Router>
      <Header />
      <Routes>
        <Route
          path="/scanner"
          element={<Scanner onAddToCart={handleAddToCart} />}
        />
        <Route
          path="/"
          element={<Item cart={cart} onQuantityChange={handleQuantityChange} />}
        />
        <Route
          path="/checkout"
          element={<Checkout cart={cart} />}
        />
      </Routes>
    </Router>
  );
}

export default App;

import React from "react";
import "./Page.css";

const BrowseMenuPage = () => {
  return (
    <div className="page-container">
      <h1 className="page-title">🍕 Browse Menu</h1>
      <p className="page-description">Explore tasty dishes from your favorite canteens!</p>
      <div className="card-grid">
        <div className="food-card">
          <img src="/images/pizza.jpg" alt="Pizza" />
          <h3>Cheese Burst Pizza</h3>
          <p>₹150 | Cheesy delight!</p>
        </div>
        <div className="food-card">
          <img src="/images/burger.jpg" alt="Burger" />
          <h3>Double Patty Burger</h3>
          <p>₹120 | Extra juicy and crispy!</p>
        </div>
        <div className="food-card">
          <img src="/images/dosa.jpg" alt="Dosa" />
          <h3>Masala Dosa</h3>
          <p>₹80 | South Indian favorite</p>
        </div>
      </div>
    </div>
  );
};

export default BrowseMenuPage;
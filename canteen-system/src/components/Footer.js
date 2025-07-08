// Footer.js
import React, { useEffect, useState } from 'react';
import './HeaderFooter.css';

const quotes = [
  "Good food is good mood 🍲",
  "Serving smiles, one meal at a time 😊",
  "Where every flavor tells a story 🍛",
  "Eat well. Live well. 🌱",
  "Fast, fresh, and fabulous ✨",
  "Canteens made smarter with FoodServe360 🚀"
];

const Footer = () => {
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="footer">
      <div className="footer-quote">"{quotes[quoteIndex]}"</div>
      <div className="footer-text">
        <strong>FoodServe360</strong> © {new Date().getFullYear()} — All rights reserved
      </div>
      <div className="footer-subtext">Made with ❤ by Our Team </div>
    </footer>
  );
};

export default Footer;
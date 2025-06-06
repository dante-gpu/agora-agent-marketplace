// src/components/Footer.tsx
import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full py-4 bg-gray-900 text-gray-300 text-center">
      <div className="max-w-xl mx-auto flex flex-col md:flex-row items-center justify-center space-y-2 md:space-y-0 md:space-x-4">
        <a
          href="https://t.me/+3d6uCNf5pX42YTY8"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white"
        >
          Community Telegram
        </a>
        <a
          href="mailto:dantegpu@gmail.com"
          className="hover:text-white"
        >
          Contact Us
        </a>
      </div>
    </footer>
  );
}

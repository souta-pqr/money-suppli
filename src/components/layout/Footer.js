import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white">
      <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-gray-500">
          © {new Date().getFullYear()} マネーサプリ - 初心者のための金融学習アプリ
        </p>
      </div>
    </footer>
  );
};

export default Footer;
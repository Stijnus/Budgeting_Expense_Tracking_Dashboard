import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 border-t border-gray-200 mt-auto py-4 px-4 sm:px-6 lg:px-8">
      <div className="text-center text-sm text-gray-500">
        &copy; {currentYear} Budget Tracker App. All rights reserved.
        {/* Add other footer links or info here if needed */}
        {/* <span className="mx-2">|</span>
        <a href="/privacy" className="hover:text-gray-700">Privacy Policy</a> */}
      </div>
    </footer>
  );
};

export default Footer;

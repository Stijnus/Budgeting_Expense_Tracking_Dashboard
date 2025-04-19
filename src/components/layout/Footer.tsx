import React from "react";
import { Github, Twitter, Mail } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-white/80 backdrop-blur-xl border-t border-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand and Description */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-800">
              Budget Tracker
            </h3>
            <p className="text-sm text-gray-500 max-w-xs">
              Take control of your finances with our powerful budgeting and
              expense tracking tools.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-500 hover:text-indigo-600 transition-colors duration-200"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-500 hover:text-indigo-600 transition-colors duration-200"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-500 hover:text-indigo-600 transition-colors duration-200"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-500 hover:text-indigo-600 transition-colors duration-200"
                >
                  Contact Support
                </a>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Connect With Us
            </h4>
            <div className="flex space-x-4">
              <a
                href="#"
                className="p-2 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Budget Tracker. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

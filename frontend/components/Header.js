// /Users/prajwal/Developer/code-helper/frontend/components/Header.js

import React, { useState, useEffect } from 'react';
import { FaGithub, FaCode, FaQuestion, FaSun, FaMoon, FaBars, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Toggle theme mode (just UI for now, would need to integrate with a theme context)
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <header className={`${isScrolled ? 'shadow-md' : ''} transition-all duration-300 bg-white dark:bg-gray-900 sticky top-0 z-50`}>
      <div className="container mx-auto py-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-gradient-to-r from-indigo-600 to-purple-500 p-2.5 rounded-lg mr-3 text-white shadow-lg transform hover:scale-105 transition-transform duration-300">
              <FaCode className="text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-500">DevSolver</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Powered by Vertex AI Gemini</p>
            </div>
          </motion.div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => setIsHelpOpen(!isHelpOpen)}
              className="text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 transition-colors flex items-center font-medium"
            >
              <FaQuestion className="mr-1.5" />
              <span>Help</span>
            </button>
            
            <a
              href="https://github.com/yourusername/documentation-helper"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 transition-colors flex items-center font-medium"
            >
              <FaGithub className="mr-1.5" />
              <span>GitHub</span>
            </a>
            
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <FaSun /> : <FaMoon />}
            </button>
            
            <a 
              href="#"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-full text-sm font-medium shadow-md hover:shadow-lg transform hover:translate-y-[-1px] transition-all duration-300 flex items-center"
            >
              Get Started
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-3 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <FaSun /> : <FaMoon />}
            </button>
            
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
              aria-label="Open mobile menu"
            >
              {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="md:hidden bg-white dark:bg-gray-900 border-t dark:border-gray-800"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="container mx-auto py-3 px-4 space-y-3">
              <button
                onClick={() => {
                  setIsHelpOpen(!isHelpOpen);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center"
              >
                <FaQuestion className="mr-3" />
                <span>Help</span>
              </button>
              
              <a
                href="https://github.com/yourusername/documentation-helper"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center"
              >
                <FaGithub className="mr-3" />
                <span>GitHub</span>
              </a>
              
              <a 
                href="#"
                className="w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg text-sm font-medium shadow-md"
              >
                Get Started
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Help Panel */}
      <AnimatePresence>
        {isHelpOpen && (
          <motion.div 
            className="bg-gray-50 dark:bg-gray-800 border-t border-b border-gray-200 dark:border-gray-700 shadow-inner"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="container mx-auto py-4 px-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3 text-lg flex items-center">
                <FaQuestion className="mr-2 text-indigo-500" />
                How to use DevSolver
              </h3>
              <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-2 list-decimal pl-5">
                <li className="pb-2 border-b border-gray-200 dark:border-gray-700">Input your code via <span className="font-medium text-indigo-600 dark:text-indigo-400">snippet</span>, <span className="font-medium text-indigo-600 dark:text-indigo-400">GitHub repo</span>, or <span className="font-medium text-indigo-600 dark:text-indigo-400">file upload</span></li>
                <li className="pb-2 border-b border-gray-200 dark:border-gray-700">Select the programming language from the dropdown menu</li>
                <li className="pb-2 border-b border-gray-200 dark:border-gray-700">Ask a specific question about your code</li>
                <li className="pb-2 border-b border-gray-200 dark:border-gray-700">Compare answers from both <span className="font-medium text-indigo-600 dark:text-indigo-400">official documentation</span> and <span className="font-medium text-indigo-600 dark:text-indigo-400">community solutions</span></li>
                <li>View code analysis for insights, improvements, and optimization suggestions</li>
              </ol>
              <button 
                onClick={() => setIsHelpOpen(false)}
                className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center"
              >
                <FaTimes className="mr-1" />
                Close help
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
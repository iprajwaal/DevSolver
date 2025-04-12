// /Users/prajwal/Developer/code-helper/frontend/components/QueryPanel.js

import React, { useState } from 'react';
import { 
  FaSearch, 
  FaSpinner, 
  FaLightbulb, 
  FaMicrophone,
  FaChevronDown, 
  FaChevronUp
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const QueryPanel = ({ query, onQueryChange, onSubmit, loading }) => {
  const [showExamples, setShowExamples] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  const exampleQuestions = [
    "What's the best way to handle state in this component?",
    "How can I optimize this function for better performance?",
    "What's causing this error and how can I fix it?",
    "How should I refactor this code to follow best practices?",
    "Can you explain how this code works and suggest improvements?",
    "Are there any security vulnerabilities in this code?",
    "What's a more elegant way to implement this feature?",
  ];

  const applyExample = (example) => {
    onQueryChange({ target: { value: example } });
    setShowExamples(false);
  };

  return (
    <motion.div 
      className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-800"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <FaSearch className="mr-2 text-indigo-500" />
          Ask a Question
        </h2>
      </div>
      
      <div className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label htmlFor="query" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              What would you like to know about your code?
            </label>
            <div className="relative">
              <textarea
                id="query"
                name="query"
                rows={isExpanded ? 6 : 3}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 resize-none transition-all duration-300"
                placeholder="E.g., How can I fix this React state update issue? What's causing this error?"
                value={query}
                onChange={onQueryChange}
                disabled={loading}
              />
              <button 
                type="button" 
                onClick={() => setIsExpanded(!isExpanded)}
                className="absolute bottom-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label={isExpanded ? "Collapse text area" : "Expand text area"}
              >
                {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
              </button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center">
              <button
                type="button"
                className="flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                onClick={() => setShowExamples(!showExamples)}
              >
                <FaLightbulb className="mr-1.5 text-amber-500" />
                {showExamples ? "Hide examples" : "Show examples"}
              </button>
              
              <div className="hidden sm:block mx-3 h-4 border-r border-gray-300 dark:border-gray-700"></div>
              
              <button 
                type="button"
                className="hidden sm:flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
              >
                <FaMicrophone className="mr-1.5 text-indigo-500" />
                Voice input
              </button>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-md transition-all duration-300 ${
                loading 
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 hover:shadow-xl transform hover:translate-y-[-1px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <FaSearch className="mr-2" />
                  Get Answer
                </>
              )}
            </button>
          </div>
        </form>
        
        <AnimatePresence>
          {showExamples && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-5 overflow-hidden"
            >
              <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
                <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <FaLightbulb className="text-amber-500 mr-2" />
                  Example Questions
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-2 scrollbar-thin">
                  {exampleQuestions.map((question, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      type="button"
                      onClick={() => applyExample(question)}
                      className="text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 shadow-sm hover:shadow"
                    >
                      {question}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default QueryPanel;
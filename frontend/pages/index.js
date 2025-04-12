// /Users/prajwal/Developer/code-helper/frontend/pages/index.js

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { FaBook, FaUsers, FaCode } from 'react-icons/fa';
import CodeInputPanel from '../components/CodeInputPanel';
import QueryPanel from '../components/QueryPanel';
import ResultsPanel from '../components/ResultsPanel';
import Header from '../components/Header';
import { submitQuery, getSupportedTechnologies } from '../utils/api';
import { useNotification } from '../contexts/NotificationContext';

export default function Home() {
  const [codeData, setCodeData] = useState({
    code: '',
    language: 'python',
    source: 'snippet',
    githubRepo: null,
  });
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [codeAnalysis, setCodeAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState('official');
  const [supportedTechnologies, setSupportedTechnologies] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const { showSuccess, showError, showInfo } = useNotification();
  
  useEffect(() => {
    // Fetch supported technologies when component mounts
    const fetchTechnologies = async () => {
      try {
        const technologies = await getSupportedTechnologies();
        setSupportedTechnologies(technologies);
      } catch (error) {
        console.error('Failed to fetch technologies:', error);
        showError('Failed to load supported technologies');
      }
    };
    
    fetchTechnologies();
    
    // Check for user's preferred color scheme
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
    
    // Show welcome message
    showInfo('Welcome to DevSolver! Enter your code and ask a question to get started.', 7000);
  }, []);
  
  useEffect(() => {
    // Apply dark mode class to body
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };
  
  const handleSubmit = async () => {
    if (!codeData.code && codeData.source === 'snippet') {
      showError('Please provide code to analyze');
      return;
    }
    
    if (!query) {
      showError('Please enter a question about your code');
      return;
    }
    
    setLoading(true);
    
    try {
      const queryData = {
        source: codeData.source,
        technology: codeData.language,
        code_snippet: codeData.code,
        github_repo: codeData.githubRepo,
        query: query,
        response_source_preference: 'both',
      };
      
      const data = await submitQuery(queryData);
      setResults(data);
      setCodeAnalysis(data.code_analysis);
      showSuccess('Analysis complete! Showing results from both documentation and community sources.');
      
    } catch (error) {
      console.error('Error submitting query:', error);
      showError('An error occurred while processing your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCodeChange = (code) => {
    setCodeData({ ...codeData, code });
  };
  
  const handleLanguageChange = (language) => {
    setCodeData({ ...codeData, language });
  };
  
  const handleSourceChange = (source, githubRepo = null) => {
    setCodeData({ ...codeData, source, githubRepo });
  };
  
  const handleQueryChange = (e) => {
    setQuery(e.target.value);
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300`}>
      <Head>
        <title>DevSolver - AI-Powered Code Assistant</title>
        <meta name="description" content="Get programming help from official docs and community solutions with AI-powered assistance" />
        <link rel="icon" href="/favicon.ico" />
        {/* Add these meta tags for better SEO and social sharing */}
        <meta property="og:title" content="DevSolver - AI-Powered Code Assistant" />
        <meta property="og:description" content="Get programming help from official docs and community solutions" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://devsolver.app" />
        <meta property="og:image" content="https://devsolver.app/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      
      <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      
      <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Hero section - only shown when no results yet */}
        {!results && !loading && (
          <motion.div 
            className="text-center mb-12 pt-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              Code Solutions Made Simple
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Get answers to your coding questions from both official documentation and community sources.
              Let AI help you write better code, fix bugs, and understand complex concepts.
            </p>
          </motion.div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <CodeInputPanel 
              codeData={codeData}
              onCodeChange={handleCodeChange}
              onLanguageChange={handleLanguageChange}
              onSourceChange={handleSourceChange}
              supportedTechnologies={supportedTechnologies}
            />
            
            <QueryPanel 
              query={query}
              onQueryChange={handleQueryChange}
              onSubmit={handleSubmit}
              loading={loading}
            />
          </div>
          
          <div>
            <ResultsPanel 
              results={results}
              loading={loading}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              codeAnalysis={codeAnalysis}
            />
          </div>
        </div>
        
        {/* Features section - shown only when no results */}
        {!results && !loading && (
          <motion.div 
            className="mt-16 mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-10">How DevSolver Helps You</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
                  <FaBook className="text-indigo-600 dark:text-indigo-400 text-xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Official Documentation</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Get accurate answers based on official documentation and best practices from language and framework authors.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
                  <FaUsers className="text-purple-600 dark:text-purple-400 text-xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Community Solutions</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Learn from practical solutions shared by developers in forums, blogs, and community discussions.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                  <FaCode className="text-blue-600 dark:text-blue-400 text-xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Code Analysis</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Get insights into your code quality, potential issues, and suggestions for improvement and optimization.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </main>
      
      <footer className="bg-white dark:bg-gray-900 mt-12 py-8 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-500 p-2 rounded-lg mr-3 text-white shadow-md">
                  <FaCode className="text-xl" />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                  DevSolver
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Powered by Vertex AI Gemini
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6">
              <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                About
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Documentation
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Pricing
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Blog
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Contact
              </a>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-800 mt-6 pt-6 text-center text-gray-500 dark:text-gray-400 text-sm">
            <p>
              DevSolver &copy; {new Date().getFullYear()} | All rights reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
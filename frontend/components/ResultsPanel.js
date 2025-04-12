// /Users/prajwal/Developer/code-helper/frontend/components/ResultsPanel.js

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { 
  FaBook, 
  FaUsers, 
  FaExclamationTriangle, 
  FaSpinner, 
  FaCode, 
  FaLightbulb, 
  FaClock, 
  FaClipboard, 
  FaInfoCircle, 
  FaExclamationCircle, 
  FaLink, 
  FaStar,
  FaChevronRight,
  FaCheck,
  FaShare,
  FaPuzzlePiece,
  FaBookmark,
  FaThumbsUp,
  FaThumbsDown,
  FaRocket
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const ResultsPanel = ({ results, loading, activeTab, onTabChange, codeAnalysis }) => {
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [codeHighlighted, setCodeHighlighted] = useState(false);
  const [thumbsUp, setThumbsUp] = useState(false);
  const [thumbsDown, setThumbsDown] = useState(false);
  const [showAnimation, setShowAnimation] = useState(true);
  
  // This would be controlled by the dark mode context in a real app
  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCodeHighlighted(true);
    setTimeout(() => setCodeHighlighted(false), 2000);
  };

  const toggleBookmark = () => {
    setBookmarked(!bookmarked);
  };

  const handleVote = (isUp) => {
    if (isUp) {
      setThumbsUp(true);
      setThumbsDown(false);
    } else {
      setThumbsDown(true);
      setThumbsUp(false);
    }
  };

  React.useEffect(() => {
    // Reset animation state when results change
    setShowAnimation(true);
    
    // Reset vote state when results change
    setThumbsUp(false);
    setThumbsDown(false);
    
    const timer = setTimeout(() => {
      setShowAnimation(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [results]);

  const renderCodeBlock = (code, language) => {
    if (!code) return null;
    
    return (
      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 shadow-md">
        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
            <FaCode className="mr-2 text-indigo-500" />
            Suggested Code
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleCopyCode(code)}
              className={`text-xs flex items-center px-2 py-1 rounded ${
                codeHighlighted 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-400'
              } transition-colors`}
            >
              {codeHighlighted ? <FaCheck className="mr-1" /> : <FaClipboard className="mr-1" />}
              {codeHighlighted ? 'Copied!' : 'Copy code'}
            </button>
            <button
              className="text-xs flex items-center px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors"
            >
              <FaShare className="mr-1" />
              Share
            </button>
          </div>
        </div>
        <div className="relative overflow-hidden">
          <div className="absolute top-2 right-2 z-10">
            <button
              onClick={toggleTheme}
              className="p-1.5 bg-gray-700/50 hover:bg-gray-700/70 text-white rounded-md transition-colors"
              title={`Switch to ${isDarkTheme ? 'light' : 'dark'} theme`}
            >
              {isDarkTheme ? '☀️' : '🌙'}
            </button>
          </div>
          <SyntaxHighlighter
            language={language || 'javascript'}
            style={isDarkTheme ? vscDarkPlus : oneLight}
            customStyle={{
              margin: 0,
              borderRadius: '0',
              fontSize: '0.95rem',
              padding: '1.5rem',
            }}
            showLineNumbers={true}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center h-full py-20 bg-white dark:bg-gray-900 rounded-xl shadow-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative">
          <div className="absolute animate-ping opacity-25 w-20 h-20 rounded-full bg-indigo-500"></div>
          <div className="relative bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full p-6 shadow-lg">
            <FaSpinner className="text-white text-4xl animate-spin" />
          </div>
        </div>
        <h2 className="text-xl font-medium text-gray-900 dark:text-white mt-8">Processing your request...</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md text-center px-6">
          We're analyzing your code and searching for the most relevant documentation and community solutions.
        </p>
        
        <div className="mt-8">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "450ms" }}></div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!results) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center h-full py-16 bg-white dark:bg-gray-900 rounded-xl shadow-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 rounded-full shadow-lg">
          <FaLightbulb className="text-white text-3xl" />
        </div>
        <h2 className="text-xl font-medium text-gray-900 dark:text-white mt-6">Ready to Help</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-md text-center px-6">
          Enter your code and ask a question to get answers from both official documentation
          and community sources. Compare approaches and choose the solution that works best for you.
        </p>
        
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg px-6">
          <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mb-3">
              <FaCode className="text-indigo-500" />
            </div>
            <span className="text-gray-700 dark:text-gray-300 font-medium text-center">Add your code</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mb-3">
              <FaBook className="text-purple-500" />
            </div>
            <span className="text-gray-700 dark:text-gray-300 font-medium text-center">Ask a question</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-3">
              <FaRocket className="text-blue-500" />
            </div>
            <span className="text-gray-700 dark:text-gray-300 font-medium text-center">Get solutions</span>
          </div>
        </div>
      </motion.div>
    );
  }

  const officialSolution = results.official_solution;
  const communitySolution = results.community_solution;
  
  const renderSolution = (solution, type) => {
    if (!solution) {
      return (
        <div className="p-6 text-center">
          <div className="inline-block p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
            <FaInfoCircle className="text-gray-400 dark:text-gray-500 text-xl" />
          </div>
          <p className="text-gray-700 dark:text-white font-medium">No {type} solution available</p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Try modifying your query or checking another tab</p>
        </div>
      );
    }
    
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            {type === 'official' ? (
              <span className="bg-indigo-100 dark:bg-indigo-900/30 p-1.5 rounded-md mr-2">
                <FaBook className="text-indigo-500" />
              </span>
            ) : (
              <span className="bg-purple-100 dark:bg-purple-900/30 p-1.5 rounded-md mr-2">
                <FaUsers className="text-purple-500" />
              </span>
            )}
            {type === 'official' ? 'Documentation Solution' : 'Community Solution'}
          </h3>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={toggleBookmark}
              className={`p-1.5 rounded-md ${
                bookmarked 
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              } transition-colors`}
              title={bookmarked ? 'Remove bookmark' : 'Bookmark solution'}
            >
              <FaBookmark />
            </button>
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
              <button 
                onClick={() => handleVote(true)}
                className={`p-1.5 ${
                  thumbsUp 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400'
                } transition-colors`}
                title="This was helpful"
              >
                <FaThumbsUp />
              </button>
              <button 
                onClick={() => handleVote(false)}
                className={`p-1.5 ${
                  thumbsDown 
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                } transition-colors`}
                title="This wasn't helpful"
              >
                <FaThumbsDown />
              </button>
            </div>
          </div>
        </div>
        
        <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-white prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline prose-code:text-gray-800 dark:prose-code:text-gray-200 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
          <motion.div
            initial={{ opacity: showAnimation ? 0 : 1 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <ReactMarkdown
              components={{
                code: ({node, inline, className, children, ...props}) => {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      language={match[1]}
                      style={isDarkTheme ? vscDarkPlus : oneLight}
                      customStyle={{
                        borderRadius: '0.5rem',
                        fontSize: '0.9rem',
                        marginTop: '1rem',
                        marginBottom: '1rem',
                        boxShadow: '0 2px 5px 0 rgba(0,0,0,0.1)',
                      }}
                      showLineNumbers={true}
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
                h1: ({children}) => <h1 className="text-xl font-bold mt-6 mb-4 dark:text-white">{children}</h1>,
                h2: ({children}) => <h2 className="text-lg font-bold mt-5 mb-3 dark:text-white">{children}</h2>,
                h3: ({children}) => <h3 className="text-base font-bold mt-4 mb-2 dark:text-white">{children}</h3>,
                ul: ({children}) => <ul className="mt-2 mb-4 pl-6 list-disc dark:text-gray-100">{children}</ul>,
                ol: ({children}) => <ol className="mt-2 mb-4 pl-6 list-decimal dark:text-gray-100">{children}</ol>,
                li: ({children}) => <li className="mb-1 dark:text-gray-100">{children}</li>,
                p: ({children}) => <p className="mb-4 dark:text-gray-100">{children}</p>,
              }}
            >
              {solution.answer}
            </ReactMarkdown>
          </motion.div>
        </div>
        
        {solution.code_changes && renderCodeBlock(solution.code_changes, results.technology)}
        
        {solution.references && solution.references.length > 0 && (
          <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <FaInfoCircle className="mr-2 text-indigo-500" />
              Sources & References
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-sm">
              <ul className="space-y-3">
                {solution.references.map((ref, index) => (
                  <motion.li 
                    key={index} 
                    className="flex items-start bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className="flex-shrink-0 bg-gray-100 dark:bg-gray-800 p-2 rounded-md mr-3">
                      <FaLink className="text-indigo-500" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white mb-1">{ref.source.title}</div>
                      {ref.source.description && (
                        <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">{ref.source.description}</p>
                      )}
                      {ref.source.url && (
                        <a
                          href={ref.source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-xs inline-flex items-center mt-1 font-medium"
                        >
                          View source
                          <FaChevronRight className="ml-1 h-2 w-2" />
                        </a>
                      )}
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCodeAnalysis = () => {
    if (!codeAnalysis) return null;
    
    return (
      <div className="p-6">
        <div className="mb-8">
          <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded-md mr-2">
              <FaExclamationCircle className="text-red-500" />
            </span>
            Issues Detected
          </h3>
          {codeAnalysis.issues && codeAnalysis.issues.length > 0 ? (
            <div className="space-y-4">
              {codeAnalysis.issues.map((issue, index) => (
                <motion.div 
                  key={index} 
                  className={`flex p-4 rounded-lg border shadow-sm ${
                    issue.severity === 'high' 
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                      : issue.severity === 'medium' 
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' 
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className={`flex-shrink-0 p-1.5 rounded-md mr-3 ${
                    issue.severity === 'high' 
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-500' 
                      : issue.severity === 'medium' 
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-500' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    <FaExclamationTriangle />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 dark:text-gray-200 font-medium mb-2">{issue.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {issue.line_number && (
                        <span className="inline-flex items-center text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 py-1 px-2 rounded-full">
                          <FaCode className="mr-1 text-gray-500" />
                          Line: {issue.line_number}
                        </span>
                      )}
                      <span className={`inline-flex items-center text-xs font-medium py-1 px-2 rounded-full ${
                        issue.severity === 'high' 
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' 
                          : issue.severity === 'medium' 
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                      }`}>
                        Severity: {issue.severity}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 flex items-start shadow-sm">
              <div className="flex-shrink-0 bg-emerald-100 dark:bg-emerald-900/30 p-1.5 rounded-md mr-3 text-emerald-500">
                <FaStar />
              </div>
              <div className="flex-1">
                <p className="text-emerald-800 dark:text-emerald-300 font-medium">No significant issues detected in your code.</p>
                <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-1">Your code follows good practices and doesn't contain obvious errors.</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="mb-8">
          <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="bg-amber-100 dark:bg-amber-900/30 p-1.5 rounded-md mr-2">
              <FaLightbulb className="text-amber-500" />
            </span>
            Improvement Suggestions
          </h3>
          {codeAnalysis.suggestions && codeAnalysis.suggestions.length > 0 ? (
            <div className="space-y-4">
              {codeAnalysis.suggestions.map((suggestion, index) => (
                <motion.div 
                  key={index} 
                  className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 shadow-sm hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/30 p-1.5 rounded-md mr-3 text-indigo-500">
                      <FaPuzzlePiece />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800 dark:text-gray-200 font-medium mb-1">{suggestion.description}</p>
                      {suggestion.benefit && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 mb-2">{suggestion.benefit}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className={`inline-flex items-center text-xs font-medium py-1 px-2 rounded-full ${
                          suggestion.effort === 'high' 
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' 
                            : suggestion.effort === 'medium' 
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300' 
                            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                        }`}>
                          Effort: {suggestion.effort}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm text-center">
              <p className="text-gray-500 dark:text-gray-400 italic">No specific suggestions available.</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Your code appears to be well-structured as is.</p>
            </div>
          )}
        </div>
        
        {codeAnalysis.complexity_score !== undefined && (
          <div className="mb-8">
            <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-md mr-2">
                <FaClock className="text-blue-500" />
              </span>
              Code Complexity
            </h3>
            <div className="p-5 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-md">
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full mb-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    codeAnalysis.complexity_score > 7 
                      ? 'bg-gradient-to-r from-red-500 to-red-600' 
                      : codeAnalysis.complexity_score > 4 
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500' 
                      : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                  }`}
                  style={{ width: `${codeAnalysis.complexity_score * 10}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs mt-1 px-1">
                <span className="font-medium text-emerald-600 dark:text-emerald-400">Simple</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">Moderate</span>
                <span className="font-medium text-red-600 dark:text-red-400">Complex</span>
              </div>
              
              <div className="mt-5 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Complexity Score:</span> 
                  <span className={`text-lg font-bold ${
                    codeAnalysis.complexity_score > 7 
                      ? 'text-red-600 dark:text-red-400' 
                      : codeAnalysis.complexity_score > 4 
                      ? 'text-amber-600 dark:text-amber-400' 
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {codeAnalysis.complexity_score}/10
                  </span>
                </div>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {codeAnalysis.complexity_score > 7 
                    ? 'High complexity code may be difficult to maintain and test. Consider refactoring into smaller functions.'
                    : codeAnalysis.complexity_score > 4
                    ? 'Moderate complexity is acceptable, but there might be room for improvement in some areas.'
                    : 'Low complexity indicates clean, maintainable code. Great job!'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {codeAnalysis.analysis_details && (
          <div>
            <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="bg-purple-100 dark:bg-purple-900/30 p-1.5 rounded-md mr-2">
                <FaInfoCircle className="text-purple-500" />
              </span>
              Analysis Details
            </h3>
            <div className="bg-white dark:bg-gray-900 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-md space-y-4">
              {codeAnalysis.analysis_details.code_structure && (
                <div>
                  <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                    <FaCode className="mr-2 text-indigo-500" />
                    Code Structure
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-700 dark:text-gray-300">
                      {codeAnalysis.analysis_details.code_structure}
                    </p>
                  </div>
                </div>
              )}
              
              {codeAnalysis.analysis_details.best_practices && (
                <div>
                  <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                    <FaStar className="mr-2 text-amber-500" />
                    Best Practices
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-700 dark:text-gray-300">
                      {codeAnalysis.analysis_details.best_practices}
                    </p>
                  </div>
                </div>
              )}
              
              {codeAnalysis.analysis_details.additional_notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                    <FaLightbulb className="mr-2 text-blue-500" />
                    Additional Notes
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-700 dark:text-gray-300">
                      {codeAnalysis.analysis_details.additional_notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div 
      className="h-full flex flex-col bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-800"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="bg-white dark:bg-gray-900">
          <nav className="flex px-2">
            <button
              className={`group relative px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'official'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => onTabChange('official')}
            >
              <div className="flex items-center">
                <FaBook className={`mr-2 ${
                  activeTab === 'official' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                }`} />
                <span>Official Documentation</span>
              </div>
              {activeTab === 'official' && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"></span>
              )}
            </button>
            
            <button
              className={`group relative px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'community'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => onTabChange('community')}
            >
              <div className="flex items-center">
                <FaUsers className={`mr-2 ${
                  activeTab === 'community' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                }`} />
                <span>Community Solutions</span>
              </div>
              {activeTab === 'community' && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"></span>
              )}
            </button>
            
            <button
              className={`group relative px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'analysis'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => onTabChange('analysis')}
            >
              <div className="flex items-center">
                <FaCode className={`mr-2 ${
                  activeTab === 'analysis' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                }`} />
                <span>Code Analysis</span>
              </div>
              {activeTab === 'analysis' && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"></span>
              )}
            </button>
          </nav>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'official' && (
            <motion.div
              key="official"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {renderSolution(officialSolution, 'official')}
            </motion.div>
          )}
          
          {activeTab === 'community' && (
            <motion.div
              key="community"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {renderSolution(communitySolution, 'community')}
            </motion.div>
          )}
          
          {activeTab === 'analysis' && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {renderCodeAnalysis()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {results.execution_time && (
        <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-3 bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
          <div className="flex items-center">
            <FaClock className="mr-2" />
            Request processed in {results.execution_time.toFixed(2)} seconds
          </div>
          <div className="flex items-center space-x-1">
            <button className="px-2 py-1 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded">
              <FaShare className="text-xs" />
            </button>
            <button className="px-2 py-1 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded">
              <FaBookmark className="text-xs" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ResultsPanel;
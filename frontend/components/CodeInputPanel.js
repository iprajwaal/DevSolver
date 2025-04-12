// /Users/prajwal/Developer/code-helper/frontend/components/CodeInputPanel.js

import React, { useState, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { 
  FaGithub, 
  FaCode, 
  FaUpload, 
  FaLink, 
  FaCog, 
  FaTimes, 
  FaClipboard,
  FaExclamationCircle,
  FaCloudUploadAlt,
  FaEllipsisH,
  FaCheck
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const CodeInputPanel = ({ codeData, onCodeChange, onLanguageChange, onSourceChange, supportedTechnologies = [] }) => {
  const [githubUrl, setGithubUrl] = useState('');
  const [showGithubInput, setShowGithubInput] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [uploadHover, setUploadHover] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);
  
  const getLanguageExtension = () => {
    switch (codeData.language) {
      case 'javascript':
      case 'typescript':
      case 'react':
        return javascript();
      case 'python':
        return python();
      default:
        return python();
    }
  };
  
  const handleGithubSubmit = () => {
    // Parse GitHub URL to extract owner, repo, and optional path
    try {
      const url = new URL(githubUrl);
      if (url.hostname !== 'github.com') {
        alert('Please enter a valid GitHub URL');
        return;
      }
      
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length < 2) {
        alert('Please enter a valid GitHub repository URL');
        return;
      }
      
      const owner = parts[0];
      const repo = parts[1];
      const branch = parts.length > 3 && parts[2] === 'tree' ? parts[3] : 'main';
      const path = parts.length > 4 && parts[2] === 'tree' ? parts.slice(4).join('/') : null;
      
      onSourceChange('github', { owner, repo, branch, path });
      setShowGithubInput(false);
    } catch (error) {
      alert('Please enter a valid GitHub URL');
    }
  };
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      onCodeChange(event.target.result);
      onSourceChange('file');
    };
    reader.readAsText(file);
  };

  const handleCopyCode = () => {
    if (!codeData.code) return;
    
    navigator.clipboard.writeText(codeData.code)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy code: ', err);
      });
  };

  const dropdownVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -10 },
    visible: { opacity: 1, scale: 1, y: 0 }
  };
  
  return (
    <motion.div 
      className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-800"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between bg-white dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <FaCode className="mr-2 text-indigo-500" />
          Code Input
        </h2>
        
        <div className="flex items-center space-x-3">
          {/* Language selector dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-25 transition-colors"
            >
              <span className="flex items-center">
                <span className="w-2 h-2 mr-2 rounded-full bg-indigo-500"></span>
                {codeData.language.charAt(0).toUpperCase() + codeData.language.slice(1)}
              </span>
              <FaCog className="ml-2 text-gray-400" />
            </button>
            
            <AnimatePresence>
              {showLanguageDropdown && (
                <motion.div 
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 dark:divide-gray-700 z-50"
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ duration: 0.2 }}
                >
                  <div className="py-1">
                    {supportedTechnologies.length > 0 ? (
                      supportedTechnologies.map((tech) => (
                        <button
                          key={tech}
                          className={`w-full text-left px-4 py-2 text-sm ${
                            codeData.language === tech 
                              ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' 
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                          onClick={() => {
                            onLanguageChange(tech);
                            setShowLanguageDropdown(false);
                          }}
                        >
                          <div className="flex items-center">
                            {codeData.language === tech && <FaCheck className="mr-2 text-indigo-500" size={12} />}
                            <span className={codeData.language === tech ? "ml-0" : "ml-5"}>
                              {tech.charAt(0).toUpperCase() + tech.slice(1)}
                            </span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <>
                        <button
                          className={`w-full text-left px-4 py-2 text-sm ${
                            codeData.language === 'python' 
                              ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' 
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                          onClick={() => {
                            onLanguageChange('python');
                            setShowLanguageDropdown(false);
                          }}
                        >
                          <div className="flex items-center">
                            {codeData.language === 'python' && <FaCheck className="mr-2 text-indigo-500" size={12} />}
                            <span className={codeData.language === 'python' ? "ml-0" : "ml-5"}>Python</span>
                          </div>
                        </button>
                        <button
                          className={`w-full text-left px-4 py-2 text-sm ${
                            codeData.language === 'javascript' 
                              ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' 
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                          onClick={() => {
                            onLanguageChange('javascript');
                            setShowLanguageDropdown(false);
                          }}
                        >
                          <div className="flex items-center">
                            {codeData.language === 'javascript' && <FaCheck className="mr-2 text-indigo-500" size={12} />}
                            <span className={codeData.language === 'javascript' ? "ml-0" : "ml-5"}>JavaScript</span>
                          </div>
                        </button>
                        <button
                          className={`w-full text-left px-4 py-2 text-sm ${
                            codeData.language === 'typescript' 
                              ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' 
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                          onClick={() => {
                            onLanguageChange('typescript');
                            setShowLanguageDropdown(false);
                          }}
                        >
                          <div className="flex items-center">
                            {codeData.language === 'typescript' && <FaCheck className="mr-2 text-indigo-500" size={12} />}
                            <span className={codeData.language === 'typescript' ? "ml-0" : "ml-5"}>TypeScript</span>
                          </div>
                        </button>
                        <button
                          className={`w-full text-left px-4 py-2 text-sm ${
                            codeData.language === 'react' 
                              ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' 
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                          onClick={() => {
                            onLanguageChange('react');
                            setShowLanguageDropdown(false);
                          }}
                        >
                          <div className="flex items-center">
                            {codeData.language === 'react' && <FaCheck className="mr-2 text-indigo-500" size={12} />}
                            <span className={codeData.language === 'react' ? "ml-0" : "ml-5"}>React</span>
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Source selection buttons */}
          <div className="flex rounded-lg overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => {
                onSourceChange('snippet');
                setShowGithubInput(false);
              }}
              className={`px-3 py-2 text-sm font-medium ${
                codeData.source === 'snippet'
                  ? 'bg-indigo-600 text-white shadow-inner'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              } border border-gray-300 dark:border-gray-700 flex items-center transition-colors`}
            >
              <FaCode className={`${codeData.source === 'snippet' ? 'text-white' : 'text-indigo-500'} mr-1.5`} />
              <span className="hidden sm:inline">Snippet</span>
            </button>
            
            <button
              type="button"
              onClick={() => setShowGithubInput(!showGithubInput)}
              className={`px-3 py-2 text-sm font-medium ${
                codeData.source === 'github'
                  ? 'bg-indigo-600 text-white shadow-inner'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              } border-t border-b border-r border-gray-300 dark:border-gray-700 flex items-center transition-colors`}
            >
              <FaGithub className={`${codeData.source === 'github' ? 'text-white' : 'text-indigo-500'} mr-1.5`} />
              <span className="hidden sm:inline">GitHub</span>
            </button>
            
            <div
              className="relative"
              onMouseEnter={() => setUploadHover(true)}
              onMouseLeave={() => setUploadHover(false)}
            >
              <label
                className={`px-3 py-2 text-sm font-medium ${
                  codeData.source === 'file'
                    ? 'bg-indigo-600 text-white shadow-inner'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                } border border-l-0 border-gray-300 dark:border-gray-700 rounded-r-lg flex items-center cursor-pointer transition-colors`}
              >
                {uploadHover ? (
                  <FaCloudUploadAlt className={`${codeData.source === 'file' ? 'text-white' : 'text-indigo-500'} mr-1.5 animate-bounce`} />
                ) : (
                  <FaUpload className={`${codeData.source === 'file' ? 'text-white' : 'text-indigo-500'} mr-1.5`} />
                )}
                <span className="hidden sm:inline">File</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".py,.js,.jsx,.ts,.tsx,.html,.css"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* GitHub Input Area */}
      <AnimatePresence>
        {showGithubInput && (
          <motion.div 
            className="p-6 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FaLink className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo/tree/branch/path"
                  className="block w-full rounded-l-lg pl-10 py-2.5 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              <button
                type="button"
                onClick={handleGithubSubmit}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-r-lg text-sm font-medium transition-colors shadow-md hover:shadow-lg"
              >
                Load
              </button>
            </div>
            <div className="mt-3 flex items-start text-xs text-gray-500 dark:text-gray-400">
              <FaExclamationCircle className="text-amber-500 mr-1.5 mt-0.5 flex-shrink-0" />
              <p>
                Enter a GitHub repository URL. You can specify a file or directory path. Example: 
                <span className="font-mono bg-gray-100 dark:bg-gray-900 px-1.5 py-0.5 rounded mx-1">
                  https://github.com/username/repo/tree/main/src
                </span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="p-0">
        {codeData.source === 'github' && codeData.githubRepo ? (
          <div className="p-6 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center text-gray-800 dark:text-gray-200 mb-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mr-2">
                <FaGithub className="text-indigo-500" />
              </div>
              <span className="font-medium">GitHub Repository</span>
            </div>
            <div className="font-mono text-sm bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-inner">
              <div className="flex flex-col space-y-2">
                <div className="flex">
                  <span className="font-medium text-gray-500 dark:text-gray-400 w-24">Repository:</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{codeData.githubRepo.owner}/{codeData.githubRepo.repo}</span>
                </div>
                <div className="flex">
                  <span className="font-medium text-gray-500 dark:text-gray-400 w-24">Branch:</span>
                  <span>{codeData.githubRepo.branch}</span>
                </div>
                {codeData.githubRepo.path && (
                  <div className="flex">
                    <span className="font-medium text-gray-500 dark:text-gray-400 w-24">Path:</span>
                    <span className="break-all">{codeData.githubRepo.path}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSourceChange('snippet')}
              className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center font-medium"
            >
              <FaCode className="mr-1.5" />
              Clear and switch to code snippet
            </button>
          </div>
        ) : (
          <div className="relative border-0 h-[450px]">
            <div className="absolute top-2 right-2 z-10 flex space-x-2">
              <button
                onClick={handleCopyCode}
                className={`p-2 rounded-md ${
                  copied 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-800/70 text-white hover:bg-gray-700/70'
                } transition-colors shadow-md`}
                title="Copy code"
              >
                {copied ? <FaCheck /> : <FaClipboard />}
              </button>
              <button
                className="p-2 rounded-md bg-gray-800/70 text-white hover:bg-gray-700/70 transition-colors shadow-md"
                title="More options"
              >
                <FaEllipsisH />
              </button>
            </div>
            <CodeMirror
              value={codeData.code}
              height="450px"
              extensions={[getLanguageExtension()]}
              onChange={onCodeChange}
              theme="dark"
              className="rounded-b-xl text-[15px]"
              basicSetup={{
                lineNumbers: true,
                highlightActiveLineGutter: true,
                highlightActiveLine: true,
                foldGutter: true,
                autocompletion: true,
              }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CodeInputPanel;
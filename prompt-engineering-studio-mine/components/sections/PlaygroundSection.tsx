
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateEnhancedPrompt } from '../../services/geminiService';
import { LoadingSpinner } from '../LoadingSpinner';
import { Card } from '../Card';
import { AccordionItem } from '../Accordion';
/* Added LightBulbIcon to the imported icons */
import { SparklesIcon, ClipboardIcon, CheckIcon, ShareIcon, TrashIcon, ClockIcon, LinkIcon, LightBulbIcon } from '../Icons';
import { playgroundExamples } from '../../constants/playgroundExamples';
import type { PlaygroundExample, HistoryItem } from '../../types';
import { Suggestions } from '../Suggestions';
import { playgroundSuggestions } from '../../constants/playgroundSuggestions';

const LOCAL_STORAGE_KEY = 'promptHistory';

interface PlaygroundSectionProps {
  initialPrompt?: string;
  onPromptUsed?: () => void;
}

export const PlaygroundSection: React.FC<PlaygroundSectionProps> = ({ initialPrompt, onPromptUsed }) => {
  const [userInput, setUserInput] = useState<string>(initialPrompt || '');
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [shareStatus, setShareStatus] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(true);
  const [isChaining, setIsChaining] = useState<boolean>(false);

  const topRef = useRef<HTMLDivElement>(null);
  const inputAreaRef = useRef<HTMLTextAreaElement>(null);

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const savedHistory = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (error) {
      console.error("Failed to load history from localStorage", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error("Failed to save history to localStorage", error);
    }
  }, [history]);
  
  // Handle shared prompt from URL and initial prompt from library
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedPrompt = params.get('prompt');
    const sharedInstructions = params.get('instructions');
    
    if (initialPrompt && onPromptUsed) {
        setUserInput(initialPrompt);
        setCustomInstructions(''); // clear this for a fresh start with a template
        onPromptUsed(); // Signal that the prompt has been consumed
    } else if (sharedPrompt) {
      setUserInput(decodeURIComponent(sharedPrompt));
    }
    
    if (sharedInstructions) {
      setCustomInstructions(decodeURIComponent(sharedInstructions));
    }
    
     // Clean up URL params after reading
    if (sharedPrompt || sharedInstructions) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [initialPrompt, onPromptUsed]);

  const handleGeneratePrompt = useCallback(async () => {
    if (!userInput.trim()) {
      setError('Please enter a base idea or prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedPrompt('');
    try {
      const enhancedPrompt = await generateEnhancedPrompt(userInput, customInstructions);
      setGeneratedPrompt(enhancedPrompt);
      
      // Add to history
      const newHistoryItem: HistoryItem = {
        id: new Date().toISOString(),
        userInput,
        customInstructions,
        generatedPrompt: enhancedPrompt,
        timestamp: new Date().toLocaleString()
      };
      setHistory(prev => [newHistoryItem, ...prev.slice(0, 19)]); // Keep last 20 items

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [userInput, customInstructions]);

  const handleCopyToClipboard = useCallback(() => {
    if (generatedPrompt) {
      navigator.clipboard.writeText(generatedPrompt).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
        setError('Failed to copy text to clipboard.');
      });
    }
  }, [generatedPrompt]);
  
  const handleSharePrompt = useCallback(async () => {
    if (!generatedPrompt) return;

    const shareData = {
      title: 'AI-Generated Prompt',
      text: generatedPrompt,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      const shareUrl = `${window.location.origin}${window.location.pathname}?prompt=${encodeURIComponent(userInput)}&instructions=${encodeURIComponent(customInstructions)}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareStatus('Share link copied to clipboard!');
        setTimeout(() => setShareStatus(''), 2500);
      } catch (err) {
        setShareStatus('Failed to copy share link.');
        setTimeout(() => setShareStatus(''), 2500);
      }
    }
  }, [generatedPrompt, userInput, customInstructions]);

  const handleChainPrompt = useCallback(() => {
    if (!generatedPrompt) return;
    
    // Smooth transition
    setIsChaining(true);
    setUserInput(generatedPrompt);
    setCustomInstructions('');
    setGeneratedPrompt('');
    
    // Scroll to top of playground
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Focus the input
    setTimeout(() => {
      inputAreaRef.current?.focus();
      setIsChaining(false);
    }, 500);
  }, [generatedPrompt]);

  const handleClearAll = useCallback(() => {
    setUserInput('');
    setCustomInstructions('');
    setGeneratedPrompt('');
    setError(null);
    setCopied(false);
  }, []);
  
  const handleSelectExample = (example: PlaygroundExample) => {
    setUserInput(example.userInput);
    setCustomInstructions(example.customInstructions);
  };

  const handleSelectSuggestion = useCallback((suggestion: string) => {
    setUserInput(suggestion);
  }, []);

  const handleReuseHistory = (item: HistoryItem) => {
    setUserInput(item.userInput);
    setCustomInstructions(item.customInstructions);
    setGeneratedPrompt(item.generatedPrompt);
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleDeleteHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  }

  return (
    <div className="space-y-8" ref={topRef}>
      <header className="pb-6 border-b border-gray-700">
        <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Prompt Playground
        </h1>
        <p className="mt-3 text-lg text-gray-400">
          Transform your basic ideas into powerful, high-performance AI prompts. Enter your concept, or start with an example, and let our AI Prompt Genius craft an enhanced version for you.
        </p>
      </header>

      {showSuggestions && (
        <Suggestions
          suggestions={playgroundSuggestions}
          onSelect={handleSelectSuggestion}
          onClose={() => setShowSuggestions(false)}
        />
      )}
      
      <Card title="Start with an Example" className="bg-gray-850">
        <div className="flex flex-wrap gap-2">
            {playgroundExamples.map(ex => (
                <button 
                    key={ex.title} 
                    onClick={() => handleSelectExample(ex)}
                    className="px-3 py-1.5 bg-gray-700 text-sm text-blue-300 rounded-full hover:bg-gray-600 transition-colors"
                >
                    {ex.title}
                </button>
            ))}
        </div>
      </Card>

      <Card className={`bg-gray-850 transition-all duration-300 ${isChaining ? 'ring-2 ring-blue-500 ring-opacity-50 scale-[1.01]' : ''}`}>
        <div className="space-y-6">
          <div className="relative">
            <label htmlFor="userInput" className="block text-sm font-medium text-blue-300 mb-1">
              Your Base Idea or Existing Prompt:
            </label>
            <textarea
              ref={inputAreaRef}
              id="userInput"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              rows={6}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-100 placeholder-gray-400 transition-all duration-300"
              placeholder="e.g., A story about a time-traveling cat."
              aria-label="Your Base Idea or Existing Prompt"
            />
            {isChaining && (
              <div className="absolute top-8 left-0 w-full h-full pointer-events-none bg-blue-500/10 animate-pulse rounded-md" />
            )}
          </div>

          <div>
            <label htmlFor="customInstructions" className="block text-sm font-medium text-blue-300 mb-1">
              Optional: Specific Instructions for Enhancement:
            </label>
            <textarea
              id="customInstructions"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              rows={3}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-100 placeholder-gray-400"
              placeholder="e.g., Target audience: young adults. Tone: humorous and witty. Output: a 500-word short story. Must include a paradoxical event. Avoid clichés."
              aria-label="Optional: Specific Instructions for Enhancement"
            />
             <p className="mt-1 text-xs text-gray-400">
              Examples: desired tone, style, length, target audience, key elements to include/exclude, output format (like JSON or Markdown).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleGeneratePrompt}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:opacity-50 transition-opacity"
              aria-busy={isLoading}
            >
              {isLoading ? (
                <LoadingSpinner size="w-5 h-5" />
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5 mr-2" aria-hidden="true" />
                  Generate Enhanced Prompt
                </>
              )}
            </button>
            <button
              onClick={handleClearAll}
              disabled={isLoading}
              className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-gray-600 text-base font-medium rounded-md shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              aria-label="Clear all inputs and results"
            >
              Clear All
            </button>
          </div>

          {error && (
            <div role="alert" className="p-4 bg-red-900/50 border border-red-500/50 rounded-md text-red-300 text-sm">
                <p className="font-semibold">An Error Occurred</p>
                <p>{error}</p>
            </div>
          )}
        </div>
      </Card>

      {generatedPrompt && (
        <Card title="✨ Genius-Level Prompt ✨" className="bg-gray-850 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative">
            <pre className="whitespace-pre-wrap p-4 bg-gray-900 rounded-md text-gray-200 text-sm overflow-x-auto border border-gray-700" aria-label="Generated enhanced prompt">
              <code>{generatedPrompt}</code>
            </pre>
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                onClick={handleChainPrompt}
                className="p-1.5 bg-gray-700 hover:bg-indigo-600 rounded-md text-indigo-300 hover:text-white transition-colors flex items-center gap-1"
                title="Chain to Input: Use this prompt as a new base for further refinement"
                aria-label="Chain generated prompt back to input"
              >
                <LinkIcon className="w-5 h-5" aria-hidden="true" />
                <span className="hidden sm:inline text-xs font-bold px-1">CHAIN</span>
              </button>
              <button
                onClick={handleSharePrompt}
                className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-gray-300 hover:text-white transition-colors"
                title="Share prompt"
                aria-label="Share generated prompt"
              >
                <ShareIcon className="w-5 h-5" aria-hidden="true" />
              </button>
              <button
                onClick={handleCopyToClipboard}
                className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-gray-300 hover:text-white transition-colors"
                title="Copy to clipboard"
                aria-label="Copy generated prompt to clipboard"
              >
                {copied ? <CheckIcon className="w-5 h-5 text-green-400" aria-label="Copied successfully"/> : <ClipboardIcon className="w-5 h-5" aria-hidden="true" />}
              </button>
            </div>
          </div>
          {shareStatus && <p className="text-xs text-green-400 mt-2 text-right">{shareStatus}</p>}
          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800/50 rounded-md">
            <p className="text-xs text-blue-300 flex items-center gap-2">
                <LightBulbIcon className="w-4 h-4" />
                <span>Tip: Click <strong>CHAIN</strong> to use this refined output as your next starting point for iterative prompt engineering.</span>
            </p>
          </div>
        </Card>
      )}

      {history.length > 0 && (
         <AccordionItem title="Prompt History">
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {history.map(item => (
                    <div key={item.id} className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-semibold text-blue-300 truncate" title={item.userInput}>
                                    {item.userInput}
                                </p>
                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                    <ClockIcon className="w-3 h-3"/>
                                    {item.timestamp}
                                </p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0 ml-4">
                                <button onClick={() => handleDeleteHistory(item.id)} className="p-1 text-gray-400 hover:text-red-400 transition-colors" title="Delete">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleReuseHistory(item)} className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors">
                                    Reuse
                                </button>
                            </div>
                        </div>
                        <details className="mt-2">
                            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-200">View Details</summary>
                            <div className="mt-2 p-2 bg-gray-800 rounded-md">
                                {item.customInstructions && (
                                  <>
                                    <p className="text-xs font-semibold text-gray-300">Instructions:</p>
                                    <p className="text-xs text-gray-400 mb-2">{item.customInstructions}</p>
                                  </>
                                )}
                                <p className="text-xs font-semibold text-gray-300">Generated Prompt:</p>
                                <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono"><code>{item.generatedPrompt}</code></pre>
                            </div>
                        </details>
                    </div>
                ))}
            </div>
         </AccordionItem>
      )}

    </div>
  );
};

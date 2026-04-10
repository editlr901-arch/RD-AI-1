import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Copy, Check, Loader2, Code, Database, Shield, Globe, HardDrive, BarChart3, Search, Smartphone, Layout } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

interface Tool {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  prompt: string;
  placeholder: string;
}

const TOOLS: Tool[] = [
  {
    id: 'ui-kit',
    name: 'UI Kit Generator',
    icon: <Code className="h-5 w-5" />,
    description: 'Generate beautiful React + Tailwind CSS components.',
    prompt: 'Generate a React component using Tailwind CSS for: ',
    placeholder: 'e.g., A glassmorphism login card with floating labels'
  },
  {
    id: 'database',
    name: 'Database Designer',
    icon: <Database className="h-5 w-5" />,
    description: 'Design Firestore schemas and security rules.',
    prompt: 'Generate a Firestore schema and security rules for: ',
    placeholder: 'e.g., A social media app with posts, comments, and likes'
  },
  {
    id: 'auth-flow',
    name: 'Auth Flow Architect',
    icon: <Shield className="h-5 w-5" />,
    description: 'Create secure authentication logic and flows.',
    prompt: 'Generate React + Firebase Auth logic for: ',
    placeholder: 'e.g., Multi-role authentication with admin and user levels'
  },
  {
    id: 'api-proxy',
    name: 'API Proxy Builder',
    icon: <Globe className="h-5 w-5" />,
    description: 'Generate Express.js API routes and proxies.',
    prompt: 'Generate an Express.js API route for: ',
    placeholder: 'e.g., A proxy for a weather API with caching'
  },
  {
    id: 'storage',
    name: 'Storage Helper',
    icon: <HardDrive className="h-5 w-5" />,
    description: 'Generate Firebase Storage upload and retrieval logic.',
    prompt: 'Generate Firebase Storage logic for: ',
    placeholder: 'e.g., Image upload with progress bar and thumbnail generation'
  },
  {
    id: 'analytics',
    name: 'Analytics Tracker',
    icon: <BarChart3 className="h-5 w-5" />,
    description: 'Implement tracking and analytics events.',
    prompt: 'Generate analytics tracking logic for: ',
    placeholder: 'e.g., Tracking user engagement on a dashboard'
  },
  {
    id: 'pwa',
    name: 'PWA Manifest Generator',
    icon: <Smartphone className="h-5 w-5" />,
    description: 'Generate manifest.json and service worker logic.',
    prompt: 'Generate a PWA manifest and service worker for: ',
    placeholder: 'e.g., An offline-first notes application'
  },
  {
    id: 'api-connector',
    name: 'API Connector',
    icon: <Search className="h-5 w-5" />,
    description: 'Generate REST or GraphQL fetch logic.',
    prompt: 'Generate fetch logic (REST/GraphQL) for: ',
    placeholder: 'e.g., Fetching data from a GraphQL endpoint with error handling'
  },
  {
    id: 'microservices',
    name: 'Microservices Architect',
    icon: <Layout className="h-5 w-5" />,
    description: 'Design microservices architecture and communication.',
    prompt: 'Design a microservices architecture for: ',
    placeholder: 'e.g., An e-commerce system with order, payment, and inventory services'
  }
];

interface BuildToolsProps {
  isOpen: boolean;
  onClose: () => void;
  initialToolId?: string;
}

export const BuildTools: React.FC<BuildToolsProps> = ({ isOpen, onClose, initialToolId }) => {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(
    initialToolId ? TOOLS.find(t => t.id === initialToolId) || null : null
  );
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!selectedTool || !prompt) return;
    setIsLoading(true);
    setResult('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const fullPrompt = `${selectedTool.prompt} ${prompt}. Return ONLY the code or schema block.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-latest",
        contents: fullPrompt,
      });
      setResult(response.text || '');
      toast.success('Generated successfully!');
    } catch (err) {
      toast.error('Generation failed.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-5xl h-[80vh] glass rounded-3xl border-primary/30 flex flex-col overflow-hidden"
      >
        <div className="p-6 border-b border-border flex justify-between items-center bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">AI App Build Tools</h2>
              <p className="text-xs text-gray-400">Powered by Gemini AI</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface rounded-full transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-border bg-surface/30 overflow-y-auto p-4 space-y-2">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                onClick={() => {
                  setSelectedTool(tool);
                  setResult('');
                  setPrompt('');
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                  selectedTool?.id === tool.id 
                    ? "bg-primary text-black font-bold shadow-[0_0_15px_rgba(0,255,135,0.3)]" 
                    : "hover:bg-surface text-gray-400 hover:text-white"
                )}
              >
                {tool.icon}
                <span className="text-sm">{tool.name}</span>
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden p-6">
            {selectedTool ? (
              <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    {selectedTool.icon}
                    {selectedTool.name}
                  </h3>
                  <p className="text-sm text-gray-400">{selectedTool.description}</p>
                </div>

                <div className="space-y-4">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={selectedTool.placeholder}
                    className="w-full h-32 bg-background border border-border rounded-2xl p-4 focus:border-primary outline-none resize-none transition-all"
                  />
                  <button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt}
                    className="w-full bg-primary text-black font-bold py-4 rounded-2xl hover:bg-accent transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Generate with AI
                      </>
                    )}
                  </button>
                </div>

                {result && (
                  <div className="flex-1 flex flex-col overflow-hidden mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Output</span>
                      <button 
                        onClick={copyToClipboard}
                        className="flex items-center gap-2 text-xs text-primary hover:text-accent transition-colors"
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied ? 'Copied!' : 'Copy Code'}
                      </button>
                    </div>
                    <div className="flex-1 bg-background rounded-2xl border border-border overflow-auto p-4 font-mono text-sm text-green-400">
                      <pre><code>{result}</code></pre>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                <Search className="h-16 w-16 mb-4 opacity-20" />
                <p className="text-lg">Select a tool from the sidebar to get started</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

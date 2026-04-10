import React, { useState, useEffect, useRef } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/themes/prism-tomorrow.css'; // Dark theme for Prism

import { 
  FileCode, 
  Save, 
  Play, 
  Sparkles, 
  X, 
  ChevronRight, 
  ChevronDown,
  Search,
  Settings,
  Terminal,
  Cpu,
  Zap,
  Bug,
  HelpCircle,
  Download,
  Monitor,
  History
} from 'lucide-react';
import { doc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { usePresence } from '../hooks/usePresence';
import { VisualBuilder } from './VisualBuilder';
import { VersionHistory } from './VersionHistory';

interface RdCodeEditorProps {
  app: any;
  onClose: () => void;
  user: any;
}

export const RdCodeEditor: React.FC<RdCodeEditorProps> = ({ app, onClose, user }) => {
  const [code, setCode] = useState(app.code || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiSidebar, setShowAiSidebar] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState('explorer');
  const activeUsers = usePresence(app.id, user);
  const [isCollaborative, setIsCollaborative] = useState(true);
  const [editorMode, setEditorMode] = useState<'code' | 'visual'>('code');
  const [showHistory, setShowHistory] = useState(false);

  // Real-time Code Sync
  useEffect(() => {
    if (!isCollaborative || !app.id) return;

    const unsubscribe = onSnapshot(doc(db, 'apps', app.id), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        // Only update if the change came from someone else
        if (data.lastUpdatedBy && data.lastUpdatedBy !== user.uid) {
          if (data.code !== code) {
            setCode(data.code);
            toast.info('Remote changes applied', { duration: 1000 });
          }
        }
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'apps/' + app.id);
    });

    return () => unsubscribe();
  }, [app.id, isCollaborative, user.uid]);

  const [suggestion, setSuggestion] = useState('');
  const [cursorPos, setCursorPos] = useState(0);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const editorRef = useRef<any>(null);

  // AI Code Completion Logic
  useEffect(() => {
    const timer = setTimeout(() => {
      if (code && cursorPos > 0 && !isAiLoading) {
        getAiCompletion();
      }
    }, 1500); // 1.5s debounce

    return () => clearTimeout(timer);
  }, [code, cursorPos]);

  const getAiCompletion = async () => {
    if (isSuggesting) return;
    setIsSuggesting(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return;

      const ai = new GoogleGenAI({ apiKey });
      
      const codeBefore = code.substring(0, cursorPos);
      const codeAfter = code.substring(cursorPos);

      const prompt = `You are an AI code completion engine for React/TypeScript. 
      Given the code before the cursor and the code after, suggest a short completion (1-5 lines max).
      Return ONLY the completion text, no markdown, no explanations.
      If no good completion is found, return an empty string.
      
      CODE BEFORE:
      ${codeBefore}
      
      CODE AFTER:
      ${codeAfter}
      
      COMPLETION:`;

      const response = await (ai as any).models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const text = response.text?.replace(/```/g, '').trim();
      
      if (text && text.length < 200) { // Limit suggestion size
        setSuggestion(text);
      } else {
        setSuggestion('');
      }
    } catch (err) {
      console.error("Completion error:", err);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && suggestion) {
      e.preventDefault();
      const newCode = code.substring(0, cursorPos) + suggestion + code.substring(cursorPos);
      setCode(newCode);
      setSuggestion('');
      // Move cursor to end of suggestion
      setTimeout(() => {
        const textarea = document.querySelector('.npm__react-simple-code-editor__textarea') as HTMLTextAreaElement;
        if (textarea) {
          const newPos = cursorPos + suggestion.length;
          textarea.setSelectionRange(newPos, newPos);
          setCursorPos(newPos);
        }
      }, 0);
    }
  };

  const handleSave = async () => {
    if (!user || !app.id) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'apps', app.id), {
        code: code,
        lastUpdatedBy: user.uid,
        updatedAt: serverTimestamp()
      }).catch(err => handleFirestoreError(err, OperationType.UPDATE, 'apps/' + app.id));
      toast.success('Code saved successfully!');
    } catch (err) {
      toast.error('Failed to save code.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAiAction = async (action: string, customPrompt?: string) => {
    setIsAiLoading(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        toast.error('AI API Key not found.');
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      let prompt = '';

      switch (action) {
        case 'improve':
          prompt = `You are a world-class React developer. Refactor and improve the following code for better performance, readability, and modern best practices. Keep the same functionality. Return ONLY the code block.\n\nCode:\n${code}`;
          break;
        case 'debug':
          prompt = `You are a senior debugger. Analyze the following code for potential bugs, security issues, or performance bottlenecks. Suggest fixes. Return ONLY the corrected code block.\n\nCode:\n${code}`;
          break;
        case 'custom':
          prompt = `You are an expert AI developer. Modify the following React code based on this request: "${customPrompt}". Return ONLY the updated code block.\n\nCode:\n${code}`;
          break;
        default:
          return;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const newCode = response.text?.replace(/```(tsx|jsx|typescript|javascript)?\n/g, '').replace(/```/g, '').trim();
      if (newCode) {
        setCode(newCode);
        toast.success('AI updated your code!');
      }
    } catch (err) {
      toast.error('AI generation failed.');
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#1e1e1e] text-[#cccccc] flex flex-col font-sans select-none"
    >
      {/* Top Bar */}
      <div className="h-10 bg-[#323233] flex items-center justify-between px-4 border-b border-[#2b2b2b]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-black font-black text-[10px]">RD</div>
            <span className="text-xs font-bold text-white">RD CODE EDITOR</span>
          </div>
          <div className="h-4 w-[1px] bg-[#454545]" />
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">{app.name}</span>
            <ChevronRight className="h-3 w-3 text-gray-600" />
            <span className="text-white">App.tsx</span>
          </div>
          <div className="h-4 w-[1px] bg-[#454545]" />
          <div className="flex bg-[#252526] rounded-md p-1 border border-[#454545] ml-4">
            <button 
              onClick={() => setEditorMode('code')}
              className={cn(
                "px-3 py-0.5 rounded text-[10px] font-bold transition-all",
                editorMode === 'code' ? "bg-primary text-black" : "text-gray-500 hover:text-white"
              )}
            >
              CODE
            </button>
            <button 
              onClick={() => setEditorMode('visual')}
              className={cn(
                "px-3 py-0.5 rounded text-[10px] font-bold transition-all",
                editorMode === 'visual' ? "bg-primary text-black" : "text-gray-500 hover:text-white"
              )}
            >
              VISUAL
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Active Users Presence */}
          <div className="flex items-center -space-x-2 mr-4">
            {activeUsers.map((u) => (
              <div 
                key={u.uid} 
                className="w-6 h-6 rounded-full border-2 border-[#323233] bg-surface flex items-center justify-center overflow-hidden group relative"
                title={u.displayName}
              >
                {u.photoURL ? (
                  <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/20 text-primary text-[8px] flex items-center justify-center font-bold">
                    {u.displayName.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.8)]" />
                </div>
              </div>
            ))}
            {activeUsers.length > 0 && (
              <div className="ml-4 text-[10px] text-primary font-bold animate-pulse flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                LIVE
              </div>
            )}
          </div>

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 py-1 bg-primary text-black text-xs font-bold rounded hover:bg-accent transition-all disabled:opacity-50"
          >
            <Save className="h-3 w-3" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-[#454545] rounded transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Activity Bar */}
        <div className="w-12 bg-[#333333] flex flex-col items-center py-4 gap-4 border-r border-[#2b2b2b]">
          <button 
            onClick={() => setActiveSidebarTab('explorer')}
            className={cn("p-2 transition-all", activeSidebarTab === 'explorer' ? "text-white border-l-2 border-primary" : "text-gray-500 hover:text-gray-300")}
          >
            <FileCode className="h-6 w-6" />
          </button>
          <button 
            onClick={() => setActiveSidebarTab('search')}
            className={cn("p-2 transition-all", activeSidebarTab === 'search' ? "text-white border-l-2 border-primary" : "text-gray-500 hover:text-gray-300")}
          >
            <Search className="h-6 w-6" />
          </button>
          <button 
            onClick={() => setActiveSidebarTab('ai')}
            className={cn("p-2 transition-all", activeSidebarTab === 'ai' ? "text-primary border-l-2 border-primary" : "text-gray-500 hover:text-gray-300")}
          >
            <Sparkles className="h-6 w-6" />
          </button>
          <button 
            onClick={() => setShowHistory(true)}
            className="p-2 text-gray-500 hover:text-gray-300 transition-all"
          >
            <History className="h-6 w-6" />
          </button>
          <div className="mt-auto flex flex-col gap-4 mb-4">
            <button className="text-gray-500 hover:text-gray-300"><Settings className="h-6 w-6" /></button>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="w-64 bg-[#252526] border-r border-[#2b2b2b] flex flex-col">
          <div className="p-3 text-[11px] uppercase font-bold tracking-wider text-gray-500 flex justify-between items-center">
            <span>{activeSidebarTab}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {activeSidebarTab === 'explorer' && (
              <div className="py-2">
                <div className="flex items-center gap-1 px-4 py-1 hover:bg-[#2a2d2e] cursor-pointer text-xs">
                  <ChevronDown className="h-3 w-3" />
                  <span className="font-bold uppercase tracking-tighter text-[10px] text-gray-500">Source</span>
                </div>
                <div className="flex items-center gap-2 px-8 py-1 bg-[#37373d] cursor-pointer text-xs text-white">
                  <FileCode className="h-3 w-3 text-primary" />
                  <span>App.tsx</span>
                </div>
              </div>
            )}
            {activeSidebarTab === 'ai' && (
              <div className="p-4 space-y-4">
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <h4 className="text-xs font-bold text-primary flex items-center gap-2 mb-2">
                    <Cpu className="h-3 w-3" />
                    RD AI ASSISTANT
                  </h4>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    I can help you refactor, debug, or add new features to your app.
                  </p>
                </div>
                <div className="space-y-2">
                  <button 
                    onClick={() => handleAiAction('improve')}
                    disabled={isAiLoading}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-[#37373d] hover:bg-[#454545] rounded text-xs transition-all disabled:opacity-50"
                  >
                    <Zap className="h-3 w-3 text-yellow-500" />
                    Refactor Code
                  </button>
                  <button 
                    onClick={() => handleAiAction('debug')}
                    disabled={isAiLoading}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-[#37373d] hover:bg-[#454545] rounded text-xs transition-all disabled:opacity-50"
                  >
                    <Bug className="h-3 w-3 text-red-500" />
                    Fix Bugs
                  </button>
                </div>
                <div className="pt-4 border-t border-[#333333]">
                  <textarea 
                    placeholder="Ask RD AI to add a feature..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full bg-[#3c3c3c] border border-[#2b2b2b] rounded p-2 text-xs focus:border-primary outline-none resize-none h-24"
                  />
                  <button 
                    onClick={() => handleAiAction('custom', aiPrompt)}
                    disabled={isAiLoading || !aiPrompt}
                    className="w-full mt-2 bg-primary text-black font-bold py-2 rounded text-xs hover:bg-accent transition-all disabled:opacity-50"
                  >
                    {isAiLoading ? 'AI is thinking...' : 'Apply Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col bg-[#1e1e1e] relative">
          {editorMode === 'code' ? (
            <>
              {/* Tabs */}
              <div className="h-9 bg-[#252526] flex items-center">
                <div className="h-full px-4 bg-[#1e1e1e] border-t border-primary flex items-center gap-2 text-xs text-white">
                  <FileCode className="h-3 w-3 text-primary" />
                  <span>App.tsx</span>
                  <X className="h-3 w-3 text-gray-600 hover:text-white cursor-pointer ml-2" />
                </div>
              </div>

              {/* Code Editor */}
              <div className="flex-1 overflow-auto custom-scrollbar relative">
                <Editor
                  value={code}
                  onValueChange={(newCode) => {
                    setCode(newCode);
                    const textarea = document.querySelector('.npm__react-simple-code-editor__textarea') as HTMLTextAreaElement;
                    if (textarea) setCursorPos(textarea.selectionStart);
                    setSuggestion(''); // Clear suggestion on type
                  }}
                  onKeyDown={handleKeyDown}
                  highlight={code => highlight(code, languages.tsx, 'tsx')}
                  padding={20}
                  style={{
                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                    fontSize: 14,
                    minHeight: '100%',
                    backgroundColor: 'transparent',
                  }}
                  className="outline-none"
                />

                {/* AI Suggestion Ghost Text Overlay */}
                <AnimatePresence>
                  {suggestion && (
                    <div 
                      className="absolute pointer-events-none opacity-40 italic text-primary flex items-center gap-2"
                      style={{
                        left: 20, // This is a simplification, ideally we'd calculate cursor X/Y
                        bottom: 20,
                        backgroundColor: '#252526',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid rgba(var(--primary), 0.3)',
                        fontSize: '12px',
                        zIndex: 5
                      }}
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Press Tab to complete: {suggestion.substring(0, 30)}{suggestion.length > 30 ? '...' : ''}</span>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <VisualBuilder 
              initialCode={code} 
              onCodeChange={(newCode) => setCode(newCode)} 
              onClose={() => setEditorMode('code')} 
            />
          )}

          {/* AI Overlay Loader */}
          <AnimatePresence>
            {isAiLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10"
              >
                <div className="bg-[#252526] p-6 rounded-2xl border border-primary/30 shadow-2xl flex flex-col items-center gap-4">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full"
                  />
                  <div className="text-center">
                    <p className="text-sm font-bold text-white">RD AI is working...</p>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Applying your request</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-primary flex items-center justify-between px-3 text-[10px] text-black font-bold">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Monitor className="h-3 w-3" />
            <span>RD CODE EDITOR v1.0</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            <span>AI READY</span>
          </div>
          <button 
            onClick={() => setIsCollaborative(!isCollaborative)}
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded transition-colors",
              isCollaborative ? "bg-black/20 text-black" : "bg-red-500/20 text-red-900"
            )}
          >
            <div className={cn("w-1.5 h-1.5 rounded-full", isCollaborative ? "bg-black animate-pulse" : "bg-red-500")} />
            <span>{isCollaborative ? 'COLLABORATIVE MODE' : 'OFFLINE MODE'}</span>
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span>Ln 1, Col 1</span>
          <span>Spaces: 2</span>
          <span>UTF-8</span>
          <span>TypeScript JSX</span>
        </div>
      </div>

      <AnimatePresence>
        {showHistory && (
          <VersionHistory 
            appId={app.id} 
            currentCode={code} 
            onRestore={(newCode) => setCode(newCode)} 
            onClose={() => setShowHistory(false)} 
            user={user}
          />
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e1e1e;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border: 2px solid #1e1e1e;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
        .npm__react-simple-code-editor__textarea {
          outline: none !important;
        }
      `}} />
    </motion.div>
  );
};

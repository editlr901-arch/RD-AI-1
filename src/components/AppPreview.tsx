import React, { useEffect, useRef } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AppPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  appName: string;
}

export const AppPreview: React.FC<AppPreviewProps> = ({ isOpen, onClose, code, appName }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  useEffect(() => {
    if (isOpen && iframeRef.current && code) {
      // Clean up the code if it's wrapped in markdown blocks
      const cleanCode = code.replace(/```(javascript|typescript|jsx|tsx)?/g, '').replace(/```/g, '').trim();

      const srcDoc = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
            <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
            <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
            <script src="https://cdn.tailwindcss.com"></script>
            <script src="https://unpkg.com/lucide@latest"></script>
            <script src="https://unpkg.com/lucide-react@latest"></script>
            <script src="https://unpkg.com/framer-motion@10.16.4/dist/framer-motion.js"></script>
            <style>
              body { margin: 0; background: #0f172a; color: white; font-family: 'Inter', sans-serif; overflow-x: hidden; }
              #root { min-height: 100vh; display: flex; flex-direction: column; }
              /* Custom scrollbar for preview */
              ::-webkit-scrollbar { width: 8px; }
              ::-webkit-scrollbar-track { background: #1e293b; }
              ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
              ::-webkit-scrollbar-thumb:hover { background: #475569; }
            </style>
          </head>
          <body>
            <div id="root"></div>
            <script type="text/babel">
              const { useState, useEffect, useMemo, useCallback, useRef, useLayoutEffect } = React;
              const { motion, AnimatePresence, LayoutGroup } = window.Motion || {};
              
              // Mock lucide-react
              const LucideIcons = window.LucideReact || {};
              const lucideProxy = new Proxy(LucideIcons, {
                get: (target, prop) => {
                  if (prop in target) return target[prop];
                  // Fallback to a simple circle if icon not found
                  return () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>;
                }
              });

              // Expose common hooks and components to global for easier access in generated code
              window.React = React;
              window.useState = useState;
              window.useEffect = useEffect;
              window.useMemo = useMemo;
              window.useCallback = useCallback;
              window.useRef = useRef;
              window.motion = motion || { div: 'div', span: 'span', button: 'button', h1: 'h1', h2: 'h2', p: 'p' };
              window.AnimatePresence = AnimatePresence || (({children}) => children);
              
              try {
                // Strip imports from code
                const codeToRun = \`${cleanCode}\`.replace(/import.*from.*;/g, '');
                
                // Execute the code
                const evalResult = eval(\`(function() { 
                  const { \${Object.keys(LucideIcons).join(', ')} } = lucideProxy;
                  \${codeToRun};
                  return typeof App !== 'undefined' ? App : null;
                })()\`);

                let ComponentToRender = evalResult;
                
                if (!ComponentToRender) {
                  // Fallback: try to find any function that starts with uppercase in window
                  const possibleComponents = Object.keys(window).filter(key => 
                    /^[A-Z]/.test(key) && typeof window[key] === 'function' && key !== 'React' && key !== 'ReactDOM'
                  );
                  if (possibleComponents.length > 0) {
                    ComponentToRender = window[possibleComponents[possibleComponents.length - 1]];
                  }
                }
                
                if (ComponentToRender) {
                  const root = ReactDOM.createRoot(document.getElementById('root'));
                  root.render(<ComponentToRender />);
                } else {
                  document.getElementById('root').innerHTML = \`
                    <div style="padding: 40px; text-align: center; color: #94a3b8;">
                      <h3 style="color: #ef4444; font-size: 1.5rem; margin-bottom: 1rem;">Preview Unavailable</h3>
                      <p>Could not find a React component to render.</p>
                      <p style="font-size: 0.875rem; margin-top: 1rem; color: #64748b;">
                        Tip: Make sure your code defines a component (e.g., <code>const App = () => { ... }</code>).
                      </p>
                    </div>
                  \`;
                }
              } catch (err) {
                console.error(err);
                document.getElementById('root').innerHTML = \`
                  <div style="padding: 40px; color: #ef4444;">
                    <h3 style="font-size: 1.5rem; margin-bottom: 1rem;">Runtime Error</h3>
                    <pre style="background: #1e1e1e; padding: 20px; border-radius: 8px; overflow: auto; font-size: 0.875rem;">\${err.message}</pre>
                    <p style="margin-top: 1rem; color: #94a3b8; font-size: 0.875rem;">Check the console for more details.</p>
                  </div>
                \`;
              }
            </script>
          </body>
        </html>
      `;

      iframeRef.current.srcdoc = srcDoc;
    }
  }, [isOpen, code]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "glass rounded-3xl border-primary/30 flex flex-col overflow-hidden transition-all duration-300",
              isFullscreen ? "w-full h-full" : "w-full max-w-5xl h-[85vh]"
            )}
          >
            <div className="flex items-center justify-between p-4 border-b border-border bg-surface/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Maximize2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Preview: {appName}</h3>
                  <p className="text-xs text-gray-400">Sandboxed Environment</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 hover:bg-surface rounded-xl text-gray-400 hover:text-white transition-all"
                >
                  {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                </button>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-red-500/10 rounded-xl text-gray-400 hover:text-red-500 transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-black relative">
              <iframe
                ref={iframeRef}
                title="App Preview"
                className="w-full h-full border-none"
                sandbox="allow-scripts allow-modals"
              />
            </div>

            <div className="p-4 border-t border-border bg-surface/30 flex justify-between items-center">
              <p className="text-xs text-gray-500 italic">
                * This is a simulated preview. Some features like Firebase or external APIs may not work.
              </p>
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-primary text-black font-bold rounded-xl hover:bg-accent transition-all"
              >
                Close Preview
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Helper for Tailwind classes
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

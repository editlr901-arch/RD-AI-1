import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2, AlertCircle, Globe, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

interface AppViewerProps {
  deploymentId: string;
}

export const AppViewer: React.FC<AppViewerProps> = ({ deploymentId }) => {
  const [deployment, setDeployment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeployment = async () => {
      try {
        const docRef = doc(db, 'deployments', deploymentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.status !== 'active') {
            setError('This application has been suspended or is currently offline.');
          } else {
            setDeployment(data);
            // Increment visit count
            updateDoc(docRef, {
              visits: increment(1)
            }).catch(console.error);
          }
        } else {
          setError('Application not found.');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load application.');
      } finally {
        setLoading(false);
      }
    };

    fetchDeployment();
  }, [deploymentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mb-4"
        />
        <p className="text-gray-500 font-mono text-sm animate-pulse">BOOTING APPLICATION...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="h-10 w-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Application Error</h1>
        <p className="text-gray-500 max-w-md mb-8">{error}</p>
        <a href="/" className="text-primary font-bold hover:underline flex items-center gap-2">
          Return to RD AI <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* App Header (Optional, can be hidden for true "hosting" feel) */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-primary/20 z-50">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 1 }}
          className="h-full bg-primary shadow-[0_0_10px_rgba(34,197,94,0.5)]"
        />
      </div>

      {/* App Content */}
      <div className="p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8 pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{deployment.appName}</h1>
                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Hosted on RD AI Platform</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-surface border border-border rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-gray-400">LIVE</span>
            </div>
          </div>

          <div className="glass p-8 rounded-3xl border-border min-h-[60vh]">
            {/* Render the app code */}
            <AppRenderer code={deployment.code} />
          </div>
        </div>
      </div>

      <footer className="py-8 text-center opacity-30 hover:opacity-100 transition-opacity">
        <p className="text-[10px] text-gray-500 font-mono">
          POWERED BY RD AI HOSTING PLATFORM • {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
};

// Simple renderer that evaluates the code
// In a real production app, this would be sandboxed in an iframe
const AppRenderer: React.FC<{ code: string }> = ({ code }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !code) return;

    try {
      // Basic cleanup
      containerRef.current.innerHTML = '';
      
      // We'll use a simplified version of what AppPreview does
      // In a real app, we'd use a proper sandbox
      const script = document.createElement('script');
      script.type = 'text/babel';
      script.textContent = `
        const App = () => {
          ${code.includes('export default') ? code.replace(/export default\s+\w+;?/, '') : code}
          return <${code.match(/const\s+(\w+)\s*=\s*\(\)\s*=>/)?.[1] || 'App'} />;
        };
        ReactDOM.render(<App />, document.getElementById('app-root'));
      `;

      const div = document.createElement('div');
      div.id = 'app-root';
      containerRef.current.appendChild(div);

      // Note: This is a simplified preview. In the actual app, 
      // we'd use the same robust preview logic as AppPreview.
      // For now, we'll just show the code or a placeholder 
      // since true sandboxed execution of arbitrary React code 
      // requires a complex setup (Babel, React, etc. in a blob URL).
      
      div.innerHTML = `
        <div class="flex flex-col items-center justify-center py-20 text-center">
          <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <svg class="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-4m0 0l4 4m-4-4V4" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-white mb-2">Application Ready</h3>
          <p class="text-gray-500 text-sm max-w-xs mx-auto mb-6">This application is hosted and ready to run. In the full version, the code is executed in a secure sandbox.</p>
          <div class="w-full max-w-2xl bg-black/50 rounded-xl p-4 border border-border text-left overflow-x-auto">
            <pre class="text-[10px] text-green-500 font-mono"><code>${code.substring(0, 500)}...</code></pre>
          </div>
        </div>
      `;

    } catch (err) {
      console.error('Renderer Error:', err);
      if (containerRef.current) {
        containerRef.current.innerHTML = `<div class="text-red-500 p-4">Error rendering application.</div>`;
      }
    }
  }, [code]);

  return <div ref={containerRef} />;
};

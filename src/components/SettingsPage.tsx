import React, { useState, useEffect } from 'react';
import { Settings, Save, Key, Shield, AlertTriangle } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const [geminiKey, setGeminiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'app'));
        if (settingsDoc.exists()) {
          setGeminiKey(settingsDoc.data().geminiApiKey || '');
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'app'), {
        geminiApiKey: geminiKey,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="pt-24 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 px-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <Settings className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="text-3xl font-bold">Admin Settings</h2>
          <p className="text-gray-400">Manage global application configuration.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="glass p-8 rounded-3xl border-border">
          <div className="flex items-center gap-2 mb-6 text-primary">
            <Key className="h-5 w-5" />
            <h3 className="text-xl font-bold">API Configuration</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Gemini API Key</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:border-primary outline-none font-mono"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                This key is used for the AI Coding Assistant. If left empty, the app will use the default environment variable or hardcoded fallback.
              </p>
            </div>
          </div>
        </div>

        <div className="glass p-8 rounded-3xl border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-2 mb-4 text-red-400">
            <Shield className="h-5 w-5" />
            <h3 className="text-xl font-bold">Security Notice</h3>
          </div>
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-1" />
            <p className="text-sm text-gray-400">
              API keys stored in Firestore are accessible to the client. For production apps, always prefer using server-side environment variables (Secrets) to keep your keys hidden from the browser.
            </p>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 bg-primary text-black font-bold py-4 rounded-2xl hover:bg-accent transition-all green-glow-hover disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          {isSaving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </div>
  );
};

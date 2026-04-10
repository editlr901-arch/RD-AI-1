import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  RotateCcw, 
  Clock, 
  User, 
  Check, 
  X,
  ChevronRight,
  FileCode,
  Save
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface Version {
  id: string;
  code: string;
  timestamp: any;
  userId: string;
  userName: string;
  note?: string;
}

interface VersionHistoryProps {
  appId: string;
  currentCode: string;
  onRestore: (code: string) => void;
  onClose: () => void;
  user: any;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({ appId, currentCode, onRestore, onClose, user }) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  useEffect(() => {
    if (!appId) return;

    const q = query(
      collection(db, 'app_versions'),
      where('appId', '==', appId),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setVersions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Version)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [appId]);

  const handleSaveVersion = async () => {
    const note = window.prompt('Enter a note for this version:');
    if (note === null) return;

    try {
      await addDoc(collection(db, 'app_versions'), {
        appId,
        code: currentCode,
        timestamp: serverTimestamp(),
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        note: note || 'Manual Save'
      });
      toast.success('Version saved successfully!');
    } catch (err) {
      toast.error('Failed to save version.');
    }
  };

  const handleRestore = async (version: Version) => {
    if (!window.confirm('Are you sure you want to restore this version? Current unsaved changes will be lost.')) return;
    
    try {
      await updateDoc(doc(db, 'apps', appId), {
        code: version.code,
        updatedAt: serverTimestamp(),
        lastUpdatedBy: user.uid
      });
      onRestore(version.code);
      toast.success('Version restored!');
      onClose();
    } catch (err) {
      toast.error('Failed to restore version.');
    }
  };

  const selectedVersion = versions.find(v => v.id === selectedVersionId);

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-5xl h-[80vh] glass rounded-3xl border-primary/20 flex overflow-hidden"
      >
        {/* Sidebar: Version List */}
        <div className="w-80 bg-surface border-r border-border flex flex-col">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              History
            </h3>
            <button 
              onClick={handleSaveVersion}
              className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-all"
              title="Save Current Version"
            >
              <Save className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs">No versions saved yet.</p>
              </div>
            ) : (
              versions.map((v) => (
                <div 
                  key={v.id}
                  onClick={() => setSelectedVersionId(v.id)}
                  className={cn(
                    "p-4 rounded-xl border cursor-pointer transition-all group",
                    selectedVersionId === v.id ? "bg-primary/10 border-primary" : "bg-background border-border hover:border-primary/30"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                      {v.timestamp?.toDate().toLocaleDateString()}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {v.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white mb-1 line-clamp-1">{v.note}</p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <User className="h-3 w-3" />
                    <span>{v.userName}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Content Area: Diff/Preview */}
        <div className="flex-1 flex flex-col bg-[#0a0a0a]">
          <div className="h-16 border-b border-border flex items-center justify-between px-8 bg-surface/30">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-gray-400">Version Preview</span>
              {selectedVersion && (
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Selected</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              {selectedVersion && (
                <button 
                  onClick={() => handleRestore(selectedVersion)}
                  className="flex items-center gap-2 px-6 py-2 bg-primary text-black font-bold rounded-xl hover:bg-accent transition-all text-xs"
                >
                  <RotateCcw className="h-4 w-4" />
                  Restore this version
                </button>
              )}
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full">
                <X className="h-6 w-6 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-8 custom-scrollbar">
            {selectedVersion ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-4 bg-surface border border-border rounded-2xl">
                  <FileCode className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs font-bold text-white">Code Snapshot</p>
                    <p className="text-[10px] text-gray-500">{selectedVersion.code.length} characters</p>
                  </div>
                </div>
                <div className="bg-background border border-border rounded-2xl p-6 overflow-x-auto">
                  <pre className="text-[11px] text-green-500 font-mono leading-relaxed">
                    <code>{selectedVersion.code}</code>
                  </pre>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-600">
                <History className="h-16 w-16 mb-4 opacity-10" />
                <h3 className="text-xl font-bold mb-2">Select a version</h3>
                <p className="text-sm max-w-xs">Choose a version from the history list to preview and restore it.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

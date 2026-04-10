import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  Rocket, 
  ExternalLink, 
  Settings, 
  Trash2, 
  BarChart3, 
  Shield, 
  ShieldAlert,
  Plus,
  Search,
  Copy,
  Check,
  Coins,
  X
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

interface HostingPlatformProps {
  user: any;
  userData: any;
}

export const HostingPlatform: React.FC<HostingPlatformProps> = ({ user, userData }) => {
  const [deployments, setDeployments] = useState<any[]>([]);
  const [myApps, setMyApps] = useState<any[]>([]);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch deployments
    const qDeploy = query(collection(db, 'deployments'), where('userId', '==', user.uid));
    const unsubDeploy = onSnapshot(qDeploy, (snapshot) => {
      setDeployments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'deployments'));

    // Fetch my apps for deployment
    const qApps = query(collection(db, 'apps'), where('userId', '==', user.uid));
    const unsubApps = onSnapshot(qApps, (snapshot) => {
      setMyApps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'apps'));

    return () => {
      unsubDeploy();
      unsubApps();
    };
  }, [user]);

  const handleDeploy = async (app: any) => {
    const cost = 50; // Deployment cost
    if (userData.coins < cost) {
      toast.error(`Insufficient coins! Deployment costs ${cost} coins.`);
      return;
    }

    setIsDeploying(true);
    try {
      const batch = writeBatch(db);
      const deploymentRef = doc(collection(db, 'deployments'));
      const userRef = doc(db, 'users', user.uid);
      const transactionId = `${user.uid}_${Date.now()}`;
      const transactionRef = doc(db, 'transactions', transactionId);

      batch.set(deploymentRef, {
        userId: user.uid,
        appId: app.id,
        appName: app.name,
        code: app.code,
        status: 'active',
        deployedAt: serverTimestamp(),
        visits: 0
      });

      batch.update(userRef, {
        coins: userData.coins - cost,
        lastTransactionId: transactionId
      });

      batch.set(transactionRef, {
        userId: user.uid,
        amount: -cost,
        type: 'app_deployment',
        timestamp: serverTimestamp(),
        description: `Deployed app: ${app.name}`
      });

      await batch.commit().catch(err => handleFirestoreError(err, OperationType.WRITE, 'batch/deployment'));
      toast.success('App deployed successfully! -50 Coins');
      setShowDeployModal(false);
    } catch (err: any) {
      console.error('Deployment Error:', err);
      
      // Log error to Firestore for admin review
      try {
        await addDoc(collection(db, 'deployment_errors'), {
          userId: user.uid,
          appId: app.id,
          appName: app.name,
          error: err.message || String(err),
          timestamp: serverTimestamp(),
          metadata: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            coins: userData.coins
          }
        });
      } catch (logErr) {
        console.error('Failed to log deployment error:', logErr);
      }

      // User-friendly error messages
      if (err.message?.includes('insufficient permissions')) {
        toast.error('Security Check Failed: You do not have permission to deploy this app. Please contact support.');
      } else if (err.message?.includes('quota exceeded')) {
        toast.error('Platform Busy: Our hosting quota has been reached for today. Please try again tomorrow.');
      } else if (err.message?.includes('offline')) {
        toast.error('Network Error: You appear to be offline. Please check your connection and try again.');
      } else {
        toast.error('Deployment Interrupted: Something went wrong while preparing your host. Our team has been notified.');
      }
    } finally {
      setIsDeploying(false);
    }
  };

  const toggleStatus = async (deployment: any) => {
    const newStatus = deployment.status === 'active' ? 'suspended' : 'active';
    try {
      await updateDoc(doc(db, 'deployments', deployment.id), {
        status: newStatus
      }).catch(err => handleFirestoreError(err, OperationType.UPDATE, 'deployments/' + deployment.id));
      toast.success(`App ${newStatus === 'active' ? 'activated' : 'suspended'}`);
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  const deleteDeployment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this deployment? This action is permanent.')) return;
    try {
      await deleteDoc(doc(db, 'deployments', id)).catch(err => handleFirestoreError(err, OperationType.DELETE, 'deployments/' + id));
      toast.success('Deployment deleted.');
    } catch (err) {
      toast.error('Failed to delete deployment.');
    }
  };

  const copyUrl = (id: string) => {
    const url = `${window.location.origin}?view=${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('URL copied to clipboard!');
  };

  return (
    <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h2 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
            <Globe className="h-10 w-10 text-primary" />
            App Host Platform
          </h2>
          <p className="text-gray-400">Deploy your creations to the world with one click.</p>
        </div>
        <button 
          onClick={() => setShowDeployModal(true)}
          className="bg-primary text-black font-bold px-8 py-3 rounded-2xl hover:bg-accent transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <Rocket className="h-5 w-5" />
          New Deployment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {deployments.length === 0 ? (
            <div className="glass p-20 rounded-3xl border-dashed border-border flex flex-col items-center justify-center text-center">
              <Globe className="h-20 w-20 text-gray-700 mb-6" />
              <h3 className="text-2xl font-bold mb-2">No Active Deployments</h3>
              <p className="text-gray-500 max-w-md mb-8">You haven't deployed any apps yet. Deploy your first app to see it live on the web!</p>
              <button 
                onClick={() => setShowDeployModal(true)}
                className="bg-surface border border-primary/30 text-primary font-bold px-8 py-3 rounded-xl hover:bg-primary/10 transition-all"
              >
                Deploy Your First App
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {deployments.map((deployment) => (
                <motion.div 
                  key={deployment.id}
                  layoutId={deployment.id}
                  className="glass p-6 rounded-3xl border-border hover:border-primary/30 transition-all group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Globe className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{deployment.appName}</h4>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            deployment.status === 'active' ? "bg-green-500 animate-pulse" : "bg-red-500"
                          )} />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                            {deployment.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleStatus(deployment)}
                        className="p-2 hover:bg-surface rounded-xl text-gray-400 hover:text-white transition-colors"
                        title={deployment.status === 'active' ? 'Suspend' : 'Activate'}
                      >
                        {deployment.status === 'active' ? <ShieldAlert className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                      </button>
                      <button 
                        onClick={() => deleteDeployment(deployment.id)}
                        className="p-2 hover:bg-red-500/10 rounded-xl text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete Deployment"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="p-3 bg-background/50 rounded-xl border border-border flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <ExternalLink className="h-3 w-3 text-gray-500 flex-shrink-0" />
                        <span className="text-xs text-gray-400 truncate">
                          {window.location.origin}?view={deployment.id}
                        </span>
                      </div>
                      <button 
                        onClick={() => copyUrl(deployment.id)}
                        className="p-1.5 hover:bg-primary/10 rounded-lg text-primary transition-colors"
                      >
                        {copiedId === deployment.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-gray-500">
                        <BarChart3 className="h-3 w-3" />
                        <span className="text-[10px] font-bold">{deployment.visits} Visits</span>
                      </div>
                    </div>
                    <a 
                      href={`${window.location.origin}?view=${deployment.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      View Live <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass p-6 rounded-3xl border-primary/20 bg-gradient-to-br from-surface to-primary/5">
            <h3 className="text-lg font-bold mb-4">Platform Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-background/50 rounded-xl border border-border">
                <span className="text-gray-400 text-sm">Active Deployments</span>
                <span className="font-bold">{deployments.filter(d => d.status === 'active').length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-background/50 rounded-xl border border-border">
                <span className="text-gray-400 text-sm">Total Visits</span>
                <span className="font-bold text-primary">
                  {deployments.reduce((acc, curr) => acc + (curr.visits || 0), 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-background/50 rounded-xl border border-border">
                <span className="text-gray-400 text-sm">Uptime</span>
                <span className="font-bold text-green-500">99.9%</span>
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-3xl border-border">
            <h3 className="text-lg font-bold mb-4">Hosting Plans</h3>
            <div className="space-y-3">
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-primary">Standard Host</span>
                  <span className="text-xs font-bold bg-primary text-black px-2 py-0.5 rounded">50 Coins</span>
                </div>
                <p className="text-[10px] text-gray-400">Deploy one app with public URL and basic analytics.</p>
              </div>
              <div className="p-4 bg-surface border border-border rounded-xl opacity-50">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold">Custom Domain</span>
                  <span className="text-xs font-bold bg-surface border border-border px-2 py-0.5 rounded text-gray-400">200 Coins</span>
                </div>
                <p className="text-[10px] text-gray-500">Connect your own domain to your deployed apps. (Coming Soon)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deploy Modal */}
      <AnimatePresence>
        {showDeployModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xl glass p-8 rounded-3xl border-primary/30"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Deploy New App</h3>
                <button onClick={() => setShowDeployModal(false)} className="p-2 hover:bg-surface rounded-full">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <p className="text-gray-400 text-sm">Select an app from your collection to deploy. Each deployment costs 50 coins.</p>
                
                <div className="max-h-64 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                  {myApps.length === 0 ? (
                    <p className="text-center py-8 text-gray-500 italic">No apps found in your collection.</p>
                  ) : (
                    myApps.map((app) => (
                      <button 
                        key={app.id}
                        onClick={() => handleDeploy(app)}
                        disabled={isDeploying}
                        className="w-full p-4 bg-surface border border-border rounded-xl flex items-center justify-between hover:border-primary/50 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center">
                            <Globe className="h-5 w-5 text-primary/50" />
                          </div>
                          <span className="font-bold group-hover:text-primary transition-colors">{app.name}</span>
                        </div>
                        <Plus className="h-5 w-5 text-gray-500 group-hover:text-primary transition-all" />
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-primary/10 rounded-2xl border border-primary/20">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  <span className="text-sm font-bold">Balance: {userData.coins} Coins</span>
                </div>
                <span className="text-sm font-bold text-primary">Cost: 50 Coins</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Code, 
  Globe,
  History, 
  X, 
  Download,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Image as ImageIcon,
  Upload,
  Loader2,
  Play,
  Zap,
  Calendar,
  Coins,
  Cpu,
  Layout,
  GitBranch
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
  orderBy,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { GoogleGenAI } from '@google/genai';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { BuildTools } from './BuildTools';
import { AppPreview } from './AppPreview';
import { TaskScheduler } from './TaskScheduler';
import { RdCodeEditor } from './RdCodeEditor';
import { TemplateGallery } from './TemplateGallery';
import { LogicBuilder } from './LogicBuilder';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

interface DashboardProps {
  user: any;
  userData: any;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, userData }) => {
  const [apps, setApps] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newAppPrompt, setNewAppPrompt] = useState('');
  const [newAppLogoURL, setNewAppLogoURL] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [showTools, setShowTools] = useState(false);
  const [activeToolId, setActiveToolId] = useState<string | undefined>();
  const [previewApp, setPreviewApp] = useState<any>(null);
  const [editingApp, setEditingApp] = useState<any>(null);
  const [launchingApp, setLaunchingApp] = useState<any>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showLogicBuilder, setShowLogicBuilder] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'my-apps' | 'store'>('my-apps');
  const [storeTab, setStoreTab] = useState<'apps' | 'plugins'>('apps');

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'apps'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setApps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'apps');
    });
    return () => unsubscribe();
  }, [user]);

  const handleGenerateCode = async () => {
    if (!newAppPrompt) return;
    setIsGenerating(true);
    try {
      // Try to get key from Firestore first, then env, then fallback
      let apiKey = process.env.GEMINI_API_KEY;
      
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'app'));
        if (settingsDoc.exists() && settingsDoc.data().geminiApiKey) {
          apiKey = settingsDoc.data().geminiApiKey;
        }
      } catch (e) {
        console.warn('Could not fetch settings from Firestore, using fallback');
      }

      if (!apiKey) {
        apiKey = 'AIzaSyAn6hG8jU6ieCJmlc-comIozbKYimxs6i0';
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = isPremium 
        ? `Generate a highly professional, production-ready, and feature-rich React component code for: ${newAppPrompt}. Include advanced styling with Tailwind CSS, complex state management if needed, and beautiful animations using motion/react. Return ONLY the code block.`
        : `Generate a React component code for: ${newAppPrompt}. Return ONLY the code block. Use Tailwind CSS for styling.`;

      const cost = isPremium ? 5 : 0;
      if (isPremium && userData.coins < cost) {
        toast.error(`Not enough coins! Premium generation costs ${cost} coins.`);
        setIsGenerating(false);
        return;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      if (isPremium) {
        const batch = writeBatch(db);
        const userRef = doc(db, 'users', user.uid);
        const transactionId = `${user.uid}_${Date.now()}`;
        const transactionRef = doc(db, 'transactions', transactionId);

        batch.update(userRef, {
          coins: userData.coins - cost,
          lastTransactionId: transactionId
        });

        batch.set(transactionRef, {
          userId: user.uid,
          amount: -cost,
          type: 'premium_feature',
          timestamp: serverTimestamp(),
          description: 'Premium AI Generation'
        });

        await batch.commit().catch(err => handleFirestoreError(err, OperationType.WRITE, 'batch/premium_gen'));
        toast.success(`Premium generation complete! -${cost} Coins`);
      } else {
        toast.success('Code snippet generated!');
      }

      setGeneratedCode(response.text || '');
    } catch (err) {
      toast.error('Failed to generate code.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveApp = async () => {
    if (!user || !newAppName || !generatedCode) return;
    try {
      if (editingApp) {
        await updateDoc(doc(db, 'apps', editingApp.id), {
          name: newAppName,
          code: generatedCode,
          logoURL: newAppLogoURL
        }).catch(err => handleFirestoreError(err, OperationType.UPDATE, 'apps/' + editingApp.id));
        toast.success('App updated successfully!');
      } else {
        await addDoc(collection(db, 'apps'), {
          userId: user.uid,
          name: newAppName,
          code: generatedCode,
          logoURL: newAppLogoURL,
          createdAt: serverTimestamp(),
          isInstalled: false
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, 'apps'));
        toast.success('App saved to your collection!');
      }
      setShowCreate(false);
      setEditingApp(null);
      setNewAppName('');
      setNewAppPrompt('');
      setNewAppLogoURL('');
      setGeneratedCode('');
    } catch (err) {
      toast.error(editingApp ? 'Failed to update app.' : 'Failed to save app.');
    }
  };

  const handleEditClick = (app: any) => {
    setEditingApp(app);
    setNewAppName(app.name);
    setGeneratedCode(app.code);
    setNewAppLogoURL(app.logoURL || '');
    setShowCreate(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB.');
      return;
    }

    setIsUploadingLogo(true);
    const storageRef = ref(storage, `app_logos/${user.uid}/${Date.now()}_${file.name}`);

    try {
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setNewAppLogoURL(downloadURL);
      toast.success('Logo uploaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload logo.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const [installingId, setInstallingId] = useState<string | null>(null);

  const handleInstall = async (app: any) => {
    if (app.isInstalled) {
      toast.info('App is already installed.');
      return;
    }

    if (installingId) return;

    const isFirstApp = !userData.firstAppFreeUsed;
    const cost = isFirstApp ? 0 : 10;

    if (userData.coins < cost) {
      toast.error('Not enough coins! You need 10 coins.');
      return;
    }

    setInstallingId(app.id);
    try {
      const batch = writeBatch(db);
      const appRef = doc(db, 'apps', app.id);
      const userRef = doc(db, 'users', user.uid);
      const transactionId = `${user.uid}_${Date.now()}`;
      const transactionRef = doc(db, 'transactions', transactionId);

      batch.update(appRef, { isInstalled: true });
      batch.update(userRef, {
        coins: userData.coins - cost,
        firstAppFreeUsed: true,
        lastTransactionId: transactionId
      });

      if (cost > 0) {
        batch.set(transactionRef, {
          userId: user.uid,
          amount: -cost,
          type: 'app_install',
          timestamp: serverTimestamp(),
          description: `Installed app: ${app.name}`
        });
      }

      await batch.commit().catch(err => handleFirestoreError(err, OperationType.WRITE, 'batch/app_install'));
      toast.success(isFirstApp ? 'First app installed for free!' : 'App installed! -10 Coins');
    } catch (err) {
      toast.error('Installation failed.');
    } finally {
      setInstallingId(null);
    }
  };

  const handleStoreInstall = (app: any) => {
    if (app.cost > (userData?.coins || 0)) {
      toast.error(`Insufficient coins! You need ${app.cost} coins.`);
      return;
    }
    toast.success(`${app.name} installation started!`);
    // In a real app, this would add the app to the user's collection
  };

  return (
    <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div className="flex items-center gap-8">
          <button 
            onClick={() => setActiveTab('my-apps')}
            className={cn(
              "text-3xl font-black transition-all relative",
              activeTab === 'my-apps' ? "text-white" : "text-gray-600 hover:text-gray-400"
            )}
          >
            My Apps
            {activeTab === 'my-apps' && <motion.div layoutId="activeTab" className="absolute -bottom-2 left-0 right-0 h-1 bg-primary rounded-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('store')}
            className={cn(
              "text-3xl font-black transition-all relative flex items-center gap-2",
              activeTab === 'store' ? "text-primary" : "text-gray-600 hover:text-gray-400"
            )}
          >
            App Store
            <span className="text-[10px] bg-primary text-black px-1.5 py-0.5 rounded-full font-bold">NEW</span>
            {activeTab === 'store' && <motion.div layoutId="activeTab" className="absolute -bottom-2 left-0 right-0 h-1 bg-primary rounded-full" />}
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowTemplates(true)}
            className="bg-surface border border-border text-white font-bold px-6 py-3 rounded-2xl hover:border-primary/50 transition-all flex items-center gap-2"
          >
            <Layout className="h-5 w-5 text-primary" />
            Templates
          </button>
          <button 
            onClick={() => setShowCreate(true)}
            className="bg-primary text-black font-bold px-8 py-3 rounded-2xl hover:bg-accent transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="h-5 w-5" />
            Build New App
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {activeTab === 'my-apps' ? (
            <div className="space-y-8">
              {/* Build Section */}
              <div className="glass p-8 rounded-3xl border-primary/20 bg-gradient-to-br from-surface to-primary/5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Code className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">AI Coding Assistant</h3>
                </div>
                <div className="space-y-4">
                  <textarea 
                    placeholder="Describe the app or component you want to build..."
                    value={newAppPrompt}
                    onChange={(e) => setNewAppPrompt(e.target.value)}
                    className="w-full h-32 bg-background border border-border rounded-xl p-4 focus:border-primary outline-none resize-none transition-all"
                  />
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setIsPremium(false)}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-xs font-bold transition-all border",
                        !isPremium ? "bg-primary/10 border-primary text-primary" : "bg-surface border-border text-gray-400 hover:border-primary/30"
                      )}
                    >
                      Standard (Free)
                    </button>
                    <button 
                      onClick={() => setIsPremium(true)}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2",
                        isPremium ? "bg-primary border-primary text-black" : "bg-surface border-border text-gray-400 hover:border-primary/30"
                      )}
                    >
                      Premium (5 Coins)
                    </button>
                  </div>
                  <button 
                    onClick={handleGenerateCode}
                    disabled={isGenerating || !newAppPrompt}
                    className="w-full flex items-center justify-center gap-2 bg-surface border border-primary/30 text-primary font-bold py-3 rounded-xl hover:bg-primary/10 transition-all disabled:opacity-50"
                  >
                    {isGenerating ? 'Generating...' : isPremium ? 'Generate Premium Code' : 'Generate Code Snippet'}
                  </button>
                </div>

                {generatedCode && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-background rounded-xl border border-border overflow-x-auto max-h-96"
                  >
                    <pre className="text-xs text-green-400 font-mono">
                      <code>{generatedCode}</code>
                    </pre>
                  </motion.div>
                )}
              </div>

              {/* Your Apps Section */}
              <div className="glass p-8 rounded-3xl border-border">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <History className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Your Apps</h3>
                </div>
                
                {apps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <Code className="h-12 w-12 mb-4 opacity-20" />
                    <p>No apps created yet. Start building!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {apps.map((app) => (
                      <div key={app.id} className="p-4 bg-surface border border-border rounded-xl hover:border-primary/50 transition-all group relative">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center overflow-hidden">
                              {app.logoURL ? (
                                <img src={app.logoURL} alt={app.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <Code className="h-5 w-5 text-primary/50" />
                              )}
                            </div>
                            <h4 className="font-bold text-white group-hover:text-primary transition-colors">{app.name}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleEditClick(app)}
                              className="p-1.5 hover:bg-primary/10 rounded-lg text-gray-400 hover:text-primary transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            {app.isInstalled ? (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            ) : (
                              <Download className="h-4 w-4 text-gray-500" />
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mb-4 line-clamp-2">{app.code.substring(0, 100)}...</p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setPreviewApp(app)}
                            className="flex-1 py-2 rounded-lg text-xs font-bold bg-surface border border-border text-gray-300 hover:border-primary/50 transition-all"
                          >
                            Preview
                          </button>
                          <button 
                            onClick={() => setEditingApp(app)}
                            className="flex-1 py-2 rounded-lg text-xs font-bold bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-all"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => {
                              // Redirect to hosting tab (this would need a way to pass the app to HostingPlatform)
                              // For now, we'll just show a message or redirect
                              toast.info('Go to Hosting tab to deploy this app!');
                            }}
                            className="flex-1 py-2 rounded-lg text-xs font-bold bg-blue-500/10 border border-blue-500/30 text-blue-500 hover:bg-blue-500/20 transition-all flex items-center justify-center gap-1"
                          >
                            <Globe className="h-3 w-3" />
                            Deploy
                          </button>
                          {app.isInstalled ? (
                            <button 
                              onClick={() => setLaunchingApp(app)}
                              className="flex-1 py-2 rounded-lg text-xs font-bold bg-green-500/10 border border-green-500/30 text-green-500 hover:bg-green-500/20 transition-all flex items-center justify-center gap-2"
                            >
                              <Play className="h-3 w-3" />
                              Launch
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleInstall(app)}
                              disabled={installingId === app.id}
                              className={cn(
                                "flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2",
                                "bg-primary text-black hover:bg-accent disabled:opacity-50"
                              )}
                            >
                              {installingId === app.id ? (
                                <span className="flex items-center gap-2">
                                  <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                  Installing...
                                </span>
                              ) : (
                                'Install'
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center gap-4 mb-6">
                <button 
                  onClick={() => setStoreTab('apps')}
                  className={cn(
                    "px-6 py-2 rounded-xl text-sm font-bold transition-all border",
                    storeTab === 'apps' ? "bg-primary text-black border-primary" : "bg-surface border-border text-gray-400 hover:border-primary/30"
                  )}
                >
                  Applications
                </button>
                <button 
                  onClick={() => setStoreTab('plugins')}
                  className={cn(
                    "px-6 py-2 rounded-xl text-sm font-bold transition-all border",
                    storeTab === 'plugins' ? "bg-primary text-black border-primary" : "bg-surface border-border text-gray-400 hover:border-primary/30"
                  )}
                >
                  Plugins & Extensions
                </button>
              </div>

              {storeTab === 'apps' ? (
                <div className="space-y-8">
                  <div className="glass p-12 rounded-3xl border-primary/20 bg-gradient-to-br from-primary/10 via-surface to-background relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5">
                  <Zap className="h-64 w-64 text-primary" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-4xl font-black mb-4">Featured Apps</h3>
                  <p className="text-gray-400 text-lg mb-8 max-w-lg">Discover and install high-quality applications built by the community and RD AI team.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                      {
                        id: 'f-1',
                        name: 'Task Master Pro',
                        desc: 'Advanced productivity tool with real-time sync and team collaboration.',
                        cost: 0,
                        icon: Calendar,
                        tag: 'Productivity'
                      },
                      {
                        id: 'f-2',
                        name: 'Crypto Live',
                        desc: 'Real-time cryptocurrency tracking with advanced charts and alerts.',
                        cost: 15,
                        icon: Zap,
                        tag: 'Finance'
                      }
                    ].map((fApp) => (
                      <div key={fApp.id} className="bg-background/40 backdrop-blur-sm border border-border p-8 rounded-3xl hover:border-primary/50 transition-all group">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <fApp.icon className="h-8 w-8 text-primary" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{fApp.tag}</span>
                            <h4 className="text-xl font-bold">{fApp.name}</h4>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mb-8 leading-relaxed">{fApp.desc}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Coins className="h-4 w-4 text-primary" />
                            <span className="font-bold text-primary">{fApp.cost === 0 ? 'FREE' : `${fApp.cost} Coins`}</span>
                          </div>
                          <button 
                            onClick={() => handleStoreInstall(fApp)}
                            className="px-6 py-2 bg-surface border border-border rounded-xl text-xs font-bold hover:border-primary transition-all"
                          >
                            Install Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Utilities', 'Games', 'Social', 'Business'].map((cat) => (
                  <button key={cat} className="p-6 bg-surface border border-border rounded-2xl text-sm font-bold hover:bg-primary/5 hover:border-primary/30 transition-all text-center">
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="glass p-12 rounded-3xl border-border bg-gradient-to-br from-surface to-background">
                <h3 className="text-3xl font-black mb-4 flex items-center gap-3">
                  <Zap className="h-8 w-8 text-primary" />
                  Plugin Marketplace
                </h3>
                <p className="text-gray-400 mb-8">Extend your apps with powerful third-party plugins and extensions.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { name: 'Stripe Payments', desc: 'Accept payments globally with Stripe integration.', cost: 50 },
                    { name: 'Auth0 Connector', desc: 'Advanced authentication and user management.', cost: 30 },
                    { name: 'Cloudinary Media', desc: 'Optimize and serve images with Cloudinary.', cost: 25 },
                    { name: 'Twilio SMS', desc: 'Send SMS and WhatsApp messages from your app.', cost: 40 },
                    { name: 'Algolia Search', desc: 'Lightning-fast search for your application.', cost: 35 },
                    { name: 'SendGrid Email', desc: 'Transactional email delivery at scale.', cost: 20 }
                  ].map((plugin) => (
                    <div key={plugin.name} className="p-6 bg-background border border-border rounded-2xl hover:border-primary/30 transition-all group">
                      <h4 className="font-bold mb-2 group-hover:text-primary transition-colors">{plugin.name}</h4>
                      <p className="text-[10px] text-gray-500 mb-4 leading-relaxed">{plugin.desc}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-primary">{plugin.cost} Coins</span>
                        <button className="px-4 py-1.5 bg-surface border border-border rounded-lg text-[10px] font-bold hover:border-primary transition-all">Buy Now</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>

        <div className="space-y-8">
          <div className="glass p-6 rounded-2xl border-primary/20 bg-gradient-to-br from-surface to-primary/5">
            <h3 className="text-lg font-bold mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-background/50 rounded-xl border border-border">
                <span className="text-gray-400 text-sm">Total Apps</span>
                <span className="font-bold">{apps.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-background/50 rounded-xl border border-border">
                <span className="text-gray-400 text-sm">Installed Apps</span>
                <span className="font-bold">{apps.filter(a => a.isInstalled).length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-background/50 rounded-xl border border-border">
                <span className="text-gray-400 text-sm">Coins Balance</span>
                <span className="font-bold text-primary">{userData?.coins || 0}</span>
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl border-border">
            <h3 className="text-lg font-bold mb-4">Premium Features</h3>
            <div className="space-y-3">
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-primary">Premium AI</span>
                  <span className="text-xs font-bold bg-primary text-black px-2 py-0.5 rounded">5 Coins</span>
                </div>
                <p className="text-[10px] text-gray-400">Unlock advanced code generation with complex logic and animations.</p>
              </div>
              <div className="p-4 bg-surface border border-border rounded-xl opacity-50">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold">App Export</span>
                  <span className="text-xs font-bold bg-surface border border-border px-2 py-0.5 rounded text-gray-400">20 Coins</span>
                </div>
                <p className="text-[10px] text-gray-500">Download your app as a production-ready ZIP file. (Coming Soon)</p>
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl border-border">
            <h3 className="text-lg font-bold mb-4">App Building Tools</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'logic-builder', name: 'Logic Builder', icon: GitBranch },
                { id: 'ui-kit', name: 'UI Kit' },
                { id: 'api-proxy', name: 'API Proxy' },
                { id: 'database', name: 'Database' },
                { id: 'auth-flow', name: 'Auth Flow' },
                { id: 'storage', name: 'Storage' },
                { id: 'analytics', name: 'Analytics' }
              ].map((tool) => (
                <div 
                  key={tool.id} 
                  onClick={() => {
                    if (tool.id === 'logic-builder') {
                      setShowLogicBuilder(true);
                    } else {
                      setActiveToolId(tool.id);
                      setShowTools(true);
                    }
                  }}
                  className="p-3 bg-surface border border-border rounded-xl text-center text-sm hover:border-primary/50 cursor-pointer transition-all hover:bg-primary/5 flex flex-col items-center gap-2"
                >
                  {tool.icon && <tool.icon className="h-4 w-4 text-primary" />}
                  {tool.name}
                </div>
              ))}
            </div>
          </div>

          <TaskScheduler user={user} />
        </div>
      </div>

      <BuildTools 
        isOpen={showTools} 
        onClose={() => setShowTools(false)} 
        initialToolId={activeToolId} 
      />

      <AppPreview 
        isOpen={!!previewApp} 
        onClose={() => setPreviewApp(null)} 
        code={previewApp?.code || ''} 
        appName={previewApp?.name || ''} 
      />

      <AppPreview 
        isOpen={!!launchingApp} 
        onClose={() => setLaunchingApp(null)} 
        code={launchingApp?.code || ''} 
        appName={launchingApp?.name || ''} 
      />

      <AnimatePresence>
        {showLogicBuilder && (
          <LogicBuilder onClose={() => setShowLogicBuilder(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTemplates && (
          <TemplateGallery 
            onClose={() => setShowTemplates(false)}
            onSelect={(template) => {
              setGeneratedCode(template.code);
              setNewAppName(template.name);
              setShowCreate(true);
              setShowTemplates(false);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingApp && (
          <RdCodeEditor 
            app={editingApp} 
            user={user} 
            onClose={() => setEditingApp(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl glass p-8 rounded-3xl border-primary/30 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">{editingApp ? 'Edit App' : 'Create New App'}</h3>
                <button 
                  onClick={() => {
                    setShowCreate(false);
                    setEditingApp(null);
                    setNewAppName('');
                    setNewAppPrompt('');
                    setNewAppLogoURL('');
                    setGeneratedCode('');
                  }} 
                  className="p-2 hover:bg-surface rounded-full"
                >
                  <X />
                </button>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">App Name</label>
                    <input 
                      type="text" 
                      value={newAppName}
                      onChange={(e) => setNewAppName(e.target.value)}
                      placeholder="My Awesome App"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Logo (Gallery Access)</label>
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center overflow-hidden flex-shrink-0 relative group">
                        {isUploadingLogo ? (
                          <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        ) : newAppLogoURL ? (
                          <img src={newAppLogoURL} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={newAppLogoURL}
                            onChange={(e) => setNewAppLogoURL(e.target.value)}
                            placeholder="Paste URL or upload..."
                            className="flex-1 bg-background border border-border rounded-xl px-4 py-3 focus:border-primary outline-none text-sm"
                          />
                          <button 
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            disabled={isUploadingLogo}
                            className="p-3 bg-surface border border-border rounded-xl hover:border-primary/50 text-gray-400 hover:text-primary transition-all disabled:opacity-50"
                            title="Upload from gallery"
                          >
                            <Upload className="h-5 w-5" />
                          </button>
                        </div>
                        <input 
                          type="file" 
                          ref={logoInputRef}
                          onChange={handleLogoUpload}
                          className="hidden"
                          accept="image/*"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">App Description / Prompt</label>
                  <textarea 
                    value={newAppPrompt}
                    onChange={(e) => setNewAppPrompt(e.target.value)}
                    placeholder="Describe what your app does..."
                    className="w-full h-32 bg-background border border-border rounded-xl p-4 focus:border-primary outline-none resize-none"
                  />
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setPreviewApp({ name: newAppName || 'New App', code: generatedCode })}
                    disabled={!generatedCode}
                    className="flex-1 bg-surface border border-border text-white font-bold py-3 rounded-xl hover:border-primary/50 transition-all disabled:opacity-50"
                  >
                    Preview App
                  </button>
                  <button 
                    onClick={handleGenerateCode}
                    disabled={isGenerating || !newAppPrompt}
                    className="flex-1 bg-surface border border-primary/30 text-primary font-bold py-3 rounded-xl hover:bg-primary/10 transition-all"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Code'}
                  </button>
                  <button 
                    onClick={handleSaveApp}
                    disabled={!generatedCode || !newAppName}
                    className="flex-1 bg-primary text-black font-bold py-3 rounded-xl hover:bg-accent transition-all disabled:opacity-50"
                  >
                    {editingApp ? 'Update App' : 'Save App (Free)'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 text-center italic">
                  * Creating apps is free. Installing/Downloading costs 10 coins (First app is free).
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

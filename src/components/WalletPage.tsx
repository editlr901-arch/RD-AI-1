import React, { useState } from 'react';
import { 
  Coins, 
  History, 
  ExternalLink, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Download,
  FileJson
} from 'lucide-react';
import { 
  doc, 
  updateDoc, 
  serverTimestamp, 
  arrayUnion, 
  writeBatch,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface WalletPageProps {
  user: any;
  userData: any;
}

export const WalletPage: React.FC<WalletPageProps> = ({ user, userData }) => {
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [exporting, setExporting] = useState(false);

  React.useEffect(() => {
    if (!user) return;
    
    // Fetch apps for export
    const appsQuery = query(
      collection(db, 'apps'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribeApps = onSnapshot(appsQuery, (snapshot) => {
      setApps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'transactions');
    });
    return () => {
      unsubscribe();
      unsubscribeApps();
    };
  }, [user]);

  const handleDailyBonus = async () => {
    if (!user || !userData) return;
    
    const now = new Date();
    const lastBonus = userData.lastDailyBonus?.toDate();
    
    if (lastBonus && now.getTime() - lastBonus.getTime() < 24 * 60 * 60 * 1000) {
      toast.info('Daily bonus already claimed! Come back tomorrow.');
      return;
    }

    try {
      const batch = writeBatch(db);
      const userRef = doc(db, 'users', user.uid);
      const transactionId = `${user.uid}_${Date.now()}`;
      const transactionRef = doc(db, 'transactions', transactionId);

      batch.update(userRef, {
        coins: userData.coins + 2,
        lastDailyBonus: serverTimestamp(),
        lastTransactionId: transactionId
      });

      batch.set(transactionRef, {
        userId: user.uid,
        amount: 2,
        type: 'daily_bonus',
        timestamp: serverTimestamp(),
        description: 'Daily login bonus'
      });

      await batch.commit().catch(err => handleFirestoreError(err, OperationType.WRITE, 'batch/daily_bonus'));
      toast.success('You received 2 Free Coins!');
    } catch (err) {
      toast.error('Failed to claim bonus.');
    }
  };

  const handleYoutubeTask = async () => {
    if (!user || !userData || userData.youtubeSubscribed) return;
    
    window.open('https://youtube.com/@xrise_yt?si=xossSDoxuFJthIKp', '_blank');
    
    try {
      const batch = writeBatch(db);
      const userRef = doc(db, 'users', user.uid);
      const transactionId = `${user.uid}_${Date.now()}`;
      const transactionRef = doc(db, 'transactions', transactionId);

      batch.update(userRef, {
        coins: userData.coins + 5,
        youtubeSubscribed: true,
        lastTransactionId: transactionId
      });

      batch.set(transactionRef, {
        userId: user.uid,
        amount: 5,
        type: 'youtube_task',
        timestamp: serverTimestamp(),
        description: 'YouTube subscription reward'
      });

      await batch.commit().catch(err => handleFirestoreError(err, OperationType.WRITE, 'batch/youtube_task'));
      toast.success('Task completed! You earned 5 Coins.');
    } catch (err) {
      toast.error('Failed to update task.');
    }
  };

  const handlePromoCode = async () => {
    if (!user || !userData || !promoCode) return;
    
    const code = promoCode.trim().toUpperCase();
    
    if (userData.usedPromoCodes?.includes(code)) {
      toast.error('You have already used this promo code.');
      return;
    }

    setLoading(true);
    
    if (code === 'RUSH-HIRU') {
      try {
        const batch = writeBatch(db);
        const userRef = doc(db, 'users', user.uid);
        const transactionId = `${user.uid}_${Date.now()}`;
        const transactionRef = doc(db, 'transactions', transactionId);

        batch.update(userRef, {
          coins: userData.coins + 20,
          usedPromoCodes: arrayUnion(code),
          lastTransactionId: transactionId
        });

        batch.set(transactionRef, {
          userId: user.uid,
          amount: 20,
          type: 'promo_code',
          timestamp: serverTimestamp(),
          description: `Promo code: ${code}`
        });

        await batch.commit().catch(err => handleFirestoreError(err, OperationType.WRITE, 'batch/promo_code'));
        toast.success('Promo code applied! +20 Coins');
        setPromoCode('');
      } catch (err) {
        toast.error('Failed to apply promo code.');
      }
    } else {
      toast.error('Invalid promo code.');
    }
    setLoading(false);
  };

  const handleExportApp = async () => {
    if (!user || !userData || !selectedAppId) return;
    
    const cost = 20;
    if (userData.coins < cost) {
      toast.error('Insufficient coins! You need 20 coins to export an app.');
      return;
    }

    const appToExport = apps.find(a => a.id === selectedAppId);
    if (!appToExport) return;

    setExporting(true);
    try {
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
        type: 'app_export',
        timestamp: serverTimestamp(),
        description: `Exported app: ${appToExport.name}`
      });

      await batch.commit().catch(err => handleFirestoreError(err, OperationType.WRITE, 'batch/app_export'));

      // Generate ZIP
      const zip = new JSZip();
      
      // Basic project structure
      zip.file("src/App.tsx", appToExport.code);
      zip.file("package.json", JSON.stringify({
        name: appToExport.name.toLowerCase().replace(/\s+/g, '-'),
        version: "1.0.0",
        dependencies: {
          "react": "^18.2.0",
          "react-dom": "^18.2.0",
          "lucide-react": "^0.284.0",
          "framer-motion": "^10.16.4"
        }
      }, null, 2));
      zip.file("index.html", `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${appToExport.name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`);
      zip.file("README.md", `# ${appToExport.name}\n\nCreated with RD AI App Builder.`);

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${appToExport.name.replace(/\s+/g, '_')}_export.zip`);
      
      toast.success('App exported successfully! -20 Coins');
      setSelectedAppId('');
    } catch (err) {
      toast.error('Failed to export app.');
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
      <div className="glass p-8 rounded-3xl border-primary/20 mb-8 bg-gradient-to-br from-surface to-primary/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Coins className="h-32 w-32 text-primary" />
        </div>
        <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-2">My Balance</h2>
        <div className="flex items-end gap-3 mb-6">
          <span className="text-6xl font-black text-white">{userData?.coins || 0}</span>
          <span className="text-xl font-bold text-primary mb-2">Coins</span>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => window.open('https://wa.me/94772398287', '_blank')}
            className="bg-primary text-black font-bold px-8 py-3 rounded-xl hover:bg-accent transition-all flex items-center gap-2"
          >
            Buy Coins
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="glass p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Earn Coins
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
                <div>
                  <p className="font-bold">Daily Bonus</p>
                  <p className="text-xs text-gray-400">Claim 2 coins every day</p>
                </div>
                <button 
                  onClick={handleDailyBonus}
                  className="bg-surface border border-primary/30 text-primary text-sm font-bold px-4 py-2 rounded-lg hover:bg-primary/10"
                >
                  Claim
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
                <div>
                  <p className="font-bold">YouTube Task</p>
                  <p className="text-xs text-gray-400">Subscribe for 5 coins</p>
                </div>
                <button 
                  onClick={handleYoutubeTask}
                  disabled={userData?.youtubeSubscribed}
                  className="bg-surface border border-primary/30 text-primary text-sm font-bold px-4 py-2 rounded-lg hover:bg-primary/10 disabled:opacity-50"
                >
                  {userData?.youtubeSubscribed ? 'Done' : 'Subscribe'}
                </button>
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              App Export
            </h3>
            <p className="text-xs text-gray-400 mb-4">Export your app as a ZIP file for 20 coins.</p>
            <div className="space-y-4">
              <select 
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:border-primary outline-none text-sm"
              >
                <option value="">Select an app to export</option>
                {apps.map(app => (
                  <option key={app.id} value={app.id}>{app.name}</option>
                ))}
              </select>
              <button 
                onClick={handleExportApp}
                disabled={exporting || !selectedAppId}
                className="w-full bg-primary text-black font-bold py-3 rounded-xl hover:bg-accent transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {exporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Export for 20 Coins
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Transaction History
            </h3>
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No transactions yet.</p>
                </div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-background border border-border rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        tx.amount > 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                      )}>
                        {tx.amount > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{tx.description || tx.type}</p>
                        <p className="text-[10px] text-gray-500">
                          {tx.timestamp?.toDate().toLocaleString() || 'Pending...'}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      "font-bold",
                      tx.amount > 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Promo Code
            </h3>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Enter Code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:border-primary outline-none"
              />
              <button 
                onClick={handlePromoCode}
                disabled={loading}
                className="w-full bg-primary text-black font-bold py-3 rounded-xl hover:bg-accent transition-all disabled:opacity-50"
              >
                {loading ? 'Applying...' : 'Apply Code'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

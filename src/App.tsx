import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDocFromServer } from 'firebase/firestore';
import { auth, db } from './firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { handleFirestoreError, OperationType } from './lib/firestoreErrorHandler';

// --- Error Boundary ---

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let message = "Something went wrong.";
      try {
        const errInfo = JSON.parse(this.state.error?.message || '{}');
        if (errInfo.error) {
          message = `Firestore Error: ${errInfo.error} during ${errInfo.operationType} on ${errInfo.path}`;
        }
      } catch (e) {
        message = this.state.error?.message || message;
      }

      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Oops!</h1>
          <p className="text-gray-400 mb-6 max-w-md">{message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-primary text-black font-bold px-6 py-2 rounded-xl"
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Components
import { Navbar } from './components/Navbar';
import { AuthPage } from './components/AuthPage';
import { Dashboard } from './components/Dashboard';
import { WalletPage } from './components/WalletPage';
import { ProfilePage } from './components/ProfilePage';
import { ContactPage } from './components/ContactPage';
import { SettingsPage } from './components/SettingsPage';
import { HostingPlatform } from './components/HostingPlatform';
import { AppViewer } from './components/AppViewer';

// --- Types ---

interface UserData {
  firstName: string;
  lastName: string;
  age: number;
  location: string;
  email: string;
  coins: number;
  photoURL: string;
  lastDailyBonus?: any;
  youtubeSubscribed?: boolean;
  firstAppFreeUsed?: boolean;
  role?: 'admin' | 'user';
}

interface AuthContextType {
  user: FirebaseUser | null;
  userData: UserData | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Auth Provider ---

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client is offline.");
          toast.error("Firebase connection failed. Check your configuration.");
        }
      }
    }
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data() as UserData);
          } else {
            // Initialization for Google Login users
            const initialData: UserData = {
              firstName: currentUser.displayName?.split(' ')[0] || '',
              lastName: currentUser.displayName?.split(' ').slice(1).join(' ') || '',
              age: 0,
              location: '',
              email: currentUser.email || '',
              coins: 10,
              photoURL: currentUser.photoURL || '',
              firstAppFreeUsed: false,
              youtubeSubscribed: false,
              role: 'user'
            };
            setDoc(userDocRef, initialData).catch(err => handleFirestoreError(err, OperationType.WRITE, 'users/' + currentUser.uid));
            setUserData(initialData);
          }
          setLoading(false);
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, 'users/' + currentUser.uid);
        });
        return () => unsubscribeDoc();
      } else {
        setUserData(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// --- Main App Component ---

const AppContent = () => {
  const { user, userData, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Handle hosted app viewing
  const urlParams = new URLSearchParams(window.location.search);
  const deploymentId = urlParams.get('view');

  if (deploymentId) {
    return <AppViewer deploymentId={deploymentId} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} userData={userData} logout={logout} />
      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && <Dashboard user={user} userData={userData} />}
            {activeTab === 'hosting' && <HostingPlatform user={user} userData={userData} />}
            {activeTab === 'wallet' && <WalletPage user={user} userData={userData} />}
            {activeTab === 'profile' && <ProfilePage user={user} userData={userData} />}
            {activeTab === 'contact' && <ContactPage />}
            {activeTab === 'settings' && userData?.role === 'admin' && <SettingsPage />}
          </motion.div>
        </AnimatePresence>
      </main>
      
      <footer className="py-8 border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">© 2026 RD AI. Powered by Rush Dewon.</p>
        </div>
      </footer>
      <Toaster position="top-center" theme="dark" richColors />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

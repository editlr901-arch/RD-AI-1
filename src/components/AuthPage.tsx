import React, { useState } from 'react';
import { motion } from 'motion/react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { toast } from 'sonner';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success('Logged in successfully!');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Logged in successfully!');
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCred.user.uid), {
          firstName,
          lastName,
          age: parseInt(age),
          location,
          email,
          coins: 10, // Welcome Bonus
          photoURL: '',
          firstAppFreeUsed: false,
          youtubeSubscribed: false,
          usedPromoCodes: []
        });
        toast.success('Account created! +10 Welcome Coins added.');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute -top-20 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.3, 0.1],
            x: [0, -40, 0],
            y: [0, -20, 0]
          }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute -bottom-20 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass p-8 rounded-2xl green-glow relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <img src="https://files.catbox.moe/or780j.png" alt="RD AI Logo" className="h-20 w-20 mb-4" referrerPolicy="no-referrer" />
          <h1 className="text-3xl font-bold text-white tracking-tighter">RD AI</h1>
          <p className="text-gray-400 text-sm">Powered by Rush Dewon</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:border-primary outline-none transition-colors"
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:border-primary outline-none transition-colors"
                required
              />
              <input
                type="number"
                placeholder="Age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:border-primary outline-none transition-colors"
                required
              />
              <input
                type="text"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:border-primary outline-none transition-colors"
                required
              />
            </div>
          )}
          <input
            type="email"
            placeholder="Gmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:border-primary outline-none transition-colors"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:border-primary outline-none transition-colors"
            required
          />

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-black font-bold py-3 rounded-lg hover:bg-accent transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface px-2 text-gray-400">Or continue with</span>
          </div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white text-black font-medium py-3 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          Google Login
        </button>

        <p className="mt-6 text-center text-sm text-gray-400">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-bold hover:underline"
          >
            {isLogin ? 'Register Now' : 'Login Now'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

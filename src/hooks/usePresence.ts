import { useEffect, useState } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  serverTimestamp, 
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export interface PresenceUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  lastSeen: any;
  appId: string;
}

export function usePresence(appId: string, user: any) {
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!user || !appId) return;

    const presenceRef = doc(db, 'presence', `${appId}_${user.uid}`);

    // Set presence
    const setPresence = async () => {
      try {
        await setDoc(presenceRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL || '',
          lastSeen: serverTimestamp(),
          appId: appId
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `presence/${appId}_${user.uid}`);
      }
    };

    setPresence();

    // Update presence every 30 seconds
    const interval = setInterval(setPresence, 30000);

    // Listen for other users in the same app
    const q = query(collection(db, 'presence'), where('appId', '==', appId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users: PresenceUser[] = [];
      const now = Date.now();
      snapshot.forEach((doc) => {
        const data = doc.data() as PresenceUser;
        // Filter out stale presence (older than 1 minute)
        // Note: Firestore serverTimestamp might be null initially
        const lastSeen = data.lastSeen?.toMillis() || now;
        if (now - lastSeen < 60000) {
          users.push(data);
        }
      });
      setActiveUsers(users);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'presence');
    });

    // Cleanup presence on unmount
    return () => {
      clearInterval(interval);
      unsubscribe();
      deleteDoc(presenceRef).catch(console.error);
    };
  }, [appId, user]);

  return activeUsers;
}

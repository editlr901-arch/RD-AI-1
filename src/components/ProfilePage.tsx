import React, { useState, useRef } from 'react';
import { User, Plus, Loader2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { toast } from 'sonner';

interface ProfilePageProps {
  user: any;
  userData: any;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, userData }) => {
  const [firstName, setFirstName] = useState(userData?.firstName || '');
  const [lastName, setLastName] = useState(userData?.lastName || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdate = async () => {
    if (!user) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        firstName,
        lastName
      });
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Update failed.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB.');
      return;
    }

    setIsUploading(true);
    const storageRef = ref(storage, `profile_pictures/${user.uid}`);

    try {
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: downloadURL
      });
      
      toast.success('Profile picture updated!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="pt-24 pb-12 px-4 max-w-2xl mx-auto">
      <div className="glass p-8 rounded-3xl border-border">
        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full border-4 border-primary/30 p-1 overflow-hidden bg-surface mb-4 flex items-center justify-center">
              {isUploading ? (
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              ) : userData?.photoURL ? (
                <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary">
                  <User className="h-16 w-16" />
                </div>
              )}
            </div>
            <button 
              onClick={triggerFileInput}
              disabled={isUploading}
              className="absolute bottom-4 right-0 p-2 bg-primary text-black rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-50 disabled:scale-100"
            >
              <Plus className="h-4 w-4" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*"
            />
          </div>
          <h2 className="text-2xl font-bold">{userData?.firstName} {userData?.lastName}</h2>
          <p className="text-gray-400 text-sm">{userData?.email}</p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">First Name</label>
              <input 
                type="text" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Last Name</label>
              <input 
                type="text" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:border-primary outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
            <input 
              type="text" 
              value={userData?.location || ''}
              disabled
              className="w-full bg-background border border-border rounded-xl px-4 py-3 opacity-50 cursor-not-allowed"
            />
          </div>
          <button 
            onClick={handleUpdate}
            disabled={isUpdating}
            className="w-full bg-primary text-black font-bold py-3 rounded-xl hover:bg-accent transition-all disabled:opacity-50"
          >
            {isUpdating ? 'Updating...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

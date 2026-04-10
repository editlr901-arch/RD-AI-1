import React, { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { toast } from 'sonner';

export const ContactPage: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    
    // Simulate sending
    setTimeout(() => {
      toast.success('Inquiry sent to tharidusudesh60@gmail.com');
      setSubject('');
      setMessage('');
      setIsSending(false);
    }, 1500);
  };

  return (
    <div className="pt-24 pb-12 px-4 max-w-2xl mx-auto">
      <div className="glass p-8 rounded-3xl border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Contact Support</h2>
        </div>
        <p className="text-gray-400 mb-8">Have questions or need help? Send us a message and our team will assist you.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Subject</label>
            <input 
              type="text" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="How can we help?"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:border-primary outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Message</label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue in detail..."
              className="w-full h-40 bg-background border border-border rounded-xl p-4 focus:border-primary outline-none resize-none"
              required
            />
          </div>
          <button 
            type="submit"
            disabled={isSending}
            className="w-full flex items-center justify-center gap-2 bg-primary text-black font-bold py-3 rounded-xl hover:bg-accent transition-all disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
            {isSending ? 'Sending...' : 'Send Inquiry'}
          </button>
        </form>
      </div>
    </div>
  );
};

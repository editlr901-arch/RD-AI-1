import React from 'react';
import { motion } from 'motion/react';
import { 
  Layout, 
  Smartphone, 
  Globe, 
  ShoppingCart, 
  MessageSquare, 
  BarChart3, 
  Zap,
  Star,
  Search,
  Filter
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: any;
  code: string;
  previewUrl?: string;
}

const TEMPLATES: Template[] = [
  {
    id: 't-1',
    name: 'SaaS Landing Page',
    description: 'A modern, high-converting landing page for your SaaS product.',
    category: 'Business',
    icon: Globe,
    code: `import React from 'react';
import { motion } from 'motion/react';
import { Zap, Shield, Globe, Rocket } from 'lucide-react';

export const SaaSLanding = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="text-2xl font-black text-primary">RD AI</div>
        <div className="flex gap-8 text-sm font-bold text-gray-400">
          <a href="#" className="hover:text-white">Features</a>
          <a href="#" className="hover:text-white">Pricing</a>
          <a href="#" className="hover:text-white">About</a>
        </div>
        <button className="bg-primary text-black font-bold px-6 py-2 rounded-xl">Get Started</button>
      </nav>

      <header className="pt-20 pb-32 text-center px-4">
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-7xl font-black mb-6 tracking-tight"
        >
          Build Faster with <span className="text-primary">AI Power</span>
        </motion.h1>
        <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-10">
          The ultimate platform for developers to create, host, and scale applications in record time.
        </p>
        <div className="flex justify-center gap-4">
          <button className="bg-primary text-black font-bold px-8 py-4 rounded-2xl text-lg shadow-lg shadow-primary/20">Start Building Free</button>
          <button className="bg-surface border border-border px-8 py-4 rounded-2xl text-lg font-bold">Watch Demo</button>
        </div>
      </header>

      <section className="py-20 max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Zap, title: "Lightning Fast", desc: "Optimized for speed and performance out of the box." },
          { icon: Shield, title: "Secure by Default", desc: "Enterprise-grade security for all your applications." },
          { icon: Globe, title: "Global Scale", desc: "Deploy to edge locations worldwide with one click." }
        ].map((f, i) => (
          <div key={i} className="glass p-8 rounded-3xl border-border hover:border-primary/30 transition-all">
            <f.icon className="h-10 w-10 text-primary mb-6" />
            <h3 className="text-xl font-bold mb-2">{f.title}</h3>
            <p className="text-gray-400">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
};`
  },
  {
    id: 't-2',
    name: 'E-commerce Dashboard',
    description: 'A comprehensive dashboard for managing orders, products, and analytics.',
    category: 'Business',
    icon: ShoppingCart,
    code: `import React from 'react';
import { BarChart3, ShoppingBag, Users, DollarSign } from 'lucide-react';

export const EcommerceDashboard = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-3xl font-black">Store Analytics</h1>
        <div className="flex gap-4">
          <button className="bg-surface border border-border px-4 py-2 rounded-xl text-sm font-bold">Export CSV</button>
          <button className="bg-primary text-black font-bold px-4 py-2 rounded-xl text-sm">New Product</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Total Revenue', value: '$124,592', icon: DollarSign, trend: '+12%' },
          { label: 'Active Orders', value: '1,240', icon: ShoppingBag, trend: '+5%' },
          { label: 'Total Customers', value: '45,200', icon: Users, trend: '+18%' },
          { label: 'Conversion Rate', value: '3.2%', icon: BarChart3, trend: '-2%' }
        ].map((stat, i) => (
          <div key={i} className="glass p-6 rounded-3xl border-border">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <span className={cn("text-xs font-bold", stat.trend.startsWith('+') ? "text-green-500" : "text-red-500")}>
                {stat.trend}
              </span>
            </div>
            <p className="text-gray-500 text-xs font-bold uppercase mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="glass p-8 rounded-3xl border-border">
        <h3 className="text-xl font-bold mb-6">Recent Orders</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((o) => (
            <div key={o} className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-border">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-background rounded-xl border border-border flex items-center justify-center font-bold">#ORD-{o}</div>
                <div>
                  <p className="font-bold">John Doe</p>
                  <p className="text-[10px] text-gray-500">2 items • $120.00</p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-green-500/10 text-green-500 px-2 py-1 rounded-full uppercase">Completed</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};`
  },
  {
    id: 't-3',
    name: 'Social Media App',
    description: 'A mobile-first social feed with likes, comments, and profile views.',
    category: 'Social',
    icon: MessageSquare,
    code: `import React from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';

export const SocialFeed = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white max-w-md mx-auto border-x border-border">
      <header className="p-4 border-b border-border flex justify-between items-center sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-md z-10">
        <h1 className="text-xl font-black italic">RD SOCIAL</h1>
        <MessageCircle className="h-6 w-6" />
      </header>

      <div className="p-4 space-y-8">
        {[1, 2, 3].map((post) => (
          <div key={post} className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent" />
                <div>
                  <p className="font-bold text-sm">user_name_{post}</p>
                  <p className="text-[10px] text-gray-500">2 hours ago</p>
                </div>
              </div>
              <MoreHorizontal className="h-5 w-5 text-gray-500" />
            </div>
            <div className="aspect-square bg-surface rounded-2xl border border-border overflow-hidden">
              <img src={\`https://picsum.photos/seed/post\${post}/800/800\`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex gap-4">
              <Heart className="h-6 w-6 hover:text-red-500 cursor-pointer transition-colors" />
              <MessageCircle className="h-6 w-6" />
              <Share2 className="h-6 w-6" />
            </div>
            <p className="text-sm">
              <span className="font-bold mr-2">user_name_{post}</span>
              Exploring the new RD AI App Builder! This platform is insane. 🔥 #coding #ai #webdev
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};`
  }
];

interface TemplateGalleryProps {
  onSelect: (template: Template) => void;
  onClose: () => void;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onSelect, onClose }) => {
  const [search, setSearch] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState('All');

  const categories = ['All', 'Business', 'Social', 'Utilities', 'Games'];

  const filteredTemplates = TEMPLATES.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'All' || t.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-6xl glass rounded-3xl border-primary/20 flex flex-col max-h-[90vh] overflow-hidden"
      >
        <div className="p-8 border-b border-border flex justify-between items-center bg-surface/50">
          <div>
            <h2 className="text-3xl font-black text-white flex items-center gap-3">
              <Layout className="h-8 w-8 text-primary" />
              App Templates
            </h2>
            <p className="text-gray-400 text-sm mt-1">Start your next project with a professional pre-built template.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-all">
            <Zap className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 bg-surface/30 border-b border-border flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-border rounded-2xl pl-12 pr-4 py-3 focus:border-primary outline-none text-sm"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border",
                  activeCategory === cat ? "bg-primary text-black border-primary" : "bg-surface border-border text-gray-400 hover:border-primary/30"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTemplates.map((template) => (
              <motion.div 
                key={template.id}
                whileHover={{ y: -5 }}
                className="glass rounded-3xl border-border overflow-hidden flex flex-col group hover:border-primary/50 transition-all"
              >
                <div className="aspect-video bg-background relative overflow-hidden flex items-center justify-center border-b border-border">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <template.icon className="h-16 w-16 text-primary/20 group-hover:text-primary transition-all group-hover:scale-110" />
                  <div className="absolute top-4 right-4">
                    <span className="text-[10px] font-bold bg-surface border border-border px-2 py-1 rounded-full text-gray-400 group-hover:text-primary group-hover:border-primary/30 transition-all">
                      {template.category}
                    </span>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{template.name}</h3>
                  <p className="text-sm text-gray-500 mb-6 flex-1 leading-relaxed">{template.description}</p>
                  <button 
                    onClick={() => onSelect(template)}
                    className="w-full bg-primary text-black font-bold py-3 rounded-2xl hover:bg-accent transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/10"
                  >
                    <Zap className="h-4 w-4" />
                    Use Template
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
          
          {filteredTemplates.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-600">
              <Filter className="h-16 w-16 mb-4 opacity-10" />
              <p className="text-lg font-bold">No templates found matching your search.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

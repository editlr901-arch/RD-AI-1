import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GitBranch, 
  Zap, 
  Database, 
  MessageSquare, 
  ArrowRight, 
  Plus, 
  Trash2, 
  Settings,
  Play,
  Save,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition';
  label: string;
  description: string;
  icon: any;
  config: any;
}

const NODE_TYPES = [
  { type: 'trigger', label: 'On Click', icon: Zap, description: 'When a button is clicked' },
  { type: 'trigger', label: 'On Load', icon: Play, description: 'When the app starts' },
  { type: 'action', label: 'Show Alert', icon: MessageSquare, description: 'Display a message' },
  { type: 'action', label: 'Save Data', icon: Database, description: 'Store info in Firestore' },
  { type: 'condition', label: 'If/Else', icon: GitBranch, description: 'Check a value' },
];

export const LogicBuilder: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const addNode = (type: any) => {
    const newNode: WorkflowNode = {
      id: Math.random().toString(36).substr(2, 9),
      type: type.type,
      label: type.label,
      description: type.description,
      icon: type.icon,
      config: {}
    };
    setNodes([...nodes, newNode]);
  };

  const deleteNode = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <div className="h-16 bg-surface border-b border-border flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <GitBranch className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Logic & Workflow Builder</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Visual Logic Designer</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-xs font-bold hover:border-primary/50 transition-all">
            <Save className="h-4 w-4" />
            Save Workflow
          </button>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full">
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: Node Types */}
        <div className="w-72 bg-surface border-r border-border p-6 flex flex-col gap-6">
          <div>
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Triggers & Actions</h3>
            <div className="space-y-2">
              {NODE_TYPES.map((type) => (
                <button 
                  key={type.label}
                  onClick={() => addNode(type)}
                  className="w-full flex items-center gap-3 p-3 bg-background border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                >
                  <div className="p-2 bg-surface rounded-lg group-hover:bg-primary/10 transition-colors">
                    <type.icon className="h-4 w-4 text-gray-400 group-hover:text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{type.label}</p>
                    <p className="text-[10px] text-gray-500">{type.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto p-4 bg-primary/5 border border-primary/20 rounded-2xl">
            <p className="text-[10px] text-primary font-bold mb-2 flex items-center gap-2">
              <Zap className="h-3 w-3" />
              PRO TIP
            </p>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Connect nodes to define the execution flow of your application. Triggers start the flow, and Actions perform tasks.
            </p>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-[#0a0a0a] overflow-auto p-20 relative custom-scrollbar">
          <div className="flex flex-col items-center gap-12">
            {nodes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 text-gray-700 border-2 border-dashed border-border rounded-3xl w-full max-w-md">
                <GitBranch className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-sm font-bold">Add a trigger to start your workflow</p>
              </div>
            )}
            {nodes.map((node, index) => (
              <React.Fragment key={node.id}>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={cn(
                    "w-64 glass p-6 rounded-2xl border-border relative group cursor-pointer transition-all",
                    selectedNodeId === node.id ? "ring-2 ring-primary border-primary" : "hover:border-primary/30"
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn(
                      "p-2 rounded-lg",
                      node.type === 'trigger' ? "bg-yellow-500/10 text-yellow-500" : 
                      node.type === 'action' ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"
                    )}>
                      <node.icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-white">{node.label}</span>
                  </div>
                  <p className="text-[10px] text-gray-500">{node.description}</p>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </motion.div>
                {index < nodes.length - 1 && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-0.5 h-8 bg-border" />
                    <ArrowRight className="h-4 w-4 text-gray-600 rotate-90" />
                    <div className="w-0.5 h-8 bg-border" />
                  </motion.div>
                )}
              </React.Fragment>
            ))}
            {nodes.length > 0 && (
              <button 
                onClick={() => addNode(NODE_TYPES[2])}
                className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary transition-all"
              >
                <Plus className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Properties Sidebar */}
        <div className="w-80 bg-surface border-l border-border p-6">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Node Configuration
          </h3>
          {selectedNodeId ? (
            <div className="space-y-6">
              <div className="p-4 bg-background border border-border rounded-2xl">
                <p className="text-xs font-bold text-white mb-1">{nodes.find(n => n.id === selectedNodeId)?.label}</p>
                <p className="text-[10px] text-gray-500">Configure how this node behaves.</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block">Display Name</label>
                  <input 
                    type="text" 
                    className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs focus:border-primary outline-none"
                    placeholder="Enter name..."
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block">Action Logic</label>
                  <select className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs focus:border-primary outline-none">
                    <option>Standard Execution</option>
                    <option>Delayed (2s)</option>
                    <option>Conditional Check</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center text-gray-600">
              <Settings className="h-12 w-12 mb-4 opacity-10" />
              <p className="text-xs font-bold">Select a node to configure its logic</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

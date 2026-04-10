import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Type, 
  Square, 
  MousePointer2, 
  Plus, 
  Trash2, 
  Settings, 
  Code, 
  Eye, 
  Layout, 
  Smartphone, 
  Monitor, 
  Tablet,
  ChevronRight,
  ChevronDown,
  Layers,
  Component,
  Zap,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

interface VisualComponent {
  id: string;
  type: 'text' | 'button' | 'input' | 'card' | 'container';
  props: any;
  position: { x: number; y: number };
}

interface VisualBuilderProps {
  initialCode?: string;
  onCodeChange: (code: string) => void;
  onClose: () => void;
}

export const VisualBuilder: React.FC<VisualBuilderProps> = ({ initialCode, onCodeChange, onClose }) => {
  const [components, setComponents] = useState<VisualComponent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showCode, setShowCode] = useState(false);

  const addComponent = (type: VisualComponent['type']) => {
    const newComp: VisualComponent = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      props: getDefaultProps(type),
      position: { x: 50, y: 50 }
    };
    setComponents([...components, newComp]);
    setSelectedId(newComp.id);
  };

  const getDefaultProps = (type: VisualComponent['type']) => {
    switch (type) {
      case 'text': return { content: 'New Text', fontSize: '16px', color: '#ffffff' };
      case 'button': return { label: 'Click Me', variant: 'primary', padding: '12px 24px' };
      case 'input': return { placeholder: 'Enter text...', type: 'text' };
      case 'card': return { title: 'Card Title', content: 'Card content goes here.' };
      case 'container': return { padding: '20px', background: 'rgba(255,255,255,0.05)' };
    }
  };

  const updateComponentProps = (id: string, newProps: any) => {
    setComponents(components.map(c => c.id === id ? { ...c, props: { ...c.props, ...newProps } } : c));
  };

  const deleteComponent = (id: string) => {
    setComponents(components.filter(c => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const generateCode = () => {
    let code = `import React from 'react';\nimport { motion } from 'motion/react';\n\nexport const GeneratedApp = () => {\n  return (\n    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 flex flex-col gap-6">\n`;
    
    components.forEach(comp => {
      switch (comp.type) {
        case 'text':
          code += `      <p style={{ fontSize: '${comp.props.fontSize}', color: '${comp.props.color}' }}>${comp.props.content}</p>\n`;
          break;
        case 'button':
          code += `      <button className="bg-primary text-black font-bold px-6 py-2 rounded-xl hover:bg-accent transition-all">${comp.props.label}</button>\n`;
          break;
        case 'input':
          code += `      <input className="bg-surface border border-border rounded-xl px-4 py-2 outline-none focus:border-primary" placeholder="${comp.props.placeholder}" />\n`;
          break;
        case 'card':
          code += `      <div className="glass p-6 rounded-3xl border-border">\n        <h3 className="text-xl font-bold mb-2">${comp.props.title}</h3>\n        <p className="text-gray-400">${comp.props.content}</p>\n      </div>\n`;
          break;
        case 'container':
          code += `      <div className="p-4 bg-white/5 rounded-2xl border border-white/10">Container Content</div>\n`;
          break;
      }
    });

    code += `    </div>\n  );\n};`;
    return code;
  };

  useEffect(() => {
    onCodeChange(generateCode());
  }, [components]);

  const selectedComp = components.find(c => c.id === selectedId);

  return (
    <div className="flex-1 flex overflow-hidden bg-[#111111]">
      {/* Left Sidebar: Components */}
      <div className="w-64 bg-[#1a1a1a] border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <Component className="h-4 w-4" />
            Components
          </h3>
        </div>
        <div className="p-4 grid grid-cols-2 gap-2">
          {[
            { type: 'text', icon: Type, label: 'Text' },
            { type: 'button', icon: MousePointer2, label: 'Button' },
            { type: 'input', icon: Square, label: 'Input' },
            { type: 'card', icon: Layout, label: 'Card' },
            { type: 'container', icon: Square, label: 'Box' },
          ].map((item) => (
            <button 
              key={item.type}
              onClick={() => addComponent(item.type as any)}
              className="flex flex-col items-center justify-center p-3 bg-surface border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <item.icon className="h-5 w-5 text-gray-500 group-hover:text-primary mb-1" />
              <span className="text-[10px] font-bold text-gray-400 group-hover:text-white">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto p-4 border-t border-border">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-bold text-gray-400">Layers</span>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
            {components.map((comp) => (
              <div 
                key={comp.id}
                onClick={() => setSelectedId(comp.id)}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all",
                  selectedId === comp.id ? "bg-primary/10 text-primary" : "hover:bg-white/5 text-gray-400"
                )}
              >
                <div className="flex items-center gap-2">
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-[10px] font-bold uppercase">{comp.type}</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteComponent(comp.id); }}
                  className="p-1 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="h-12 bg-[#1a1a1a] border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex bg-background rounded-lg p-1 border border-border">
              <button 
                onClick={() => setViewMode('desktop')}
                className={cn("p-1.5 rounded-md transition-all", viewMode === 'desktop' ? "bg-primary text-black" : "text-gray-500 hover:text-white")}
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setViewMode('tablet')}
                className={cn("p-1.5 rounded-md transition-all", viewMode === 'tablet' ? "bg-primary text-black" : "text-gray-500 hover:text-white")}
              >
                <Tablet className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setViewMode('mobile')}
                className={cn("p-1.5 rounded-md transition-all", viewMode === 'mobile' ? "bg-primary text-black" : "text-gray-500 hover:text-white")}
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowCode(!showCode)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                showCode ? "bg-primary text-black border-primary" : "bg-surface border-border text-gray-400 hover:border-primary/50"
              )}
            >
              <Code className="h-4 w-4" />
              {showCode ? 'Hide Code' : 'Show Code'}
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-12 bg-[#0a0a0a] flex justify-center items-start custom-scrollbar">
          <motion.div 
            layout
            className={cn(
              "bg-[#0a0a0a] border border-border rounded-3xl shadow-2xl overflow-hidden min-h-[600px] transition-all relative",
              viewMode === 'desktop' ? "w-full max-w-5xl" : viewMode === 'tablet' ? "w-[768px]" : "w-[375px]"
            )}
          >
            <div className="p-8 flex flex-col gap-6">
              {components.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 text-gray-600 border-2 border-dashed border-border rounded-2xl">
                  <Zap className="h-12 w-12 mb-4 opacity-20" />
                  <p className="text-sm font-bold">Drag components here to start building</p>
                </div>
              )}
              {components.map((comp) => (
                <div 
                  key={comp.id}
                  onClick={() => setSelectedId(comp.id)}
                  className={cn(
                    "relative group cursor-pointer transition-all",
                    selectedId === comp.id ? "ring-2 ring-primary ring-offset-4 ring-offset-[#0a0a0a]" : "hover:ring-1 hover:ring-white/20"
                  )}
                >
                  {comp.type === 'text' && (
                    <p style={{ fontSize: comp.props.fontSize, color: comp.props.color }}>{comp.props.content}</p>
                  )}
                  {comp.type === 'button' && (
                    <button className="bg-primary text-black font-bold px-6 py-2 rounded-xl hover:bg-accent transition-all">
                      {comp.props.label}
                    </button>
                  )}
                  {comp.type === 'input' && (
                    <input className="bg-surface border border-border rounded-xl px-4 py-2 outline-none focus:border-primary w-full" placeholder={comp.props.placeholder} />
                  )}
                  {comp.type === 'card' && (
                    <div className="glass p-6 rounded-3xl border-border">
                      <h3 className="text-xl font-bold mb-2">{comp.props.title}</h3>
                      <p className="text-gray-400">{comp.props.content}</p>
                    </div>
                  )}
                  {comp.type === 'container' && (
                    <div className="p-8 bg-white/5 rounded-2xl border border-white/10 text-center text-xs text-gray-500">
                      Container Area
                    </div>
                  )}

                  {selectedId === comp.id && (
                    <div className="absolute -top-8 right-0 flex items-center gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteComponent(comp.id); }}
                        className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Sidebar: Properties */}
      <div className="w-72 bg-[#1a1a1a] border-l border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Properties
          </h3>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {selectedComp ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Component className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-white capitalize">{selectedComp.type}</h4>
                  <p className="text-[10px] text-gray-500 font-mono">ID: {selectedComp.id}</p>
                </div>
              </div>

              {selectedComp.type === 'text' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block">Content</label>
                    <textarea 
                      value={selectedComp.props.content}
                      onChange={(e) => updateComponentProps(selectedComp.id, { content: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg p-3 text-xs focus:border-primary outline-none resize-none h-24"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block">Font Size</label>
                    <input 
                      type="text"
                      value={selectedComp.props.fontSize}
                      onChange={(e) => updateComponentProps(selectedComp.id, { fontSize: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block">Color</label>
                    <div className="flex gap-2">
                      <input 
                        type="color"
                        value={selectedComp.props.color}
                        onChange={(e) => updateComponentProps(selectedComp.id, { color: e.target.value })}
                        className="w-10 h-10 bg-transparent border-none cursor-pointer"
                      />
                      <input 
                        type="text"
                        value={selectedComp.props.color}
                        onChange={(e) => updateComponentProps(selectedComp.id, { color: e.target.value })}
                        className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs focus:border-primary outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedComp.type === 'button' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block">Label</label>
                    <input 
                      type="text"
                      value={selectedComp.props.label}
                      onChange={(e) => updateComponentProps(selectedComp.id, { label: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:border-primary outline-none"
                    />
                  </div>
                </div>
              )}

              {selectedComp.type === 'card' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block">Title</label>
                    <input 
                      type="text"
                      value={selectedComp.props.title}
                      onChange={(e) => updateComponentProps(selectedComp.id, { title: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block">Content</label>
                    <textarea 
                      value={selectedComp.props.content}
                      onChange={(e) => updateComponentProps(selectedComp.id, { content: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg p-3 text-xs focus:border-primary outline-none resize-none h-24"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center text-gray-600">
              <MousePointer2 className="h-10 w-10 mb-4 opacity-20" />
              <p className="text-xs font-bold">Select a component to edit its properties</p>
            </div>
          )}
        </div>
      </div>

      {/* Code Overlay */}
      <AnimatePresence>
        {showCode && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed top-0 right-0 bottom-0 w-[500px] bg-[#1e1e1e] border-l border-border z-[70] shadow-2xl flex flex-col"
          >
            <div className="p-4 border-b border-border flex justify-between items-center bg-[#252526]">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-white">Generated Code</span>
              </div>
              <button onClick={() => setShowCode(false)} className="p-1 hover:bg-white/10 rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 p-6 overflow-auto custom-scrollbar">
              <pre className="text-[11px] text-green-500 font-mono leading-relaxed">
                <code>{generateCode()}</code>
              </pre>
            </div>
            <div className="p-4 border-t border-border bg-[#252526]">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(generateCode());
                  alert('Code copied to clipboard!');
                }}
                className="w-full bg-primary text-black font-bold py-2 rounded-xl hover:bg-accent transition-all text-xs"
              >
                Copy Code
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

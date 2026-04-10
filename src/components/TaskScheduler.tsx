import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  X
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Task {
  id: string;
  title: string;
  description?: string;
  scheduledAt: Timestamp;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Timestamp;
}

interface TaskSchedulerProps {
  user: any;
}

export const TaskScheduler: React.FC<TaskSchedulerProps> = ({ user }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      orderBy('scheduledAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'tasks');
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle || !newDate || !newTime) return;

    try {
      const scheduledDate = new Date(`${newDate}T${newTime}`);
      
      await addDoc(collection(db, 'tasks'), {
        userId: user.uid,
        title: newTitle,
        description: newDesc,
        scheduledAt: Timestamp.fromDate(scheduledDate),
        status: 'pending',
        createdAt: serverTimestamp()
      }).catch(err => handleFirestoreError(err, OperationType.CREATE, 'tasks'));

      toast.success('Task scheduled successfully!');
      setIsAdding(false);
      setNewTitle('');
      setNewDesc('');
      setNewDate('');
      setNewTime('');
    } catch (err) {
      toast.error('Failed to schedule task.');
    }
  };

  const toggleStatus = async (task: Task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await updateDoc(doc(db, 'tasks', task.id), {
        status: newStatus
      }).catch(err => handleFirestoreError(err, OperationType.UPDATE, 'tasks/' + task.id));
    } catch (err) {
      toast.error('Failed to update task.');
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId)).catch(err => handleFirestoreError(err, OperationType.DELETE, 'tasks/' + taskId));
      toast.success('Task deleted.');
    } catch (err) {
      toast.error('Failed to delete task.');
    }
  };

  return (
    <div className="glass p-6 rounded-2xl border-border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Scheduled Tasks
        </h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 p-4 bg-background border border-border rounded-xl"
          >
            <form onSubmit={handleAddTask} className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm">New Task</h4>
                <button type="button" onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <input 
                type="text" 
                placeholder="Task Title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                required
              />
              <textarea 
                placeholder="Description (Optional)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:border-primary outline-none resize-none h-20"
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Date</label>
                  <input 
                    type="date" 
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Time</label>
                  <input 
                    type="time" 
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                    required
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-primary text-black font-bold py-2 rounded-lg hover:bg-accent transition-all text-sm"
              >
                Schedule Task
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">No tasks scheduled yet.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <motion.div 
              layout
              key={task.id}
              className={cn(
                "p-4 border rounded-xl transition-all group",
                task.status === 'completed' ? "bg-primary/5 border-primary/20 opacity-60" : "bg-surface border-border hover:border-primary/30"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <button 
                    onClick={() => toggleStatus(task)}
                    className={cn(
                      "mt-1 transition-colors",
                      task.status === 'completed' ? "text-primary" : "text-gray-600 hover:text-primary"
                    )}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </button>
                  <div>
                    <h4 className={cn(
                      "font-bold text-sm",
                      task.status === 'completed' && "line-through text-gray-500"
                    )}>
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <Calendar className="h-3 w-3" />
                        {task.scheduledAt.toDate().toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <Clock className="h-3 w-3" />
                        {task.scheduledAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => deleteTask(task.id)}
                  className="p-2 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

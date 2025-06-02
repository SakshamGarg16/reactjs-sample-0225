'use client';

import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db, auth } from '../utils/firebase';
import TaskCard from '../components/TaskCard';
import AddTaskModal from '../components/AddTaskModal';
import { Toaster } from 'react-hot-toast';
import { onAuthStateChanged, User } from 'firebase/auth';
import ProtectedRoute from '../components/ProctedRoute';


export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  deadline: string;
  userId: string;
  createdAt?: Timestamp | string | null;
  updatedAt?: Timestamp | string | null;
}

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const fetchTasks = useCallback(async (uid: string) => {
    try {
      setLoading(true);
      // Temporarily remove orderBy to avoid index requirement
      const q = query(
        collection(db, 'tasks'), 
        where('userId', '==', uid)
        // orderBy('createdAt', 'desc') // Comment this out temporarily
      );
      
      const snapshot = await getDocs(q);
      const fetchedTasks = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          status: data.status || 'pending',
          deadline: data.deadline || '',
          userId: data.userId || '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        } as Task;
      });
      
      const sortedTasks = fetchedTasks.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        
        // Handle Firebase Timestamps
        const aTime = (a.createdAt as Timestamp).toDate ? 
          (a.createdAt as Timestamp).toDate().getTime() : 
          new Date(a.createdAt as unknown as string).getTime();
        const bTime = (b.createdAt as Timestamp).toDate ? 
          (b.createdAt as Timestamp).toDate().getTime() : 
          new Date(b.createdAt as unknown as string).getTime();
        
        return bTime - aTime; // Descending order (newest first)
      });
      
      setTasks(sortedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        setUser(user);
        fetchTasks(user.uid);
      } else {
        setTasks([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchTasks]);

  const handleTaskUpdate = useCallback(() => {
    if (user) {
      fetchTasks(user.uid);
    }
  }, [user, fetchTasks]);

  return (
    <ProtectedRoute>
      <main className="p-6">
        <Toaster />
        <h1 className="text-3xl font-bold mb-6">Task Board</h1>
        
        <AddTaskModal onTaskAdded={handleTaskUpdate} />
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-gray-500">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">No tasks yet.</p>
            <p className="text-gray-400 text-sm mt-2">Create your first task to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <TaskCard 
                key={task.id}
                id={task.id}
                title={task.title}
                description={task.description}
                status={task.status}
                deadline={task.deadline}
                createdAt={task.createdAt instanceof Timestamp ? task.createdAt : null}
                onTaskUpdated={handleTaskUpdate}
              />
            ))}
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}

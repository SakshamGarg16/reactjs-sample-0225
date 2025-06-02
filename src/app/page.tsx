'use client';

import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db, auth } from '../utils/firebase';
import TaskCard from '../components/TaskCard';
import AddTaskModal from '../components/AddTaskModal';
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
      const q = query(
        collection(db, 'tasks'), 
        where('userId', '==', uid)
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
      
      // Sort on the client side
      const sortedTasks = fetchedTasks.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        
        const aTime = (a.createdAt as Timestamp).toDate ? 
          (a.createdAt as Timestamp).toDate().getTime() : 
          new Date(a.createdAt as string).getTime();
        const bTime = (b.createdAt as Timestamp).toDate ? 
          (b.createdAt as Timestamp).toDate().getTime() : 
          new Date(b.createdAt as string).getTime();
        
        return bTime - aTime;
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
    if (typeof window !== 'undefined' && auth) {
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
    }
  }, [fetchTasks]);

  const handleTaskUpdate = useCallback(() => {
    if (user) {
      fetchTasks(user.uid);
    }
  }, [user, fetchTasks]);

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-300 mb-2">Task Board</h1>
          <p className="text-gray-100">Manage your tasks efficiently</p>
        </div>
        
        <div className="mb-6">
          <AddTaskModal onTaskAdded={handleTaskUpdate} />
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading tasks...</p>
            </div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks yet</h3>
            <p className="text-gray-500 mb-4">Create your first task to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Your Tasks ({tasks.length})
              </h2>
              <div className="flex gap-2 text-sm">
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                  Pending: {tasks.filter(t => t.status === 'pending').length}
                </span>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  In Progress: {tasks.filter(t => t.status === 'in-progress').length}
                </span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                  Completed: {tasks.filter(t => t.status === 'completed').length}
                </span>
              </div>
            </div>
            
            {tasks.map((task) => (
              <TaskCard 
                key={task.id}
                id={task.id}
                title={task.title}
                description={task.description}
                status={task.status}
                deadline={task.deadline}
                createdAt={task.createdAt}
                onTaskUpdated={handleTaskUpdate}
              />
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db, auth } from '../utils/firebase';
import TaskCard from '../components/TaskCard';
import AddTaskModal from '../components/AddTaskModal';
import { Toaster } from 'react-hot-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface Task {
  id: string;
  title: string;
  status: string;
  userId: string;
  description?: string;
  deadline?: Timestamp | Date | null;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

type FilterStatus = 'all' | 'pending' | 'in-progress' | 'completed';

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<FilterStatus>('all');
  const router = useRouter();

  const fetchTasks = async (uid: string) => {
    const q = query(collection(db, 'tasks'), where('userId', '==', uid));
    const snapshot = await getDocs(q);
    const fetchedTasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Task[];
    setTasks(fetchedTasks);
    setLoading(false);
  };

  // Filter tasks based on selected status
  useEffect(() => {
    if (selectedFilter === 'all') {
      setFilteredTasks(tasks);
    } else {
      const filtered = tasks.filter(task => task.status === selectedFilter);
      setFilteredTasks(filtered);
    }
  }, [tasks, selectedFilter]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchTasks(user.uid);
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);


  const handleFilterChange = (filter: FilterStatus) => {
    setSelectedFilter(filter);
  };

  const getTaskCount = (status: FilterStatus) => {
    if (status === 'all') return tasks.length;
    return tasks.filter(task => task.status === status).length;
  };

  const getStatusLabel = (status: FilterStatus) => {
    switch (status) {
      case 'all':
        return 'All Tasks';
      case 'pending':
        return 'Pending';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 2000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      {/* Sidebar Filter */}
      <div className="w-64 bg-gray-800 shadow-lg p-6 border-r border-gray-200">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Filter Tasks</h2>
          
          {/* Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedFilter}
              onChange={(e) => handleFilterChange(e.target.value as FilterStatus)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 cursor-pointer transition-all duration-200"
            >
              <option value="all">All Tasks ({getTaskCount('all')})</option>
              <option value="pending">Pending ({getTaskCount('pending')})</option>
              <option value="in-progress">In Progress ({getTaskCount('in-progress')})</option>
              <option value="completed">Completed ({getTaskCount('completed')})</option>
            </select>
          </div>
        </div>

        {/* Filter Stats */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white mb-3">Task Overview</h3>
          
          {(['all', 'pending', 'in-progress', 'completed'] as FilterStatus[]).map((status) => (
            <div
              key={status}
              onClick={() => handleFilterChange(status)}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                selectedFilter === status
                  ? 'bg-blue-50 border-2 border-blue-200 text-blue-800'
                  : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent text-gray-700'
              }`}
            >
              <span className="font-medium">{getStatusLabel(status)}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                selectedFilter === status
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {getTaskCount(status)}
              </span>
            </div>
          ))}
        </div>

        {/* Current Filter Display */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Active Filter:</span><br />
            {getStatusLabel(selectedFilter)}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Task Board</h1>
              <p className="text-gray-600 mt-1">
                {selectedFilter === 'all' 
                  ? `Showing all ${tasks.length} tasks`
                  : `Showing ${filteredTasks.length} ${getStatusLabel(selectedFilter).toLowerCase()} tasks`
                }
              </p>
            </div>
            <AddTaskModal />
          </div>

          {/* Tasks Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading tasks...</p>
              </div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {selectedFilter === 'all' ? 'No tasks yet' : `No ${getStatusLabel(selectedFilter).toLowerCase()} tasks`}
              </h3>
              <p className="text-gray-500 mb-4">
                {selectedFilter === 'all' 
                  ? 'Create your first task to get started'
                  : `You don't have any ${getStatusLabel(selectedFilter).toLowerCase()} tasks at the moment`
                }
              </p>
              {selectedFilter !== 'all' && (
                <button
                  onClick={() => setSelectedFilter('all')}
                  className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                >
                  View all tasks
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  id={task.id}
                  title={task.title} 
                  status={task.status}
                  description={task.description}
                  deadline={task.deadline}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

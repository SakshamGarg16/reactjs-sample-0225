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
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
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
    setIsMobileFilterOpen(false); // Close mobile filter after selection
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

  const getStatusColor = (status: FilterStatus) => {
    switch (status) {
      case 'all':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      
      {/* Desktop Sidebar Filter */}
      <div className="hidden lg:block w-64 bg-gray-800 shadow-lg p-6 border-r border-gray-200">
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
      <div className="flex-1 p-4 md:p-6 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Task Board</h1>
              <p className="text-gray-400 mt-1 text-sm md:text-base">
                {selectedFilter === 'all' 
                  ? `Showing all ${tasks.length} tasks`
                  : `Showing ${filteredTasks.length} ${getStatusLabel(selectedFilter).toLowerCase()} tasks`
                }
              </p>
            </div>
            
            {/* Mobile Filter Button & Add Task */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Mobile Filter Dropdown */}
              <div className="lg:hidden relative flex-1 sm:flex-none">
                <button
                  onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                  className="w-full sm:w-auto flex items-center justify-between px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors duration-200"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span className="text-sm font-medium">{getStatusLabel(selectedFilter)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedFilter)}`}>
                      {getTaskCount(selectedFilter)}
                    </span>
                  </div>
                  <svg className={`w-4 h-4 transition-transform duration-200 ${isMobileFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Mobile Filter Dropdown Menu */}
                {isMobileFilterOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    {(['all', 'pending', 'in-progress', 'completed'] as FilterStatus[]).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleFilterChange(status)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg ${
                          selectedFilter === status ? 'bg-blue-50 text-blue-800' : 'text-gray-700'
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
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <AddTaskModal />
            </div>
          </div>

          {/* Mobile Filter Stats */}
          <div className="lg:hidden mb-6">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['all', 'pending', 'in-progress', 'completed'] as FilterStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleFilterChange(status)}
                    className={`p-3 rounded-lg text-center transition-all duration-200 ${
                      selectedFilter === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="text-lg font-bold">{getTaskCount(status)}</div>
                    <div className="text-xs">{getStatusLabel(status)}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tasks Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading tasks...</p>
              </div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                {selectedFilter === 'all' ? 'No tasks yet' : `No ${getStatusLabel(selectedFilter).toLowerCase()} tasks`}
              </h3>
              <p className="text-gray-400 mb-4">
                {selectedFilter === 'all' 
                  ? 'Create your first task to get started'
                  : `You don't have any ${getStatusLabel(selectedFilter).toLowerCase()} tasks at the moment`
                }
              </p>
              {selectedFilter !== 'all' && (
                <button
                  onClick={() => setSelectedFilter('all')}
                  className="text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                >
                  View all tasks
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

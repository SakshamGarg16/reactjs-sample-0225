'use client';

import { useState, useCallback } from 'react';
import { doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';
import toast from 'react-hot-toast';

interface TaskCardProps {
  id: string;
  title: string;
  status: string;
  deadline?: Timestamp | Date | null;
  description?: string;
}

interface FormattedDeadline {
  full: string;
  date: string;
  time: string;
}

export default function TaskCard({ id, title, status, deadline, description }: TaskCardProps) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateTaskStatus = useCallback(async (newStatus: string) => {
    if (!db) {
      toast.error('Database not available');
      return;
    }

    if (newStatus === currentStatus) {
      return; // No change needed
    }

    if (isUpdating) {
      return; // Prevent multiple simultaneous updates
    }

    setIsUpdating(true);
    
    // Create a unique toast ID to prevent duplicates
    const toastId = `update-${id}-${Date.now()}`;
    
    try {
      const taskRef = doc(db, 'tasks', id);
      await updateDoc(taskRef, { 
        status: newStatus,
        updatedAt: new Date()
      });
      
      setCurrentStatus(newStatus);
      toast.success('Task status updated!', { id: toastId });
      
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task status', { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  }, [id, currentStatus, isUpdating]);

  const deleteTask = useCallback(async () => {
    if (!db) {
      toast.error('Database not available');
      return;
    }

    if (isUpdating) {
      return; // Prevent multiple simultaneous operations
    }

    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    setIsUpdating(true);
    
    // Create a unique toast ID
    const toastId = `delete-${id}-${Date.now()}`;
    
    try {
      const taskRef = doc(db, 'tasks', id);
      await deleteDoc(taskRef);
      
      toast.success('Task deleted successfully!', { id: toastId });
      
      // Refresh the page to update the task list
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task', { id: toastId });
      setIsUpdating(false);
    }
  }, [id, isUpdating]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
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

  const formatDeadline = (deadline: Timestamp | Date | null | undefined): FormattedDeadline | null => {
    if (!deadline) return null;
    
    try {
      let date: Date;
      if (deadline instanceof Timestamp) {
        date = deadline.toDate();
      } else if (deadline instanceof Date) {
        date = deadline;
      } else {
        return null;
      }
      
      return {
        full: date.toLocaleString(),
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    } catch (error) {
      console.error('Error formatting deadline:', error);
      return null;
    }
  };

  const isOverdue = (deadline: Timestamp | Date | null | undefined): boolean => {
    if (!deadline || currentStatus === 'completed') return false;
    
    try {
      let date: Date;
      if (deadline instanceof Timestamp) {
        date = deadline.toDate();
      } else if (deadline instanceof Date) {
        date = deadline;
      } else {
        return false;
      }
      
      return date < new Date();
    } catch (error) {
      return false;
    }
  };

  const getTimeRemaining = (deadline: Timestamp | Date | null | undefined): string | null => {
    if (!deadline || currentStatus === 'completed') return null;
    
    try {
      let date: Date;
      if (deadline instanceof Timestamp) {
        date = deadline.toDate();
      } else if (deadline instanceof Date) {
        date = deadline;
      } else {
        return null;
      }
      
      const now = new Date();
      const diff = date.getTime() - now.getTime();
      
      if (diff < 0) return 'Overdue';
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) return `${days}d ${hours}h remaining`;
      if (hours > 0) return `${hours}h ${minutes}m remaining`;
      if (minutes > 0) return `${minutes}m remaining`;
      return 'Due now';
    } catch (error) {
      return null;
    }
  };

  const formattedDeadline = formatDeadline(deadline);
  const overdue = isOverdue(deadline);
  const timeRemaining = getTimeRemaining(deadline);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex-1 mr-2">{title}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(currentStatus)}`}>
          {getStatusLabel(currentStatus)}
        </span>
      </div>

      {description && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{description}</p>
      )}

      {formattedDeadline && (
        <div className={`mb-4 p-3 rounded-md text-sm ${
          overdue 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          <div className="flex items-center mb-1">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">
              {overdue ? 'Overdue' : 'Deadline'}
            </span>
          </div>
          <div className="ml-6">
            <p className="font-medium">{formattedDeadline.date}</p>
            <p className="text-xs opacity-75">{formattedDeadline.time}</p>
            {timeRemaining && (
              <p className={`text-xs mt-1 font-medium ${
                overdue ? 'text-red-600' : 'text-blue-600'
              }`}>
                {timeRemaining}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Update Status:
          </label>
          <select
            value={currentStatus}
            onChange={(e) => updateTaskStatus(e.target.value)}
            disabled={isUpdating}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <button
          onClick={deleteTask}
          disabled={isUpdating}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors duration-200 text-sm font-medium"
        >
          {isUpdating ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : (
            'Delete Task'
          )}
        </button>
      </div>
    </div>
  );
}

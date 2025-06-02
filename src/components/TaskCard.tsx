'use client';

import { useState } from 'react';
import { doc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';
import toast from 'react-hot-toast';

interface TaskCardProps {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  deadline: string;
  createdAt?: Timestamp | string | null;
  onTaskUpdated?: () => void;
}

export default function TaskCard({ 
  id, 
  title, 
  description, 
  status, 
  deadline, 
  createdAt,
  onTaskUpdated 
}: TaskCardProps) {
  const [loading, setLoading] = useState(false);

  // Validate required props
  if (!id || !title) {
    console.error('TaskCard: Missing required props', { id, title });
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateInput: Timestamp | string | null | undefined) => {
    try {
      if (!dateInput) return 'No date';
      
      // Handle Firebase Timestamp
      if (dateInput && typeof dateInput === 'object' && 'toDate' in dateInput) {
        const date = (dateInput as Timestamp).toDate();
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
      
      // Handle string dates
      if (typeof dateInput === 'string') {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return 'Invalid date';
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
      
      return 'Invalid date';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const isOverdue = () => {
    try {
      if (!deadline) return false;
      const now = new Date();
      const deadlineDate = new Date(deadline);
      return !isNaN(deadlineDate.getTime()) && deadlineDate < now && status !== 'completed';
    } catch {
      return false;
    }
  };

  const updateStatus = async (newStatus: 'pending' | 'in-progress' | 'completed') => {
    if (!id) {
      toast.error('Invalid task ID');
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'tasks', id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      toast.success(`Task status updated to ${getStatusText(newStatus)}`);
      
      if (onTaskUpdated) {
        onTaskUpdated();
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async () => {
    const newStatus = status === 'completed' ? 'pending' : 'completed';
    await updateStatus(newStatus);
  };

  const deleteTask = async () => {
    if (!id) {
      toast.error('Invalid task ID');
      return;
    }

    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    setLoading(true);
    try {
      await deleteDoc(doc(db, 'tasks', id));
      toast.success('Task deleted successfully');
      
      if (onTaskUpdated) {
        onTaskUpdated();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white p-4 rounded-lg shadow-md border-l-4 mb-4 ${
      status === 'completed' ? 'border-green-500' : 
      status === 'in-progress' ? 'border-yellow-500' : 
      'border-red-500'
    } ${isOverdue() ? 'bg-red-50' : ''}`}>
      
      {/* Header */}
      <div className="flex justify-between items-start mb-3 text-gray-700">
        <h3 className={`text-lg font-semibold ${status === 'completed' ? 'line-through text-gray-700' : ''}`}>
          {title || 'Untitled Task'}
        </h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
          {getStatusText(status)}
        </span>
      </div>

      {/* Description */}
      {description && (
        <p className={`text-gray-600 mb-3 ${status === 'completed' ? 'line-through' : ''}`}>
          {description}
        </p>
      )}

      {/* Deadline */}
      {deadline && (
        <div className="mb-3">
          <p className={`text-sm ${isOverdue() ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
            <span className="font-medium">Deadline:</span> {formatDate(deadline)}
            {isOverdue() && <span className="ml-2 text-red-600">(Overdue!)</span>}
          </p>
        </div>
      )}

      {/* Status Update Buttons */}
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={() => updateStatus('pending')}
          disabled={loading || status === 'pending'}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            status === 'pending' 
              ? 'bg-red-200 text-red-800 cursor-not-allowed' 
              : 'bg-red-100 text-red-700 hover:bg-red-200'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => updateStatus('in-progress')}
          disabled={loading || status === 'in-progress'}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            status === 'in-progress' 
              ? 'bg-yellow-200 text-yellow-800 cursor-not-allowed' 
              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
          }`}
        >
          In Progress
        </button>
        <button
          onClick={() => updateStatus('completed')}
          disabled={loading || status === 'completed'}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            status === 'completed' 
              ? 'bg-green-200 text-green-800 cursor-not-allowed' 
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={toggleStatus}
          disabled={loading}
          className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
            status === 'completed'
              ? 'bg-yellow-500 text-white hover:bg-yellow-600'
              : 'bg-green-500 text-white hover:bg-green-600'
          } disabled:opacity-50`}
        >
          {loading ? 'Updating...' : status === 'completed' ? 'Mark Incomplete' : 'Mark Complete'}
        </button>
        
        <button
          onClick={deleteTask}
          disabled={loading}
          className="bg-red-500 text-white py-2 px-3 rounded text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      {/* Created Date */}
      {createdAt && (
        <p className="text-xs text-gray-400 mt-2">
          Created: {formatDate(createdAt)}
        </p>
      )}
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';
import toast from 'react-hot-toast';

interface TaskCardProps {
  id: string;
  title: string;
  status: string;
  deadline?: Timestamp | Date | null;
  description?: string;
  createdAt?: Timestamp | Date;
  onTaskUpdated: () => void;
}

interface FormattedDeadline {
  full: string;
  date: string;
  time: string;
  isOverdue: boolean;
  timeLeft: string;
  progressPercentage: number;
  urgencyLevel: 'safe' | 'warning' | 'urgent' | 'overdue';
}

export default function TaskCard({ id, title, status, deadline, description, createdAt, onTaskUpdated }: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Edit form states
  const [editTitle, setEditTitle] = useState(title);
  const [editDescription, setEditDescription] = useState(description || '');
  const [editDeadline, setEditDeadline] = useState('');
  
  const expandedContentRef = useRef<HTMLDivElement>(null);

  // Format deadline for datetime-local input
  useEffect(() => {
    if (deadline) {
      let deadlineDate: Date;
      if (deadline instanceof Timestamp) {
        deadlineDate = deadline.toDate();
      } else if (deadline instanceof Date) {
        deadlineDate = deadline;
      } else {
        return;
      }
      
      const year = deadlineDate.getFullYear();
      const month = String(deadlineDate.getMonth() + 1).padStart(2, '0');
      const day = String(deadlineDate.getDate()).padStart(2, '0');
      const hours = String(deadlineDate.getHours()).padStart(2, '0');
      const minutes = String(deadlineDate.getMinutes()).padStart(2, '0');
      
      setEditDeadline(`${year}-${month}-${day}T${hours}:${minutes}`);
    }
  }, [deadline]);

  const getTimeLeft = (targetDate: Date): string => {
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Overdue';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h left`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    } else if (minutes > 0) {
      return `${minutes}m left`;
    } else {
      return 'Due soon';
    }
  };

  const calculateProgress = (createdAt: Date, deadline: Date): { percentage: number; urgencyLevel: 'safe' | 'warning' | 'urgent' | 'overdue' } => {
    const now = new Date();
    const totalTime = deadline.getTime() - createdAt.getTime();
    const timeElapsed = now.getTime() - createdAt.getTime();
    const timeRemaining = deadline.getTime() - now.getTime();
    
    // If overdue
    if (timeRemaining <= 0) {
      return { percentage: 100, urgencyLevel: 'overdue' };
    }
    
    // Calculate how much time has passed as a percentage
    const progressPercentage = Math.min(100, Math.max(0, (timeElapsed / totalTime) * 100));
    
    // Determine urgency level based on remaining time percentage
    const remainingPercentage = 100 - progressPercentage;
    
    if (remainingPercentage > 60) {
      return { percentage: progressPercentage, urgencyLevel: 'safe' };
    } else if (remainingPercentage > 30) {
      return { percentage: progressPercentage, urgencyLevel: 'warning' };
    } else {
      return { percentage: progressPercentage, urgencyLevel: 'urgent' };
    }
  };

  const formatDeadline = (deadline: Timestamp | Date | null | undefined, createdAt: Timestamp | Date | undefined): FormattedDeadline | null => {
    if (!deadline) return null;

    let deadlineDate: Date;
    let creationDate: Date;
    
    // Convert deadline to Date
    if (deadline instanceof Timestamp) {
      deadlineDate = deadline.toDate();
    } else if (deadline instanceof Date) {
      deadlineDate = deadline;
    } else {
      return null;
    }

    // Convert createdAt to Date, fallback to current time if not available
    if (createdAt instanceof Timestamp) {
      creationDate = createdAt.toDate();
    } else if (createdAt instanceof Date) {
      creationDate = createdAt;
    } else {
      // Fallback: assume created now (this shouldn't happen in normal cases)
      creationDate = new Date();
    }

    const now = new Date();
    const isOverdue = deadlineDate < now && status !== 'completed';
    
    const progress = calculateProgress(creationDate, deadlineDate);

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };

    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
    };

    return {
      full: deadlineDate.toLocaleDateString('en-US', options),
      date: deadlineDate.toLocaleDateString('en-US', dateOptions),
      time: deadlineDate.toLocaleDateString('en-US', timeOptions),
      isOverdue,
      timeLeft: getTimeLeft(deadlineDate),
      progressPercentage: progress.percentage,
      urgencyLevel: isOverdue ? 'overdue' : progress.urgencyLevel,
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600';
    }
  };

  const getProgressBarColor = (urgencyLevel: 'safe' | 'warning' | 'urgent' | 'overdue') => {
    switch (urgencyLevel) {
      case 'safe':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'urgent':
        return 'bg-orange-500';
      case 'overdue':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTimeLeftColor = (urgencyLevel: 'safe' | 'warning' | 'urgent' | 'overdue') => {
    switch (urgencyLevel) {
      case 'safe':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'urgent':
        return 'text-orange-400';
      case 'overdue':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return;
    
    setIsUpdating(true);
    try {
      const taskRef = doc(db, 'tasks', id);
      await updateDoc(taskRef, {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });
      
      toast.success('Status updated successfully!');
      onTaskUpdated();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditClick = () => {
    setIsExpanded(true);
    setTimeout(() => setIsEditing(true), 300);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle(title);
    setEditDescription(description || '');
    setTimeout(() => setIsExpanded(false), 100);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      toast.error('Title cannot be empty');
      return;
    }

    setIsUpdating(true);
    try {
      const taskRef = doc(db, 'tasks', id);
      
      // Create update object with proper typing for Firestore
      const updateData: Record<string, string | Timestamp | null> = {
        title: editTitle.trim(),
        description: editDescription.trim(),
        updatedAt: Timestamp.now(),
      };

      if (editDeadline) {
        updateData.deadline = Timestamp.fromDate(new Date(editDeadline));
      } else {
        updateData.deadline = null;
      }

      await updateDoc(taskRef, updateData);
      
      toast.success('Task updated successfully!');
      setIsEditing(false);
      setTimeout(() => setIsExpanded(false), 100);
      onTaskUpdated();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const taskRef = doc(db, 'tasks', id);
      await deleteDoc(taskRef);
      
      toast.success('Task deleted successfully!');
      onTaskUpdated();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const formattedDeadline = formatDeadline(deadline, createdAt);

  return (
    <div className={`bg-gray-800 dark:bg-gray-800 rounded-lg shadow-md border border-gray-700 dark:border-gray-600 hover:shadow-lg transition-all duration-300 ${
      isExpanded ? 'ring-2 ring-blue-500 shadow-xl' : ''
    } ${isDeleting ? 'opacity-50' : ''}`}>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4 shadow-xl border border-gray-200 dark:border-gray-600">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Task</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete "{title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Main Card Content */}
      <div className="p-4">
        {/* Header with Title, Edit Button, and Delete Button */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-white dark:text-white line-clamp-2 flex-1 mr-2">
            {title}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Edit Button */}
            <button
              onClick={handleEditClick}
              disabled={isExpanded || isUpdating}
              className={`p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-all duration-200 ${
                isExpanded ? 'rotate-45 bg-gray-700 text-blue-400' : ''
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Edit task"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            
            {/* Delete Button */}
            <button
              onClick={handleDeleteClick}
              disabled={isDeleting || isUpdating}
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete task"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Description */}
        {description && !isExpanded && (
          <p className="text-gray-300 dark:text-gray-300 text-sm mb-3 line-clamp-3">
            {description}
          </p>
        )}

        {/* Status and Deadline Row */}
        <div className="flex items-center justify-between mb-3">
          {/* Status Dropdown */}
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={isUpdating}
            className={`px-3 py-1 rounded-full text-xs font-medium border bg-transparent cursor-pointer transition-all duration-200 ${getStatusColor(status)} ${
              isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
            }`}
          >
            <option value="pending" className="text-gray-900">Pending</option>
            <option value="in-progress" className="text-gray-900">In Progress</option>
            <option value="completed" className="text-gray-900">Completed</option>
          </select>

          {/* Loading indicator for status update */}
          {isUpdating && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          )}
        </div>

        {/* Deadline Information */}
        {formattedDeadline && !isExpanded && (
          <div className="space-y-2">
            {/* Deadline Date & Time */}
            <div className="flex items-center text-sm">
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={`${formattedDeadline.isOverdue ? 'text-red-400' : 'text-gray-400 dark:text-gray-300'}`}>
                Due: {formattedDeadline.full}
              </span>
            </div>
            
            {/* Time Left / Overdue Status - Only show if not completed */}
            {status !== 'completed' && (
              <>
                {/* Time Left - Separate Line */}
                <div className="flex items-center text-sm">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className={`font-medium ${getTimeLeftColor(formattedDeadline.urgencyLevel)}`}>
                    {formattedDeadline.timeLeft}
                  </span>
                </div>

                {/* Responsive Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(formattedDeadline.urgencyLevel)}`}
                    style={{
                      width: `${formattedDeadline.progressPercentage}%`
                    }}
                  ></div>
                </div>

              </>
            )}

            {/* Completed Status Message */}
            {status === 'completed' && (
              <div className="flex items-center text-sm">
                <svg className="w-4 h-4 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-green-400">
                  Task Completed
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expandable Edit Section */}
      <div
        ref={expandedContentRef}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4 border-t border-gray-700">
          {isEditing && (
            <div className="pt-4 space-y-4 animate-fadeIn">
              {/* Edit Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  placeholder="Enter task title"
                  disabled={isUpdating}
                />
              </div>

              {/* Edit Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors duration-200"
                  placeholder="Enter task description (optional)"
                  disabled={isUpdating}
                />
              </div>

              {/* Edit Deadline */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Deadline
                </label>
                <input
                  type="datetime-local"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  disabled={isUpdating}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isUpdating || !editTitle.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isUpdating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>


  );
}
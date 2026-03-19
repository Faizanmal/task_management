'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useToast } from '../context/toast-context';
import {
  apiClient,
  CreateTaskInput,
  Task,
  TaskPriority,
  TaskStatus,
  UpdateTaskInput,
} from '@/lib/api';
import { useRouter } from 'next/navigation';
import styles from './tasks.module.css';
import TaskForm from '../components/task-form';
import TaskList from '../components/task-list';
import TaskFilter from '../components/task-filter';

interface PaginatedResponse {
  data: Task[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function TasksPage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');
  const [dueFrom, setDueFrom] = useState('');
  const [dueTo, setDueTo] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'dueDate' | 'priority'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const response: PaginatedResponse = await apiClient.getTasks({
        page,
        limit: pageSize,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        dueFrom: dueFrom ? new Date(dueFrom).toISOString() : undefined,
        dueTo: dueTo ? new Date(dueTo).toISOString() : undefined,
        sortBy,
        sortOrder,
      });

      setTasks(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      addToast(message || 'Failed to fetch tasks', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [
    page,
    pageSize,
    searchTerm,
    statusFilter,
    priorityFilter,
    dueFrom,
    dueTo,
    sortBy,
    sortOrder,
    addToast,
  ]);

  // Fetch tasks when filter or pagination changes
  useEffect(() => {
    if (user) {
      void fetchTasks();
    }
  }, [
    user,
    searchTerm,
    statusFilter,
    priorityFilter,
    dueFrom,
    dueTo,
    sortBy,
    sortOrder,
    page,
    fetchTasks,
  ]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const stream = apiClient.streamTasks(() => {
      void fetchTasks();
    });

    return () => {
      stream?.close();
    };
  }, [user, fetchTasks]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const checkReminders = async () => {
      try {
        const reminders = await apiClient.getUpcomingReminders();
        if (reminders.length > 0) {
          addToast(`You have ${reminders.length} upcoming reminder(s).`, 'success');
        }
      } catch {
        // Intentionally silent; reminders are optional enhancement.
      }
    };

    void checkReminders();
    const interval = setInterval(() => {
      void checkReminders();
    }, 60000);

    return () => clearInterval(interval);
  }, [user, addToast]);

  const handleCreateTask = async (payload: CreateTaskInput) => {
    try {
      await apiClient.createTask(payload);
      addToast('Task created successfully', 'success');
      setShowForm(false);
      setPage(1);
      await fetchTasks();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      addToast(message || 'Failed to create task', 'error');
    }
  };

  const handleUpdateTask = async (
    taskId: string,
    payload: UpdateTaskInput,
  ) => {
    try {
      await apiClient.updateTask(taskId, payload);
      addToast('Task updated successfully', 'success');
      setEditingTask(null);
      await fetchTasks();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      addToast(message || 'Failed to update task', 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await apiClient.deleteTask(taskId);
      addToast('Task deleted successfully', 'success');
      await fetchTasks();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      addToast(message || 'Failed to delete task', 'error');
    }
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      await apiClient.toggleTask(taskId);
      addToast('Task status updated', 'success');
      await fetchTasks();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      addToast(message || 'Failed to toggle task', 'error');
    }
  };

  const handleMoveTaskStatus = async (task: Task, status: TaskStatus) => {
    try {
      await apiClient.updateTask(task.id, { status });
      addToast(`Moved task to ${status}`, 'success');
      await fetchTasks();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      addToast(message || 'Failed to move task', 'error');
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (authLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.mainTitle}>Task Manager</h1>
          <div className={styles.userInfo}>
            <span>Welcome, {user.username}!</span>
            <button
              onClick={handleLogout}
              className={styles.logoutButton}
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.topBar}>
          <button
            className={styles.addButton}
            onClick={() => {
              setEditingTask(null);
              setShowForm(!showForm);
            }}
          >
            {showForm ? 'Cancel' : '+  Add Task'}
          </button>
        </div>

        {showForm && (
          <TaskForm
            onSubmit={
              editingTask
                ? (payload) =>
                    handleUpdateTask(editingTask.id, payload)
                : handleCreateTask
            }
            initialTask={editingTask || undefined}
          />
        )}

        <TaskFilter
          searchTerm={searchTerm}
          onSearchChange={(value) => {
            setPage(1);
            setSearchTerm(value);
          }}
          statusFilter={statusFilter}
          onStatusChange={(value) => {
            setPage(1);
            setStatusFilter(value);
          }}
          priorityFilter={priorityFilter}
          onPriorityChange={(value) => {
            setPage(1);
            setPriorityFilter(value);
          }}
          dueFrom={dueFrom}
          onDueFromChange={(value) => {
            setPage(1);
            setDueFrom(value);
          }}
          dueTo={dueTo}
          onDueToChange={(value) => {
            setPage(1);
            setDueTo(value);
          }}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
        />

        {isLoading && !showForm ? (
          <div className={styles.loading}>Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No tasks yet. Create one to get started!</p>
          </div>
        ) : (
          <>
            <TaskList
              tasks={tasks}
              onEdit={(task) => {
                setEditingTask(task);
                setShowForm(true);
              }}
              onDelete={handleDeleteTask}
              onToggle={handleToggleTask}
              onMoveStatus={handleMoveTaskStatus}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className={styles.paginationButton}
                >
                  Previous
                </button>
                <span className={styles.pageInfo}>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className={styles.paginationButton}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

import React from 'react';
import { Task, TaskStatus } from '@/lib/api';
import styles from './task-list.module.css';

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onMoveStatus: (task: Task, status: TaskStatus) => void;
}

export default function TaskList({
  tasks,
  onEdit,
  onDelete,
  onToggle,
  onMoveStatus,
}: TaskListProps) {
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'COMPLETED':
        return '#10b981';
      case 'PENDING':
        return '#f59e0b';
      case 'ARCHIVED':
        return '#6b7280';
      default:
        return '#3b82f6';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'URGENT':
        return '#ef4444';
      case 'HIGH':
        return '#f97316';
      case 'MEDIUM':
        return '#2563eb';
      default:
        return '#64748b';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const groupedTasks: Record<TaskStatus, Task[]> = {
    PENDING: tasks.filter((task) => task.status === 'PENDING'),
    COMPLETED: tasks.filter((task) => task.status === 'COMPLETED'),
    ARCHIVED: tasks.filter((task) => task.status === 'ARCHIVED'),
  };

  const statuses: Array<{ key: TaskStatus; label: string }> = [
    { key: 'PENDING', label: 'To Do' },
    { key: 'COMPLETED', label: 'Done' },
    { key: 'ARCHIVED', label: 'Archived' },
  ];

  return (
    <div className={styles.kanbanBoard}>
      {statuses.map((status) => (
        <div
          key={status.key}
          className={styles.kanbanColumn}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            const taskId = event.dataTransfer.getData('text/plain');
            const task = tasks.find((item) => item.id === taskId);
            if (task && task.status !== status.key) {
              onMoveStatus(task, status.key);
            }
          }}
        >
          <h3 className={styles.columnTitle}>{status.label}</h3>
          <div className={styles.taskList}>
            {groupedTasks[status.key].map((task) => (
              <div
                key={task.id}
                className={styles.taskCard}
                draggable
                onDragStart={(event) => event.dataTransfer.setData('text/plain', task.id)}
              >
                <div className={styles.taskHeader}>
                  <div className={styles.taskTitle}>
                    <h3>{task.title}</h3>
                    <span
                      className={styles.statusBadge}
                      style={{ backgroundColor: getStatusColor(task.status) }}
                    >
                      {task.status}
                    </span>
                  </div>
                  <div className={styles.taskDate}>{formatDate(task.createdAt)}</div>
                </div>

                <div className={styles.metaRow}>
                  <span
                    className={styles.priorityBadge}
                    style={{ borderColor: getPriorityColor(task.priority), color: getPriorityColor(task.priority) }}
                  >
                    {task.priority}
                  </span>
                  {task.dueDate && (
                    <span className={styles.metaText}>Due {formatDate(task.dueDate)}</span>
                  )}
                  {task.reminderAt && (
                    <span className={styles.metaText}>
                      Reminder {formatDate(task.reminderAt)}
                    </span>
                  )}
                </div>

                {task.description && (
                  <p className={styles.description}>{task.description}</p>
                )}

                <div className={styles.actions}>
                  <button
                    onClick={() => onToggle(task.id)}
                    className={`${styles.actionButton} ${styles.toggleButton}`}
                    title={
                      task.status === 'COMPLETED'
                        ? 'Mark as pending'
                        : 'Mark as completed'
                    }
                  >
                    {task.status === 'COMPLETED' ? 'Restore' : 'Complete'}
                  </button>
                  <button
                    onClick={() => onEdit(task)}
                    className={`${styles.actionButton} ${styles.editButton}`}
                    title="Edit task"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(task.id)}
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    title="Delete task"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {groupedTasks[status.key].length === 0 && (
              <div className={styles.emptyColumn}>Drop tasks here</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

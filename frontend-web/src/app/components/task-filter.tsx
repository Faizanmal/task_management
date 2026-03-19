import React from 'react';
import styles from './task-filter.module.css';
import { TaskPriority, TaskStatus } from '@/lib/api';

interface TaskFilterProps {
  searchTerm: string;
  onSearchChange: (search: string) => void;
  statusFilter: TaskStatus | '';
  onStatusChange: (status: TaskStatus | '') => void;
  priorityFilter: TaskPriority | '';
  onPriorityChange: (priority: TaskPriority | '') => void;
  dueFrom: string;
  onDueFromChange: (value: string) => void;
  dueTo: string;
  onDueToChange: (value: string) => void;
  sortBy: 'createdAt' | 'dueDate' | 'priority';
  onSortByChange: (value: 'createdAt' | 'dueDate' | 'priority') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (value: 'asc' | 'desc') => void;
}

export default function TaskFilter({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  dueFrom,
  onDueFromChange,
  dueTo,
  onDueToChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}: TaskFilterProps) {
  return (
    <div className={styles.filterContainer}>
      <div className={styles.filterGroup}>
        <input
          type="text"
          placeholder="Search tasks by title..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.filterGroup}>
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as TaskStatus | '')}
          className={styles.statusSelect}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <div className={styles.filterGroup}>
        <select
          value={priorityFilter}
          onChange={(e) => onPriorityChange(e.target.value as TaskPriority | '')}
          className={styles.statusSelect}
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>

      <div className={styles.filterGroup}>
        <input
          type="date"
          value={dueFrom}
          onChange={(e) => onDueFromChange(e.target.value)}
          className={styles.searchInput}
          title="Due from"
        />
      </div>

      <div className={styles.filterGroup}>
        <input
          type="date"
          value={dueTo}
          onChange={(e) => onDueToChange(e.target.value)}
          className={styles.searchInput}
          title="Due to"
        />
      </div>

      <div className={styles.filterGroup}>
        <select
          value={sortBy}
          onChange={(e) =>
            onSortByChange(e.target.value as 'createdAt' | 'dueDate' | 'priority')
          }
          className={styles.statusSelect}
        >
          <option value="createdAt">Sort: Created Date</option>
          <option value="dueDate">Sort: Due Date</option>
          <option value="priority">Sort: Priority</option>
        </select>
      </div>

      <div className={styles.filterGroup}>
        <select
          value={sortOrder}
          onChange={(e) => onSortOrderChange(e.target.value as 'asc' | 'desc')}
          className={styles.statusSelect}
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>
    </div>
  );
}

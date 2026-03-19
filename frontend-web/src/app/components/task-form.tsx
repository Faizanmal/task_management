import React, { useState } from 'react';
import { CreateTaskInput, RecurrencePattern, TaskPriority } from '@/lib/api';
import styles from './task-form.module.css';

interface TaskFormProps {
  onSubmit: (data: CreateTaskInput) => Promise<void> | void;
  initialTask?: {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: TaskPriority;
    dueDate?: string | null;
    reminderAt?: string | null;
    recurrence: RecurrencePattern;
    recurrenceInterval?: number | null;
  };
  isLoading?: boolean;
}

export default function TaskForm({
  onSubmit,
  initialTask,
}: TaskFormProps) {
  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(
    initialTask?.description || '',
  );
  const [priority, setPriority] = useState<TaskPriority>(
    initialTask?.priority || 'MEDIUM',
  );
  const [dueDate, setDueDate] = useState(
    initialTask?.dueDate ? initialTask.dueDate.slice(0, 16) : '',
  );
  const [reminderAt, setReminderAt] = useState(
    initialTask?.reminderAt ? initialTask.reminderAt.slice(0, 16) : '',
  );
  const [recurrence, setRecurrence] = useState<RecurrencePattern>(
    initialTask?.recurrence || 'NONE',
  );
  const [recurrenceInterval, setRecurrenceInterval] = useState(
    initialTask?.recurrenceInterval || 1,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        description: description || undefined,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        reminderAt: reminderAt ? new Date(reminderAt).toISOString() : undefined,
        recurrence,
        recurrenceInterval: recurrence === 'NONE' ? undefined : recurrenceInterval,
      });
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setDueDate('');
      setReminderAt('');
      setRecurrence('NONE');
      setRecurrenceInterval(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="title">Task Title</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter task title..."
          required
          disabled={isSubmitting}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="description">Description (optional)</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter task description..."
          disabled={isSubmitting}
          rows={3}
        />
      </div>

      <div className={styles.gridRow}>
        <div className={styles.formGroup}>
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            disabled={isSubmitting}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="dueDate">Due Date (optional)</label>
          <input
            id="dueDate"
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className={styles.gridRow}>
        <div className={styles.formGroup}>
          <label htmlFor="reminderAt">Reminder (optional)</label>
          <input
            id="reminderAt"
            type="datetime-local"
            value={reminderAt}
            onChange={(e) => setReminderAt(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="recurrence">Recurrence</label>
          <select
            id="recurrence"
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as RecurrencePattern)}
            disabled={isSubmitting}
          >
            <option value="NONE">None</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </div>
      </div>

      {recurrence !== 'NONE' && (
        <div className={styles.formGroup}>
          <label htmlFor="recurrenceInterval">Recurrence Interval</label>
          <input
            id="recurrenceInterval"
            type="number"
            min={1}
            value={recurrenceInterval}
            onChange={(e) => setRecurrenceInterval(Number(e.target.value) || 1)}
            disabled={isSubmitting}
          />
        </div>
      )}

      <button
        type="submit"
        className={styles.submitButton}
        disabled={isSubmitting || !title.trim()}
      >
        {isSubmitting
          ? 'Saving...'
          : initialTask
            ? 'Update Task'
            : 'Create Task'}
      </button>
    </form>
  );
}

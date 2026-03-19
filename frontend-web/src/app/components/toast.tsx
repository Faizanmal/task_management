/**
 * Toast Notification Display Component
 */

'use client';

import React from 'react';
import { useToast, Toast } from '../context/toast-context';
import styles from './toast.module.css';

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const getBackgroundColor = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'info':
      default:
        return '#3b82f6';
    }
  };

  return (
    <div
      className={styles.toastItem}
      style={{ backgroundColor: getBackgroundColor(toast.type) }}
    >
      <div className={styles.toastContent}>
        <span>{toast.message}</span>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className={styles.toastContainer}>
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

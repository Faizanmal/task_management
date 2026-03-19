/**
 * API client for making requests to the backend
 */

import { authStorage } from '@/lib/auth-storage';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || 'http://localhost:3001';

export type TaskStatus = 'PENDING' | 'COMPLETED' | 'ARCHIVED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type RecurrencePattern = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  reminderAt?: string | null;
  recurrence: RecurrencePattern;
  recurrenceInterval?: number | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskStreamEvent {
  type: 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_DELETED' | 'TASK_TOGGLED' | 'TASK_RECURRED';
  task: Task;
}

export interface PaginatedResponse {
  data: Task[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface User {
  id: string;
  email: string;
  username: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface TaskFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: TaskStatus | '';
  priority?: TaskPriority | '';
  dueFrom?: string;
  dueTo?: string;
  sortBy?: 'createdAt' | 'dueDate' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  reminderAt?: string;
  recurrence?: RecurrencePattern;
  recurrenceInterval?: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  reminderAt?: string;
  recurrence?: RecurrencePattern;
  recurrenceInterval?: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async tryRefreshToken(): Promise<boolean> {
    const refreshToken = authStorage.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const data = (await response.json()) as {
        accessToken: string;
        refreshToken: string;
      };

      const currentUser = authStorage.getUser();
      if (!currentUser) {
        return false;
      }

      authStorage.setAuth(
        {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        },
        currentUser,
      );

      return true;
    } catch {
      return false;
    }
  }

  async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    data?: unknown,
    retryOnUnauthorized = true,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        // Auto-refresh and retry once on 401 (Unauthorized)
        if (response.status === 401 && retryOnUnauthorized) {
          const refreshed = await this.tryRefreshToken();
          if (refreshed) {
            return this.request<T>(endpoint, method, data, false);
          }
        }

        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `API error: ${response.status}`);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${error}`);
      throw error;
    }
  }

  // Auth endpoints
  register(email: string, username: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', 'POST', {
      email,
      username,
      password,
    });
  }

  login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', 'POST', { email, password });
  }

  refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    return this.request<{ accessToken: string; refreshToken: string }>('/auth/refresh', 'POST', {
      refreshToken,
    });
  }

  logout(refreshToken: string): Promise<void> {
    return this.request<void>('/auth/logout', 'POST', { refreshToken });
  }

  // Task endpoints
  getTasks(filters: TaskFilters = {}): Promise<PaginatedResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      priority,
      dueFrom,
      dueTo,
      sortBy,
      sortOrder,
    } = filters;
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (priority) params.append('priority', priority);
    if (dueFrom) params.append('dueFrom', dueFrom);
    if (dueTo) params.append('dueTo', dueTo);
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);

    return this.request<PaginatedResponse>(`/tasks?${params.toString()}`, 'GET');
  }

  getTask(id: string): Promise<Task> {
    return this.request<Task>(`/tasks/${id}`, 'GET');
  }

  createTask(data: CreateTaskInput): Promise<Task> {
    return this.request<Task>('/tasks', 'POST', data);
  }

  updateTask(id: string, data: UpdateTaskInput) {
    return this.request<Task>(`/tasks/${id}`, 'PATCH', data);
  }

  deleteTask(id: string): Promise<void> {
    return this.request<void>(`/tasks/${id}`, 'DELETE');
  }

  toggleTask(id: string): Promise<Task> {
    return this.request<Task>(`/tasks/${id}/toggle`, 'PATCH');
  }

  getUpcomingReminders(): Promise<Task[]> {
    return this.request<Task[]>('/tasks/reminders/upcoming', 'GET');
  }

  streamTasks(onEvent: (event: TaskStreamEvent) => void): EventSource | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const token = this.getToken();
    if (!token) {
      return null;
    }

    const streamUrl = `${this.baseUrl}/tasks/stream?accessToken=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(streamUrl);
    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as TaskStreamEvent;
        onEvent(parsed);
      } catch (error) {
        console.error('Failed to parse task stream event', error);
      }
    };

    return eventSource;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

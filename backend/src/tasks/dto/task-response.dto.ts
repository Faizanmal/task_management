export class TaskResponseDto {
  id: string;
  title: string;
  description?: string | null;
  status: 'PENDING' | 'COMPLETED' | 'ARCHIVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: Date | null;
  reminderAt?: Date | null;
  recurrence: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  recurrenceInterval?: number | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

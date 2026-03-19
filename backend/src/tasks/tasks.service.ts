import {
  BadRequestException,
  Injectable,
  MessageEvent,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Task } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskFilterDto } from './dto/task-filter.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { PaginatedResponseDto } from './dto/paginated-response.dto';
import { Observable, Subject, filter, map } from 'rxjs';

type TaskEventType =
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_DELETED'
  | 'TASK_TOGGLED'
  | 'TASK_RECURRED';

interface TaskEvent {
  userId: string;
  type: TaskEventType;
  task: TaskResponseDto;
}

@Injectable()
export class TasksService {
  private readonly taskEvents$ = new Subject<TaskEvent>();

  constructor(private prisma: PrismaService) {}

  async getTasks(
    userId: string,
    filterDto: TaskFilterDto,
  ): Promise<PaginatedResponseDto<TaskResponseDto>> {
    const {
      search,
      status,
      priority,
      dueFrom,
      dueTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = filterDto;
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = { userId };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (dueFrom || dueTo) {
      where.dueDate = {
        ...(dueFrom ? { gte: new Date(dueFrom) } : {}),
        ...(dueTo ? { lte: new Date(dueTo) } : {}),
      };
    }

    const total = await this.prisma.task.count({ where });
    const tasks = await this.prisma.task.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    return {
      data: tasks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
  async getTaskById(userId: string, taskId: string): Promise<TaskResponseDto> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId },
    });

    if (!task) throw new NotFoundException(`Task with ID ${taskId} not found`);
    return task;
  }

  async createTask(
    userId: string,
    createTaskDto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    this.validateReminderDates(createTaskDto.dueDate, createTaskDto.reminderAt);

    const task = await this.prisma.task.create({
      data: {
        title: createTaskDto.title,
        description: createTaskDto.description,
        userId,
        status: 'PENDING',
        priority: createTaskDto.priority ?? 'MEDIUM',
        dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null,
        reminderAt: createTaskDto.reminderAt
          ? new Date(createTaskDto.reminderAt)
          : null,
        recurrence: createTaskDto.recurrence ?? 'NONE',
        recurrenceInterval: createTaskDto.recurrenceInterval ?? 1,
      },
    });

    await this.recordTaskActivity(task.id, userId, 'TASK_CREATED', {
      title: task.title,
      priority: task.priority,
      dueDate: task.dueDate,
    });
    this.emitTaskEvent(userId, 'TASK_CREATED', task);
    return task;
  }

  async updateTask(
    userId: string,
    taskId: string,
    updateTaskDto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId },
    });
    if (!task) throw new NotFoundException(`Task with ID ${taskId} not found`);

    this.validateReminderDates(updateTaskDto.dueDate, updateTaskDto.reminderAt);

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...updateTaskDto,
        dueDate: updateTaskDto.dueDate
          ? new Date(updateTaskDto.dueDate)
          : updateTaskDto.dueDate === undefined
            ? undefined
            : null,
        reminderAt: updateTaskDto.reminderAt
          ? new Date(updateTaskDto.reminderAt)
          : updateTaskDto.reminderAt === undefined
            ? undefined
            : null,
        completedAt:
          updateTaskDto.status === 'COMPLETED'
            ? new Date()
            : updateTaskDto.status
              ? null
              : undefined,
      },
    });

    await this.recordTaskActivity(task.id, userId, 'TASK_UPDATED', {
      changes: updateTaskDto as Prisma.InputJsonValue,
    });
    this.emitTaskEvent(userId, 'TASK_UPDATED', updatedTask);

    if (task.status !== 'COMPLETED' && updatedTask.status === 'COMPLETED') {
      await this.createRecurringTaskIfNeeded(updatedTask, userId);
    }

    return updatedTask;
  }

  async deleteTask(
    userId: string,
    taskId: string,
  ): Promise<{ message: string }> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId },
    });
    if (!task) throw new NotFoundException(`Task with ID ${taskId} not found`);

    await this.recordTaskActivity(task.id, userId, 'TASK_DELETED', {
      title: task.title,
    });
    await this.prisma.task.delete({ where: { id: taskId } });
    this.emitTaskEvent(userId, 'TASK_DELETED', task);
    return { message: 'Task deleted successfully' };
  }

  async toggleTask(userId: string, taskId: string): Promise<TaskResponseDto> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId },
    });
    if (!task) throw new NotFoundException(`Task with ID ${taskId} not found`);

    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';

    const toggledTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        completedAt: newStatus === 'COMPLETED' ? new Date() : null,
      },
    });

    await this.recordTaskActivity(task.id, userId, 'TASK_TOGGLED', {
      status: newStatus,
    });
    this.emitTaskEvent(userId, 'TASK_TOGGLED', toggledTask);

    if (newStatus === 'COMPLETED') {
      await this.createRecurringTaskIfNeeded(toggledTask, userId);
    }

    return toggledTask;
  }

  async getUpcomingReminders(
    userId: string,
    hoursAhead = 24,
  ): Promise<TaskResponseDto[]> {
    const now = new Date();
    const until = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
    return this.prisma.task.findMany({
      where: {
        userId,
        status: 'PENDING',
        reminderAt: {
          gte: now,
          lte: until,
        },
      },
      orderBy: {
        reminderAt: 'asc',
      },
    });
  }

  streamTasks(userId: string): Observable<MessageEvent> {
    return this.taskEvents$.pipe(
      filter((event) => event.userId === userId),
      map((event) => ({
        data: event,
      })),
    );
  }

  private emitTaskEvent(
    userId: string,
    type: TaskEventType,
    task: TaskResponseDto,
  ) {
    this.taskEvents$.next({ userId, type, task });
  }

  private async recordTaskActivity(
    taskId: string,
    userId: string,
    action: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    await this.prisma.taskActivity.create({
      data: {
        taskId,
        userId,
        action,
        metadata,
      },
    });
  }

  private validateReminderDates(dueDate?: string, reminderAt?: string) {
    if (!reminderAt || !dueDate) return;

    if (new Date(reminderAt).getTime() > new Date(dueDate).getTime()) {
      throw new BadRequestException('Reminder time must be before due date');
    }
  }

  private async createRecurringTaskIfNeeded(task: Task, userId: string) {
    if (task.recurrence === 'NONE') {
      return;
    }

    const baseDate = task.dueDate ?? task.updatedAt;
    const interval = task.recurrenceInterval ?? 1;
    const nextDueDate = this.calculateNextDueDate(
      baseDate,
      task.recurrence,
      interval,
    );
    const reminderOffset =
      task.dueDate && task.reminderAt
        ? task.dueDate.getTime() - task.reminderAt.getTime()
        : undefined;

    const nextTask = await this.prisma.task.create({
      data: {
        title: task.title,
        description: task.description,
        userId,
        status: 'PENDING',
        priority: task.priority,
        dueDate: nextDueDate,
        reminderAt:
          reminderOffset !== undefined
            ? new Date(nextDueDate.getTime() - reminderOffset)
            : null,
        recurrence: task.recurrence,
        recurrenceInterval: task.recurrenceInterval,
      },
    });

    await this.recordTaskActivity(task.id, userId, 'TASK_RECURRED', {
      nextTaskId: nextTask.id,
      recurrence: task.recurrence,
    });
    this.emitTaskEvent(userId, 'TASK_RECURRED', nextTask);
  }

  private calculateNextDueDate(
    currentDueDate: Date,
    recurrence: 'DAILY' | 'WEEKLY' | 'MONTHLY',
    interval: number,
  ): Date {
    const nextDate = new Date(currentDueDate);

    if (recurrence === 'DAILY') {
      nextDate.setDate(nextDate.getDate() + interval);
    } else if (recurrence === 'WEEKLY') {
      nextDate.setDate(nextDate.getDate() + interval * 7);
    } else {
      nextDate.setMonth(nextDate.getMonth() + interval);
    }

    return nextDate;
  }
}

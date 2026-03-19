import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ValidationPipe,
  HttpCode,
  MessageEvent,
  Sse,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import type { Request as ExpressRequest } from 'express';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: string;
  };
}

import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskFilterDto } from './dto/task-filter.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { PaginatedResponseDto } from './dto/paginated-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Sse('stream')
  streamTasks(@Request() req: AuthenticatedRequest): Observable<MessageEvent> {
    return this.tasksService.streamTasks(req.user.id);
  }

  @Get('reminders/upcoming')
  async getUpcomingReminders(
    @Request() req: AuthenticatedRequest,
  ): Promise<TaskResponseDto[]> {
    return this.tasksService.getUpcomingReminders(req.user.id);
  }

  /**
   * GET /tasks - Get all tasks with pagination and filtering
   */
  @Get()
  async getTasks(
    @Query(ValidationPipe) filterDto: TaskFilterDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<PaginatedResponseDto<TaskResponseDto>> {
    return this.tasksService.getTasks(req.user.id, filterDto);
  }
  /**
   * POST /tasks - Create a new task
   */
  @Post()
  async createTask(
    @Body(ValidationPipe) createTaskDto: CreateTaskDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<TaskResponseDto> {
    return this.tasksService.createTask(req.user.id, createTaskDto);
  }
  /**
   * GET /tasks/:id - Get a single task
   */
  @Get(':id')
  async getTaskById(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<TaskResponseDto> {
    return this.tasksService.getTaskById(req.user.id, id);
  }
  /**
   * PATCH /tasks/:id - Update a task
   */
  @Patch(':id')
  async updateTask(
    @Param('id') id: string,
    @Body(ValidationPipe) updateTaskDto: UpdateTaskDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<TaskResponseDto> {
    return this.tasksService.updateTask(req.user.id, id, updateTaskDto);
  }
  /**
   * DELETE /tasks/:id - Delete a task
   */
  @Delete(':id')
  @HttpCode(200)
  async deleteTask(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    return this.tasksService.deleteTask(req.user.id, id);
  }
  /**
   * PATCH /tasks/:id/toggle - Toggle task status (PENDING <-> COMPLETED)
   */
  @Patch(':id/toggle')
  async toggleTask(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<TaskResponseDto> {
    return this.tasksService.toggleTask(req.user.id, id);
  }
}

import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  @IsOptional()
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsDateString()
  @IsOptional()
  reminderAt?: string;

  @IsIn(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'])
  @IsOptional()
  recurrence?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

  @IsInt()
  @Min(1)
  @IsOptional()
  recurrenceInterval?: number;
}

enum TaskStatus { pending, completed, archived }

enum TaskPriority { low, medium, high, urgent }

enum RecurrencePattern { none, daily, weekly, monthly }

enum TaskSortBy { createdAt, dueDate, priority }

enum TaskSortOrder { asc, desc }

TaskStatus taskStatusFromApi(String value) {
  switch (value) {
    case 'COMPLETED':
      return TaskStatus.completed;
    case 'ARCHIVED':
      return TaskStatus.archived;
    case 'PENDING':
    default:
      return TaskStatus.pending;
  }
}

TaskPriority taskPriorityFromApi(String value) {
  switch (value) {
    case 'LOW':
      return TaskPriority.low;
    case 'HIGH':
      return TaskPriority.high;
    case 'URGENT':
      return TaskPriority.urgent;
    case 'MEDIUM':
    default:
      return TaskPriority.medium;
  }
}

RecurrencePattern recurrenceFromApi(String value) {
  switch (value) {
    case 'DAILY':
      return RecurrencePattern.daily;
    case 'WEEKLY':
      return RecurrencePattern.weekly;
    case 'MONTHLY':
      return RecurrencePattern.monthly;
    case 'NONE':
    default:
      return RecurrencePattern.none;
  }
}

String taskStatusToApi(TaskStatus value) {
  switch (value) {
    case TaskStatus.pending:
      return 'PENDING';
    case TaskStatus.completed:
      return 'COMPLETED';
    case TaskStatus.archived:
      return 'ARCHIVED';
  }
}

String taskPriorityToApi(TaskPriority value) {
  switch (value) {
    case TaskPriority.low:
      return 'LOW';
    case TaskPriority.medium:
      return 'MEDIUM';
    case TaskPriority.high:
      return 'HIGH';
    case TaskPriority.urgent:
      return 'URGENT';
  }
}

String recurrenceToApi(RecurrencePattern value) {
  switch (value) {
    case RecurrencePattern.none:
      return 'NONE';
    case RecurrencePattern.daily:
      return 'DAILY';
    case RecurrencePattern.weekly:
      return 'WEEKLY';
    case RecurrencePattern.monthly:
      return 'MONTHLY';
  }
}

String sortByToApi(TaskSortBy value) {
  switch (value) {
    case TaskSortBy.createdAt:
      return 'createdAt';
    case TaskSortBy.dueDate:
      return 'dueDate';
    case TaskSortBy.priority:
      return 'priority';
  }
}

String sortOrderToApi(TaskSortOrder value) {
  switch (value) {
    case TaskSortOrder.asc:
      return 'asc';
    case TaskSortOrder.desc:
      return 'desc';
  }
}

class Task {
  const Task({
    required this.id,
    required this.title,
    required this.status,
    required this.priority,
    required this.recurrence,
    required this.createdAt,
    required this.updatedAt,
    this.description,
    this.dueDate,
    this.reminderAt,
    this.recurrenceInterval,
    this.completedAt,
  });

  final String id;
  final String title;
  final String? description;
  final TaskStatus status;
  final TaskPriority priority;
  final DateTime? dueDate;
  final DateTime? reminderAt;
  final RecurrencePattern recurrence;
  final int? recurrenceInterval;
  final DateTime? completedAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  factory Task.fromJson(Map<String, dynamic> json) {
    return Task(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      status: taskStatusFromApi(json['status'] as String),
      priority: taskPriorityFromApi(json['priority'] as String),
      dueDate: _parseDateTime(json['dueDate']),
      reminderAt: _parseDateTime(json['reminderAt']),
      recurrence: recurrenceFromApi(json['recurrence'] as String),
      recurrenceInterval: json['recurrenceInterval'] as int?,
      completedAt: _parseDateTime(json['completedAt']),
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  static DateTime? _parseDateTime(dynamic value) {
    if (value == null) {
      return null;
    }
    return DateTime.parse(value as String);
  }
}

class PaginatedTasks {
  const PaginatedTasks({
    required this.data,
    required this.total,
    required this.page,
    required this.limit,
    required this.totalPages,
  });

  final List<Task> data;
  final int total;
  final int page;
  final int limit;
  final int totalPages;

  factory PaginatedTasks.fromJson(Map<String, dynamic> json) {
    final list = (json['data'] as List<dynamic>)
        .map((item) => Task.fromJson(item as Map<String, dynamic>))
        .toList();

    return PaginatedTasks(
      data: list,
      total: json['total'] as int,
      page: json['page'] as int,
      limit: json['limit'] as int,
      totalPages: json['totalPages'] as int,
    );
  }
}

class CreateTaskInput {
  CreateTaskInput({
    required this.title,
    this.description,
    this.priority,
    this.dueDate,
    this.reminderAt,
    this.recurrence,
    this.recurrenceInterval,
  });

  final String title;
  final String? description;
  final TaskPriority? priority;
  final DateTime? dueDate;
  final DateTime? reminderAt;
  final RecurrencePattern? recurrence;
  final int? recurrenceInterval;

  Map<String, dynamic> toApiJson() {
    return {
      'title': title,
      if (description != null && description!.trim().isNotEmpty)
        'description': description,
      if (priority != null) 'priority': taskPriorityToApi(priority!),
      if (dueDate != null) 'dueDate': dueDate!.toIso8601String(),
      if (reminderAt != null) 'reminderAt': reminderAt!.toIso8601String(),
      if (recurrence != null) 'recurrence': recurrenceToApi(recurrence!),
      if (recurrenceInterval != null) 'recurrenceInterval': recurrenceInterval,
    };
  }
}

class UpdateTaskInput {
  UpdateTaskInput({
    this.title,
    this.description,
    this.status,
    this.priority,
    this.dueDate,
    this.reminderAt,
    this.recurrence,
    this.recurrenceInterval,
    this.includeDescription = false,
    this.includeDueDate = false,
    this.includeReminderAt = false,
    this.includeRecurrenceInterval = false,
  });

  final String? title;
  final String? description;
  final TaskStatus? status;
  final TaskPriority? priority;
  final DateTime? dueDate;
  final DateTime? reminderAt;
  final RecurrencePattern? recurrence;
  final int? recurrenceInterval;
  final bool includeDescription;
  final bool includeDueDate;
  final bool includeReminderAt;
  final bool includeRecurrenceInterval;

  Map<String, dynamic> toApiJson() {
    return {
      if (title != null && title!.trim().isNotEmpty) 'title': title,
      if (includeDescription || description != null) 'description': description,
      if (status != null) 'status': taskStatusToApi(status!),
      if (priority != null) 'priority': taskPriorityToApi(priority!),
      if (includeDueDate || dueDate != null)
        'dueDate': dueDate?.toIso8601String(),
      if (includeReminderAt || reminderAt != null)
        'reminderAt': reminderAt?.toIso8601String(),
      if (recurrence != null) 'recurrence': recurrenceToApi(recurrence!),
      if (includeRecurrenceInterval || recurrenceInterval != null)
        'recurrenceInterval': recurrenceInterval,
    };
  }
}

class TaskFilters {
  TaskFilters({
    this.page = 1,
    this.limit = 10,
    this.search,
    this.status,
    this.priority,
    this.sortBy = TaskSortBy.createdAt,
    this.sortOrder = TaskSortOrder.desc,
  });

  final int page;
  final int limit;
  final String? search;
  final TaskStatus? status;
  final TaskPriority? priority;
  final TaskSortBy sortBy;
  final TaskSortOrder sortOrder;

  Map<String, String> toQueryParameters() {
    return {
      'page': page.toString(),
      'limit': limit.toString(),
      if (search != null && search!.trim().isNotEmpty) 'search': search!,
      if (status != null) 'status': taskStatusToApi(status!),
      if (priority != null) 'priority': taskPriorityToApi(priority!),
      'sortBy': sortByToApi(sortBy),
      'sortOrder': sortOrderToApi(sortOrder),
    };
  }
}

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/task_models.dart';

class TaskFormResult {
  TaskFormResult({
    required this.title,
    this.description,
    this.status,
    this.priority,
    this.dueDate,
    this.reminderAt,
    this.recurrence,
    this.recurrenceInterval,
  });

  final String title;
  final String? description;
  final TaskStatus? status;
  final TaskPriority? priority;
  final DateTime? dueDate;
  final DateTime? reminderAt;
  final RecurrencePattern? recurrence;
  final int? recurrenceInterval;

  CreateTaskInput toCreateInput() {
    return CreateTaskInput(
      title: title,
      description: description,
      priority: priority,
      dueDate: dueDate,
      reminderAt: reminderAt,
      recurrence: recurrence,
      recurrenceInterval: recurrenceInterval,
    );
  }

  UpdateTaskInput toUpdateInput() {
    return UpdateTaskInput(
      title: title,
      description: description,
      status: status,
      priority: priority,
      dueDate: dueDate,
      reminderAt: reminderAt,
      recurrence: recurrence,
      recurrenceInterval: recurrenceInterval,
      includeDescription: true,
      includeDueDate: true,
      includeReminderAt: true,
      includeRecurrenceInterval: true,
    );
  }
}

class TaskFormSheet extends StatefulWidget {
  const TaskFormSheet({super.key, this.task, this.initialStatus});

  final Task? task;
  final TaskStatus? initialStatus;

  @override
  State<TaskFormSheet> createState() => _TaskFormSheetState();
}

class _TaskFormSheetState extends State<TaskFormSheet> {
  late final TextEditingController _titleController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _recurrenceIntervalController;

  late TaskPriority _priority;
  late TaskStatus _status;
  late RecurrencePattern _recurrence;
  late int _recurrenceInterval;

  DateTime? _dueDate;
  DateTime? _reminderAt;

  bool get _isEditing => widget.task != null;

  @override
  void initState() {
    super.initState();

    final task = widget.task;

    _titleController = TextEditingController(text: task?.title ?? '');
    _descriptionController = TextEditingController(
      text: task?.description ?? '',
    );

    _priority = task?.priority ?? TaskPriority.medium;
    _status = task?.status ?? widget.initialStatus ?? TaskStatus.pending;
    _recurrence = task?.recurrence ?? RecurrencePattern.none;
    _recurrenceInterval = task?.recurrenceInterval ?? 1;
    _recurrenceIntervalController = TextEditingController(
      text: _recurrenceInterval.toString(),
    );

    _dueDate = task?.dueDate;
    _reminderAt = task?.reminderAt;
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _recurrenceIntervalController.dispose();
    super.dispose();
  }

  Future<void> _pickDateTime({required bool forReminder}) async {
    final base = forReminder ? _reminderAt : _dueDate;
    final now = DateTime.now();

    final selectedDate = await showDatePicker(
      context: context,
      initialDate: base ?? now,
      firstDate: DateTime(now.year - 5),
      lastDate: DateTime(now.year + 20),
    );

    if (selectedDate == null || !mounted) {
      return;
    }

    final selectedTime = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(base ?? now),
    );

    if (selectedTime == null) {
      return;
    }

    final dateTime = DateTime(
      selectedDate.year,
      selectedDate.month,
      selectedDate.day,
      selectedTime.hour,
      selectedTime.minute,
    );

    setState(() {
      if (forReminder) {
        _reminderAt = dateTime;
      } else {
        _dueDate = dateTime;
      }
    });
  }

  void _submit() {
    final title = _titleController.text.trim();
    if (title.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Task title is required.')));
      return;
    }

    if (_reminderAt != null &&
        _dueDate != null &&
        _reminderAt!.isAfter(_dueDate!)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Reminder must be before due date.')),
      );
      return;
    }

    final result = TaskFormResult(
      title: title,
      description: _descriptionController.text.trim().isEmpty
          ? null
          : _descriptionController.text.trim(),
      status: _isEditing ? _status : null,
      priority: _priority,
      dueDate: _dueDate,
      reminderAt: _reminderAt,
      recurrence: _recurrence,
      recurrenceInterval: _recurrence == RecurrencePattern.none
          ? null
          : _recurrenceInterval,
    );

    Navigator.of(context).pop(result);
  }

  @override
  Widget build(BuildContext context) {
    final formatter = DateFormat('MMM d, y h:mm a');

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 16,
          bottom: 16 + MediaQuery.of(context).viewInsets.bottom,
        ),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                _isEditing ? 'Edit Task' : 'Create Task',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Title',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _descriptionController,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Description (optional)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<TaskPriority>(
                key: ValueKey<String>('priority-${_priority.name}'),
                initialValue: _priority,
                decoration: const InputDecoration(
                  labelText: 'Priority',
                  border: OutlineInputBorder(),
                ),
                items: TaskPriority.values
                    .map(
                      (value) => DropdownMenuItem(
                        value: value,
                        child: Text(value.name.toUpperCase()),
                      ),
                    )
                    .toList(),
                onChanged: (value) {
                  if (value == null) {
                    return;
                  }
                  setState(() {
                    _priority = value;
                  });
                },
              ),
              if (_isEditing) ...[
                const SizedBox(height: 12),
                DropdownButtonFormField<TaskStatus>(
                  key: ValueKey<String>('status-${_status.name}'),
                  initialValue: _status,
                  decoration: const InputDecoration(
                    labelText: 'Status',
                    border: OutlineInputBorder(),
                  ),
                  items: TaskStatus.values
                      .map(
                        (value) => DropdownMenuItem(
                          value: value,
                          child: Text(value.name.toUpperCase()),
                        ),
                      )
                      .toList(),
                  onChanged: (value) {
                    if (value == null) {
                      return;
                    }
                    setState(() {
                      _status = value;
                    });
                  },
                ),
              ],
              const SizedBox(height: 12),
              DropdownButtonFormField<RecurrencePattern>(
                key: ValueKey<String>('recurrence-${_recurrence.name}'),
                initialValue: _recurrence,
                decoration: const InputDecoration(
                  labelText: 'Recurrence',
                  border: OutlineInputBorder(),
                ),
                items: RecurrencePattern.values
                    .map(
                      (value) => DropdownMenuItem(
                        value: value,
                        child: Text(value.name.toUpperCase()),
                      ),
                    )
                    .toList(),
                onChanged: (value) {
                  if (value == null) {
                    return;
                  }
                  setState(() {
                    _recurrence = value;
                  });
                },
              ),
              if (_recurrence != RecurrencePattern.none) ...[
                const SizedBox(height: 12),
                TextField(
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Recurrence interval',
                    border: OutlineInputBorder(),
                  ),
                  controller: _recurrenceIntervalController,
                  onChanged: (value) {
                    final parsed = int.tryParse(value);
                    if (parsed != null && parsed > 0) {
                      _recurrenceInterval = parsed;
                    }
                  },
                ),
              ],
              const SizedBox(height: 12),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Due date'),
                subtitle: Text(
                  _dueDate == null ? 'Not set' : formatter.format(_dueDate!),
                ),
                trailing: Wrap(
                  spacing: 8,
                  children: [
                    IconButton(
                      onPressed: () => _pickDateTime(forReminder: false),
                      icon: const Icon(Icons.event),
                    ),
                    if (_dueDate != null)
                      IconButton(
                        onPressed: () => setState(() => _dueDate = null),
                        icon: const Icon(Icons.clear),
                      ),
                  ],
                ),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Reminder'),
                subtitle: Text(
                  _reminderAt == null
                      ? 'Not set'
                      : formatter.format(_reminderAt!),
                ),
                trailing: Wrap(
                  spacing: 8,
                  children: [
                    IconButton(
                      onPressed: () => _pickDateTime(forReminder: true),
                      icon: const Icon(Icons.alarm),
                    ),
                    if (_reminderAt != null)
                      IconButton(
                        onPressed: () => setState(() => _reminderAt = null),
                        icon: const Icon(Icons.clear),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _submit,
                  child: Text(_isEditing ? 'Update Task' : 'Create Task'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

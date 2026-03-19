import 'dart:async';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/task_models.dart';
import '../state/app_controller.dart';
import '../widgets/task_form_sheet.dart';

class TasksScreen extends StatefulWidget {
  const TasksScreen({super.key, required this.controller});

  final AppController controller;

  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  late final TextEditingController _searchController;
  Timer? _reminderTimer;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController(text: widget.controller.search);
    _scheduleReminderChecks();
  }

  @override
  void dispose() {
    _reminderTimer?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _scheduleReminderChecks() {
    _checkUpcomingReminders();

    _reminderTimer = Timer.periodic(const Duration(minutes: 1), (_) {
      _checkUpcomingReminders();
    });
  }

  Future<void> _checkUpcomingReminders() async {
    try {
      final count = await widget.controller.getUpcomingReminderCount();

      if (!mounted || count <= 0) {
        return;
      }

      _showMessage('You have $count upcoming reminder(s).');
    } catch (_) {
      // Keep reminders as best-effort and avoid interrupting core task flow.
    }
  }

  Future<void> _openTaskForm({Task? task}) async {
    final result = await showModalBottomSheet<TaskFormResult>(
      context: context,
      isScrollControlled: true,
      builder: (context) => TaskFormSheet(task: task),
    );

    if (result == null) {
      return;
    }

    try {
      if (task == null) {
        await widget.controller.createTask(result.toCreateInput());
        _showMessage('Task created successfully.');
      } else {
        await widget.controller.updateTask(task.id, result.toUpdateInput());
        _showMessage('Task updated successfully.');
      }
    } catch (_) {
      _showMessage(widget.controller.errorMessage ?? 'Unable to save task.');
    }
  }

  Future<void> _deleteTask(Task task) async {
    final shouldDelete = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Delete task?'),
          content: Text('Are you sure you want to delete "${task.title}"?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );

    if (shouldDelete != true) {
      return;
    }

    try {
      await widget.controller.deleteTask(task.id);
      _showMessage('Task deleted successfully.');
    } catch (_) {
      _showMessage(widget.controller.errorMessage ?? 'Failed to delete task.');
    }
  }

  Future<void> _toggleTask(Task task) async {
    try {
      await widget.controller.toggleTask(task.id);
      _showMessage('Task status updated.');
    } catch (_) {
      _showMessage(widget.controller.errorMessage ?? 'Failed to toggle task.');
    }
  }

  void _showMessage(String message) {
    if (!mounted) {
      return;
    }

    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _logout() async {
    await widget.controller.logout();
  }

  Future<void> _applyFilters() async {
    widget.controller.setSearch(_searchController.text.trim());

    try {
      await widget.controller.loadTasks();
    } catch (_) {
      _showMessage(widget.controller.errorMessage ?? 'Failed to load tasks.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.controller,
      builder: (context, _) {
        final user = widget.controller.user;
        final isLoading = widget.controller.isTasksLoading;
        final tasks = widget.controller.tasks;

        final formatter = DateFormat('MMM d, y h:mm a');

        return Scaffold(
          appBar: AppBar(
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Task Manager'),
                if (user != null)
                  Text(
                    'Welcome, ${user.username}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
              ],
            ),
            actions: [
              IconButton(
                onPressed: isLoading
                    ? null
                    : () => widget.controller.loadTasks(),
                icon: const Icon(Icons.refresh),
              ),
              IconButton(
                onPressed: widget.controller.isAuthLoading ? null : _logout,
                icon: const Icon(Icons.logout),
              ),
            ],
          ),
          floatingActionButton: FloatingActionButton.extended(
            onPressed: () => _openTaskForm(),
            icon: const Icon(Icons.add),
            label: const Text('Add Task'),
          ),
          body: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
                child: Column(
                  children: [
                    TextField(
                      controller: _searchController,
                      decoration: InputDecoration(
                        border: const OutlineInputBorder(),
                        labelText: 'Search by title or description',
                        suffixIcon: IconButton(
                          onPressed: _applyFilters,
                          icon: const Icon(Icons.search),
                        ),
                      ),
                      onSubmitted: (_) => _applyFilters(),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<TaskStatus?>(
                            key: ValueKey<String>(
                              'status-${widget.controller.statusFilter?.name ?? 'all'}',
                            ),
                            initialValue: widget.controller.statusFilter,
                            decoration: const InputDecoration(
                              labelText: 'Status',
                              border: OutlineInputBorder(),
                            ),
                            items: [
                              const DropdownMenuItem<TaskStatus?>(
                                value: null,
                                child: Text('All statuses'),
                              ),
                              ...TaskStatus.values.map(
                                (value) => DropdownMenuItem<TaskStatus?>(
                                  value: value,
                                  child: Text(value.name.toUpperCase()),
                                ),
                              ),
                            ],
                            onChanged: (value) =>
                                widget.controller.setStatusFilter(value),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: DropdownButtonFormField<TaskPriority?>(
                            key: ValueKey<String>(
                              'priority-${widget.controller.priorityFilter?.name ?? 'all'}',
                            ),
                            initialValue: widget.controller.priorityFilter,
                            decoration: const InputDecoration(
                              labelText: 'Priority',
                              border: OutlineInputBorder(),
                            ),
                            items: [
                              const DropdownMenuItem<TaskPriority?>(
                                value: null,
                                child: Text('All priorities'),
                              ),
                              ...TaskPriority.values.map(
                                (value) => DropdownMenuItem<TaskPriority?>(
                                  value: value,
                                  child: Text(value.name.toUpperCase()),
                                ),
                              ),
                            ],
                            onChanged: (value) =>
                                widget.controller.setPriorityFilter(value),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<TaskSortBy>(
                            key: ValueKey<String>(
                              'sort-by-${widget.controller.sortBy.name}',
                            ),
                            initialValue: widget.controller.sortBy,
                            decoration: const InputDecoration(
                              labelText: 'Sort by',
                              border: OutlineInputBorder(),
                            ),
                            items: TaskSortBy.values
                                .map(
                                  (value) => DropdownMenuItem(
                                    value: value,
                                    child: Text(value.name),
                                  ),
                                )
                                .toList(),
                            onChanged: (value) {
                              if (value != null) {
                                widget.controller.setSorting(
                                  value,
                                  widget.controller.sortOrder,
                                );
                              }
                            },
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: DropdownButtonFormField<TaskSortOrder>(
                            key: ValueKey<String>(
                              'sort-order-${widget.controller.sortOrder.name}',
                            ),
                            initialValue: widget.controller.sortOrder,
                            decoration: const InputDecoration(
                              labelText: 'Order',
                              border: OutlineInputBorder(),
                            ),
                            items: TaskSortOrder.values
                                .map(
                                  (value) => DropdownMenuItem(
                                    value: value,
                                    child: Text(value.name.toUpperCase()),
                                  ),
                                )
                                .toList(),
                            onChanged: (value) {
                              if (value != null) {
                                widget.controller.setSorting(
                                  widget.controller.sortBy,
                                  value,
                                );
                              }
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Align(
                      alignment: Alignment.centerRight,
                      child: FilledButton.tonal(
                        onPressed: _applyFilters,
                        child: const Text('Apply Filters'),
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              Expanded(
                child: isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : tasks.isEmpty
                    ? const Center(child: Text('No tasks found.'))
                    : ListView.separated(
                        padding: const EdgeInsets.all(12),
                        itemCount: tasks.length,
                        separatorBuilder: (BuildContext context, int index) =>
                            const SizedBox(height: 8),
                        itemBuilder: (context, index) {
                          final task = tasks[index];

                          return Card(
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          task.title,
                                          style: Theme.of(
                                            context,
                                          ).textTheme.titleMedium,
                                        ),
                                      ),
                                      Chip(
                                        label: Text(
                                          task.status.name.toUpperCase(),
                                        ),
                                      ),
                                    ],
                                  ),
                                  if (task.description != null &&
                                      task.description!.trim().isNotEmpty) ...[
                                    const SizedBox(height: 6),
                                    Text(task.description!),
                                  ],
                                  const SizedBox(height: 8),
                                  Wrap(
                                    spacing: 8,
                                    runSpacing: 8,
                                    children: [
                                      Chip(
                                        avatar: const Icon(
                                          Icons.flag,
                                          size: 16,
                                        ),
                                        label: Text(
                                          task.priority.name.toUpperCase(),
                                        ),
                                      ),
                                      if (task.dueDate != null)
                                        Chip(
                                          avatar: const Icon(
                                            Icons.event,
                                            size: 16,
                                          ),
                                          label: Text(
                                            'Due ${formatter.format(task.dueDate!.toLocal())}',
                                          ),
                                        ),
                                      if (task.reminderAt != null)
                                        Chip(
                                          avatar: const Icon(
                                            Icons.alarm,
                                            size: 16,
                                          ),
                                          label: Text(
                                            'Reminder ${formatter.format(task.reminderAt!.toLocal())}',
                                          ),
                                        ),
                                      Chip(
                                        avatar: const Icon(
                                          Icons.repeat,
                                          size: 16,
                                        ),
                                        label: Text(
                                          task.recurrence.name.toUpperCase(),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 10),
                                  Row(
                                    children: [
                                      TextButton.icon(
                                        onPressed: () => _toggleTask(task),
                                        icon: const Icon(
                                          Icons.check_circle_outline,
                                        ),
                                        label: Text(
                                          task.status == TaskStatus.completed
                                              ? 'Mark Pending'
                                              : 'Complete',
                                        ),
                                      ),
                                      TextButton.icon(
                                        onPressed: () =>
                                            _openTaskForm(task: task),
                                        icon: const Icon(Icons.edit_outlined),
                                        label: const Text('Edit'),
                                      ),
                                      TextButton.icon(
                                        onPressed: () => _deleteTask(task),
                                        icon: const Icon(Icons.delete_outline),
                                        label: const Text('Delete'),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
              ),
              if (widget.controller.totalPages > 1)
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 6, 12, 10),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      OutlinedButton(
                        onPressed: widget.controller.page > 1
                            ? () => widget.controller.goToPage(
                                widget.controller.page - 1,
                              )
                            : null,
                        child: const Text('Previous'),
                      ),
                      Text(
                        'Page ${widget.controller.page} of ${widget.controller.totalPages}',
                      ),
                      OutlinedButton(
                        onPressed:
                            widget.controller.page <
                                widget.controller.totalPages
                            ? () => widget.controller.goToPage(
                                widget.controller.page + 1,
                              )
                            : null,
                        child: const Text('Next'),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}

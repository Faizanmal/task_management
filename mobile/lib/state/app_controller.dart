import 'package:flutter/foundation.dart';

import '../models/auth_models.dart';
import '../models/task_models.dart';
import '../services/api_client.dart';

class AppController extends ChangeNotifier {
  AppController({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  final ApiClient _apiClient;

  bool isInitialized = false;
  bool isAuthLoading = false;
  bool isTasksLoading = false;

  String? errorMessage;

  List<Task> tasks = <Task>[];
  int page = 1;
  int limit = 10;
  int total = 0;
  int totalPages = 1;

  String search = '';
  TaskStatus? statusFilter;
  TaskPriority? priorityFilter;
  TaskSortBy sortBy = TaskSortBy.createdAt;
  TaskSortOrder sortOrder = TaskSortOrder.desc;

  User? get user => _apiClient.currentUser;
  bool get isAuthenticated => user != null;

  Future<void> initialize() async {
    errorMessage = null;

    try {
      await _apiClient.initialize();

      if (!isAuthenticated && _apiClient.hasRefreshToken) {
        try {
          await _apiClient.refreshTokens();
        } catch (_) {
          await _apiClient.clearSession();
        }
      }

      if (isAuthenticated) {
        await loadTasks();
      }
    } finally {
      isInitialized = true;
      notifyListeners();
    }
  }

  Future<void> register({
    required String email,
    required String username,
    required String password,
  }) async {
    isAuthLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      await _apiClient.register(
        email: email,
        username: username,
        password: password,
      );
      page = 1;
      await loadTasks();
    } on ApiException catch (error) {
      errorMessage = error.message;
      rethrow;
    } finally {
      isAuthLoading = false;
      notifyListeners();
    }
  }

  Future<void> login({required String email, required String password}) async {
    isAuthLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      await _apiClient.login(email: email, password: password);
      page = 1;
      await loadTasks();
    } on ApiException catch (error) {
      errorMessage = error.message;
      rethrow;
    } finally {
      isAuthLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    isAuthLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      await _apiClient.logout();
      tasks = <Task>[];
      page = 1;
      total = 0;
      totalPages = 1;
    } finally {
      isAuthLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadTasks() async {
    if (!isAuthenticated) {
      return;
    }

    isTasksLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.getTasks(
        TaskFilters(
          page: page,
          limit: limit,
          search: search,
          status: statusFilter,
          priority: priorityFilter,
          sortBy: sortBy,
          sortOrder: sortOrder,
        ),
      );

      tasks = response.data;
      total = response.total;
      totalPages = response.totalPages;
    } on ApiException catch (error) {
      errorMessage = error.message;
      rethrow;
    } finally {
      isTasksLoading = false;
      notifyListeners();
    }
  }

  Future<void> createTask(CreateTaskInput input) async {
    errorMessage = null;

    try {
      await _apiClient.createTask(input);
      page = 1;
      await loadTasks();
    } on ApiException catch (error) {
      errorMessage = error.message;
      rethrow;
    }
  }

  Future<void> updateTask(String taskId, UpdateTaskInput input) async {
    errorMessage = null;

    try {
      await _apiClient.updateTask(taskId, input);
      await loadTasks();
    } on ApiException catch (error) {
      errorMessage = error.message;
      rethrow;
    }
  }

  Future<void> deleteTask(String taskId) async {
    errorMessage = null;

    try {
      await _apiClient.deleteTask(taskId);

      if (tasks.length == 1 && page > 1) {
        page -= 1;
      }

      await loadTasks();
    } on ApiException catch (error) {
      errorMessage = error.message;
      rethrow;
    }
  }

  Future<void> toggleTask(String taskId) async {
    errorMessage = null;

    try {
      await _apiClient.toggleTask(taskId);
      await loadTasks();
    } on ApiException catch (error) {
      errorMessage = error.message;
      rethrow;
    }
  }

  Future<int> getUpcomingReminderCount() async {
    if (!isAuthenticated) {
      return 0;
    }

    final reminders = await _apiClient.getUpcomingReminders();
    return reminders.length;
  }

  void setSearch(String value) {
    search = value;
    page = 1;
    notifyListeners();
  }

  void setStatusFilter(TaskStatus? status) {
    statusFilter = status;
    page = 1;
    notifyListeners();
  }

  void setPriorityFilter(TaskPriority? priority) {
    priorityFilter = priority;
    page = 1;
    notifyListeners();
  }

  void setSorting(TaskSortBy by, TaskSortOrder order) {
    sortBy = by;
    sortOrder = order;
    page = 1;
    notifyListeners();
  }

  Future<void> goToPage(int nextPage) async {
    if (nextPage < 1 || nextPage > totalPages) {
      return;
    }

    page = nextPage;
    notifyListeners();
    await loadTasks();
  }
}

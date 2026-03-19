import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../models/auth_models.dart';
import '../models/task_models.dart';
import 'auth_storage.dart';

class ApiException implements Exception {
  const ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient({String? baseUrl, AuthStorage? storage, http.Client? httpClient})
    : _baseUrl = baseUrl ?? _resolveBaseUrl(),
      _storage = storage ?? AuthStorage(),
      _httpClient = httpClient ?? http.Client();

  final String _baseUrl;
  final AuthStorage _storage;
  final http.Client _httpClient;

  String? _accessToken;
  String? _refreshToken;
  User? _user;

  User? get currentUser => _user;
  bool get hasRefreshToken => _refreshToken != null;

  static String _resolveBaseUrl() {
    const configured = String.fromEnvironment('API_BASE_URL', defaultValue: '');
    if (configured.isNotEmpty) {
      return configured;
    }

    if (kIsWeb) {
      return 'http://localhost:3001';
    }

    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:3001';
    }

    return 'http://localhost:3001';
  }

  Future<void> initialize() async {
    final session = await _storage.readSession();
    _accessToken = session.accessToken;
    _refreshToken = session.refreshToken;
    _user = session.user;
  }

  Future<AuthResponse> register({
    required String email,
    required String username,
    required String password,
  }) async {
    final payload = {
      'email': email,
      'username': username,
      'password': password,
    };

    final json = await _request(
      method: 'POST',
      path: '/auth/register',
      body: payload,
      authRequired: false,
      canRefresh: false,
    );

    final auth = AuthResponse.fromJson(json as Map<String, dynamic>);
    await _setSessionFromAuth(auth);
    return auth;
  }

  Future<AuthResponse> login({
    required String email,
    required String password,
  }) async {
    final json = await _request(
      method: 'POST',
      path: '/auth/login',
      body: {'email': email, 'password': password},
      authRequired: false,
      canRefresh: false,
    );

    final auth = AuthResponse.fromJson(json as Map<String, dynamic>);
    await _setSessionFromAuth(auth);
    return auth;
  }

  Future<void> refreshTokens() async {
    final refreshToken = _refreshToken;
    if (refreshToken == null) {
      throw const ApiException('No refresh token available');
    }

    final json = await _request(
      method: 'POST',
      path: '/auth/refresh',
      body: {'refreshToken': refreshToken},
      authRequired: false,
      canRefresh: false,
    );

    final tokenJson = json as Map<String, dynamic>;
    final newAccessToken = tokenJson['accessToken'] as String;
    final newRefreshToken = tokenJson['refreshToken'] as String;

    if (_user == null) {
      throw const ApiException('Cannot refresh without a signed in user');
    }

    _accessToken = newAccessToken;
    _refreshToken = newRefreshToken;
    await _storage.writeSession(
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: _user!,
    );
  }

  Future<void> logout() async {
    final refreshToken = _refreshToken;

    if (refreshToken != null) {
      try {
        await _request(
          method: 'POST',
          path: '/auth/logout',
          body: {'refreshToken': refreshToken},
          authRequired: true,
          canRefresh: false,
        );
      } catch (_) {
        // Clear local session even if backend logout fails.
      }
    }

    await clearSession();
  }

  Future<void> clearSession() async {
    _accessToken = null;
    _refreshToken = null;
    _user = null;
    await _storage.clear();
  }

  Future<PaginatedTasks> getTasks(TaskFilters filters) async {
    final json = await _request(
      method: 'GET',
      path: '/tasks',
      queryParameters: filters.toQueryParameters(),
      authRequired: true,
      canRefresh: true,
    );

    return PaginatedTasks.fromJson(json as Map<String, dynamic>);
  }

  Future<Task> createTask(CreateTaskInput input) async {
    final json = await _request(
      method: 'POST',
      path: '/tasks',
      body: input.toApiJson(),
      authRequired: true,
      canRefresh: true,
    );

    return Task.fromJson(json as Map<String, dynamic>);
  }

  Future<Task> updateTask(String taskId, UpdateTaskInput input) async {
    final json = await _request(
      method: 'PATCH',
      path: '/tasks/$taskId',
      body: input.toApiJson(),
      authRequired: true,
      canRefresh: true,
    );

    return Task.fromJson(json as Map<String, dynamic>);
  }

  Future<void> deleteTask(String taskId) async {
    await _request(
      method: 'DELETE',
      path: '/tasks/$taskId',
      authRequired: true,
      canRefresh: true,
    );
  }

  Future<Task> toggleTask(String taskId) async {
    final json = await _request(
      method: 'PATCH',
      path: '/tasks/$taskId/toggle',
      authRequired: true,
      canRefresh: true,
    );

    return Task.fromJson(json as Map<String, dynamic>);
  }

  Future<List<Task>> getUpcomingReminders() async {
    final json = await _request(
      method: 'GET',
      path: '/tasks/reminders/upcoming',
      authRequired: true,
      canRefresh: true,
    );

    final list = json as List<dynamic>;
    return list
        .map((item) => Task.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<void> _setSessionFromAuth(AuthResponse auth) async {
    _accessToken = auth.accessToken;
    _refreshToken = auth.refreshToken;
    _user = auth.user;

    await _storage.writeSession(
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      user: auth.user,
    );
  }

  Future<dynamic> _request({
    required String method,
    required String path,
    Map<String, dynamic>? body,
    Map<String, String>? queryParameters,
    required bool authRequired,
    required bool canRefresh,
  }) async {
    final uri = Uri.parse(
      '$_baseUrl$path',
    ).replace(queryParameters: queryParameters);

    final response = await _send(
      method: method,
      uri: uri,
      body: body,
      authRequired: authRequired,
    );

    if (response.statusCode == 401 && canRefresh && _refreshToken != null) {
      await refreshTokens();

      final retryResponse = await _send(
        method: method,
        uri: uri,
        body: body,
        authRequired: authRequired,
      );
      return _parseResponse(retryResponse);
    }

    return _parseResponse(response);
  }

  Future<http.Response> _send({
    required String method,
    required Uri uri,
    Map<String, dynamic>? body,
    required bool authRequired,
  }) {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      if (authRequired && _accessToken != null)
        'Authorization': 'Bearer $_accessToken',
    };

    final encodedBody = body == null ? null : jsonEncode(body);

    switch (method) {
      case 'GET':
        return _httpClient.get(uri, headers: headers);
      case 'POST':
        return _httpClient.post(uri, headers: headers, body: encodedBody);
      case 'PATCH':
        return _httpClient.patch(uri, headers: headers, body: encodedBody);
      case 'DELETE':
        return _httpClient.delete(uri, headers: headers);
      default:
        throw ApiException('Unsupported method $method');
    }
  }

  dynamic _parseResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) {
        return null;
      }
      return jsonDecode(response.body);
    }

    String message = 'Request failed with status ${response.statusCode}';

    if (response.body.isNotEmpty) {
      try {
        final decoded = jsonDecode(response.body);
        if (decoded is Map<String, dynamic>) {
          final rawMessage = decoded['message'];
          if (rawMessage is List) {
            message = rawMessage.join(', ');
          } else if (rawMessage is String) {
            message = rawMessage;
          }
        }
      } catch (_) {
        // Fall back to generic message.
      }
    }

    throw ApiException(message, statusCode: response.statusCode);
  }
}

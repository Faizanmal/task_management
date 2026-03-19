import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/auth_models.dart';

class StoredSession {
  const StoredSession({this.accessToken, this.refreshToken, this.user});

  final String? accessToken;
  final String? refreshToken;
  final User? user;
}

class AuthStorage {
  static const _accessTokenKey = 'accessToken';
  static const _refreshTokenKey = 'refreshToken';
  static const _userKey = 'user';

  Future<StoredSession> readSession() async {
    final prefs = await SharedPreferences.getInstance();
    final userRaw = prefs.getString(_userKey);

    return StoredSession(
      accessToken: prefs.getString(_accessTokenKey),
      refreshToken: prefs.getString(_refreshTokenKey),
      user: userRaw == null
          ? null
          : User.fromJson(jsonDecode(userRaw) as Map<String, dynamic>),
    );
  }

  Future<void> writeSession({
    required String accessToken,
    required String refreshToken,
    required User user,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_accessTokenKey, accessToken);
    await prefs.setString(_refreshTokenKey, refreshToken);
    await prefs.setString(_userKey, jsonEncode(user.toJson()));
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_accessTokenKey);
    await prefs.remove(_refreshTokenKey);
    await prefs.remove(_userKey);
  }
}

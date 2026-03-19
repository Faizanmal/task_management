import 'package:flutter/material.dart';

import 'screens/auth_screen.dart';
import 'screens/tasks_screen.dart';
import 'state/app_controller.dart';

void main() {
  runApp(const EarnestTaskApp());
}

class EarnestTaskApp extends StatefulWidget {
  const EarnestTaskApp({super.key});

  @override
  State<EarnestTaskApp> createState() => _EarnestTaskAppState();
}

class _EarnestTaskAppState extends State<EarnestTaskApp> {
  final AppController _controller = AppController();

  @override
  void initState() {
    super.initState();
    _controller.initialize();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Earnest Task Manager',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0F766E)),
        useMaterial3: true,
      ),
      home: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          if (!_controller.isInitialized) {
            return const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            );
          }

          if (!_controller.isAuthenticated) {
            return AuthScreen(controller: _controller);
          }

          return TasksScreen(controller: _controller);
        },
      ),
    );
  }
}

import 'package:flutter/material.dart';

import '../state/app_controller.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key, required this.controller});

  final AppController controller;

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  bool _isRegisterMode = false;

  final _formKey = GlobalKey<FormState>();

  final _emailController = TextEditingController();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _usernameController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    try {
      if (_isRegisterMode) {
        await widget.controller.register(
          email: _emailController.text.trim(),
          username: _usernameController.text.trim(),
          password: _passwordController.text,
        );
      } else {
        await widget.controller.login(
          email: _emailController.text.trim(),
          password: _passwordController.text,
        );
      }
    } catch (_) {
      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(widget.controller.errorMessage ?? 'Request failed.'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.controller,
      builder: (context, _) {
        final isLoading = widget.controller.isAuthLoading;

        return Scaffold(
          appBar: AppBar(title: const Text('Earnest Task Manager')),
          body: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        _isRegisterMode
                            ? 'Create your account'
                            : 'Welcome back',
                        style: Theme.of(context).textTheme.headlineSmall,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 20),
                      TextFormField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(
                          labelText: 'Email',
                          border: OutlineInputBorder(),
                        ),
                        validator: (value) {
                          final trimmed = value?.trim() ?? '';
                          if (trimmed.isEmpty || !trimmed.contains('@')) {
                            return 'Enter a valid email address.';
                          }
                          return null;
                        },
                      ),
                      if (_isRegisterMode) ...[
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _usernameController,
                          decoration: const InputDecoration(
                            labelText: 'Username',
                            border: OutlineInputBorder(),
                          ),
                          validator: (value) {
                            final length = value?.trim().length ?? 0;
                            if (length < 3 || length > 20) {
                              return 'Username must be 3-20 characters.';
                            }
                            return null;
                          },
                        ),
                      ],
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _passwordController,
                        obscureText: true,
                        decoration: const InputDecoration(
                          labelText: 'Password',
                          border: OutlineInputBorder(),
                        ),
                        validator: (value) {
                          final text = value ?? '';
                          if (_isRegisterMode && text.length < 6) {
                            return 'Password must be at least 6 characters.';
                          }
                          if (text.isEmpty) {
                            return 'Password is required.';
                          }
                          return null;
                        },
                      ),
                      if (_isRegisterMode) ...[
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _confirmPasswordController,
                          obscureText: true,
                          decoration: const InputDecoration(
                            labelText: 'Confirm password',
                            border: OutlineInputBorder(),
                          ),
                          validator: (value) {
                            if ((value ?? '') != _passwordController.text) {
                              return 'Passwords do not match.';
                            }
                            return null;
                          },
                        ),
                      ],
                      const SizedBox(height: 16),
                      FilledButton(
                        onPressed: isLoading ? null : _submit,
                        child: Text(
                          isLoading
                              ? 'Please wait...'
                              : _isRegisterMode
                              ? 'Create account'
                              : 'Log in',
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: isLoading
                            ? null
                            : () {
                                setState(() {
                                  _isRegisterMode = !_isRegisterMode;
                                });
                              },
                        child: Text(
                          _isRegisterMode
                              ? 'Already have an account? Log in'
                              : 'No account yet? Register',
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

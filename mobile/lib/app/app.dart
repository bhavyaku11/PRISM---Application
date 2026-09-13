import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../features/settings/controllers/theme_controller.dart';
import 'router.dart';
import 'theme.dart';

class PrismApp extends StatefulWidget {
  final GoRouter? router;
  final ThemeController? themeController;

  const PrismApp({
    super.key,
    this.router,
    this.themeController,
  });

  @override
  State<PrismApp> createState() => _PrismAppState();
}

class _PrismAppState extends State<PrismApp> {
  late final GoRouter _router;
  late final ThemeController _themeController;

  @override
  void initState() {
    super.initState();
    _router = widget.router ?? createRouter();
    _themeController = widget.themeController ?? ThemeController.instance;
    _themeController.loadThemeMode();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _themeController,
      builder: (context, child) {
        return MaterialApp.router(
          title: 'PRISM',
          debugShowCheckedModeBanner: false,
          theme: PrismTheme.lightTheme,
          darkTheme: PrismTheme.darkTheme,
          themeMode: _themeController.themeMode,
          routerConfig: _router,
        );
      },
    );
  }
}

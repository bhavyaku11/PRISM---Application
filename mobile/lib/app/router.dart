import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/auth/screens/signup_screen.dart';
import '../features/auth/screens/splash_screen.dart';
import '../features/dashboard/screens/dashboard_screen.dart';
import '../features/policies/screens/policies_list_screen.dart';
import '../features/policies/screens/add_policy_screen.dart';
import '../features/policies/screens/policy_processing_screen.dart';
import '../features/policies/screens/policy_detail_screen.dart';
import '../features/ask_prism/screens/ask_screen.dart';
import '../features/claims/screens/claims_screen.dart';
import '../features/claims/screens/claim_detail_screen.dart';
import '../features/notifications/screens/notifications_screen.dart';
import '../features/profile/screens/profile_screen.dart';
import '../features/scenarios/screens/scenario_screen.dart';
import '../features/settings/screens/settings_screen.dart';
import '../shared/widgets/main_scaffold.dart';

final GlobalKey<NavigatorState> rootNavigatorKey = GlobalKey<NavigatorState>();

GoRouter createRouter({String initialLocation = '/splash'}) {
  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: initialLocation,
    redirect: (BuildContext context, GoRouterState state) {
      Session? session;
      try {
        session = Supabase.instance.client.auth.currentSession;
      } catch (_) {
        session = null;
      }
      final isAuthenticated = session != null;
      final loc = state.matchedLocation;

      final isAuthRoute =
          loc == '/login' || loc == '/signup' || loc == '/splash';

      if (!isAuthenticated && !isAuthRoute) {
        return '/login';
      }

      if (isAuthenticated && (loc == '/login' || loc == '/signup')) {
        return '/dashboard';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/signup',
        builder: (context, state) => const SignupScreen(),
      ),
      // Stateful shell for bottom navigation bar
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return MainScaffold(navigationShell: navigationShell);
        },
        branches: [
          // 0: Home / Dashboard
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/dashboard',
                builder: (context, state) => const DashboardScreen(),
              ),
            ],
          ),
          // 1: Policies
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/policies',
                builder: (context, state) => const PoliciesListScreen(),
              ),
            ],
          ),
          // 2: Ask PRISM
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/ask',
                builder: (context, state) {
                  final policyId = state.uri.queryParameters['policy_id'];
                  final initialQuestion = state.uri.queryParameters['q'];
                  return AskScreen(
                    policyId: policyId,
                    initialQuestion: initialQuestion,
                  );
                },
              ),
            ],
          ),
          // 3: Claims
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/claims',
                builder: (context, state) => const ClaimsScreen(),
              ),
            ],
          ),
          // 4: More / Settings
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/settings',
                builder: (context, state) => const SettingsScreen(),
              ),
            ],
          ),
        ],
      ),
      // Direct secondary routes
      GoRoute(
        path: '/policies/add',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const AddPolicyScreen(),
      ),
      GoRoute(
        path: '/policies/:id/processing',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          final documentId = state.uri.queryParameters['document_id'] ??
              (state.extra as Map<String, dynamic>?)?['document_id'] as String?;
          final initialStatus = state.uri.queryParameters['status'] ??
              (state.extra as Map<String, dynamic>?)?['status'] as String?;
          return PolicyProcessingScreen(
            policyId: id,
            documentId: documentId,
            initialStatus: initialStatus,
          );
        },
      ),
      GoRoute(
        path: '/policies/:id',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return PolicyDetailScreen(policyId: id);
        },
      ),
      GoRoute(
        path: '/claims/:id',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return ClaimDetailScreen(claimId: id);
        },
      ),
      GoRoute(
        path: '/notifications',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const NotificationsScreen(),
      ),
      GoRoute(
        path: '/profile',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const ProfileScreen(),
      ),
      GoRoute(
        path: '/scenario',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const ScenarioScreen(),
      ),
    ],
  );
}

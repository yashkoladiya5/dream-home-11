import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/auth/presentation/providers/auth_state.dart';
import '../../features/auth/presentation/screens/splash_screen.dart';
import '../../features/auth/presentation/screens/language_screen.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/otp_screen.dart';
import '../../features/dashboard/presentation/screens/dashboard_layout.dart';

class GoRouterRefreshListenable extends ChangeNotifier {
  final Ref _ref;

  GoRouterRefreshListenable(this._ref) {
    _ref.listen(authProvider, (previous, next) {
      if (previous?.status != next.status) {
        notifyListeners();
      }
    });
  }
}

final routerProvider = Provider<GoRouter>((ref) {
  final listenable = GoRouterRefreshListenable(ref);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: listenable,
    redirect: (context, state) {
      final authState = ref.read(authProvider);
      final status = authState.status;
      final isLoggingIn = state.matchedLocation == '/' || 
                          state.matchedLocation == '/language' || 
                          state.matchedLocation == '/login' || 
                          state.matchedLocation == '/otp';

      if (status == AuthStatus.verified) {
        if (isLoggingIn) {
          return '/home';
        }
      } else {
        if (!isLoggingIn) {
          return '/language';
        }
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/language',
        builder: (context, state) => const LanguageScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/otp',
        builder: (context, state) {
          final phoneNumber = state.extra as String? ?? '';
          return OtpScreen(phoneNumber: phoneNumber);
        },
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const DashboardLayout(),
      ),
    ],
  );
});


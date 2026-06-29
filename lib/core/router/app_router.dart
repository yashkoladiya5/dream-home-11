import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/auth/presentation/providers/auth_state.dart';
import '../../features/auth/presentation/screens/splash_screen.dart';
import '../../features/auth/presentation/screens/language_screen.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/otp_screen.dart';
import '../../features/contests/presentation/screens/our_contests_screen.dart';
import '../../features/contests/presentation/screens/mega_contest_screen.dart';
import '../../features/contests/presentation/screens/home_contest_screen.dart';
import '../../features/contests/presentation/screens/create_contest_screen.dart';
import '../../features/contests/presentation/screens/enter_code_screen.dart';
import '../../features/contests/presentation/screens/contest_running_screen.dart';
import '../../features/contests/presentation/screens/completed_contest_screen.dart';
import '../../features/dashboard/presentation/screens/dashboard_layout.dart';
import '../../features/dashboard/presentation/screens/performance_screen.dart';
import '../../features/points/presentation/screens/multiplier_screen.dart';
import '../../features/points/presentation/screens/earn_points_screen.dart';
import '../../features/points/presentation/screens/streak_screen.dart';
import '../../features/notifications/presentation/screens/reminders_screen.dart';
import '../../features/notifications/presentation/screens/create_reminder_screen.dart';
import '../../features/share_tracker/presentation/screens/share_tracker_screen.dart';
import '../../features/rewards/presentation/screens/rewards_catalog_screen.dart';
import '../../features/rewards/presentation/screens/reward_detail_screen.dart';
import '../../features/winners/presentation/screens/winners_history_screen.dart';
import '../../features/achievements/presentation/screens/achievements_screen.dart';
import '../../features/prize_homes/presentation/screens/home_gallery_screen.dart';
import '../../features/prize_homes/presentation/screens/home_spec_detail_screen.dart';
import '../../features/prize_homes/presentation/screens/location_selection_screen.dart';
import '../../features/winners/presentation/screens/winner_profile_screen.dart';
import '../../features/wallet/presentation/screens/wallet_screen.dart';
import '../../features/wallet/presentation/screens/my_balance_screen.dart';
import '../../features/wallet/presentation/screens/add_cash_screen.dart';
import '../../features/wallet/presentation/screens/payment_options_screen.dart';
import '../../features/wallet/presentation/screens/contest_transactions_screen.dart';
import '../../features/wallet/presentation/screens/deposit_transactions_screen.dart';
import '../../features/wallet/presentation/screens/other_transactions_screen.dart';
import '../../features/wallet/presentation/screens/withdraw_screen.dart';
import '../../features/wallet/presentation/screens/withdraw_history_screen.dart';
import '../../features/wallet/presentation/screens/manage_payment_screen.dart';
import '../../features/kyc/presentation/screens/kyc_details_screen.dart';
import '../../features/leaderboard/presentation/screens/leaderboard_screen.dart';
import '../../features/leaderboard/presentation/screens/series_leaderboard_screen.dart';
import '../../features/contests/presentation/screens/my_home_contest_screen.dart';
import '../../features/feed/presentation/screens/feed_screen.dart';
import '../../features/feed/presentation/screens/find_people_screen.dart';
import '../../features/gamification/presentation/screens/spin_screen.dart';
import '../../features/polls/presentation/screens/vote_screen.dart';
import '../../features/chat/presentation/screens/chat_debug_screen.dart';
import '../../features/chat/presentation/screens/chat_list_screen.dart';
import '../../features/chat/presentation/screens/direct_chat_screen.dart';
import '../../features/chat/presentation/screens/group_chat_screen.dart';
import '../../features/help/presentation/screens/faq_screen.dart';
import '../../features/help/presentation/screens/support_screen.dart';
import '../../features/help/presentation/screens/how_to_play_screen.dart';
import '../../features/help/presentation/screens/community_guidelines_screen.dart';
import '../../features/legal/presentation/screens/terms_of_service_screen.dart';
import '../../features/legal/presentation/screens/privacy_policy_screen.dart';
import '../../features/legal/presentation/screens/responsible_gaming_screen.dart';
import '../../features/legal/presentation/screens/about_screen.dart';
import '../../features/legal/presentation/screens/version_screen.dart';
import '../../features/legal/presentation/screens/contact_screen.dart';
import '../../features/legal/presentation/screens/legality_screen.dart';
import '../../features/legal/presentation/screens/jobs_screen.dart';
import '../../features/legal/presentation/screens/more_screen.dart';
import '../../features/referral/presentation/screens/invite_screen.dart';
import '../../features/admin/presentation/screens/admin_dashboard_screen.dart';
import '../../features/admin/presentation/screens/admin_users_screen.dart';
import '../../features/admin/presentation/screens/admin_kyc_screen.dart';
import '../../features/admin/presentation/screens/admin_user_detail_screen.dart';
import '../../features/admin/presentation/screens/admin_contests_screen.dart';
import '../../features/admin/presentation/screens/admin_contest_detail_screen.dart';
import '../../features/admin/presentation/screens/admin_config_screen.dart';
import '../../features/admin/presentation/screens/admin_support_tickets_screen.dart';

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
        final isAdminRoute = state.matchedLocation.startsWith('/admin');
        if (isAdminRoute) {
          final role = authState.role;
          final isAdmin = role != null && role.name == 'admin';
          if (!isAdmin) {
            return '/home';
          }
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
      GoRoute(
        path: '/contest/:id',
        builder: (context, state) {
          final contestId = state.pathParameters['id']!;
          return OurContestsScreen(contestId: contestId);
        },
      ),
      GoRoute(
        path: '/mega-contests',
        builder: (context, state) => const MegaContestScreen(),
      ),
      GoRoute(
        path: '/home-contests',
        builder: (context, state) => const HomeContestScreen(),
      ),
      GoRoute(
        path: '/my-contests',
        builder: (context, state) => const MyHomeContestScreen(),
      ),
      GoRoute(
        path: '/feed',
        builder: (context, state) => const FeedScreen(),
      ),
      GoRoute(
        path: '/find-people',
        builder: (context, state) => const FindPeopleScreen(),
      ),
      GoRoute(
        path: '/create-contest',
        builder: (context, state) => const CreateContestScreen(),
      ),
      GoRoute(
        path: '/enter-code',
        builder: (context, state) => const EnterCodeScreen(),
      ),
      GoRoute(
        path: '/contest/:id/live',
        builder: (context, state) => ContestRunningScreen(
          contestId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(
        path: '/contest/:id/completed',
        builder: (context, state) => CompletedContestScreen(
          contestId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(
        path: '/performance',
        builder: (context, state) => const PerformanceScreen(),
      ),
      GoRoute(
        path: '/multiplier',
        builder: (context, state) => const MultiplierScreen(),
      ),
      GoRoute(
        path: '/earn-points',
        builder: (context, state) => const EarnPointsScreen(),
      ),
      GoRoute(
        path: '/streak',
        builder: (context, state) => const StreakScreen(),
      ),
      GoRoute(
        path: '/reminders',
        builder: (context, state) => const RemindersScreen(),
      ),
      GoRoute(
        path: '/create-reminder',
        builder: (context, state) => const CreateReminderScreen(),
      ),
      GoRoute(
        path: '/share-tracker',
        builder: (context, state) => const ShareTrackerScreen(),
      ),
      GoRoute(
        path: '/rewards',
        builder: (context, state) => const RewardsCatalogScreen(),
      ),
      GoRoute(
        path: '/rewards/:id',
        builder: (context, state) => RewardDetailScreen(
          rewardId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(
        path: '/winners',
        builder: (context, state) => const WinnersHistoryScreen(),
      ),
      GoRoute(
        path: '/achievements',
        builder: (context, state) => const AchievementsScreen(),
      ),
      GoRoute(
        path: '/prize-homes',
        builder: (context, state) => const HomeGalleryScreen(),
      ),
      GoRoute(
        path: '/prize-homes/:id',
        builder: (context, state) => HomeSpecDetailScreen(
          prizeHomeId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(
        path: '/locations',
        builder: (context, state) => const LocationSelectionScreen(),
      ),
      GoRoute(
        path: '/winner-profile/:contestId/:userId',
        builder: (context, state) => WinnerProfileScreen(
          contestId: state.pathParameters['contestId']!,
          winnerUserId: state.pathParameters['userId']!,
        ),
      ),
      GoRoute(
        path: '/wallet',
        builder: (context, state) => const WalletScreen(),
      ),
      GoRoute(
        path: '/my-balance',
        builder: (context, state) => const MyBalanceScreen(),
      ),
      GoRoute(
        path: '/add-cash',
        builder: (context, state) => const AddCashScreen(),
      ),
      GoRoute(
        path: '/payment-options',
        builder: (context, state) => const PaymentOptionsScreen(),
      ),
      GoRoute(
        path: '/kyc',
        builder: (context, state) => const KycDetailsScreen(),
      ),
      GoRoute(
        path: '/withdraw',
        builder: (context, state) => const WithdrawScreen(),
      ),
      GoRoute(
        path: '/withdraw-history',
        builder: (context, state) => const WithdrawHistoryScreen(),
      ),
      GoRoute(
        path: '/leaderboard',
        builder: (context, state) => const LeaderboardScreen(),
      ),
      GoRoute(
        path: '/series-leaderboard',
        builder: (context, state) => const SeriesLeaderboardScreen(),
      ),
      GoRoute(
        path: '/manage-payment',
        builder: (context, state) => const ManagePaymentScreen(),
      ),
      GoRoute(
        path: '/transactions/contest',
        builder: (context, state) => const ContestTransactionsScreen(),
      ),
      GoRoute(
        path: '/transactions/deposit',
        builder: (context, state) => const DepositTransactionsScreen(),
      ),
      GoRoute(
        path: '/spin',
        builder: (context, state) => const SpinScreen(),
      ),
      GoRoute(
        path: '/vote',
        builder: (context, state) => const VoteScreen(),
      ),
      GoRoute(
        path: '/chat',
        builder: (context, state) => const ChatDebugScreen(),
      ),
      GoRoute(
        path: '/conversations',
        builder: (context, state) => const ChatListScreen(),
      ),
      GoRoute(
        path: '/chat/:chatId',
        builder: (context, state) {
          final chatId = state.pathParameters['chatId']!;
          return DirectChatScreen(chatId: chatId);
        },
      ),
      GoRoute(
        path: '/chat/:chatId/group',
        builder: (context, state) {
          final chatId = state.pathParameters['chatId']!;
          return GroupChatScreen(chatId: chatId);
        },
      ),
      GoRoute(
        path: '/faq',
        builder: (context, state) => const FaqScreen(),
      ),
      GoRoute(
        path: '/support',
        builder: (context, state) => const SupportScreen(),
      ),
      GoRoute(
        path: '/how-to-play',
        builder: (context, state) => const HowToPlayScreen(),
      ),
      GoRoute(
        path: '/community-guidelines',
        builder: (context, state) => const CommunityGuidelinesScreen(),
      ),
      GoRoute(
        path: '/terms-of-service',
        builder: (context, state) => const TermsOfServiceScreen(),
      ),
      GoRoute(
        path: '/privacy-policy',
        builder: (context, state) => const PrivacyPolicyScreen(),
      ),
      GoRoute(
        path: '/responsible-gaming',
        builder: (context, state) => const ResponsibleGamingScreen(),
      ),
      GoRoute(
        path: '/legality',
        builder: (context, state) => const LegalityScreen(),
      ),
      GoRoute(
        path: '/about',
        builder: (context, state) => const AboutScreen(),
      ),
      GoRoute(
        path: '/app-info',
        builder: (context, state) => const VersionScreen(),
      ),
      GoRoute(
        path: '/contact',
        builder: (context, state) => const ContactScreen(),
      ),
      GoRoute(
        path: '/transactions/others',
        builder: (context, state) => const OtherTransactionsScreen(),
      ),
      GoRoute(
        path: '/jobs',
        builder: (context, state) => const JobsScreen(),
      ),
      GoRoute(
        path: '/more',
        builder: (context, state) => const MoreScreen(),
      ),
      GoRoute(
        path: '/invite',
        builder: (context, state) => const InviteScreen(),
      ),
      GoRoute(
        path: '/admin',
        builder: (context, state) => const AdminDashboardScreen(),
      ),
      GoRoute(
        path: '/admin/users',
        builder: (context, state) => const AdminUsersScreen(),
      ),
      GoRoute(
        path: '/admin/kyc',
        builder: (context, state) => const AdminKycScreen(),
      ),
      GoRoute(
        path: '/admin/users/:id',
        builder: (context, state) {
          final userId = state.pathParameters['id']!;
          return AdminUserDetailScreen(userId: userId);
        },
      ),
      GoRoute(
        path: '/admin/contests',
        builder: (context, state) => const AdminContestsScreen(),
      ),
      GoRoute(
        path: '/admin/contests/:id',
        builder: (context, state) {
          final contestId = state.pathParameters['id']!;
          return AdminContestDetailScreen(contestId: contestId);
        },
      ),
      GoRoute(
        path: '/admin/config',
        builder: (context, state) => const AdminConfigScreen(),
      ),
      GoRoute(
        path: '/admin/support-tickets',
        builder: (context, state) => const AdminSupportTicketsScreen(),
      ),
    ],
  );
});


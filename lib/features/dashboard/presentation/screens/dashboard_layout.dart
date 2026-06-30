import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/user_profile_provider.dart';
import '../widgets/navigation_drawer.dart';
import '../widgets/contest_tab.dart';
import '../widgets/wallet_tab.dart';
import '../widgets/rewards_tab.dart';
import '../widgets/profile_tab.dart';
import 'home_screen.dart';
import '../../../notifications/presentation/providers/notifications_provider.dart';

class DashboardLayout extends ConsumerStatefulWidget {
  const DashboardLayout({super.key});

  @override
  ConsumerState<DashboardLayout> createState() => _DashboardLayoutState();
}

class _DashboardLayoutState extends ConsumerState<DashboardLayout> {
  int _currentIndex = 0;
  late PageController _pageController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(initialPage: _currentIndex);

    // Proactively fetch user profile on layout initialization
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(userProfileProvider.notifier).fetchProfile();
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onTabTapped(int index) {
    if (index == _currentIndex) return;
    _pageController.jumpToPage(index);
  }

  String _getAppBarTitle() {
    switch (_currentIndex) {
      case 0:
        return 'Dream Home 11';
      case 1:
        return 'Contests';
      case 2:
        return 'My Wallet';
      case 3:
        return 'Rewards Store';
      case 4:
        return 'My Profile';
      default:
        return 'Dream Home 11';
    }
  }

  @override
  Widget build(BuildContext context) {
    final profileState = ref.watch(userProfileProvider);
    final unreadCountAsync = ref.watch(unreadNotificationCountProvider);
    final screenWidth = MediaQuery.of(context).size.width;
    final bottomPadding = MediaQuery.of(context).padding.bottom;

    // Width of each tab item (within the margins of the floating dock)
    final dockWidth = screenWidth - 36;
    final tabWidth = dockWidth / 5;
    final capsuleWidth = 60.0;
    final capsuleLeftOffset =
        (tabWidth * _currentIndex) + (tabWidth - capsuleWidth) / 2;

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      drawer: const NavigationDrawerWidget(),
      appBar: AppBar(
        backgroundColor: AppTheme.darkSlate,
        elevation: 0,
        leading: Builder(
          builder: (context) {
            return IconButton(
              icon: profileState.maybeWhen(
                data: (profile) {
                  return Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppTheme.primaryRed,
                        width: 1.5,
                      ),
                    ),
                    child: const CircleAvatar(
                      radius: 12,
                      backgroundColor: AppTheme.secondarySlate,
                      child: Icon(
                        Icons.person_rounded,
                        size: 16,
                        color: AppTheme.white,
                      ),
                    ),
                  );
                },
                orElse: () =>
                    const Icon(Icons.menu_rounded, color: AppTheme.white),
              ),
              onPressed: () => Scaffold.of(context).openDrawer(),
            );
          },
        ),
        title: AnimatedSwitcher(
          duration: const Duration(milliseconds: 200),
          child: Text(
            _getAppBarTitle(),
            key: ValueKey<int>(_currentIndex),
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
            ),
          ),
        ),
        centerTitle: true,
        actions: [
          // Elegant points counter pill in AppBar for quick summary
          profileState.maybeWhen(
            data: (profile) => Padding(
              padding: const EdgeInsets.only(right: 8.0),
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.goldYellow.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: AppTheme.goldYellow.withValues(alpha: 0.2),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.stars_rounded,
                        color: AppTheme.goldYellow,
                        size: 14,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${profile.pointsBalance} PTS',
                        style: const TextStyle(
                          color: AppTheme.goldYellow,
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            orElse: () => const SizedBox.shrink(),
          ),
          // Elegant Notification Bell Icon with Red Badge
          unreadCountAsync.maybeWhen(
            data: (count) {
              return Stack(
                alignment: Alignment.center,
                children: [
                  IconButton(
                    icon: const Icon(Icons.notifications_rounded, color: Colors.white),
                    onPressed: () => context.push('/notifications'),
                  ),
                  if (count > 0)
                    Positioned(
                      right: 8,
                      top: 8,
                      child: Container(
                        padding: const EdgeInsets.all(3),
                        decoration: const BoxDecoration(
                          color: AppTheme.primaryRed,
                          shape: BoxShape.circle,
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 14,
                          minHeight: 14,
                        ),
                        child: Text(
                          '$count',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 8,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                ],
              );
            },
            orElse: () => IconButton(
              icon: const Icon(Icons.notifications_rounded, color: Colors.white),
              onPressed: () => context.push('/notifications'),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: PageView(
        controller: _pageController,
        onPageChanged: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        physics: const BouncingScrollPhysics(),
        children: const [
          HomeScreen(),
          ContestTab(),
          WalletTab(),
          RewardsTab(),
          ProfileTab(),
        ],
      ),
      bottomNavigationBar: Container(
        margin: EdgeInsets.only(
          left: 18,
          right: 18,
          bottom: bottomPadding > 0 ? bottomPadding : 16,
        ),
        height: 70,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(28),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.4),
              blurRadius: 24,
              offset: const Offset(0, 10),
            ),
            BoxShadow(
              color: AppTheme.primaryRed.withValues(alpha: 0.08),
              blurRadius: 16,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(28),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
            child: Container(
              decoration: BoxDecoration(
                color: AppTheme.secondarySlate.withValues(alpha: 0.82),
                borderRadius: BorderRadius.circular(28),
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.08),
                  width: 1.2,
                ),
              ),
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  // Sliding Active Indicator Capsule behind the Active Icon
                  AnimatedPositioned(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeOutBack,
                    left: capsuleLeftOffset,
                    top: 5,
                    child: Container(
                      width: capsuleWidth,
                      height: 55,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            AppTheme.primaryRed.withValues(alpha: 0.22),
                            AppTheme.primaryRed.withValues(alpha: 0.04),
                          ],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(
                          color: AppTheme.primaryRed.withValues(alpha: 0.35),
                          width: 1.2,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.primaryRed.withValues(alpha: 0.15),
                            blurRadius: 8,
                            spreadRadius: 0.5,
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Pulsing Indicator Dot
                  // AnimatedPositioned(
                  //   duration: const Duration(milliseconds: 300),
                  //   curve: Curves.easeOutCubic,
                  //   left: (tabWidth * _currentIndex) + (tabWidth - 5) / 2,
                  //   bottom: 8,
                  //   child: Container(
                  //     width: 5,
                  //     height: 5,
                  //     decoration: BoxDecoration(
                  //       shape: BoxShape.circle,
                  //       color: AppTheme.primaryRed,
                  //       boxShadow: [
                  //         BoxShadow(
                  //           color: AppTheme.primaryRed.withValues(alpha: 0.8),
                  //           blurRadius: 4,
                  //           spreadRadius: 1,
                  //         ),
                  //       ],
                  //     ),
                  //   ),
                  // ),

                  // Navigation Items
                  Row(
                    children: [
                      _buildNavBarItem(
                        0,
                        Icons.home_outlined,
                        Icons.home_rounded,
                        'Home',
                      ),
                      _buildNavBarItem(
                        1,
                        Icons.emoji_events_outlined,
                        Icons.emoji_events_rounded,
                        'Contest',
                      ),
                      _buildNavBarItem(
                        2,
                        Icons.account_balance_wallet_outlined,
                        Icons.account_balance_wallet_rounded,
                        'Wallet',
                      ),
                      _buildNavBarItem(
                        3,
                        Icons.stars_outlined,
                        Icons.stars_rounded,
                        'Rewards',
                      ),
                      _buildNavBarItem(
                        4,
                        Icons.person_outlined,
                        Icons.person_rounded,
                        'Profile',
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavBarItem(
    int index,
    IconData outlineIcon,
    IconData filledIcon,
    String label,
  ) {
    final isSelected = _currentIndex == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => _onTabTapped(index),
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedScale(
              scale: isSelected ? 1.1 : 1.0,
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeOutBack,
              child: Icon(
                isSelected ? filledIcon : outlineIcon,
                color: isSelected
                    ? AppTheme.white
                    : AppTheme.greyMedium.withValues(alpha: 0.7),
                size: 22,
              ),
            ),
            const SizedBox(height: 5),
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 200),
              style: TextStyle(
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                color: isSelected
                    ? AppTheme.white
                    : AppTheme.greyMedium.withValues(alpha: 0.7),
                letterSpacing: 0.2,
                shadows: isSelected
                    ? [
                        Shadow(
                          color: Colors.black.withValues(alpha: 0.3),
                          blurRadius: 4,
                          offset: const Offset(0, 1),
                        ),
                      ]
                    : null,
              ),
              child: Text(label),
            ),
            const SizedBox(height: 6),
          ],
        ),
      ),
    );
  }
}

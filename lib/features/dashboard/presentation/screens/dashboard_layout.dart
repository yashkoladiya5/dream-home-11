import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/user_profile_provider.dart';
import '../widgets/navigation_drawer.dart';
import '../widgets/contest_tab.dart';
import '../widgets/wallet_tab.dart';
import '../widgets/rewards_tab.dart';
import '../widgets/profile_tab.dart';
import 'home_screen.dart';

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
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeInOutCubic,
    );
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
                      border: Border.all(color: AppTheme.primaryRed, width: 1.5),
                    ),
                    child: const CircleAvatar(
                      radius: 12,
                      backgroundColor: AppTheme.secondarySlate,
                      child: Icon(Icons.person_rounded, size: 16, color: AppTheme.white),
                    ),
                  );
                },
                orElse: () => const Icon(Icons.menu_rounded, color: AppTheme.white),
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
              padding: const EdgeInsets.only(right: 16.0),
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppTheme.goldYellow.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.goldYellow.withValues(alpha: 0.2)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.stars_rounded, color: AppTheme.goldYellow, size: 14),
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
        decoration: const BoxDecoration(
          border: Border(
            top: BorderSide(color: Color(0x12FFFFFF), width: 1.0),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: _onTabTapped,
          type: BottomNavigationBarType.fixed,
          backgroundColor: AppTheme.secondarySlate,
          selectedItemColor: AppTheme.primaryRed,
          unselectedItemColor: AppTheme.greyMedium,
          selectedFontSize: 12,
          unselectedFontSize: 11,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold),
          unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home_rounded, color: AppTheme.primaryRed),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.emoji_events_outlined),
              activeIcon: Icon(Icons.emoji_events_rounded, color: AppTheme.primaryRed),
              label: 'Contest',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.account_balance_wallet_outlined),
              activeIcon: Icon(Icons.account_balance_wallet_rounded, color: AppTheme.primaryRed),
              label: 'Wallet',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.stars_outlined),
              activeIcon: Icon(Icons.stars_rounded, color: AppTheme.primaryRed),
              label: 'Rewards',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person_rounded, color: AppTheme.primaryRed),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}

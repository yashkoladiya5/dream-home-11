import 'dart:ui';
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
    final screenWidth = MediaQuery.of(context).size.width;
    final bottomPadding = MediaQuery.of(context).padding.bottom;
    
    // Width of each tab item
    final tabWidth = screenWidth / 5;
    
    // Offset for the active indicator (centered inside the active tab)
    // Indicator width is 32px, so subtract 16px to center it
    final indicatorLeftOffset = (tabWidth * _currentIndex) + (tabWidth / 2) - 16;

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
        height: 64 + bottomPadding,
        decoration: const BoxDecoration(
          color: Colors.transparent,
          border: Border(
            top: BorderSide(color: Color(0x0CFFFFFF), width: 1.0),
          ),
        ),
        child: ClipRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
            child: Container(
              color: AppTheme.secondarySlate.withValues(alpha: 0.75),
              padding: EdgeInsets.only(bottom: bottomPadding),
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  // Sliding Active Indicator Pill (placed at the top border of the bar)
                  AnimatedPositioned(
                    duration: const Duration(milliseconds: 250),
                    curve: Curves.easeOutQuad,
                    left: indicatorLeftOffset,
                    top: 0,
                    child: Container(
                      width: 32,
                      height: 3,
                      decoration: const BoxDecoration(
                        color: AppTheme.primaryRed,
                        borderRadius: BorderRadius.only(
                          bottomLeft: Radius.circular(2),
                          bottomRight: Radius.circular(2),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.primaryRed,
                            blurRadius: 6,
                            spreadRadius: 1,
                            offset: Offset(0, 1),
                          ),
                        ],
                      ),
                    ),
                  ),
                  
                  // Navigation Items
                  Row(
                    children: [
                      _buildNavBarItem(0, Icons.home_outlined, Icons.home_rounded, 'Home'),
                      _buildNavBarItem(1, Icons.emoji_events_outlined, Icons.emoji_events_rounded, 'Contest'),
                      _buildNavBarItem(2, Icons.account_balance_wallet_outlined, Icons.account_balance_wallet_rounded, 'Wallet'),
                      _buildNavBarItem(3, Icons.stars_outlined, Icons.stars_rounded, 'Rewards'),
                      _buildNavBarItem(4, Icons.person_outlined, Icons.person_rounded, 'Profile'),
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

  Widget _buildNavBarItem(int index, IconData outlineIcon, IconData filledIcon, String label) {
    final isSelected = _currentIndex == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => _onTabTapped(index),
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedScale(
              scale: isSelected ? 1.15 : 1.0,
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeOutBack,
              child: Icon(
                isSelected ? filledIcon : outlineIcon,
                color: isSelected ? AppTheme.white : AppTheme.greyMedium,
                size: 22,
              ),
            ),
            const SizedBox(height: 4),
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 200),
              style: TextStyle(
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                color: isSelected ? AppTheme.white : AppTheme.greyMedium,
                letterSpacing: 0.2,
              ),
              child: Text(label),
            ),
          ],
        ),
      ),
    );
  }
}

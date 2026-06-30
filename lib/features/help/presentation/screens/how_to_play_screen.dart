import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class HowToPlayItem {
  final String category;
  final String title;
  final String description;
  final IconData icon;
  const HowToPlayItem({
    required this.category,
    required this.title,
    required this.description,
    required this.icon,
  });
}

const List<HowToPlayItem> howToPlayData = [
  HowToPlayItem(
    category: 'Getting Started',
    title: 'Create Your Account',
    description: 'Download the Dream Home 11 app and sign up using your phone number. Complete your profile by adding a name and avatar. Make sure to complete KYC verification to unlock withdrawals and prize eligibility.',
    icon: Icons.person_add_rounded,
  ),
  HowToPlayItem(
    category: 'Getting Started',
    title: 'Explore the Dashboard',
    description: 'The home screen shows your points balance, active contests, and daily activities. Use the bottom navigation to switch between Contests, Feed, Leaderboard, and Profile sections.',
    icon: Icons.dashboard_rounded,
  ),
  HowToPlayItem(
    category: 'Getting Started',
    title: 'Complete Your KYC',
    description: 'Navigate to Profile > KYC Details. Submit your Aadhaar number, PAN card, and upload clear images of your documents and a selfie. KYC is verified instantly and is required for withdrawals.',
    icon: Icons.verified_user_rounded,
  ),
  HowToPlayItem(
    category: 'Earning Points',
    title: 'Join Contests',
    description: 'Browse available contests from the Contests tab. Join free or paid contests, compete with other players, and earn points based on your performance. Higher placements earn more points.',
    icon: Icons.sports_esports_rounded,
  ),
  HowToPlayItem(
    category: 'Earning Points',
    title: 'Daily Activities',
    description: 'Complete daily actions like opening the app, engaging with the feed, and participating in polls. Each action rewards you with points. Track your progress on the Earn Points screen.',
    icon: Icons.calendar_view_day_rounded,
  ),
  HowToPlayItem(
    category: 'Earning Points',
    title: 'Maintain Streaks',
    description: 'Log in and stay active on consecutive days to build streaks. A 7-day streak earns you +100 bonus points, and a 30-day streak rewards you with +600 points. Don\'t break your streak!',
    icon: Icons.local_fire_department_rounded,
  ),
  HowToPlayItem(
    category: 'Earning Points',
    title: 'Spin the Wheel',
    description: 'Visit the Daily Spin page once every day to spin the reward wheel. You can win between 10-50 points depending on your membership tier. Higher tiers unlock better rewards.',
    icon: Icons.casino_rounded,
  ),
  HowToPlayItem(
    category: 'Earning Points',
    title: 'Vote in Daily Polls',
    description: 'Participate in daily polls to share your opinion and earn +20 points per vote. Poll results are displayed with animated charts showing how others voted.',
    icon: Icons.how_to_vote_rounded,
  ),
  HowToPlayItem(
    category: 'Earning Points',
    title: 'Refer Friends',
    description: 'Share your unique referral code from the Invite Friends page. You earn 30 points when a friend signs up using your code, and 50 more points when they complete KYC.',
    icon: Icons.person_add_alt_rounded,
  ),
  HowToPlayItem(
    category: 'Earning Points',
    title: 'Points Multiplier',
    description: 'Your membership tier determines your points multiplier: Bronze (1.0x), Silver (1.1x), Gold (1.25x), and Platinum (1.5x). Higher tiers earn more points from every activity.',
    icon: Icons.speed_rounded,
  ),
  HowToPlayItem(
    category: 'Contests',
    title: 'Types of Contests',
    description: 'Dream Home 11 offers Mega Contests (large prize pools), Normal Contests (standard play), Home Contests (featuring dream home prizes), and Private Contests (invite-only with a code).',
    icon: Icons.category_rounded,
  ),
  HowToPlayItem(
    category: 'Contests',
    title: 'Joining a Contest',
    description: 'Tap on a contest from the Contests tab to view details including entry fee, prize pool, duration, and rules. Tap Join to enter. Some contests are free, while others require a wallet entry fee.',
    icon: Icons.play_circle_rounded,
  ),
  HowToPlayItem(
    category: 'Contests',
    title: 'Creating Private Contests',
    description: 'You can create your own private contest by setting the entry fee, number of slots, rules, and duration. Share the generated code with friends so they can join your exclusive contest.',
    icon: Icons.lock_outline_rounded,
  ),
  HowToPlayItem(
    category: 'Contests',
    title: 'Live Scoring',
    description: 'During a contest, track your rank and points in real-time on the Live screen. See how you stack up against other participants and adjust your strategy to climb the leaderboard.',
    icon: Icons.trending_up_rounded,
  ),
  HowToPlayItem(
    category: 'Winning & Rewards',
    title: 'How Winners Are Selected',
    description: 'Winners are determined by total points earned during the contest period. The participants with the highest points at the end of the contest win. Prizes include points, cash, and dream homes.',
    icon: Icons.emoji_events_rounded,
  ),
  HowToPlayItem(
    category: 'Winning & Rewards',
    title: 'Prize Homes',
    description: 'Top performers in Home Contests can win fully furnished dream homes. Browse the Prize Homes Gallery to see available properties with specifications, features, and locations.',
    icon: Icons.home_rounded,
  ),
  HowToPlayItem(
    category: 'Winning & Rewards',
    title: 'Redeeming Rewards',
    description: 'Visit the Rewards Catalog to redeem your points for gift cards, merchandise, and other exciting rewards. Select a reward and tap Redeem to use your points.',
    icon: Icons.card_giftcard_rounded,
  ),
  HowToPlayItem(
    category: 'Winning & Rewards',
    title: 'Leaderboard Rankings',
    description: 'Compete for top positions on the global and series leaderboards. Weekly, monthly, and all-time rankings determine who earns the biggest rewards and recognition.',
    icon: Icons.leaderboard_rounded,
  ),
  HowToPlayItem(
    category: 'Wallet & Payments',
    title: 'Adding Cash',
    description: 'Go to Wallet > Add Cash to deposit money using your preferred payment method. Receive bonus points on every deposit. Your wallet balance can be used to enter paid contests.',
    icon: Icons.account_balance_wallet_rounded,
  ),
  HowToPlayItem(
    category: 'Wallet & Payments',
    title: 'Withdrawing Winnings',
    description: 'Go to Wallet > Withdraw to cash out your winnings. Minimum withdrawal is ₹100. Add your bank account or UPI details in Manage Payment before withdrawing. KYC must be approved.',
    icon: Icons.logout_rounded,
  ),
  HowToPlayItem(
    category: 'Wallet & Payments',
    title: 'Transaction History',
    description: 'View all your transactions including deposits, withdrawals, contest fees, and winnings from the Wallet screen. Filter by type to find specific transactions quickly.',
    icon: Icons.receipt_long_rounded,
  ),
  HowToPlayItem(
    category: 'Community',
    title: 'Community Feed',
    description: 'Share your achievements, strategies, and moments with the Dream Home 11 community. Post updates, like and comment on other players\' content, and build your network.',
    icon: Icons.rss_feed_rounded,
  ),
  HowToPlayItem(
    category: 'Community',
    title: 'Chat with Players',
    description: 'Use the in-app chat to communicate with other players. Send direct messages or participate in group chats. Discuss strategies, share tips, and make friends.',
    icon: Icons.chat_rounded,
  ),
  HowToPlayItem(
    category: 'Community',
    title: 'Find People',
    description: 'Search for other players by name or phone number. View their profiles, see their rankings, and connect with top performers on the leaderboard.',
    icon: Icons.person_search_rounded,
  ),
  HowToPlayItem(
    category: 'Tips & Strategies',
    title: 'Maximize Your Earnings',
    description: 'Log in daily to maintain your streak. Complete all daily actions, vote in polls, spin the wheel, and participate in multiple contests. Refer friends for passive point earnings.',
    icon: Icons.tips_and_updates_rounded,
  ),
  HowToPlayItem(
    category: 'Tips & Strategies',
    title: 'Tier Progression',
    description: 'Focus on accumulating lifetime points to climb tiers. Platinum tier (1.5x multiplier) earns 50% more points from every activity compared to Bronze. Participate in high-point contests.',
    icon: Icons.workspace_premium_rounded,
  ),
  HowToPlayItem(
    category: 'Tips & Strategies',
    title: 'Stay Informed',
    description: 'Enable notifications and set reminders for contest start times and daily activities. Check the FAQs and Support pages if you have questions. Follow community guidelines at all times.',
    icon: Icons.notifications_active_rounded,
  ),
];

class HowToPlayScreen extends StatefulWidget {
  const HowToPlayScreen({super.key});
  @override
  State<HowToPlayScreen> createState() => _HowToPlayScreenState();
}

class _HowToPlayScreenState extends State<HowToPlayScreen> {
  @override
  Widget build(BuildContext context) {
    final categories = howToPlayData.map((e) => e.category).toSet().toList();
    return Scaffold(
      appBar: AppBar(
        title: const Text('How to Play'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: categories.length,
        itemBuilder: (context, index) {
          final category = categories[index];
          final items = howToPlayData.where((e) => e.category == category).toList();
          return _buildCategorySection(context, category, items);
        },
      ),
    );
  }

  Widget _buildCategorySection(BuildContext context, String category, List<HowToPlayItem> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 16, bottom: 12),
          child: Text(
            category,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
              color: AppTheme.primaryRed,
            ),
          ),
        ),
        ...items.map((item) => Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Container(
            clipBehavior: Clip.antiAlias,
            decoration: BoxDecoration(
              gradient: AppTheme.darkCardGradient,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0x1FFFFFFF)),
            ),
            child: ExpansionTile(
              shape: const Border(),
              collapsedShape: const Border(),
              leading: Icon(item.icon, color: AppTheme.goldYellow, size: 20),
              title: Text(
                item.title,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              iconColor: AppTheme.primaryRed,
              collapsedIconColor: AppTheme.greyMedium,
              backgroundColor: Colors.transparent,
              collapsedBackgroundColor: Colors.transparent,
              children: [
                Text(
                  item.description,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppTheme.greyMedium,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        )),
      ],
    );
  }
}

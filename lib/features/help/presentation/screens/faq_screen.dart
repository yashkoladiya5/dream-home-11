import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class FaqItem {
  final String category;
  final String question;
  final String answer;
  const FaqItem({required this.category, required this.question, required this.answer});
}

const List<FaqItem> faqData = [
  FaqItem(category: 'General', question: 'What is Dream Home 11?', answer: 'Dream Home 11 is a gamified loyalty platform where you can participate in contests, earn points, and win dream homes and other exciting rewards.'),
  FaqItem(category: 'General', question: 'How do I earn points?', answer: 'You can earn points by joining and winning contests, completing daily activities like opening the app and engaging with the feed, maintaining streaks, spinning the reward wheel, voting in daily polls, and referring friends.'),
  FaqItem(category: 'General', question: 'Is Dream Home 11 free to use?', answer: 'Yes, signing up is free. Some contests may require an entry fee using wallet balance, but there are also free contests and multiple ways to earn points without spending money.'),
  FaqItem(category: 'General', question: 'How do I change my language preference?', answer: 'You can change your language from the Settings or Language screen accessible from your Profile page.'),
  FaqItem(category: 'Account & KYC', question: 'How do I complete my KYC?', answer: 'Go to your Profile and tap on KYC Details. You will need to enter your Aadhaar and PAN numbers and upload clear images of your documents and a selfie.'),
  FaqItem(category: 'Account & KYC', question: 'Why is KYC required?', answer: 'KYC is mandatory to withdraw cash winnings and to claim prize homes. It helps us verify your identity and comply with legal regulations.'),
  FaqItem(category: 'Account & KYC', question: 'How long does KYC verification take?', answer: 'KYC is typically verified instantly. In some cases, it may take up to 24 hours for manual review.'),
  FaqItem(category: 'Account & KYC', question: 'Can I update my profile details?', answer: 'Yes, you can edit your name, email, and avatar from the Edit Profile section in your Profile page.'),
  FaqItem(category: 'Payments & Wallet', question: 'How do I add cash to my wallet?', answer: 'Go to Wallet > Add Cash. Choose an amount or enter a custom amount, select a payment method, and complete the payment. You will receive bonus points on every deposit.'),
  FaqItem(category: 'Payments & Wallet', question: 'How do I withdraw money?', answer: 'Go to Wallet > Withdraw. Enter the amount (minimum ₹100) and select your payment method. Ensure your KYC is approved and bank details are saved.'),
  FaqItem(category: 'Payments & Wallet', question: 'What are the withdrawal limits?', answer: 'The minimum withdrawal amount is ₹100. Maximum limits may vary based on your account tier and verification status.'),
  FaqItem(category: 'Payments & Wallet', question: 'Which states are restricted?', answer: 'Users from Assam, Odisha, and Telangana are currently restricted from making withdrawals due to local regulations.'),
  FaqItem(category: 'Payments & Wallet', question: 'How do I save my bank details?', answer: 'Go to Wallet > Manage Payment to add or update your bank account and UPI details.'),
  FaqItem(category: 'Contests', question: 'How do I join a contest?', answer: 'Browse available contests from the Contests tab, select one that interests you, review the rules and entry fee, and tap Join.'),
  FaqItem(category: 'Contests', question: 'What are the different contest types?', answer: 'We offer Mega Contests, Normal Contests, Home Contests (with dream home prizes), and Private Contests (invite-only with a code).'),
  FaqItem(category: 'Contests', question: 'How are winners selected?', answer: 'Winners are determined based on points earned during the contest period. The participants with the highest points at the end of the contest win.'),
  FaqItem(category: 'Contests', question: 'Can I create my own contest?', answer: 'Yes! You can create a private contest from the Create Contest option. Set your own entry fee, slots, and rules, then invite friends using the generated code.'),
  FaqItem(category: 'Rewards & Points', question: 'What can I redeem my points for?', answer: 'Points can be redeemed for gift cards, merchandise, and other rewards from the Rewards Catalog. You can also use points to enter certain contests.'),
  FaqItem(category: 'Rewards & Points', question: 'How do points multipliers work?', answer: 'Your tier determines your points multiplier: Bronze (1.0x), Silver (1.1x), Gold (1.25x), and Platinum (1.5x). Higher tiers earn more points from the same activities.'),
  FaqItem(category: 'Rewards & Points', question: 'What is a streak bonus?', answer: 'You earn streak bonuses by logging in and being active on consecutive days. A 7-day streak earns +100 points and a 30-day streak earns +600 points.'),
  FaqItem(category: 'Rewards & Points', question: 'How do I refer a friend?', answer: 'Share your unique referral code from the Invite Friends page. You earn 30 points when they sign up and 50 more when they complete KYC.'),
  FaqItem(category: 'Technical', question: 'The app is not loading properly', answer: 'Try closing and reopening the app, check your internet connection, or restart your device. If the problem persists, contact support.'),
  FaqItem(category: 'Technical', question: 'I am not receiving OTP', answer: 'Ensure you have entered the correct phone number with country code. Wait for 60 seconds before requesting a new OTP. Check if your device has network connectivity.'),
  FaqItem(category: 'Technical', question: 'How do I contact support?', answer: 'You can submit a support ticket from the Support page in your Profile, or email us at support@dreamhome11.com.'),
];

class FaqScreen extends StatefulWidget {
  const FaqScreen({super.key});
  @override
  State<FaqScreen> createState() => _FaqScreenState();
}

class _FaqScreenState extends State<FaqScreen> {
  @override
  Widget build(BuildContext context) {
    final categories = faqData.map((e) => e.category).toSet().toList();
    return Scaffold(
      appBar: AppBar(
        title: const Text('FAQs'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: categories.length,
        itemBuilder: (context, index) {
          final category = categories[index];
          final items = faqData.where((e) => e.category == category).toList();
          return _buildCategorySection(context, category, items);
        },
      ),
    );
  }

  Widget _buildCategorySection(BuildContext context, String category, List<FaqItem> items) {
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
              title: Text(
                item.question,
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
                  item.answer,
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

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/user_profile_provider.dart';
import '../widgets/shimmer_widget.dart';

class WalletTab extends ConsumerStatefulWidget {
  const WalletTab({super.key});

  @override
  ConsumerState<WalletTab> createState() => _WalletTabState();
}

class _WalletTabState extends ConsumerState<WalletTab> {
  double _selectedAmount = 100.0;
  bool _isDepositing = false;

  void _onQuickAmountSelected(double amount) {
    setState(() {
      _selectedAmount = amount;
    });
  }

  Future<void> _handleDeposit() async {
    setState(() {
      _isDepositing = true;
    });

    final success = await ref.read(userProfileProvider.notifier).deposit(_selectedAmount);

    if (mounted) {
      setState(() {
        _isDepositing = false;
      });

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppTheme.emeraldGreen,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            content: Text(
              'Successfully deposited ₹${_selectedAmount.toStringAsFixed(2)} to your wallet!',
              style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.white),
            ),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppTheme.primaryRed,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            content: const Text(
              'Deposit failed. Please try again.',
              style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.white),
            ),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final profileState = ref.watch(userProfileProvider);

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 350),
      switchInCurve: Curves.easeIn,
      switchOutCurve: Curves.easeOut,
      child: profileState.when(
        data: (profile) {
          return SingleChildScrollView(
            key: const ValueKey('loaded'),
            physics: const BouncingScrollPhysics(),
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Header
                  Text(
                    'My Wallet',
                    style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                          fontWeight: FontWeight.w900,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Manage your funds and bonus game points.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppTheme.greyMedium,
                        ),
                  ),
                  const SizedBox(height: 24),

                  // Wallet Balance Cards
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      gradient: AppTheme.darkCardGradient,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: const Color(0x0CFFFFFF)),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x05000000),
                          blurRadius: 10,
                          offset: Offset(0, 5),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'UNUTILIZED CASH',
                                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                        color: AppTheme.greyMedium,
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 1.0,
                                      ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  '₹${profile.walletBalanceInr.toStringAsFixed(2)}',
                                  style: Theme.of(context).textTheme.displayLarge?.copyWith(
                                        fontWeight: FontWeight.w900,
                                        fontSize: 32,
                                      ),
                                ),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppTheme.emeraldGreen.withValues(alpha: 0.12),
                                shape: BoxShape.circle,
                                border: Border.all(color: AppTheme.emeraldGreen.withValues(alpha: 0.2)),
                              ),
                              child: const Icon(
                                Icons.account_balance_wallet_rounded,
                                color: AppTheme.emeraldGreen,
                                size: 32,
                              ),
                            ),
                          ],
                        ),
                        const Divider(height: 32, color: Color(0x12FFFFFF)),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'EARNED POINTS',
                                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                        color: AppTheme.greyMedium,
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 1.0,
                                      ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  '${profile.pointsBalance} PTS',
                                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                                        fontWeight: FontWeight.bold,
                                        color: AppTheme.goldYellow,
                                      ),
                                ),
                              ],
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  'BONUS TIER',
                                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                        color: AppTheme.greyMedium,
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 1.0,
                                      ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  profile.currentTier.toUpperCase(),
                                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                        fontWeight: FontWeight.bold,
                                      ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Deposit Section
                  Text(
                    'Add Cash to Wallet',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildQuickAmountButton(context, 100.0, '₹100'),
                      _buildQuickAmountButton(context, 500.0, '₹500'),
                      _buildQuickAmountButton(context, 1000.0, '₹1,000'),
                    ],
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _isDepositing ? null : _handleDeposit,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: AppTheme.primaryRed,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: 4,
                      shadowColor: AppTheme.primaryRed.withValues(alpha: 0.3),
                    ),
                    child: _isDepositing
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.0,
                              valueColor: AlwaysStoppedAnimation<Color>(AppTheme.white),
                            ),
                          )
                        : Text('PROCEED TO DEPOSIT ₹${_selectedAmount.toStringAsFixed(0)}'),
                  ),

                  const SizedBox(height: 32),

                  // Recent Transactions Placeholder
                  Text(
                    'Recent Transactions',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 12),
                  _buildTransactionTile(
                    context,
                    title: 'Cash Deposit Success',
                    subtitle: 'Via Wallet Portal • Just Now',
                    amount: '+₹100.00',
                    isCredit: true,
                  ),
                  const SizedBox(height: 8),
                  _buildTransactionTile(
                    context,
                    title: 'Contest Entry Fee Debit',
                    subtitle: 'Mega Dream Home • 14 Jun, 06:12 PM',
                    amount: '-₹49.00',
                    isCredit: false,
                  ),
                ],
              ),
            ),
          );
        },
        loading: () {
          return SingleChildScrollView(
            key: const ValueKey('loading'),
            physics: const NeverScrollableScrollPhysics(),
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const ShimmerLine(width: 110, height: 22),
                  const SizedBox(height: 8),
                  const ShimmerLine(width: 220, height: 14),
                  const SizedBox(height: 24),
                  const ShimmerCard(height: 170),
                  const SizedBox(height: 32),
                  const ShimmerLine(width: 140, height: 18),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: const [
                      ShimmerCard(width: 90, height: 48, borderRadius: 12),
                      ShimmerCard(width: 90, height: 48, borderRadius: 12),
                      ShimmerCard(width: 90, height: 48, borderRadius: 12),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const ShimmerCard(height: 52, borderRadius: 16),
                  const SizedBox(height: 32),
                  const ShimmerLine(width: 150, height: 18),
                  const SizedBox(height: 12),
                  const ShimmerCard(height: 72, borderRadius: 16),
                  const SizedBox(height: 8),
                  const ShimmerCard(height: 72, borderRadius: 16),
                ],
              ),
            ),
          );
        },
        error: (err, stack) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline_rounded, color: AppTheme.primaryRed, size: 48),
                const SizedBox(height: 16),
                const Text('Failed to load wallet details', textAlign: TextAlign.center),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () => ref.read(userProfileProvider.notifier).fetchProfile(),
                  child: const Text('RETRY'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildQuickAmountButton(BuildContext context, double amount, String label) {
    final isSelected = _selectedAmount == amount;
    return Container(
      width: MediaQuery.of(context).size.width * 0.27,
      decoration: BoxDecoration(
        color: isSelected ? AppTheme.primaryRed.withValues(alpha: 0.12) : const Color(0x0CFFFFFF),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isSelected ? AppTheme.primaryRed : const Color(0x0FFFFFFF),
          width: isSelected ? 1.5 : 1.0,
        ),
      ),
      child: InkWell(
        onTap: () => _onQuickAmountSelected(amount),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 14.0),
          child: Center(
            child: Text(
              label,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: isSelected ? AppTheme.white : AppTheme.white.withValues(alpha: 0.7),
                  ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTransactionTile(
    BuildContext context, {
    required String title,
    required String subtitle,
    required String amount,
    required bool isCredit,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0x0CFFFFFF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x0FFFFFFF)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.greyMedium,
                      fontSize: 12,
                    ),
              ),
            ],
          ),
          Text(
            amount,
            style: TextStyle(
              color: isCredit ? AppTheme.emeraldGreen : AppTheme.primaryRed,
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }
}


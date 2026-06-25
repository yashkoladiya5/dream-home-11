import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../dashboard/presentation/providers/user_profile_provider.dart';
import '../../../dashboard/data/models/user_profile.dart';
import '../providers/deposit_provider.dart';

class AddCashScreen extends ConsumerStatefulWidget {
  const AddCashScreen({super.key});

  @override
  ConsumerState<AddCashScreen> createState() => _AddCashScreenState();
}

class _AddCashScreenState extends ConsumerState<AddCashScreen> {
  final _amountController = TextEditingController();
  final _focusNode = FocusNode();
  double? _selectedAmount;
  String? _selectedMethod;
  bool _isProcessing = false;
  bool _showSuccess = false;

  static const _quickAmounts = [100, 200, 500, 1000, 2000];

  static const _paymentMethods = [
    _PaymentMethod('PhonePe', Icons.phone_android_rounded, Color(0xFF5F259F)),
    _PaymentMethod('Google Pay', Icons.g_mobiledata_rounded, Color(0xFF4285F4)),
    _PaymentMethod('Paytm', Icons.account_balance_wallet_rounded, Color(0xFF00BAF2)),
    _PaymentMethod('Credit/Debit Card', Icons.credit_card_rounded, Color(0xFF2D7D9A)),
    _PaymentMethod('UPI', Icons.qr_code_rounded, Color(0xFF6C5CE7)),
  ];

  @override
  void dispose() {
    _amountController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  double get _effectiveAmount => _selectedAmount ?? double.tryParse(_amountController.text) ?? 0;

  void _onProcessingComplete(UserProfile profile) {
    setState(() {
      _isProcessing = false;
      _showSuccess = true;
    });
    ref.read(userProfileProvider.notifier).fetchProfile();
  }

  Future<void> _proceed() async {
    final amount = _effectiveAmount;
    if (amount <= 0) return;
    if (_selectedMethod == null) return;

    setState(() => _isProcessing = true);

    final result = await ref.read(depositProvider).deposit(amount);
    if (!mounted) return;

    if (result != null) {
      _onProcessingComplete(result);
    } else {
      setState(() => _isProcessing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Deposit failed. Please try again.'),
          backgroundColor: AppTheme.primaryRed,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final profileAsync = ref.watch(userProfileProvider);

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Add Cash'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: profileAsync.when(
        data: (profile) {
          if (_showSuccess) {
            return _buildSuccess(theme, profile);
          }
          return _buildForm(theme, profile);
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, s) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline_rounded, color: AppTheme.primaryRed, size: 48),
              const SizedBox(height: 16),
              const Text('Failed to load profile', style: TextStyle(color: AppTheme.greyMedium)),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => ref.read(userProfileProvider.notifier).fetchProfile(),
                child: const Text('RETRY'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildForm(ThemeData theme, UserProfile profile) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: AppTheme.darkCardGradient,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0x1FFFFFFF)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Current Balance', style: theme.textTheme.bodySmall?.copyWith(color: AppTheme.greyMedium)),
                const SizedBox(height: 6),
                Text(
                  '\u20B9${profile.walletBalanceInr.toStringAsFixed(2)}',
                  style: theme.textTheme.displayMedium?.copyWith(fontWeight: FontWeight.w900),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text('Select Amount', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: _quickAmounts.map((amount) {
              final selected = _selectedAmount == amount;
              return GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedAmount = amount.toDouble();
                    _amountController.clear();
                  });
                  _focusNode.unfocus();
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                  decoration: BoxDecoration(
                    gradient: selected ? AppTheme.goldGradient : AppTheme.darkCardGradient,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: selected ? AppTheme.goldYellow : const Color(0x1FFFFFFF),
                    ),
                  ),
                  child: Text(
                    '\u20B9$amount',
                    style: TextStyle(
                      color: selected ? Colors.white : AppTheme.greyLight,
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 52,
                  child: TextField(
                    controller: _amountController,
                    focusNode: _focusNode,
                    keyboardType: TextInputType.number,
                    style: const TextStyle(color: Colors.white, fontSize: 16),
                    decoration: InputDecoration(
                      prefixText: '\u20B9 ',
                      prefixStyle: const TextStyle(color: AppTheme.greyMedium, fontSize: 16),
                      hintText: 'Custom amount',
                      hintStyle: TextStyle(color: AppTheme.greyMedium.withValues(alpha: 0.6)),
                      filled: true,
                      fillColor: AppTheme.secondarySlate,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: AppTheme.greyDark.withValues(alpha: 0.5)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppTheme.primaryRed),
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    ),
                    onChanged: (_) {
                      setState(() => _selectedAmount = null);
                    },
                  ),
                ),
              ),
            ],
          ),
          if (_effectiveAmount > 0 && (_effectiveAmount < 10 || _effectiveAmount > 50000))
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                'Amount must be between \u20B910 and \u20B950,000',
                style: TextStyle(color: AppTheme.primaryRed, fontSize: 12),
              ),
            ),
          const SizedBox(height: 24),
          Text('Payment Method', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          ..._paymentMethods.map((method) {
            final selected = _selectedMethod == method.name;
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: GestureDetector(
                onTap: () => setState(() => _selectedMethod = method.name),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    gradient: selected ? AppTheme.darkCardGradient : AppTheme.darkCardGradient,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: selected ? method.color : const Color(0x1FFFFFFF),
                      width: selected ? 1.5 : 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: method.color.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(method.icon, color: method.color, size: 22),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Text(
                          method.name,
                          style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                        ),
                      ),
                      Container(
                        width: 22,
                        height: 22,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: selected ? method.color : AppTheme.greyMedium.withValues(alpha: 0.4),
                            width: 2,
                          ),
                          color: selected ? method.color : Colors.transparent,
                        ),
                        child: selected
                            ? const Icon(Icons.check_rounded, size: 14, color: Colors.white)
                            : null,
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _effectiveAmount < 10 || _effectiveAmount > 50000 || _selectedMethod == null || _isProcessing
                  ? null
                  : _proceed,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryRed,
                disabledBackgroundColor: AppTheme.greyDark,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: _isProcessing
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                    )
                  : Text(
                      'Proceed to Pay \u20B9${_effectiveAmount.toStringAsFixed(0)}',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                    ),
            ),
          ),
          const SizedBox(height: 12),
          Center(
            child: Text(
              'Secure payment • No extra charges',
              style: theme.textTheme.bodySmall?.copyWith(color: AppTheme.greyMedium, fontSize: 12),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildSuccess(ThemeData theme, UserProfile profile) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppTheme.emeraldGreen.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle_rounded, color: AppTheme.emeraldGreen, size: 48),
            ),
            const SizedBox(height: 24),
            Text(
              'Deposit Successful!',
              style: theme.textTheme.headlineLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              '\u20B9${_effectiveAmount.toStringAsFixed(0)}',
              style: theme.textTheme.displayLarge?.copyWith(
                fontWeight: FontWeight.w900,
                color: AppTheme.emeraldGreen,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'has been added to your wallet',
              style: theme.textTheme.bodyMedium?.copyWith(color: AppTheme.greyMedium),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                gradient: AppTheme.darkCardGradient,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0x1FFFFFFF)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('New Balance: ', style: TextStyle(color: AppTheme.greyMedium)),
                  Text(
                    '\u20B9${profile.walletBalanceInr.toStringAsFixed(2)}',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: () => context.pop(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryRed,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: const Text('Done', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PaymentMethod {
  final String name;
  final IconData icon;
  final Color color;

  const _PaymentMethod(this.name, this.icon, this.color);
}

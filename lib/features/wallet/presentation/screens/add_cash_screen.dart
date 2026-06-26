import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../dashboard/presentation/providers/user_profile_provider.dart';
import '../../../dashboard/data/models/user_profile.dart';
import '../providers/payment_provider.dart';
import '../../data/models/payment_order.dart';

class AddCashScreen extends ConsumerStatefulWidget {
  const AddCashScreen({super.key});

  @override
  ConsumerState<AddCashScreen> createState() => _AddCashScreenState();
}

class _AddCashScreenState extends ConsumerState<AddCashScreen>
    with SingleTickerProviderStateMixin {
  final _amountController = TextEditingController();
  final _focusNode = FocusNode();
  double? _selectedAmount;
  String? _selectedMethod;
  bool _isProcessing = false;
  bool _showSuccess = false;
  bool _showProcessingAnimation = false;
  String _processingStep = '';
  PaymentVerification? _verificationResult;
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  static const _quickAmounts = [100, 200, 500, 1000, 2000];

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 0.85, end: 1.15).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _amountController.dispose();
    _focusNode.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  double get _effectiveAmount =>
      _selectedAmount ?? double.tryParse(_amountController.text) ?? 0;

  IconData _methodIcon(String? method) {
    switch (method) {
      case 'UPI': return Icons.phone_android_rounded;
      case 'Credit/Debit Card': return Icons.credit_card_rounded;
      case 'Net Banking': return Icons.account_balance_rounded;
      case 'Wallet': return Icons.account_balance_wallet_rounded;
      default: return Icons.payment_rounded;
    }
  }

  Color _methodColor(String? method) {
    switch (method) {
      case 'UPI': return const Color(0xFF6C5CE7);
      case 'Credit/Debit Card': return const Color(0xFF2D7D9A);
      case 'Net Banking': return const Color(0xFFE17055);
      case 'Wallet': return const Color(0xFF00BAF2);
      default: return AppTheme.greyMedium;
    }
  }

  String? _displayNameForCategory(String? key) {
    switch (key) {
      case 'upi': return 'UPI';
      case 'card': return 'Credit/Debit Card';
      case 'net_banking': return 'Net Banking';
      case 'wallet': return 'Wallet';
      default: return key;
    }
  }

  void _resetToForm() {
    setState(() {
      _isProcessing = false;
      _showSuccess = false;
      _showProcessingAnimation = false;
      _processingStep = '';
      _verificationResult = null;
    });
  }

  Future<void> _proceed() async {
    final amount = _effectiveAmount;
    if (amount <= 0) return;
    if (_selectedMethod == null) return;

    setState(() {
      _isProcessing = true;
      _showProcessingAnimation = true;
      _processingStep = 'Connecting to $_selectedMethod...';
    });

    final order =
        await ref.read(paymentProvider).createOrder(amount, paymentMethod: _selectedMethod);
    if (!mounted) return;

    if (order == null) {
      _resetToForm();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Failed to create payment order. Please try again.'),
          backgroundColor: AppTheme.primaryRed,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
      return;
    }

    await Future.delayed(const Duration(seconds: 2));
    if (!mounted) return;

    setState(() => _processingStep = 'Payment Successful!');

    await Future.delayed(const Duration(milliseconds: 800));
    if (!mounted) return;

    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final result = await ref.read(paymentProvider).verifyPayment(
      order.orderId,
      'PAY_sim_$timestamp',
    );
    if (!mounted) return;

    if (result != null && result.success) {
      setState(() {
        _verificationResult = result;
        _showProcessingAnimation = false;
        _showSuccess = true;
        _isProcessing = false;
      });
      ref.read(userProfileProvider.notifier).fetchProfile();
    } else {
      _resetToForm();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Payment verification failed. Please try again.'),
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
          if (_showProcessingAnimation) {
            return _buildProcessingAnimation(theme);
          }
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

  Widget _buildProcessingAnimation(ThemeData theme) {
    final isComplete = _processingStep == 'Payment Successful!';
    final icon = _methodIcon(_selectedMethod);
    final color = _methodColor(_selectedMethod);

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedBuilder(
              animation: _pulseAnimation,
              builder: (context, child) {
                return Transform.scale(
                  scale: isComplete ? 1.0 : _pulseAnimation.value,
                  child: Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isComplete
                          ? AppTheme.emeraldGreen.withValues(alpha: 0.15)
                          : color.withValues(alpha: 0.15),
                      border: Border.all(
                        color: isComplete
                            ? AppTheme.emeraldGreen
                            : color.withValues(alpha: 0.5),
                        width: 2,
                      ),
                    ),
                    child: isComplete
                        ? const Icon(
                            Icons.check_circle_rounded,
                            color: AppTheme.emeraldGreen,
                            size: 52,
                          )
                        : Icon(
                            icon,
                            color: color,
                            size: 44,
                          ),
                  ),
                );
              },
            ),
            const SizedBox(height: 32),
            Text(
              _processingStep,
              style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            if (!isComplete)
              const Text(
                'Do not close this screen',
                style: TextStyle(color: AppTheme.greyMedium, fontSize: 14),
              ),
            if (!isComplete) ...[
              const SizedBox(height: 24),
              const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                    strokeWidth: 2.5, color: Colors.white),
              ),
            ],
          ],
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
                Text('Current Balance',
                    style: theme.textTheme.bodySmall
                        ?.copyWith(color: AppTheme.greyMedium)),
                const SizedBox(height: 6),
                Text(
                  '\u20B9${profile.walletBalanceInr.toStringAsFixed(2)}',
                  style: theme.textTheme.displayMedium
                      ?.copyWith(fontWeight: FontWeight.w900),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text('Select Amount',
              style: theme.textTheme.titleLarge
                  ?.copyWith(fontWeight: FontWeight.bold)),
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
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                  decoration: BoxDecoration(
                    gradient:
                        selected ? AppTheme.goldGradient : AppTheme.darkCardGradient,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: selected
                          ? AppTheme.goldYellow
                          : const Color(0x1FFFFFFF),
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
                    style:
                        const TextStyle(color: Colors.white, fontSize: 16),
                    decoration: InputDecoration(
                      prefixText: '\u20B9 ',
                      prefixStyle: const TextStyle(
                          color: AppTheme.greyMedium, fontSize: 16),
                      hintText: 'Custom amount',
                      hintStyle: TextStyle(
                        color: AppTheme.greyMedium.withValues(alpha: 0.6),
                      ),
                      filled: true,
                      fillColor: AppTheme.secondarySlate,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(
                          color: AppTheme.greyDark.withValues(alpha: 0.5),
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppTheme.primaryRed),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 14),
                    ),
                    onChanged: (_) {
                      setState(() => _selectedAmount = null);
                    },
                  ),
                ),
              ),
            ],
          ),
          if (_effectiveAmount > 0 &&
              (_effectiveAmount < 10 || _effectiveAmount > 50000))
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                'Amount must be between \u20B910 and \u20B950,000',
                style: TextStyle(color: AppTheme.primaryRed, fontSize: 12),
              ),
            ),
          const SizedBox(height: 24),
          Text('Payment Method',
              style: theme.textTheme.titleLarge
                  ?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          GestureDetector(
            onTap: () async {
              final result = await context.push<String>('/payment-options');
              if (result != null) {
                setState(() {
                  _selectedMethod = _displayNameForCategory(result);
                });
              }
            },
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: AppTheme.darkCardGradient,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: _selectedMethod != null ? const Color(0xFF6C5CE7) : const Color(0x1FFFFFFF),
                  width: _selectedMethod != null ? 1.5 : 1,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: (_selectedMethod != null ? const Color(0xFF6C5CE7) : AppTheme.greyMedium).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      _selectedMethod != null ? Icons.check_circle_rounded : Icons.payment_rounded,
                      color: _selectedMethod != null ? const Color(0xFF6C5CE7) : AppTheme.greyMedium,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _selectedMethod != null ? _selectedMethod! : 'Select a payment method',
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: _selectedMethod != null ? Colors.white : AppTheme.greyMedium,
                          ),
                        ),
                        if (_selectedMethod != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            'Tap to change',
                            style: theme.textTheme.bodySmall?.copyWith(color: AppTheme.greyMedium, fontSize: 11),
                          ),
                        ],
                      ],
                    ),
                  ),
                  Icon(Icons.chevron_right_rounded, color: AppTheme.greyMedium),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _effectiveAmount < 10 ||
                      _effectiveAmount > 50000 ||
                      _selectedMethod == null ||
                      _isProcessing
                  ? null
                  : _proceed,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryRed,
                disabledBackgroundColor: AppTheme.greyDark,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
              ),
              child: _isProcessing
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                          strokeWidth: 2.5, color: Colors.white),
                    )
                  : Text(
                      'Proceed to Pay \u20B9${_effectiveAmount.toStringAsFixed(0)}',
                      style: const TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w700),
                    ),
            ),
          ),
          const SizedBox(height: 12),
          Center(
            child: Text(
              'Secure payment \u2022 No extra charges',
              style: theme.textTheme.bodySmall
                  ?.copyWith(color: AppTheme.greyMedium, fontSize: 12),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildSuccess(ThemeData theme, UserProfile profile) {
    final bonusPoints = _verificationResult?.bonusPoints ?? 0;
    final walletBalance = _verificationResult?.walletBalance ?? profile.walletBalanceInr;

    return Center(
      child: SingleChildScrollView(
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
              child: const Icon(Icons.check_circle_rounded,
                  color: AppTheme.emeraldGreen, size: 48),
            ),
            const SizedBox(height: 24),
            Text(
              'Deposit Successful!',
              style: theme.textTheme.headlineLarge
                  ?.copyWith(fontWeight: FontWeight.bold),
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
              style: theme.textTheme.bodyMedium
                  ?.copyWith(color: AppTheme.greyMedium),
            ),
            if (bonusPoints > 0) ...[
              const SizedBox(height: 16),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFFF3CD), Color(0xFFFFE082)],
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.workspace_premium_rounded,
                        color: Color(0xFFB8860B), size: 20),
                    const SizedBox(width: 8),
                    Text(
                      '$bonusPoints Bonus Points awarded!',
                      style: const TextStyle(
                        color: Color(0xFF7A6200),
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                gradient: AppTheme.darkCardGradient,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0x1FFFFFFF)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('New Balance: ',
                      style: TextStyle(color: AppTheme.greyMedium)),
                  Text(
                    '\u20B9${walletBalance.toStringAsFixed(2)}',
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 18),
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
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                ),
                child: const Text('Done',
                    style:
                        TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}


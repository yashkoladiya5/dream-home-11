import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../dashboard/presentation/providers/user_profile_provider.dart';
import '../providers/withdraw_provider.dart';
import '../providers/bank_details_provider.dart';
import '../../data/models/restricted_states.dart';

class WithdrawScreen extends ConsumerStatefulWidget {
  const WithdrawScreen({super.key});

  @override
  ConsumerState<WithdrawScreen> createState() => _WithdrawScreenState();
}

class _WithdrawScreenState extends ConsumerState<WithdrawScreen>
    with SingleTickerProviderStateMixin {
  final _amountController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  int? _selectedAmount;
  AnimationController? _animController;

  static const _quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  bool _isProcessing = false;
  bool _showSuccess = false;
  String? _successAmount;
  double? _newBalance;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
  }

  @override
  void dispose() {
    _amountController.dispose();
    _animController?.dispose();
    super.dispose();
  }

  Future<void> _proceed() async {
    if (!_formKey.currentState!.validate()) return;

    final amount = _selectedAmount?.toDouble() ?? double.tryParse(_amountController.text.trim()) ?? 0.0;
    if (amount < 100) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Minimum withdrawal amount is ₹100'),
          backgroundColor: AppTheme.primaryRed,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
      return;
    }

    setState(() => _isProcessing = true);
    _animController?.repeat(reverse: true);

    final bankDetails = ref.read(bankDetailsProvider);
    try {
      final result = await ref.read(withdrawProvider).requestWithdrawal(
        amount: amount,
        bankAccountNumber: bankDetails?.bankAccountNumber,
        bankIfsc: bankDetails?.bankIfsc,
        bankName: bankDetails?.bankName,
        upiId: bankDetails?.upiId,
      );

      _animController?.stop();
      _animController?.reset();

      if (!mounted) return;

      if (result != null) {
        final profileValue = ref.read(userProfileProvider).value;
        setState(() {
          _showSuccess = true;
          _isProcessing = false;
          _successAmount = '₹${amount.toStringAsFixed(0)}';
          _newBalance = (profileValue?.walletBalanceInr ?? 0) - amount;
        });
      } else {
        setState(() => _isProcessing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Withdrawal failed. Please try again.'),
            backgroundColor: AppTheme.primaryRed,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    } catch (e) {
      _animController?.stop();
      _animController?.reset();
      if (!mounted) return;
      setState(() => _isProcessing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString()),
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
    final bankDetails = ref.watch(bankDetailsProvider);

    if (_showSuccess) return _buildSuccess(theme);

    final userState = profileAsync.value?.state;
    final restrictedMessage = getRestrictedStateMessage(userState);
    final isRestricted = restrictedMessage != null;

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Withdraw Cash'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            _buildBalanceCard(theme, profileAsync),
            const SizedBox(height: 24),
            if (isRestricted)
              _buildRestrictedWarning(theme, restrictedMessage)
            else ...[
              _buildAmountSection(theme),
              const SizedBox(height: 20),
              _buildPaymentMethod(theme, bankDetails),
              const SizedBox(height: 24),
              _buildInfoNotice(theme),
              const SizedBox(height: 24),
              _buildSubmitButton(theme),
            ],
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildBalanceCard(ThemeData theme, AsyncValue profileAsync) {
    final balance = profileAsync.value?.walletBalanceInr ?? 0.0;
    return Container(
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
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppTheme.primaryRed.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.account_balance_wallet_rounded, color: AppTheme.primaryRed, size: 22),
              ),
              const SizedBox(width: 12),
              Text('Available Balance', style: theme.textTheme.bodySmall?.copyWith(color: AppTheme.greyMedium)),
            ],
          ),
          const SizedBox(height: 12),
          Text('₹${balance.toStringAsFixed(2)}', style: theme.textTheme.displayMedium?.copyWith(
            fontWeight: FontWeight.bold,
          )),
          const SizedBox(height: 4),
          Text('Minimum withdrawal: ₹100', style: theme.textTheme.bodySmall?.copyWith(color: AppTheme.greyMedium, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildAmountSection(ThemeData theme) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Enter Amount', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text('Choose a quick amount or enter custom', style: theme.textTheme.bodySmall?.copyWith(color: AppTheme.greyMedium)),
          const SizedBox(height: 14),
          TextFormField(
            controller: _amountController,
            style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w600),
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              prefixText: '₹ ',
              prefixStyle: const TextStyle(color: AppTheme.greyMedium, fontSize: 24, fontWeight: FontWeight.w600),
              hintText: 'Custom amount',
              hintStyle: TextStyle(color: AppTheme.greyMedium.withValues(alpha: 0.5), fontSize: 24),
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
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
            ),
            onChanged: (_) {
              setState(() => _selectedAmount = null);
            },
            validator: (v) {
              if (v != null && v.trim().isNotEmpty) {
                final val = double.tryParse(v.trim());
                if (val != null && val < 100) return 'Minimum ₹100';
              }
              return null;
            },
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: _quickAmounts.map((amount) {
              final isSelected = _selectedAmount == amount;
              return GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedAmount = amount;
                    _amountController.clear();
                  });
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  decoration: BoxDecoration(
                    gradient: isSelected ? AppTheme.goldGradient : AppTheme.darkCardGradient,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected ? AppTheme.goldYellow : const Color(0x1FFFFFFF),
                    ),
                  ),
                  child: Text(
                    '₹$amount',
                    style: TextStyle(
                      color: isSelected ? Colors.white : AppTheme.greyLight,
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentMethod(ThemeData theme, dynamic bankDetails) {
    final hasDetails = bankDetails != null &&
        ((bankDetails.bankAccountNumber != null && bankDetails.bankIfsc != null) ||
            bankDetails.upiId != null);

    String displayText = 'Select a payment method';
    if (hasDetails) {
      if (bankDetails.upiId != null) {
        displayText = 'UPI: ${bankDetails.upiId}';
      } else {
        displayText = '${bankDetails.bankName ?? "Bank"} ••••${bankDetails.bankAccountNumber?.substring(bankDetails.bankAccountNumber!.length - 4) ?? ""}';
      }
    }

    return GestureDetector(
      onTap: () {
        context.push('/manage-payment');
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: AppTheme.darkCardGradient,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: hasDetails ? AppTheme.emeraldGreen.withValues(alpha: 0.5) : const Color(0x1FFFFFFF),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: (hasDetails ? AppTheme.emeraldGreen : AppTheme.greyMedium).withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                hasDetails ? Icons.check_circle_rounded : Icons.account_balance_rounded,
                color: hasDetails ? AppTheme.emeraldGreen : AppTheme.greyMedium,
                size: 22,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Withdraw To', style: theme.textTheme.bodySmall?.copyWith(color: AppTheme.greyMedium, fontSize: 11)),
                  const SizedBox(height: 4),
                  Text(displayText, style: theme.textTheme.titleSmall?.copyWith(
                    color: hasDetails ? AppTheme.greyLight : AppTheme.greyMedium,
                  )),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: AppTheme.greyMedium),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoNotice(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.goldYellow.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.info_outline_rounded, color: AppTheme.goldYellow, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Withdrawals are processed within 24-48 business hours. A verified KYC is required.',
              style: theme.textTheme.bodySmall?.copyWith(color: AppTheme.greyLight, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSubmitButton(ThemeData theme) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton(
        onPressed: _isProcessing ? null : _proceed,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppTheme.primaryRed,
          disabledBackgroundColor: AppTheme.greyDark,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
        child: _isProcessing
            ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
            : const Text('Withdraw', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
      ),
    );
  }

  Widget _buildRestrictedWarning(ThemeData theme, String message) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.primaryRed.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.primaryRed.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          const Icon(Icons.gpp_bad_rounded, color: AppTheme.primaryRed, size: 48),
          const SizedBox(height: 12),
          Text('Withdrawals Not Available', style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
            color: AppTheme.primaryRed,
          )),
          const SizedBox(height: 8),
          Text(
            message,
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyMedium?.copyWith(color: AppTheme.greyLight),
          ),
        ],
      ),
    );
  }

  Widget _buildSuccess(ThemeData theme) {
    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Withdraw Cash'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () => context.pop(),
        ),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppTheme.emeraldGreen.withValues(alpha: 0.15),
                ),
                child: const Icon(Icons.check_circle_rounded, color: AppTheme.emeraldGreen, size: 48),
              ),
              const SizedBox(height: 24),
              Text('Withdrawal Requested!', style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text(_successAmount ?? '', style: theme.textTheme.displayMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: AppTheme.emeraldGreen,
              )),
              const SizedBox(height: 8),
              Text('Your withdrawal request has been submitted', style: theme.textTheme.bodyMedium?.copyWith(color: AppTheme.greyMedium)),
              const SizedBox(height: 4),
              Text('and is being processed.', style: theme.textTheme.bodyMedium?.copyWith(color: AppTheme.greyMedium)),
              if (_newBalance != null) ...[
                const SizedBox(height: 24),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: AppTheme.darkCardGradient,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0x1FFFFFFF)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Remaining Balance', style: theme.textTheme.bodySmall?.copyWith(color: AppTheme.greyMedium)),
                      Text('₹${_newBalance!.toStringAsFixed(2)}', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ],
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
      ),
    );
  }
}

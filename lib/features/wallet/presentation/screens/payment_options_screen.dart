import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';
import '../providers/payment_methods_provider.dart';
import '../../data/models/saved_payment_method.dart';

class PaymentOptionsScreen extends ConsumerStatefulWidget {
  const PaymentOptionsScreen({super.key});

  @override
  ConsumerState<PaymentOptionsScreen> createState() => _PaymentOptionsScreenState();
}

class _PaymentOptionsScreenState extends ConsumerState<PaymentOptionsScreen> {
  void _showAddMethodSheet({required String category, String? categoryLabel}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.darkSlate,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => _AddMethodSheet(
        category: category,
        categoryLabel: categoryLabel,
        onSave: (label, displayValue, providerName) async {
          final navigator = Navigator.of(ctx);
          final success = await ref
              .read(paymentMethodsNotifierProvider)
              .addMethod(
                category: category,
                label: label,
                displayValue: displayValue,
                providerName: providerName,
              );
          if (!mounted) return;
          navigator.pop();
          if (success && mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: const Text('Payment method added'),
                backgroundColor: AppTheme.emeraldGreen,
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            );
          } else if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: const Text('Failed to add payment method'),
                backgroundColor: AppTheme.primaryRed,
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            );
          }
        },
      ),
    );
  }

  Future<void> _confirmDelete(SavedPaymentMethod method) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.secondarySlate,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Remove Method'),
        titleTextStyle: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        content: Text('Remove ${method.label} from saved methods?'),
        contentTextStyle: Theme.of(context).textTheme.bodyMedium,
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: TextButton.styleFrom(foregroundColor: AppTheme.primaryRed),
            child: const Text('Remove'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      final success = await ref.read(paymentMethodsNotifierProvider).removeMethod(method.id);
      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Payment method removed'),
            backgroundColor: AppTheme.emeraldGreen,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final categoriesAsync = ref.watch(paymentMethodCategoriesProvider);
    final methodsAsync = ref.watch(paymentMethodsProvider);

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Payment Options'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text('Choose a payment method', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            Text('Select or add a method to pay', style: theme.textTheme.bodySmall?.copyWith(color: AppTheme.greyMedium)),
            const SizedBox(height: 20),
            categoriesAsync.when(
              data: (categories) => _buildCategoriesGrid(categories),
              loading: () => _buildShimmerGrid(),
              error: (e, s) => _buildErrorWidget(
                message: 'Failed to load payment options',
                onRetry: () => ref.invalidate(paymentMethodCategoriesProvider),
              ),
            ),
            const SizedBox(height: 28),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Saved Methods', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                Icon(Icons.credit_card_rounded, color: AppTheme.greyMedium.withValues(alpha: 0.4), size: 20),
              ],
            ),
            const SizedBox(height: 16),
            methodsAsync.when(
              data: (methods) => _buildSavedMethods(methods),
              loading: () => _buildShimmerSavedMethods(),
              error: (e, s) => _buildErrorWidget(
                message: 'Failed to load saved methods',
                onRetry: () => ref.invalidate(paymentMethodsProvider),
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoriesGrid(List<PaymentMethodCategory> categories) {
    final displayCategories = categories.isNotEmpty
        ? categories
        : [
            const PaymentMethodCategory(key: 'upi', label: 'UPI', icon: '', description: 'Google Pay, PhonePe, Paytm'),
            const PaymentMethodCategory(key: 'card', label: 'Cards', icon: '', description: 'Visa, Mastercard, RuPay'),
            const PaymentMethodCategory(key: 'net_banking', label: 'Net Banking', icon: '', description: 'HDFC, SBI, ICICI & more'),
            const PaymentMethodCategory(key: 'wallet', label: 'Wallets', icon: '', description: 'Paytm, Freecharge, Mobikwik'),
          ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.95,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: displayCategories.length,
      itemBuilder: (context, index) => _buildCategoryCard(displayCategories[index]),
    );
  }

  Widget _buildCategoryCard(PaymentMethodCategory cat) {
    final icon = _categoryIcon(cat.key);
    return GestureDetector(
      onTap: () => _showAddMethodSheet(category: cat.key, categoryLabel: cat.label),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: AppTheme.darkCardGradient,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0x1FFFFFFF)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppTheme.goldYellow.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: AppTheme.goldYellow, size: 20),
            ),
            const Spacer(),
            Text(cat.label, style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text(cat.description, style: const TextStyle(color: AppTheme.greyMedium, fontSize: 11), maxLines: 2, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 6),
            Row(
              children: [
                const Spacer(),
                Icon(Icons.add_circle_outline_rounded, color: AppTheme.goldYellow.withValues(alpha: 0.6), size: 18),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSavedMethods(List<SavedPaymentMethod> methods) {
    if (methods.isEmpty) {
      return _buildEmptySavedMethods();
    }

    final grouped = <String, List<SavedPaymentMethod>>{};
    for (final m in methods) {
      grouped.putIfAbsent(m.category, () => []).add(m);
    }

    return Column(
      children: grouped.entries.map((entry) {
        return _buildSavedCategorySection(entry.key, entry.value);
      }).toList(),
    );
  }

  Widget _buildSavedCategorySection(String category, List<SavedPaymentMethod> methods) {
    final icon = _categoryIcon(category);
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: AppTheme.greyMedium, size: 16),
              const SizedBox(width: 8),
              Text(
                methods.first.categoryLabel,
                style: const TextStyle(color: AppTheme.greyLight, fontSize: 13, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ...methods.map((method) => _buildSavedMethodItem(method)),
          const SizedBox(height: 8),
          GestureDetector(
            onTap: () => _showAddMethodSheet(category: category, categoryLabel: methods.first.categoryLabel),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                border: Border.all(color: const Color(0x1FFFFFFF)),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.add_rounded, color: AppTheme.greyMedium, size: 16),
                  const SizedBox(width: 6),
                  Text('Add New', style: TextStyle(color: AppTheme.greyMedium, fontSize: 13, fontWeight: FontWeight.w500)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSavedMethodItem(SavedPaymentMethod method) {
    final icon = _categoryIcon(method.category);
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: AppTheme.greyDark.withValues(alpha: 0.4),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: AppTheme.greyLight, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(method.label, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(
                  method.displayValue,
                  style: const TextStyle(color: AppTheme.greyMedium, fontSize: 12),
                ),
                if (method.providerName != null) ...[
                  const SizedBox(height: 1),
                  Text(method.providerName!, style: TextStyle(color: AppTheme.greyMedium.withValues(alpha: 0.6), fontSize: 11)),
                ],
              ],
            ),
          ),
          GestureDetector(
            onTap: () => _confirmDelete(method),
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.primaryRed.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.delete_outline_rounded, color: AppTheme.primaryRed, size: 18),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptySavedMethods() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 36),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Column(
        children: [
          Icon(Icons.credit_card_rounded, size: 44, color: AppTheme.greyMedium.withValues(alpha: 0.4)),
          const SizedBox(height: 14),
          const Text('No saved methods', style: TextStyle(color: AppTheme.greyMedium, fontSize: 15)),
          const SizedBox(height: 4),
          const Text('Add one for faster checkout', style: TextStyle(color: AppTheme.greyDark, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildErrorWidget({required String message, required VoidCallback onRetry}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 32),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Column(
        children: [
          Icon(Icons.error_outline_rounded, color: AppTheme.primaryRed, size: 40),
          const SizedBox(height: 12),
          Text(message, style: const TextStyle(color: AppTheme.greyMedium, fontSize: 14)),
          const SizedBox(height: 12),
          ElevatedButton(onPressed: onRetry, child: const Text('RETRY')),
        ],
      ),
    );
  }

  Widget _buildShimmerGrid() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.95,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: 4,
      itemBuilder: (context, index) => const ShimmerCard(height: 0),
    );
  }

  Widget _buildShimmerSavedMethods() {
    return Column(
      children: List.generate(3, (index) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: const ShimmerCard(height: 64),
      )),
    );
  }

  IconData _categoryIcon(String key) {
    switch (key) {
      case 'upi': return Icons.phone_android_rounded;
      case 'card': return Icons.credit_card_rounded;
      case 'net_banking': return Icons.account_balance_rounded;
      case 'wallet': return Icons.account_balance_wallet_rounded;
      default: return Icons.payment_rounded;
    }
  }
}

class _AddMethodSheet extends StatefulWidget {
  final String category;
  final String? categoryLabel;
  final Future<void> Function(String label, String displayValue, String? providerName) onSave;

  const _AddMethodSheet({
    required this.category,
    this.categoryLabel,
    required this.onSave,
  });

  @override
  State<_AddMethodSheet> createState() => _AddMethodSheetState();
}

class _AddMethodSheetState extends State<_AddMethodSheet> {
  final _labelController = TextEditingController();
  final _vpaController = TextEditingController();
  final _cardNumberController = TextEditingController();
  final _expiryController = TextEditingController();
  final _cvvController = TextEditingController();
  final _walletIdController = TextEditingController();
  String? _selectedBank;
  bool _isSaving = false;

  static const _banks = [
    'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank',
    'Kotak Mahindra Bank', 'Yes Bank', 'Punjab National Bank', 'Bank of Baroda',
  ];

  @override
  void dispose() {
    _labelController.dispose();
    _vpaController.dispose();
    _cardNumberController.dispose();
    _expiryController.dispose();
    _cvvController.dispose();
    _walletIdController.dispose();
    super.dispose();
  }

  String get _categoryLabel {
    if (widget.categoryLabel != null) return widget.categoryLabel!;
    switch (widget.category) {
      case 'upi': return 'UPI';
      case 'card': return 'Card';
      case 'net_banking': return 'Net Banking';
      case 'wallet': return 'Wallet';
      default: return 'Payment Method';
    }
  }

  Future<void> _save() async {
    String label;
    String displayValue;
    String? providerName;

    switch (widget.category) {
      case 'upi':
        final vpa = _vpaController.text.trim();
        if (vpa.isEmpty) return;
        label = _labelController.text.trim().isNotEmpty ? _labelController.text.trim() : 'My UPI';
        displayValue = vpa;
        providerName = null;
      case 'card':
        final cardNum = _cardNumberController.text.trim();
        if (cardNum.isEmpty || cardNum.length < 4) return;
        label = _labelController.text.trim().isNotEmpty ? _labelController.text.trim() : 'My Card';
        displayValue = '**** ${cardNum.substring(cardNum.length - 4)}';
        providerName = 'Card';
      case 'net_banking':
        if (_selectedBank == null) return;
        label = _labelController.text.trim().isNotEmpty ? _labelController.text.trim() : _selectedBank!;
        displayValue = _selectedBank!;
        providerName = _selectedBank;
      case 'wallet':
        final walletId = _walletIdController.text.trim();
        if (walletId.isEmpty) return;
        label = _labelController.text.trim().isNotEmpty ? _labelController.text.trim() : 'My Wallet';
        displayValue = walletId;
        providerName = null;
      default:
        return;
    }

    setState(() => _isSaving = true);
    await widget.onSave(label, displayValue, providerName);
    if (mounted) setState(() => _isSaving = false);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    final icon = _categoryIcon();

    return Padding(
      padding: EdgeInsets.only(left: 24, right: 24, top: 16, bottom: bottomInset + 24),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40, height: 4,
                decoration: BoxDecoration(color: AppTheme.greyDark, borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Container(
                  width: 44, height: 44,
                  decoration: BoxDecoration(
                    color: AppTheme.goldYellow.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: AppTheme.goldYellow, size: 22),
                ),
                const SizedBox(width: 14),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Add $_categoryLabel', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                    Text('Enter your payment details', style: theme.textTheme.bodySmall?.copyWith(color: AppTheme.greyMedium)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 24),
            _buildLabelField(),
            const SizedBox(height: 16),
            _buildCategoryField(),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: _isSaving ? null : _save,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryRed,
                  disabledBackgroundColor: AppTheme.greyDark,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: _isSaving
                    ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                    : const Text('Save Method', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _categoryIcon() {
    switch (widget.category) {
      case 'upi': return Icons.phone_android_rounded;
      case 'card': return Icons.credit_card_rounded;
      case 'net_banking': return Icons.account_balance_rounded;
      case 'wallet': return Icons.account_balance_wallet_rounded;
      default: return Icons.payment_rounded;
    }
  }

  Widget _buildLabelField() {
    return TextField(
      controller: _labelController,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        labelText: 'Label',
        hintText: 'e.g., My $_categoryLabel',
        labelStyle: const TextStyle(color: AppTheme.greyMedium),
        hintStyle: TextStyle(color: AppTheme.greyMedium.withValues(alpha: 0.5)),
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
      ),
    );
  }

  Widget _buildCategoryField() {
    switch (widget.category) {
      case 'upi':
        return TextField(
          controller: _vpaController,
          style: const TextStyle(color: Colors.white),
          keyboardType: TextInputType.emailAddress,
          decoration: InputDecoration(
            labelText: 'UPI ID',
            hintText: 'e.g., name@paytm',
            labelStyle: const TextStyle(color: AppTheme.greyMedium),
            hintStyle: TextStyle(color: AppTheme.greyMedium.withValues(alpha: 0.5)),
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
          ),
        );
      case 'card':
        return Column(
          children: [
            TextField(
              controller: _cardNumberController,
              style: const TextStyle(color: Colors.white),
              keyboardType: TextInputType.number,
              maxLength: 19,
              decoration: InputDecoration(
                labelText: 'Card Number',
                hintText: '1234 5678 9012 3456',
                labelStyle: const TextStyle(color: AppTheme.greyMedium),
                hintStyle: TextStyle(color: AppTheme.greyMedium.withValues(alpha: 0.5)),
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
                counterText: '',
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _expiryController,
                    style: const TextStyle(color: Colors.white),
                    keyboardType: TextInputType.datetime,
                    decoration: InputDecoration(
                      labelText: 'Expiry',
                      hintText: 'MM/YY',
                      labelStyle: const TextStyle(color: AppTheme.greyMedium),
                      hintStyle: TextStyle(color: AppTheme.greyMedium.withValues(alpha: 0.5)),
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
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: _cvvController,
                    style: const TextStyle(color: Colors.white),
                    keyboardType: TextInputType.number,
                    obscureText: true,
                    maxLength: 4,
                    decoration: InputDecoration(
                      labelText: 'CVV',
                      hintText: '***',
                      labelStyle: const TextStyle(color: AppTheme.greyMedium),
                      hintStyle: TextStyle(color: AppTheme.greyMedium.withValues(alpha: 0.5)),
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
                      counterText: '',
                    ),
                  ),
                ),
              ],
            ),
          ],
        );
      case 'net_banking':
        return DropdownButtonFormField<String>(
          initialValue: _selectedBank,
          decoration: InputDecoration(
            labelText: 'Select Bank',
            labelStyle: const TextStyle(color: AppTheme.greyMedium),
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
          ),
          dropdownColor: AppTheme.secondarySlate,
          style: const TextStyle(color: Colors.white),
          items: _banks.map((bank) => DropdownMenuItem(value: bank, child: Text(bank))).toList(),
          onChanged: (value) => setState(() => _selectedBank = value),
        );
      case 'wallet':
        return TextField(
          controller: _walletIdController,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            labelText: 'Wallet ID',
            hintText: 'e.g., user@wallet',
            labelStyle: const TextStyle(color: AppTheme.greyMedium),
            hintStyle: TextStyle(color: AppTheme.greyMedium.withValues(alpha: 0.5)),
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
          ),
        );
      default:
        return const SizedBox.shrink();
    }
  }
}

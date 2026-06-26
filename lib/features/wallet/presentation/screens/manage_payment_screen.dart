import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/bank_details_provider.dart';

class ManagePaymentScreen extends ConsumerStatefulWidget {
  const ManagePaymentScreen({super.key});

  @override
  ConsumerState<ManagePaymentScreen> createState() => _ManagePaymentScreenState();
}

class _ManagePaymentScreenState extends ConsumerState<ManagePaymentScreen> {
  int _selectedTab = 0;

  final _bankFormKey = GlobalKey<FormState>();
  final _accountHolderCtrl = TextEditingController();
  final _accountNumberCtrl = TextEditingController();
  final _confirmAccountCtrl = TextEditingController();
  final _ifscCtrl = TextEditingController();
  final _bankNameCtrl = TextEditingController();

  final _upiFormKey = GlobalKey<FormState>();
  final _upiCtrl = TextEditingController();

  bool _isSaving = false;
  bool _isEditingBank = false;
  bool _isEditingUpi = false;

  @override
  void dispose() {
    _accountHolderCtrl.dispose();
    _accountNumberCtrl.dispose();
    _confirmAccountCtrl.dispose();
    _ifscCtrl.dispose();
    _bankNameCtrl.dispose();
    _upiCtrl.dispose();
    super.dispose();
  }

  void _loadExistingDetails(dynamic bankDetails) {
    if (bankDetails == null) return;
    _accountHolderCtrl.text = bankDetails.accountHolderName ?? '';
    _accountNumberCtrl.text = bankDetails.bankAccountNumber ?? '';
    _confirmAccountCtrl.text = bankDetails.bankAccountNumber ?? '';
    _ifscCtrl.text = bankDetails.bankIfsc ?? '';
    _bankNameCtrl.text = bankDetails.bankName ?? '';
    _upiCtrl.text = bankDetails.upiId ?? '';
  }

  Future<void> _saveBank() async {
    if (!_bankFormKey.currentState!.validate()) return;
    setState(() => _isSaving = true);

    final success = await ref.read(bankDetailsProvider.notifier).updateBankDetails(
          bankAccountNumber: _accountNumberCtrl.text.trim(),
          bankIfsc: _ifscCtrl.text.trim().toUpperCase(),
          bankName: _bankNameCtrl.text.trim(),
        );

    if (!mounted) return;
    setState(() => _isSaving = false);

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Bank details saved successfully!'),
          backgroundColor: AppTheme.emeraldGreen,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
      context.pop();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Failed to save bank details'),
          backgroundColor: AppTheme.primaryRed,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    }
  }

  Future<void> _saveUpi() async {
    if (!_upiFormKey.currentState!.validate()) return;
    setState(() => _isSaving = true);

    final success = await ref.read(bankDetailsProvider.notifier).updateBankDetails(
          upiId: _upiCtrl.text.trim(),
        );

    if (!mounted) return;
    setState(() => _isSaving = false);

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('UPI ID saved successfully!'),
          backgroundColor: AppTheme.emeraldGreen,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
      context.pop();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Failed to save UPI ID'),
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
    final bankDetails = ref.watch(bankDetailsProvider);

    if (bankDetails != null && _accountNumberCtrl.text.isEmpty && !_isEditingBank && !_isEditingUpi) {
      _loadExistingDetails(bankDetails);
    }

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Manage Payment'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: Column(
        children: [
          _buildTabBar(theme),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: _selectedTab == 0 ? _buildBankSection(theme) : _buildUpiSection(theme),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar(ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: AppTheme.secondarySlate,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _selectedTab = 0),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: _selectedTab == 0 ? AppTheme.primaryRed : Colors.transparent,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'Bank Account',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: _selectedTab == 0 ? Colors.white : AppTheme.greyMedium,
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
            ),
            Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _selectedTab = 1),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: _selectedTab == 1 ? AppTheme.primaryRed : Colors.transparent,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'UPI',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: _selectedTab == 1 ? Colors.white : AppTheme.greyMedium,
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBankSection(ThemeData theme) {
    final hasDetails = _accountNumberCtrl.text.isNotEmpty && !_isEditingBank;

    if (hasDetails) {
      return Column(
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
                Row(
                  children: [
                    Icon(Icons.check_circle_rounded, color: AppTheme.emeraldGreen, size: 20),
                    const SizedBox(width: 8),
                    Text('Saved Bank Account', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                    const Spacer(),
                    GestureDetector(
                      onTap: () => setState(() => _isEditingBank = true),
                      child: const Icon(Icons.edit_rounded, color: AppTheme.primaryRed, size: 20),
                    ),
                  ],
                ),
                const Divider(color: Color(0x1FFFFFFF), height: 24),
                _detailRow('Account Number', '••••${_accountNumberCtrl.text.substring(_accountNumberCtrl.text.length - 4)}'),
                const SizedBox(height: 10),
                _detailRow('IFSC Code', _ifscCtrl.text.toUpperCase()),
                const SizedBox(height: 10),
                _detailRow('Bank Name', _bankNameCtrl.text),
              ],
            ),
          ),
        ],
      );
    }

    return _buildBankForm(theme);
  }

  Widget _buildBankForm(ThemeData theme) {
    return Form(
      key: _bankFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 8),
          Text('Bank Account Details', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text('Add your bank account for withdrawals', style: theme.textTheme.bodySmall?.copyWith(color: AppTheme.greyMedium)),
          const SizedBox(height: 20),
          _buildField(
            controller: _accountHolderCtrl,
            label: 'Account Holder Name',
            hint: 'Name as on bank account',
            validator: (v) => (v == null || v.trim().isEmpty) ? 'Name is required' : null,
          ),
          const SizedBox(height: 16),
          _buildField(
            controller: _accountNumberCtrl,
            label: 'Account Number',
            hint: 'Bank account number',
            keyboardType: TextInputType.number,
            maxLength: 18,
            validator: (v) {
              if (v == null || v.trim().isEmpty) return 'Account number is required';
              if (v.trim().length < 9) return 'Must be at least 9 digits';
              if (!RegExp(r'^\d+$').hasMatch(v.trim())) return 'Only digits allowed';
              return null;
            },
          ),
          const SizedBox(height: 16),
          _buildField(
            controller: _confirmAccountCtrl,
            label: 'Confirm Account Number',
            hint: 'Re-enter account number',
            keyboardType: TextInputType.number,
            maxLength: 18,
            validator: (v) {
              if (v == null || v.trim().isEmpty) return 'Please confirm account number';
              if (v.trim() != _accountNumberCtrl.text.trim()) return 'Account numbers do not match';
              return null;
            },
          ),
          const SizedBox(height: 16),
          _buildField(
            controller: _ifscCtrl,
            label: 'IFSC Code',
            hint: 'e.g., SBIN0001234',
            textCapitalization: TextCapitalization.characters,
            maxLength: 11,
            validator: (v) {
              if (v == null || v.trim().isEmpty) return 'IFSC code is required';
              if (!RegExp(r'^[A-Z]{4}0[A-Z0-9]{6}$').hasMatch(v.trim().toUpperCase())) return 'Invalid IFSC format';
              return null;
            },
          ),
          const SizedBox(height: 16),
          _buildField(
            controller: _bankNameCtrl,
            label: 'Bank Name',
            hint: 'e.g., State Bank of India',
            validator: (v) => (v == null || v.trim().isEmpty) ? 'Bank name is required' : null,
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _isSaving ? null : _saveBank,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryRed,
                disabledBackgroundColor: AppTheme.greyDark,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: _isSaving
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                  : const Text('Save Bank Account', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildUpiSection(ThemeData theme) {
    final hasDetails = _upiCtrl.text.isNotEmpty && !_isEditingUpi;

    if (hasDetails) {
      return Column(
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
                Row(
                  children: [
                    Icon(Icons.check_circle_rounded, color: AppTheme.emeraldGreen, size: 20),
                    const SizedBox(width: 8),
                    Text('Saved UPI ID', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                    const Spacer(),
                    GestureDetector(
                      onTap: () => setState(() => _isEditingUpi = true),
                      child: const Icon(Icons.edit_rounded, color: AppTheme.primaryRed, size: 20),
                    ),
                  ],
                ),
                const Divider(color: Color(0x1FFFFFFF), height: 24),
                _detailRow('UPI ID', _upiCtrl.text),
              ],
            ),
          ),
        ],
      );
    }

    return Form(
      key: _upiFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 8),
          Text('UPI Details', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text('Add your UPI ID for instant withdrawals', style: theme.textTheme.bodySmall?.copyWith(color: AppTheme.greyMedium)),
          const SizedBox(height: 20),
          _buildField(
            controller: _upiCtrl,
            label: 'UPI ID',
            hint: 'e.g., username@paytm',
            keyboardType: TextInputType.emailAddress,
            validator: (v) {
              if (v == null || v.trim().isEmpty) return 'UPI ID is required';
              if (!v.trim().contains('@')) return 'Invalid UPI ID format (e.g., user@bank)';
              return null;
            },
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _isSaving ? null : _saveUpi,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryRed,
                disabledBackgroundColor: AppTheme.greyDark,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: _isSaving
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                  : const Text('Save UPI ID', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildField({
    required TextEditingController controller,
    required String label,
    required String hint,
    TextInputType? keyboardType,
    TextCapitalization textCapitalization = TextCapitalization.none,
    int? maxLength,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      style: const TextStyle(color: Colors.white),
      keyboardType: keyboardType,
      textCapitalization: textCapitalization,
      maxLength: maxLength,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
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
      validator: validator,
    );
  }

  Widget _detailRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: AppTheme.greyMedium, fontSize: 14)),
        Text(value, style: const TextStyle(color: AppTheme.greyLight, fontWeight: FontWeight.w600, fontSize: 14)),
      ],
    );
  }
}

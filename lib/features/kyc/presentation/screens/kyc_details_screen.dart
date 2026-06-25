import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/kyc_status.dart';
import '../providers/kyc_provider.dart';

class KycDetailsScreen extends ConsumerStatefulWidget {
  const KycDetailsScreen({super.key});

  @override
  ConsumerState<KycDetailsScreen> createState() => _KycDetailsScreenState();
}

class _KycDetailsScreenState extends ConsumerState<KycDetailsScreen> {
  final _aadhaarController = TextEditingController();
  final _panController = TextEditingController();
  final _nameController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _aadhaarController.dispose();
    _panController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    final result = await ref.read(kycProvider).submitKyc(
      aadhaarNumber: _aadhaarController.text.trim(),
      panNumber: _panController.text.trim().toUpperCase(),
      fullName: _nameController.text.trim(),
    );

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (result != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('KYC submitted successfully!'),
          backgroundColor: AppTheme.emeraldGreen,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('KYC submission failed. Check your details and try again.'),
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
    final kycAsync = ref.watch(kycStatusProvider);

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('KYC Verification'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: kycAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, s) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline_rounded, color: AppTheme.primaryRed, size: 48),
              const SizedBox(height: 16),
              const Text('Failed to load KYC status', style: TextStyle(color: AppTheme.greyMedium)),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => ref.invalidate(kycStatusProvider),
                child: const Text('RETRY'),
              ),
            ],
          ),
        ),
        data: (kycStatus) => SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),
              _buildStatusHeader(theme, kycStatus),
              const SizedBox(height: 24),
              if (kycStatus.isApproved)
                _buildVerifiedState(theme, kycStatus)
              else
                _buildForm(theme),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusHeader(ThemeData theme, KycStatusModel kycStatus) {
    Color statusColor;
    String statusLabel;
    IconData statusIcon;

    if (kycStatus.isApproved) {
      statusColor = AppTheme.emeraldGreen;
      statusLabel = 'VERIFIED';
      statusIcon = Icons.verified_rounded;
    } else if (kycStatus.isPending) {
      statusColor = AppTheme.goldYellow;
      statusLabel = 'PENDING';
      statusIcon = Icons.hourglass_empty_rounded;
    } else if (kycStatus.isRejected) {
      statusColor = AppTheme.primaryRed;
      statusLabel = 'REJECTED';
      statusIcon = Icons.cancel_rounded;
    } else {
      statusColor = AppTheme.greyMedium;
      statusLabel = 'UNVERIFIED';
      statusIcon = Icons.verified_user_rounded;
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Row(
        children: [
          Container(
            width: 56, height: 56,
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(statusIcon, color: statusColor, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('KYC Status', style: theme.textTheme.bodySmall?.copyWith(color: AppTheme.greyMedium)),
                const SizedBox(height: 4),
                Text(statusLabel, style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: statusColor,
                )),
                if (kycStatus.verifiedAt != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(
                      'Verified on ${kycStatus.verifiedAt!.toLocal().toString().split(' ')[0]}',
                      style: theme.textTheme.bodySmall?.copyWith(color: AppTheme.greyMedium, fontSize: 11),
                    ),
                  ),
                if (kycStatus.rejectionReason != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(
                      kycStatus.rejectionReason!,
                      style: theme.textTheme.bodySmall?.copyWith(color: AppTheme.primaryRed, fontSize: 11),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVerifiedState(ThemeData theme, KycStatusModel kycStatus) {
    return Column(
      children: [
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
                  Text('Verification Details', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                ],
              ),
              const Divider(color: Color(0x1FFFFFFF)),
              const SizedBox(height: 8),
              _detailRow('Aadhaar', 'Verified', AppTheme.emeraldGreen),
              const SizedBox(height: 12),
              _detailRow('PAN', 'Verified', AppTheme.emeraldGreen),
            ],
          ),
        ),
        const SizedBox(height: 24),
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
    );
  }

  Widget _buildForm(ThemeData theme) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Complete Your KYC', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text('Verify your identity with Aadhaar & PAN', style: theme.textTheme.bodySmall?.copyWith(color: AppTheme.greyMedium)),
          const SizedBox(height: 20),
          TextFormField(
            controller: _nameController,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: 'Full Name',
              hintText: 'As on Aadhaar card',
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
            validator: (v) => (v == null || v.trim().isEmpty) ? 'Name is required' : null,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _aadhaarController,
            style: const TextStyle(color: Colors.white),
            keyboardType: TextInputType.number,
            maxLength: 12,
            decoration: InputDecoration(
              labelText: 'Aadhaar Number',
              hintText: '12-digit Aadhaar number',
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
            validator: (v) {
              if (v == null || v.trim().isEmpty) return 'Aadhaar number is required';
              if (!RegExp(r'^\d{12}$').hasMatch(v.trim())) return 'Must be 12 digits';
              return null;
            },
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _panController,
            style: const TextStyle(color: Colors.white),
            textCapitalization: TextCapitalization.characters,
            maxLength: 10,
            decoration: InputDecoration(
              labelText: 'PAN Number',
              hintText: 'e.g., ABCDE1234F',
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
            validator: (v) {
              if (v == null || v.trim().isEmpty) return 'PAN number is required';
              if (!RegExp(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$').hasMatch(v.trim().toUpperCase())) return 'Invalid PAN format';
              return null;
            },
          ),
          const SizedBox(height: 8),
          Container(
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
                    'Your documents are verified securely. We use encrypted connections and never store raw document images.',
                    style: theme.textTheme.bodySmall?.copyWith(color: AppTheme.greyLight, fontSize: 12),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryRed,
                disabledBackgroundColor: AppTheme.greyDark,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: _isSubmitting
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                  : const Text('Submit KYC', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _detailRow(String label, String value, Color color) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: AppTheme.greyMedium)),
        Row(
          children: [
            Icon(Icons.check_circle_rounded, color: color, size: 16),
            const SizedBox(width: 4),
            Text(value, style: TextStyle(color: color, fontWeight: FontWeight.w600)),
          ],
        ),
      ],
    );
  }
}

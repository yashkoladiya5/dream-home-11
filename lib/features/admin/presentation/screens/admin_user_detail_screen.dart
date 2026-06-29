import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';
import '../providers/admin_user_detail_provider.dart';
import '../providers/admin_dashboard_provider.dart';
import '../../data/models/admin_user_detail.dart';

class AdminUserDetailScreen extends ConsumerStatefulWidget {
  final String userId;

  const AdminUserDetailScreen({super.key, required this.userId});

  @override
  ConsumerState<AdminUserDetailScreen> createState() => _AdminUserDetailScreenState();
}

class _AdminUserDetailScreenState extends ConsumerState<AdminUserDetailScreen> {
  final _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    final userAsync = ref.watch(adminUserDetailProvider(widget.userId));

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('User Details'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => Navigator.of(context).pop(),
        ),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
        actions: [
          userAsync.whenOrNull(
            data: (_) => IconButton(
              icon: const Icon(Icons.edit_rounded),
              onPressed: () => _showEditSheet(userAsync.asData!.value),
            ),
          ) ?? const SizedBox.shrink(),
        ],
      ),
      body: userAsync.when(
        loading: () => _buildShimmer(),
        error: (err, _) => _buildError(err),
        data: (user) => _buildContent(user),
      ),
    );
  }

  Widget _buildShimmer() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        ShimmerCard(height: 80, borderRadius: 16),
        const SizedBox(height: 12),
        ShimmerCard(height: 200, borderRadius: 16),
        const SizedBox(height: 12),
        ShimmerCard(height: 160, borderRadius: 16),
      ],
    );
  }

  Widget _buildError(Object error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline_rounded, size: 64, color: AppTheme.primaryRed.withValues(alpha: 0.6)),
            const SizedBox(height: 16),
            Text(
              error.toString(),
              style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 14),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => ref.invalidate(adminUserDetailProvider(widget.userId)),
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime dt) {
    return '${dt.day.toString().padLeft(2, '0')} ${_monthAbbr(dt.month)} ${dt.year}';
  }

  String _monthAbbr(int month) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  }

  Widget _buildContent(AdminUserDetail user) {
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(adminUserDetailProvider(widget.userId)),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          _buildProfileHeader(user),
          const SizedBox(height: 16),
          _buildInfoSection('Account Info', [
            _infoRow('Name', user.fullName ?? '—'),
            _infoRow('Phone', user.phoneNumber),
            _infoRow('Email', user.email ?? '—'),
            _infoRow('State', user.state ?? '—'),
            _infoRow('Member Since', _formatDate(user.createdAt)),
          ]),
          const SizedBox(height: 12),
          _buildInfoSection('Status & Role', [
            _infoRow('Role', user.role?.toUpperCase() ?? 'USER'),
            _infoRow('Status', user.isActive ? 'Active' : 'Inactive',
                valueColor: user.isActive ? AppTheme.emeraldGreen : AppTheme.greyMedium),
            _infoRow('Tier', user.currentTier.toUpperCase()),
          ]),
          const SizedBox(height: 12),
          _buildInfoSection('Activity', [
            _infoRow('Contests Played', user.contestCount.toString()),
            _infoRow('Total Deposits', '₹${user.totalDeposits.toStringAsFixed(2)}'),
            _infoRow('Total Withdrawals', '₹${user.totalWithdrawals.toStringAsFixed(2)}'),
          ]),
        ],
      ),
    );
  }

  Widget _buildProfileHeader(AdminUserDetail user) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 34,
            backgroundColor: AppTheme.primaryRed.withValues(alpha: 0.2),
            child: Text(
              (user.fullName ?? user.phoneNumber)[0].toUpperCase(),
              style: GoogleFonts.outfit(color: AppTheme.primaryRed, fontWeight: FontWeight.bold, fontSize: 28),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user.fullName ?? 'User',
                  style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 18),
                ),
                const SizedBox(height: 4),
                Text(
                  user.phoneNumber,
                  style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 14),
                ),
                const SizedBox(height: 6),
                _tierBadge(user.currentTier),
              ],
            ),
          ),
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              color: user.isActive ? AppTheme.emeraldGreen : AppTheme.greyMedium,
              shape: BoxShape.circle,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoSection(String title, List<Widget> rows) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 0.5),
          ),
          const SizedBox(height: 12),
          ...rows,
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 130,
            child: Text(
              label,
              style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 14),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: GoogleFonts.outfit(
                color: valueColor ?? Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _tierBadge(String tier) {
    final Color color;
    switch (tier.toLowerCase()) {
      case 'bronze':
        color = const Color(0xFFCD7F32);
      case 'silver':
        color = AppTheme.greyLight;
      case 'gold':
        color = AppTheme.goldYellow;
      case 'platinum':
        color = const Color(0xFFE5E4E2);
      default:
        color = AppTheme.greyMedium;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        tier.toUpperCase(),
        style: GoogleFonts.outfit(color: color, fontSize: 11, fontWeight: FontWeight.w600),
      ),
    );
  }

  void _showEditSheet(AdminUserDetail user) {
    String selectedRole = user.role ?? 'user';
    bool isActive = user.isActive;
    String selectedTier = user.currentTier;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Container(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              decoration: const BoxDecoration(
                gradient: AppTheme.darkCardGradient,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: AppTheme.greyDark,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text('Edit User', style: GoogleFonts.outfit(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 24),
                    DropdownButtonFormField<String>(
                      value: selectedRole,
                      decoration: InputDecoration(labelText: 'Role',
                        labelStyle: GoogleFonts.outfit(color: AppTheme.greyMedium)),
                      dropdownColor: AppTheme.secondarySlate,
                      style: GoogleFonts.outfit(color: Colors.white),
                      items: const ['user', 'admin', 'moderator'].map((r) => DropdownMenuItem(value: r, child: Text(r.toUpperCase()))).toList(),
                      onChanged: (v) => setSheetState(() => selectedRole = v!),
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      value: selectedTier,
                      decoration: InputDecoration(labelText: 'Tier',
                        labelStyle: GoogleFonts.outfit(color: AppTheme.greyMedium)),
                      dropdownColor: AppTheme.secondarySlate,
                      style: GoogleFonts.outfit(color: Colors.white),
                      items: const ['bronze', 'silver', 'gold', 'platinum'].map((t) => DropdownMenuItem(value: t, child: Text(t.toUpperCase()))).toList(),
                      onChanged: (v) => setSheetState(() => selectedTier = v!),
                    ),
                    const SizedBox(height: 16),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text('Active', style: GoogleFonts.outfit(color: Colors.white)),
                      value: isActive,
                      activeColor: AppTheme.emeraldGreen,
                      onChanged: (v) => setSheetState(() => isActive = v),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () => _saveEdit(user.id, selectedRole, isActive, selectedTier, ctx),
                        child: const Text('Save Changes'),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _saveEdit(String id, String role, bool active, String tier, BuildContext sheetContext) async {
    final service = ref.read(adminApiServiceProvider);
    try {
      await service.updateUser(id, {
        'role': role,
        'isActive': active,
        'currentTier': tier,
      });
      if (sheetContext.mounted) Navigator.of(sheetContext).pop();
      ref.invalidate(adminUserDetailProvider(widget.userId));
    } catch (e) {
      if (sheetContext.mounted) {
        ScaffoldMessenger.of(sheetContext).showSnackBar(
          SnackBar(content: Text('Failed to update: $e'), backgroundColor: AppTheme.primaryRed),
        );
      }
    }
  }
}

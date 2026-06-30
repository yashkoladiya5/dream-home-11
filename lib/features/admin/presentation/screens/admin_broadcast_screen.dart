import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/services/admin_api_service.dart';

class AdminBroadcastScreen extends ConsumerStatefulWidget {
  const AdminBroadcastScreen({super.key});

  @override
  ConsumerState<AdminBroadcastScreen> createState() => _AdminBroadcastScreenState();
}

class _AdminBroadcastScreenState extends ConsumerState<AdminBroadcastScreen> {
  final _titleController = TextEditingController();
  final _messageController = TextEditingController();
  String _target = 'all';
  bool _sendSms = false;
  bool _loading = false;

  @override
  void dispose() {
    _titleController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Broadcast Notification'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Target Audience', style: GoogleFonts.outfit(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _targetChip('All Users', 'all'),
                const SizedBox(width: 8),
                _targetChip('Bronze', 'bronze'),
                const SizedBox(width: 8),
                _targetChip('Silver', 'silver'),
                const SizedBox(width: 8),
                _targetChip('Gold', 'gold'),
                const SizedBox(width: 8),
                _targetChip('Platinum', 'platinum'),
              ],
            ),
          ),
          const SizedBox(height: 24),
          TextField(
            controller: _titleController,
            style: GoogleFonts.outfit(color: Colors.white),
            decoration: InputDecoration(
              labelText: 'Notification Title',
              labelStyle: GoogleFonts.outfit(color: AppTheme.greyMedium),
              filled: true,
              fillColor: const Color(0x0CFFFFFF),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              contentPadding: const EdgeInsets.all(16),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _messageController,
            maxLines: 4,
            style: GoogleFonts.outfit(color: Colors.white),
            decoration: InputDecoration(
              labelText: 'Message',
              labelStyle: GoogleFonts.outfit(color: AppTheme.greyMedium),
              filled: true,
              fillColor: const Color(0x0CFFFFFF),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              contentPadding: const EdgeInsets.all(16),
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: AppTheme.darkCardGradient,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0x1FFFFFFF)),
            ),
            child: Row(
              children: [
                Icon(Icons.message_rounded, color: _sendSms ? AppTheme.emeraldGreen : AppTheme.greyMedium, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text('Also send via SMS', style: GoogleFonts.outfit(color: Colors.white, fontSize: 14)),
                ),
                Switch(
                  value: _sendSms,
                  onChanged: (v) => setState(() => _sendSms = v),
                  activeThumbColor: AppTheme.primaryRed,
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: _loading ? null : _sendBroadcast,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryRed,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: _loading
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Text('SEND NOTIFICATION', style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _targetChip(String label, String value) {
    final selected = _target == value;
    return GestureDetector(
      onTap: () => setState(() => _target = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppTheme.primaryRed.withValues(alpha: 0.2) : const Color(0x0CFFFFFF),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? AppTheme.primaryRed : const Color(0x1AFFFFFF)),
        ),
        child: Text(label, style: GoogleFonts.outfit(color: selected ? AppTheme.primaryRed : AppTheme.greyMedium, fontWeight: FontWeight.w600, fontSize: 12)),
      ),
    );
  }

  Future<void> _sendBroadcast() async {
    if (_titleController.text.trim().isEmpty || _messageController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please fill in all fields', style: GoogleFonts.outfit(color: Colors.white)),
          backgroundColor: AppTheme.primaryRed),
      );
      return;
    }

    setState(() => _loading = true);
    try {
      final dio = ref.read(apiClientProvider);
      final service = AdminApiService(dio);
      final tier = _target == 'all' ? null : _target;

      final pushResult = await service.broadcastNotification(
        title: _titleController.text.trim(),
        message: _messageController.text.trim(),
        tier: tier,
      );

      if (_sendSms) {
        await service.broadcastSms(
          message: _messageController.text.trim(),
          tier: tier,
        );
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Sent to ${pushResult['sent']} devices', style: GoogleFonts.outfit(color: Colors.white)),
            backgroundColor: AppTheme.emeraldGreen,
          ),
        );
        _titleController.clear();
        _messageController.clear();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e', style: GoogleFonts.outfit(color: Colors.white)),
            backgroundColor: AppTheme.primaryRed),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}

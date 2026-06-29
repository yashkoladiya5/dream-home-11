import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/network/api_client.dart';
import '../providers/support_provider.dart';
import '../../data/models/support_ticket.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';

class SupportScreen extends ConsumerStatefulWidget {
  const SupportScreen({super.key});
  @override
  ConsumerState<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends ConsumerState<SupportScreen> {
  final _formKey = GlobalKey<FormState>();
  final _subjectController = TextEditingController();
  final _messageController = TextEditingController();
  String _selectedCategory = 'general';
  File? _selectedFile;
  String? _selectedFileName;
  bool _isSubmitting = false;
  bool _showForm = true;

  final List<Map<String, String>> _categories = [
    {'value': 'general', 'label': 'General'},
    {'value': 'payment', 'label': 'Payment'},
    {'value': 'technical', 'label': 'Technical'},
    {'value': 'kyc', 'label': 'KYC'},
    {'value': 'account', 'label': 'Account'},
    {'value': 'other', 'label': 'Other'},
  ];

  @override
  void dispose() {
    _subjectController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _pickFile() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (picked != null) {
      setState(() {
        _selectedFile = File(picked.path);
        _selectedFileName = picked.name;
      });
    }
  }

  Future<void> _submitTicket() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSubmitting = true);
    try {
      final dio = ref.read(apiClientProvider);
      final formData = FormData.fromMap({
        'subject': _subjectController.text.trim(),
        'category': _selectedCategory,
        'message': _messageController.text.trim(),
      });
      if (_selectedFile != null) {
        formData.files.add(MapEntry(
          'attachment',
          await MultipartFile.fromFile(_selectedFile!.path, filename: _selectedFileName),
        ));
      }
      await dio.post('/api/v1/support/tickets', data: formData);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Ticket submitted successfully!'), backgroundColor: AppTheme.emeraldGreen, behavior: SnackBarBehavior.floating),
        );
        _subjectController.clear();
        _messageController.clear();
        setState(() {
          _selectedCategory = 'general';
          _selectedFile = null;
          _selectedFileName = null;
          _showForm = false;
        });
        ref.invalidate(myTicketsProvider);
      }
    } catch (e) {
      if (mounted) {
        String msg = 'Failed to submit ticket';
        if (e is DioException && e.response?.data is Map) {
          msg = (e.response!.data as Map)['message']?.toString() ?? msg;
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg), backgroundColor: AppTheme.primaryRed, behavior: SnackBarBehavior.floating),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final ticketsAsync = ref.watch(myTicketsProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Support'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(myTicketsProvider),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_showForm) _buildFormSection(),
              if (_showForm) const SizedBox(height: 24),
              _buildTicketHistorySection(ticketsAsync),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFormSection() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Submit a Ticket', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
            const SizedBox(height: 16),
            TextFormField(
              controller: _subjectController,
              decoration: InputDecoration(
                labelText: 'Subject',
                hintText: 'Brief title for your issue',
                filled: true,
                fillColor: AppTheme.darkSlate,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                labelStyle: TextStyle(color: AppTheme.greyMedium),
                hintStyle: TextStyle(color: AppTheme.greyMedium.withValues(alpha: 0.5)),
              ),
              style: const TextStyle(color: Colors.white),
              maxLength: 200,
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Subject is required' : null,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _selectedCategory,
              decoration: InputDecoration(
                labelText: 'Category',
                filled: true,
                fillColor: AppTheme.darkSlate,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                labelStyle: TextStyle(color: AppTheme.greyMedium),
              ),
              dropdownColor: AppTheme.darkSlate,
              style: const TextStyle(color: Colors.white),
              items: _categories.map((c) => DropdownMenuItem(value: c['value'], child: Text(c['label']!))).toList(),
              onChanged: (v) => setState(() => _selectedCategory = v ?? 'general'),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _messageController,
              decoration: InputDecoration(
                labelText: 'Message',
                hintText: 'Describe your issue in detail',
                filled: true,
                fillColor: AppTheme.darkSlate,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                labelStyle: TextStyle(color: AppTheme.greyMedium),
                hintStyle: TextStyle(color: AppTheme.greyMedium.withValues(alpha: 0.5)),
                alignLabelWithHint: true,
              ),
              style: const TextStyle(color: Colors.white),
              maxLines: 5,
              maxLength: 1000,
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Message is required' : null,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                OutlinedButton.icon(
                  onPressed: _pickFile,
                  icon: const Icon(Icons.attach_file_rounded, size: 18),
                  label: Text(_selectedFileName ?? 'Attach Image'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.greyMedium,
                    side: BorderSide(color: AppTheme.greyMedium.withValues(alpha: 0.3)),
                  ),
                ),
                if (_selectedFile != null)
                  IconButton(
                    onPressed: () => setState(() { _selectedFile = null; _selectedFileName = null; }),
                    icon: const Icon(Icons.close, color: AppTheme.primaryRed, size: 18),
                  ),
              ],
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _submitTicket,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryRed,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _isSubmitting
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Submit Ticket', style: TextStyle(fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTicketHistorySection(AsyncValue<List<SupportTicket>> ticketsAsync) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('My Tickets', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
            if (!_showForm)
              TextButton.icon(
                onPressed: () => setState(() => _showForm = true),
                icon: const Icon(Icons.add_rounded, size: 18),
                label: const Text('New Ticket'),
              ),
          ],
        ),
        const SizedBox(height: 12),
        ticketsAsync.when(
          data: (tickets) {
            if (tickets.isEmpty) {
              return Container(
                width: double.infinity,
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  gradient: AppTheme.darkCardGradient,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0x1FFFFFFF)),
                ),
                child: Column(
                  children: [
                    Icon(Icons.support_agent_rounded, color: AppTheme.greyMedium, size: 48),
                    const SizedBox(height: 12),
                    Text('No tickets yet', style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: AppTheme.greyMedium)),
                    const SizedBox(height: 4),
                    Text('Submit a ticket above', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppTheme.greyMedium)),
                  ],
                ),
              );
            }
            return ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: tickets.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) => _buildTicketCard(tickets[index]),
            );
          },
          loading: () => const Column(
            children: [
              ShimmerCard(height: 100, borderRadius: 12),
              SizedBox(height: 8),
              ShimmerCard(height: 100, borderRadius: 12),
            ],
          ),
          error: (err, _) => Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: AppTheme.darkCardGradient,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0x1FFFFFFF)),
            ),
            child: Column(
              children: [
                Icon(Icons.error_outline_rounded, color: AppTheme.primaryRed, size: 36),
                const SizedBox(height: 8),
                Text('Failed to load tickets', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.greyMedium)),
                const SizedBox(height: 8),
                ElevatedButton(onPressed: () => ref.invalidate(myTicketsProvider), child: const Text('RETRY')),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTicketCard(SupportTicket ticket) {
    final statusColors = <String, Color>{
      'open': AppTheme.goldYellow,
      'in_progress': const Color(0xFF3B82F6),
      'resolved': AppTheme.emeraldGreen,
      'closed': AppTheme.greyMedium,
    };
    final statusLabels = <String, String>{
      'open': 'Open',
      'in_progress': 'In Progress',
      'resolved': 'Resolved',
      'closed': 'Closed',
    };
    final catColors = <String, Color>{
      'general': AppTheme.greyMedium,
      'payment': AppTheme.emeraldGreen,
      'technical': const Color(0xFF3B82F6),
      'kyc': const Color(0xFF8B5CF6),
      'account': AppTheme.goldYellow,
      'other': AppTheme.greyMedium,
    };

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(ticket.subject, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: (statusColors[ticket.status] ?? AppTheme.greyMedium).withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  statusLabels[ticket.status] ?? ticket.status,
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: statusColors[ticket.status] ?? AppTheme.greyMedium),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: (catColors[ticket.category] ?? AppTheme.greyMedium).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  ticket.category.toUpperCase(),
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: catColors[ticket.category] ?? AppTheme.greyMedium),
                ),
              ),
              const Spacer(),
              Text(
                _formatDate(ticket.createdAt),
                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppTheme.greyMedium, fontSize: 11),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            ticket.message,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppTheme.greyMedium.withValues(alpha: 0.8)),
          ),
          if (ticket.attachmentUrl != null)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Row(
                children: [
                  Icon(Icons.attach_file_rounded, color: AppTheme.greyMedium, size: 14),
                  const SizedBox(width: 4),
                  Text('Attachment', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppTheme.primaryRed, fontSize: 11)),
                ],
              ),
            ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);
    if (diff.inDays == 0) return 'Today';
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${date.day}/${date.month}/${date.year}';
  }
}

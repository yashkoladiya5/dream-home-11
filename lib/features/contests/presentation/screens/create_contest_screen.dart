import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/contest_model.dart';
import '../providers/contest_provider.dart';

class CreateContestScreen extends ConsumerStatefulWidget {
  const CreateContestScreen({super.key});

  @override
  ConsumerState<CreateContestScreen> createState() => _CreateContestScreenState();
}

class _CreateContestScreenState extends ConsumerState<CreateContestScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _entryFeeController = TextEditingController();
  final _pointsController = TextEditingController();
  final _maxSlotsController = TextEditingController();
  final _prizeController = TextEditingController();
  final _rulesController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _titleController.dispose();
    _entryFeeController.dispose();
    _pointsController.dispose();
    _maxSlotsController.dispose();
    _prizeController.dispose();
    _rulesController.dispose();
    super.dispose();
  }

  Future<void> _onSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    final rulesValue = _rulesController.text.trim().isEmpty ? null : _rulesController.text.trim();
    debugPrint('[CreateContest] Submitting contest — title: "${_titleController.text.trim()}", '
        'entryFeeInr: ${_entryFeeController.text.trim()}, '
        'pointsToJoin: ${_pointsController.text.trim()}, '
        'maxSlots: ${_maxSlotsController.text.trim()}, '
        'prize: "${_prizeController.text.trim()}", '
        'rules: "${rulesValue}"');

    final result = await ref.read(contestListProvider.notifier).createPrivateContest(
      title: _titleController.text.trim(),
      entryFeeInr: double.parse(_entryFeeController.text.trim()),
      pointsToJoin: int.parse(_pointsController.text.trim()),
      maxSlots: int.parse(_maxSlotsController.text.trim()),
      prize: _prizeController.text.trim().isEmpty ? null : _prizeController.text.trim(),
      rules: rulesValue,
    );

    setState(() => _isSubmitting = false);

    if (!mounted) return;

    if (result != null) {
      final contest = result['contest'] as ContestModel;
      final inviteCode = result['inviteCode'] as String;
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (_) => PrivateContestSuccessDialog(
          contest: contest,
          inviteCode: inviteCode,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to create contest. Please try again.'),
          backgroundColor: AppTheme.primaryRed,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Create Private Contest'),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildSectionHeader(context, 'Contest Details'),
                const SizedBox(height: 16),
                _buildField(
                  context,
                  controller: _titleController,
                  label: 'Contest Title',
                  hint: 'e.g. Weekend Knockout',
                  maxLength: 150,
                  keyboardType: TextInputType.text,
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Title is required';
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                _buildField(
                  context,
                  controller: _entryFeeController,
                  label: 'Entry Fee (INR)',
                  hint: 'e.g. 50',
                  prefixText: '\u20B9 ',
                  keyboardType: TextInputType.number,
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Entry fee is required';
                    final fee = double.tryParse(v.trim());
                    if (fee == null || fee < 0) return 'Enter a valid amount';
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                _buildField(
                  context,
                  controller: _pointsController,
                  label: 'Points to Join',
                  hint: 'e.g. 100',
                  keyboardType: TextInputType.number,
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Points are required';
                    final pts = int.tryParse(v.trim());
                    if (pts == null || pts < 0) return 'Enter valid points';
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                _buildField(
                  context,
                  controller: _maxSlotsController,
                  label: 'Max Slots',
                  hint: 'e.g. 100',
                  keyboardType: TextInputType.number,
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Max slots is required';
                    final slots = int.tryParse(v.trim());
                    if (slots == null || slots < 1) return 'Minimum 1 slot';
                    if (slots > 100000) return 'Maximum 100000 slots';
                    return null;
                  },
                ),
                const SizedBox(height: 24),
                _buildSectionHeader(context, 'Additional Info (Optional)'),
                const SizedBox(height: 16),
                _buildField(
                  context,
                  controller: _prizeController,
                  label: 'Prize Description',
                  hint: 'e.g. Winner gets \u20B9500',
                  maxLines: 3,
                  keyboardType: TextInputType.multiline,
                ),
                const SizedBox(height: 16),
                _buildField(
                  context,
                  controller: _rulesController,
                  label: 'Rules',
                  hint: 'Any special rules or instructions...',
                  maxLines: 4,
                  keyboardType: TextInputType.multiline,
                ),
                const SizedBox(height: 32),
                _buildSubmitButton(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String text) {
    return Text(
      text,
      style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
    );
  }

  Widget _buildField(
    BuildContext context, {
    required TextEditingController controller,
    required String label,
    String? hint,
    String? prefixText,
    int? maxLength,
    int maxLines = 1,
    required TextInputType keyboardType,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      maxLength: maxLength,
      maxLines: maxLines,
      keyboardType: keyboardType,
      style: Theme.of(context).textTheme.bodyLarge,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixText: prefixText,
        counterText: '',
      ),
    );
  }

  Widget _buildSubmitButton() {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: _isSubmitting ? null : AppTheme.primaryGradient,
        color: _isSubmitting ? const Color(0xFF1F2937) : null,
        boxShadow: _isSubmitting
            ? null
            : [
                BoxShadow(
                  color: AppTheme.primaryRed.withAlpha(60),
                  blurRadius: 15,
                  offset: const Offset(0, 5),
                ),
              ],
      ),
      child: ElevatedButton(
        onPressed: _isSubmitting ? null : _onSubmit,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          disabledBackgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          padding: const EdgeInsets.symmetric(vertical: 18),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        child: _isSubmitting
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  valueColor: AlwaysStoppedAnimation<Color>(AppTheme.white),
                ),
              )
            : Text(
                'CREATE PRIVATE CONTEST',
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.2,
                      fontSize: 16,
                      color: AppTheme.white,
                    ),
              ),
      ),
    );
  }
}

class PrivateContestSuccessDialog extends StatelessWidget {
  final ContestModel contest;
  final String inviteCode;

  const PrivateContestSuccessDialog({
    super.key,
    required this.contest,
    required this.inviteCode,
  });

  void _copyInviteCode(BuildContext context) {
    Clipboard.setData(ClipboardData(text: inviteCode));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Invite code copied!'),
        backgroundColor: AppTheme.emeraldGreen,
        duration: Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      child: Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(24),
        child: Container(
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0x1FFFFFFF)),
          ),
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: [
                      AppTheme.emeraldGreen.withValues(alpha: 0.3),
                      AppTheme.emeraldGreen.withValues(alpha: 0.1),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  border: Border.all(
                    color: AppTheme.emeraldGreen.withValues(alpha: 0.4),
                    width: 2,
                  ),
                ),
                child: const Icon(
                  Icons.check_rounded,
                  color: AppTheme.emeraldGreen,
                  size: 36,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Contest Created!',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                contest.title,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppTheme.greyLight,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              Text(
                'Share this code with friends to invite them',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.greyMedium,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                decoration: BoxDecoration(
                  color: AppTheme.secondarySlate,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: AppTheme.emeraldGreen.withValues(alpha: 0.5),
                    width: 1.5,
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      inviteCode,
                      style: Theme.of(context).textTheme.displayMedium?.copyWith(
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.bold,
                            letterSpacing: 4,
                            color: AppTheme.emeraldGreen,
                            fontSize: 28,
                          ),
                    ),
                    const SizedBox(width: 12),
                    InkWell(
                      onTap: () => _copyInviteCode(context),
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppTheme.emeraldGreen.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(
                          Icons.copy_rounded,
                          color: AppTheme.emeraldGreen,
                          size: 22,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: () => _copyInviteCode(context),
                  icon: const Icon(Icons.share_rounded, size: 18),
                  label: const Text(
                    'SHARE INVITE CODE',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.0,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.emeraldGreen,
                    foregroundColor: AppTheme.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    context.push('/contest/${contest.id}');
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryRed,
                    foregroundColor: AppTheme.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 4,
                    shadowColor: AppTheme.primaryRed.withValues(alpha: 0.4),
                  ),
                  child: const Text(
                    'GO TO CONTEST',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.0,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: Text(
                  'BACK TO CONTESTS',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.greyMedium,
                        decoration: TextDecoration.underline,
                      ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

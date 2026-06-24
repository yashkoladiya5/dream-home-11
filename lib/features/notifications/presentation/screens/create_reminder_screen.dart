import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../features/contests/presentation/providers/contest_provider.dart';
import '../../../../features/dashboard/presentation/widgets/shimmer_widget.dart';
import '../providers/reminder_provider.dart';

class CreateReminderScreen extends ConsumerStatefulWidget {
  const CreateReminderScreen({super.key});

  @override
  ConsumerState<CreateReminderScreen> createState() => _CreateReminderScreenState();
}

class _CreateReminderScreenState extends ConsumerState<CreateReminderScreen> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedContestId;
  DateTime? _selectedDateTime;
  bool _isLoading = false;

  Future<void> _pickDateTime() async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: _selectedDateTime ?? now.add(const Duration(hours: 1)),
      firstDate: now,
      lastDate: now.add(const Duration(days: 90)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: AppTheme.primaryRed,
              onPrimary: Colors.white,
              surface: AppTheme.secondarySlate,
              onSurface: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );
    if (date == null) return;
    if (!mounted) return;

    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_selectedDateTime ?? now),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: AppTheme.primaryRed,
              onPrimary: Colors.white,
              surface: AppTheme.secondarySlate,
              onSurface: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );
    if (time == null) return;

    setState(() {
      _selectedDateTime = DateTime(
        date.year,
        date.month,
        date.day,
        time.hour,
        time.minute,
      );
    });
  }

  String _formatDateTime(DateTime dt) {
    final hour = dt.hour > 12 ? dt.hour - 12 : (dt.hour == 0 ? 12 : dt.hour);
    final minute = dt.minute.toString().padLeft(2, '0');
    final ampm = dt.hour >= 12 ? 'PM' : 'AM';
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${months[dt.month - 1]} ${dt.day}, $dt.year at $hour:$minute $ampm';
  }

  Future<void> _submit() async {
    if (_selectedContestId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a contest'),
          backgroundColor: AppTheme.primaryRed,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    if (_selectedDateTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a reminder time'),
          backgroundColor: AppTheme.primaryRed,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    final result = await ref.read(remindersProvider.notifier).createReminder(
      contestId: _selectedContestId!,
      remindAt: _selectedDateTime!,
    );

    setState(() => _isLoading = false);

    if (result != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Reminder created!'),
          backgroundColor: AppTheme.emeraldGreen,
          behavior: SnackBarBehavior.floating,
        ),
      );
      Navigator.pop(context, true);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to create reminder'),
          backgroundColor: AppTheme.primaryRed,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final contestsState = ref.watch(contestListProvider);

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Set Reminder'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Select Contest',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              contestsState.when(
                data: (contests) {
                  final upcoming = contests.where((c) => c.status == 'upcoming').toList();
                  if (upcoming.isEmpty) {
                    return Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppTheme.secondarySlate,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.greyDark),
                      ),
                      child: Text(
                        'No upcoming contests available',
                        style: theme.textTheme.bodyMedium?.copyWith(color: AppTheme.greyMedium),
                      ),
                    );
                  }
                  return Container(
                    decoration: BoxDecoration(
                      color: AppTheme.secondarySlate,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.greyDark),
                    ),
                    constraints: const BoxConstraints(maxHeight: 220),
                    child: ListView.separated(
                      shrinkWrap: true,
                      padding: EdgeInsets.zero,
                      itemCount: upcoming.length,
                      separatorBuilder: (_, _) => const Divider(height: 1, color: AppTheme.greyDark),
                      itemBuilder: (context, index) {
                        final contest = upcoming[index];
                        final isSelected = _selectedContestId == contest.id;
                        return InkWell(
                          onTap: () => setState(() {
                            _selectedContestId = contest.id;
                          }),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            decoration: BoxDecoration(
                              color: isSelected ? AppTheme.primaryRed.withValues(alpha: 0.1) : Colors.transparent,
                              borderRadius: BorderRadius.circular(index == 0 ? 12 : 0),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 20,
                                  height: 20,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: isSelected ? AppTheme.primaryRed : AppTheme.greyMedium,
                                      width: 2,
                                    ),
                                    color: isSelected ? AppTheme.primaryRed : Colors.transparent,
                                  ),
                                  child: isSelected
                                      ? const Icon(Icons.check_rounded, size: 12, color: Colors.white)
                                      : null,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        contest.title,
                                        style: theme.textTheme.bodyLarge?.copyWith(
                                          fontWeight: FontWeight.w600,
                                          color: isSelected ? AppTheme.primaryRed : Colors.white,
                                        ),
                                      ),
                                      Text(
                                        '${contest.type.toUpperCase()}  •  ${contest.entryFeeInr.toStringAsFixed(0)} pts',
                                        style: theme.textTheme.bodyMedium?.copyWith(
                                          fontSize: 11,
                                          color: AppTheme.greyMedium,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  );
                },
                loading: () => const ShimmerCard(height: 120, borderRadius: 12),
                error: (err, _) => Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.secondarySlate,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    'Failed to load contests',
                    style: theme.textTheme.bodyMedium?.copyWith(color: AppTheme.greyMedium),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Reminder Time',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              InkWell(
                onTap: _pickDateTime,
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  decoration: BoxDecoration(
                    color: AppTheme.secondarySlate,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.greyDark),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.calendar_month_rounded,
                        color: AppTheme.primaryRed,
                        size: 22,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _selectedDateTime != null
                              ? _formatDateTime(_selectedDateTime!)
                              : 'Tap to select date & time',
                          style: theme.textTheme.bodyLarge?.copyWith(
                            color: _selectedDateTime != null
                                ? Colors.white
                                : AppTheme.greyMedium,
                          ),
                        ),
                      ),
                      const Icon(
                        Icons.arrow_forward_ios_rounded,
                        color: AppTheme.greyMedium,
                        size: 14,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 40),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _selectedContestId != null && _selectedDateTime != null
                        ? AppTheme.primaryRed
                        : AppTheme.greyDark,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          'CREATE REMINDER',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.5,
                          ),
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

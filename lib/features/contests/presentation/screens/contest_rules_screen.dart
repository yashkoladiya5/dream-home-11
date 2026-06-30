import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/contest_model.dart';

class ContestRulesScreen extends StatelessWidget {
  final ContestModel contest;
  final VoidCallback onAgreed;

  const ContestRulesScreen({
    super.key,
    required this.contest,
    required this.onAgreed,
  });

  @override
  Widget build(BuildContext context) {
    final rules = contest.rules;
    debugPrint('[ContestRulesScreen] Building for contest: "${contest.title}" (id: ${contest.id})');
    debugPrint('[ContestRulesScreen] contest.rules is null? ${rules == null}');
    debugPrint('[ContestRulesScreen] contest.rules raw value: "$rules"');
    final ruleLines = rules != null ? rules.split('\n').where((l) => l.trim().isNotEmpty).toList() : <String>[];
    debugPrint('[ContestRulesScreen] Parsed ${ruleLines.length} rule lines');
    if (ruleLines.isNotEmpty) {
      for (var i = 0; i < ruleLines.length; i++) {
        debugPrint('[ContestRulesScreen] Rule $i: "${ruleLines[i]}"');
      }
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Contest Rules'),
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _buildHeader(context, contest),
                  const SizedBox(height: 24),
                  if (ruleLines.isNotEmpty) ...[
                    Text(
                      'Terms & Conditions',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 16),
                    ...List.generate(ruleLines.length, (index) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              margin: const EdgeInsets.only(top: 4),
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: AppTheme.primaryRed,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                ruleLines[index].replaceFirst(RegExp(r'^\d+\.\s*'), ''),
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                      height: 1.5,
                                    ),
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                  ] else ...[
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.all(40),
                        child: Column(
                          children: [
                            const Icon(Icons.description_outlined, size: 48, color: AppTheme.greyMedium),
                            const SizedBox(height: 16),
                            Text(
                              'No specific rules for this contest',
                              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                    color: AppTheme.greyMedium,
                                  ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  _buildInfoCard(context),
                ],
              ),
            ),
          ),
          _buildAgreeButton(context),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context, ContestModel contest) {
    return Container(
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppTheme.primaryRed.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(Icons.gavel_rounded, color: AppTheme.primaryRed, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  contest.title,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Please read the rules carefully before joining',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.greyMedium,
                        fontSize: 13,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.emeraldGreen.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.emeraldGreen.withValues(alpha: 0.2)),
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          const Icon(Icons.info_outline_rounded, color: AppTheme.emeraldGreen, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'By agreeing, you confirm that you have read and accept these terms.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.greyLight,
                    fontSize: 13,
                  ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAgreeButton(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.darkSlate.withValues(alpha: 0),
            AppTheme.darkSlate,
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: SizedBox(
        width: double.infinity,
        height: 56,
        child: ElevatedButton(
          onPressed: onAgreed,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primaryRed,
            foregroundColor: AppTheme.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            elevation: 4,
            shadowColor: AppTheme.primaryRed.withValues(alpha: 0.4),
          ),
          child: Text(
            'I AGREE - JOIN CONTEST \u20B9${contest.entryFeeInr.toStringAsFixed(0)}',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.0,
                ),
          ),
        ),
      ),
    );
  }
}

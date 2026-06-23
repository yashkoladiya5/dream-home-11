import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/contest_model.dart';
import '../providers/contest_provider.dart';
import '../helpers/join_contest_dialog.dart';
import 'contest_rules_screen.dart';
import 'join_success_screen.dart';
import '../../../dashboard/data/models/user_profile.dart';
import '../../../dashboard/presentation/providers/user_profile_provider.dart';

enum _CodeLookupState { idle, loading, found, notFound, full, notRunning, cannotJoin, alreadyJoined, error }

class EnterCodeScreen extends ConsumerStatefulWidget {
  const EnterCodeScreen({super.key});

  @override
  ConsumerState<EnterCodeScreen> createState() => _EnterCodeScreenState();
}

class _EnterCodeScreenState extends ConsumerState<EnterCodeScreen>
    with SingleTickerProviderStateMixin {
  final TextEditingController _codeController = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  _CodeLookupState _lookupState = _CodeLookupState.idle;
  ContestModel? _foundContest;
  String? _errorMessage;
  bool _isFocused = false;
  late AnimationController _animController;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(() {
      setState(() => _isFocused = _focusNode.hasFocus);
    });
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _fadeAnim = CurvedAnimation(parent: _animController, curve: Curves.easeOut);
    _slideAnim = Tween<Offset>(
      begin: const Offset(0, 0.15),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _animController, curve: Curves.easeOutCubic));
  }

  @override
  void dispose() {
    _codeController.dispose();
    _focusNode.dispose();
    _animController.dispose();
    super.dispose();
  }

  Future<void> _lookupCode() async {
    final code = _codeController.text.trim();
    if (code.length != 8) return;

    setState(() {
      _lookupState = _CodeLookupState.loading;
      _foundContest = null;
      _errorMessage = null;
    });
    _animController.reverse();

    try {
      debugPrint('[EnterCodeScreen] Calling lookupContestByCode with code: "$code"');
      final contest = await ref.read(contestListProvider.notifier).lookupContestByCode(code);
      debugPrint('[EnterCodeScreen] lookupContestByCode returned: $contest');
      if (!mounted) return;

      if (contest == null) {
        debugPrint('[EnterCodeScreen] contest is null → notFound state');
        setState(() => _lookupState = _CodeLookupState.notFound);
      } else {
        debugPrint('[EnterCodeScreen] contest.id: ${contest.id}');
        debugPrint('[EnterCodeScreen] contest.title: ${contest.title}');
        debugPrint('[EnterCodeScreen] contest.status: "${contest.status}"');
        debugPrint('[EnterCodeScreen] contest.filledSlots: ${contest.filledSlots}');
        debugPrint('[EnterCodeScreen] contest.maxSlots: ${contest.maxSlots}');
        debugPrint('[EnterCodeScreen] contest.inviteCode: "${contest.inviteCode}"');

        if (contest.filledSlots >= contest.maxSlots) {
          debugPrint('[EnterCodeScreen] contest is full → full state');
          setState(() {
            _lookupState = _CodeLookupState.full;
            _foundContest = contest;
          });
        } else if (contest.status != 'running') {
          debugPrint('[EnterCodeScreen] status "${contest.status}" != "running" → notRunning state');
          setState(() {
            _lookupState = _CodeLookupState.notRunning;
            _foundContest = contest;
          });
        } else if (ref.read(contestListProvider.notifier).isJoined(contest.id)) {
          debugPrint('[EnterCodeScreen] user already joined → alreadyJoined state');
          setState(() {
            _lookupState = _CodeLookupState.alreadyJoined;
            _foundContest = contest;
          });
        } else if (contest.canJoin == false) {
          debugPrint('[EnterCodeScreen] canJoin is false → cannotJoin state, reason: "${contest.cannotJoinReason}"');
          setState(() {
            _lookupState = _CodeLookupState.cannotJoin;
            _foundContest = contest;
          });
        } else {
          debugPrint('[EnterCodeScreen] all checks passed → found state');
          setState(() {
            _lookupState = _CodeLookupState.found;
            _foundContest = contest;
          });
        }
      }
      _animController.forward(from: 0);
    } catch (e, stack) {
      debugPrint('[EnterCodeScreen] EXCEPTION: $e');
      debugPrint('[EnterCodeScreen] Stack trace: $stack');
      if (!mounted) return;
      setState(() {
        _lookupState = _CodeLookupState.error;
        _errorMessage = e.toString();
      });
      _animController.forward(from: 0);
    }
  }

  void _resetLookup() {
    setState(() {
      _lookupState = _CodeLookupState.idle;
      _foundContest = null;
      _errorMessage = null;
    });
    _animController.reverse();
  }

  Future<void> _joinContest(ContestModel contest) async {
    debugPrint('[EnterCodeScreen] _joinContest called — contest.id: ${contest.id}, contest.title: "${contest.title}"');
    debugPrint('[EnterCodeScreen] contest.rules is null? ${contest.rules == null}');
    debugPrint('[EnterCodeScreen] contest.rules value: "${contest.rules}"');

    final result = await Navigator.of(context).push<String>(
      MaterialPageRoute(
        builder: (_) => ContestRulesScreen(
          contest: contest,
          onAgreed: () {
            debugPrint('[EnterCodeScreen] User agreed to rules');
            Navigator.of(context).pop('confirmed');
          },
        ),
      ),
    );
    debugPrint('[EnterCodeScreen] Rules screen returned: "$result"');

    if (result == 'confirmed' && context.mounted) {
      final confirmed = await showJoinConfirmationDialog(context, contest);
      if (confirmed == true && context.mounted) {
        final joinResult =
            await ref.read(userProfileProvider.notifier).joinContestById(contest.id);
        if (context.mounted) {
          if (joinResult != null) {
            final userData =
                UserProfile.fromJson(joinResult['user'] as Map<String, dynamic>);
            ref.read(contestListProvider.notifier).updateContestAfterJoin(contest.id);
            await Navigator.of(context).pushReplacement(
              MaterialPageRoute(
                builder: (_) => JoinSuccessScreen(
                  contest: contest,
                  updatedProfile: userData,
                ),
              ),
            );
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                backgroundColor: AppTheme.primaryRed,
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                content: const Text(
                  'Failed to join contest. Please check your wallet balance.',
                  style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.white),
                ),
              ),
            );
          }
        }
      }
    }
  }

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'running':
        return AppTheme.emeraldGreen;
      case 'upcoming':
        return AppTheme.goldYellow;
      case 'completed':
        return Colors.blueAccent;
      default:
        return AppTheme.greyMedium;
    }
  }

  String _statusLabel(String status) {
    switch (status.toLowerCase()) {
      case 'running':
        return 'LIVE';
      case 'upcoming':
        return 'UPCOMING';
      case 'completed':
        return 'COMPLETED';
      default:
        return status.toUpperCase();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Enter Contest Code')),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 32, 20, 20),
        child: Column(
          children: [
            _buildCodeInput(),
            const SizedBox(height: 24),
            if (_lookupState == _CodeLookupState.idle) _buildIdleState(),
            if (_lookupState == _CodeLookupState.loading) _buildLoadingState(),
            if (_lookupState == _CodeLookupState.notFound) _buildNotFoundState(),
            if (_lookupState == _CodeLookupState.full) _buildFullState(),
            if (_lookupState == _CodeLookupState.notRunning) _buildNotRunningState(),
            if (_lookupState == _CodeLookupState.error) _buildErrorState(),
            if (_lookupState == _CodeLookupState.found && _foundContest != null)
              _buildContestPreview(_foundContest!),
            if (_lookupState == _CodeLookupState.cannotJoin && _foundContest != null) ...[
              _buildContestPreview(_foundContest!),
              const SizedBox(height: 12),
              _buildCannotJoinBanner(_foundContest!),
            ],
            if (_lookupState == _CodeLookupState.alreadyJoined && _foundContest != null)
              _buildContestPreview(_foundContest!),
          ],
        ),
      ),
    );
  }

  Widget _buildCodeInput() {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: _isFocused
              ? AppTheme.emeraldGreen.withValues(alpha: 0.6)
              : const Color(0x1FFFFFFF),
          width: _isFocused ? 2 : 1,
        ),
        boxShadow: _isFocused
            ? [
                BoxShadow(
                  color: AppTheme.emeraldGreen.withValues(alpha: 0.08),
                  blurRadius: 24,
                  spreadRadius: 0,
                ),
              ]
            : null,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _codeController,
            focusNode: _focusNode,
            maxLength: 8,
            textCapitalization: TextCapitalization.characters,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: 'monospace',
              fontSize: 30,
              fontWeight: FontWeight.bold,
              color: AppTheme.white,
              letterSpacing: 10,
            ),
            decoration: const InputDecoration(
              counterText: '',
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              hintText: '0 0 0 0  0 0 0 0',
              hintStyle: TextStyle(
                fontFamily: 'monospace',
                fontSize: 30,
                color: Color(0xFF374151),
                letterSpacing: 10,
              ),
            ),
            onChanged: (value) {
              if (_lookupState != _CodeLookupState.idle && value.length < 8) {
                _resetLookup();
              }
              if (value.length == 8) {
                _lookupCode();
              }
            },
            onSubmitted: (_) {
              if (_codeController.text.length == 8) {
                _lookupCode();
              }
            },
          ),
          const SizedBox(height: 8),
          Text(
            'Enter the 8-character invite code',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppTheme.greyMedium,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildIdleState() {
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: ElevatedButton(
        onPressed: _codeController.text.length == 8 ? _lookupCode : null,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppTheme.primaryRed,
          foregroundColor: AppTheme.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          elevation: 2,
          disabledBackgroundColor: AppTheme.greyDark,
          disabledForegroundColor: AppTheme.greyMedium,
        ),
        child: const Text(
          'LOOKUP',
          style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.5),
        ),
      ),
    );
  }

  Widget _buildLoadingState() {
    return const Center(
      child: Padding(
        padding: EdgeInsets.symmetric(vertical: 40),
        child: CircularProgressIndicator(
          color: AppTheme.emeraldGreen,
          strokeWidth: 3,
        ),
      ),
    );
  }

  Widget _buildNotFoundState() {
    return FadeTransition(
      opacity: _fadeAnim,
      child: SlideTransition(
        position: _slideAnim,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            gradient: AppTheme.darkCardGradient,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0x1FFFFFFF)),
          ),
          child: Column(
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: AppTheme.primaryRed.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.cancel_rounded,
                  color: AppTheme.primaryRed,
                  size: 32,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Invalid Code',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'The code you entered is invalid',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.greyMedium,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              TextButton.icon(
                onPressed: _resetLookup,
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: const Text('TRY AGAIN'),
                style: TextButton.styleFrom(
                  foregroundColor: AppTheme.primaryRed,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFullState() {
    return FadeTransition(
      opacity: _fadeAnim,
      child: SlideTransition(
        position: _slideAnim,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            gradient: AppTheme.darkCardGradient,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0x1FFFFFFF)),
          ),
          child: Column(
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: AppTheme.goldYellow.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.group_off_rounded,
                  color: AppTheme.goldYellow,
                  size: 32,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Contest Full',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'This contest has reached its maximum slots',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.greyMedium,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              TextButton.icon(
                onPressed: _resetLookup,
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: const Text('TRY ANOTHER CODE'),
                style: TextButton.styleFrom(
                  foregroundColor: AppTheme.goldYellow,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNotRunningState() {
    return FadeTransition(
      opacity: _fadeAnim,
      child: SlideTransition(
        position: _slideAnim,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            gradient: AppTheme.darkCardGradient,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0x1FFFFFFF)),
          ),
          child: Column(
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: Colors.blueAccent.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.info_outline_rounded,
                  color: Colors.blueAccent,
                  size: 32,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Contest Not Available',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                _foundContest != null
                    ? 'This contest is ${_statusLabel(_foundContest!.status).toLowerCase()} and cannot be joined right now'
                    : 'This contest is not currently available for joining',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.greyMedium,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              TextButton.icon(
                onPressed: _resetLookup,
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: const Text('TRY ANOTHER CODE'),
                style: TextButton.styleFrom(
                  foregroundColor: Colors.blueAccent,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return FadeTransition(
      opacity: _fadeAnim,
      child: SlideTransition(
        position: _slideAnim,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            gradient: AppTheme.darkCardGradient,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0x1FFFFFFF)),
          ),
          child: Column(
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: AppTheme.primaryRed.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.wifi_off_rounded,
                  color: AppTheme.primaryRed,
                  size: 32,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Something went wrong',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                _errorMessage ?? 'An unexpected error occurred. Please try again.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.greyMedium,
                      fontSize: 13,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _lookupCode,
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: const Text('RETRY'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryRed,
                  foregroundColor: AppTheme.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildContestPreview(ContestModel contest) {
    final isRunning = contest.status == 'running';
    final statusColor = _statusColor(contest.status);
    final statusLabel = _statusLabel(contest.status);
    final isAlreadyJoined = _lookupState == _CodeLookupState.alreadyJoined;
    final isCannotJoin = _lookupState == _CodeLookupState.cannotJoin;

    return FadeTransition(
      opacity: _fadeAnim,
      child: SlideTransition(
        position: _slideAnim,
        child: Container(
          decoration: BoxDecoration(
            gradient: AppTheme.darkCardGradient,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0x1FFFFFFF)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
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
                              if (contest.prize != null) ...[
                                const SizedBox(height: 6),
                                Text(
                                  contest.prize!,
                                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                        color: AppTheme.goldYellow,
                                        fontWeight: FontWeight.w600,
                                      ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: statusColor.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: statusColor.withValues(alpha: 0.4),
                              width: 1,
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: BoxDecoration(
                                  color: statusColor,
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: statusColor.withValues(alpha: 0.5),
                                      blurRadius: 6,
                                      spreadRadius: 1,
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                statusLabel,
                                style: TextStyle(
                                  color: statusColor,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 1.0,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (isAlreadyJoined) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: AppTheme.emeraldGreen.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: AppTheme.emeraldGreen.withValues(alpha: 0.4),
                                width: 1,
                              ),
                            ),
                            child: Text(
                              'ALREADY JOINED',
                              style: TextStyle(
                                color: AppTheme.emeraldGreen,
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.8,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Expanded(
                          child: _buildInfoItem(
                            icon: Icons.account_balance_wallet_rounded,
                            label: 'Entry Fee',
                            value: '\u20B9${contest.entryFeeInr.toStringAsFixed(0)}',
                            color: AppTheme.emeraldGreen,
                          ),
                        ),
                        Container(
                          width: 1,
                          height: 36,
                          color: Colors.white.withValues(alpha: 0.08),
                        ),
                        Expanded(
                          child: _buildInfoItem(
                            icon: Icons.stars_rounded,
                            label: 'Points to Join',
                            value: '${contest.pointsToJoin} PTS',
                            color: AppTheme.goldYellow,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Text(
                          '${contest.filledSlots}/${contest.maxSlots}',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                                fontSize: 22,
                              ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'slots filled',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppTheme.greyMedium,
                                fontSize: 13,
                              ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: contest.fillPercentage,
                        backgroundColor: AppTheme.greyDark,
                        valueColor: const AlwaysStoppedAnimation<Color>(
                          AppTheme.emeraldGreen,
                        ),
                        minHeight: 8,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '${contest.spotsLeft} spots left',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppTheme.emeraldGreen,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                        Text(
                          '${(contest.fillPercentage * 100).toStringAsFixed(0)}% filled',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppTheme.greyMedium,
                                fontSize: 12,
                              ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
                child: SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: !isAlreadyJoined && !isCannotJoin && isRunning
                        ? () => _joinContest(contest)
                        : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor:
                          isRunning && !isAlreadyJoined && !isCannotJoin
                              ? AppTheme.emeraldGreen
                              : AppTheme.greyDark,
                      foregroundColor: AppTheme.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: isRunning && !isAlreadyJoined && !isCannotJoin
                          ? 4
                          : 0,
                      shadowColor: isRunning && !isAlreadyJoined && !isCannotJoin
                          ? AppTheme.emeraldGreen.withValues(alpha: 0.4)
                          : null,
                    ),
                    child: Text(
                      isAlreadyJoined
                          ? 'ALREADY JOINED'
                          : isCannotJoin
                              ? 'CANNOT JOIN'
                              : isRunning
                                  ? 'JOIN CONTEST - \u20B9${contest.entryFeeInr.toStringAsFixed(0)}'
                                  : contest.status == 'completed'
                                      ? 'CONTEST ENDED'
                                      : 'COMING SOON',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.0,
                          ),
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

  Widget _buildCannotJoinBanner(ContestModel contest) {
    return FadeTransition(
      opacity: _fadeAnim,
      child: Padding(
        padding: const EdgeInsets.only(top: 12),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppTheme.primaryRed.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.primaryRed.withValues(alpha: 0.2)),
          ),
          child: Row(
            children: [
              Icon(Icons.error_outline_rounded, color: AppTheme.primaryRed, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  contest.cannotJoinReason ?? 'Cannot join this contest',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.primaryRed,
                      ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoItem({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(height: 4),
        Text(
          label,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppTheme.greyMedium,
                fontSize: 11,
              ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: color,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
        ),
      ],
    );
  }
}

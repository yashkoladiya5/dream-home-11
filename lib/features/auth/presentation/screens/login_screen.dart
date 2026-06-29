import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/auth_provider.dart';
import '../providers/auth_state.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  bool _isAgeAccepted = false;
  bool _isPhoneValid = false;
  late final TapGestureRecognizer _termsRecognizer;
  late final TapGestureRecognizer _privacyRecognizer;

  @override
  void initState() {
    super.initState();
    _phoneController.addListener(_validatePhone);
    _termsRecognizer = TapGestureRecognizer()..onTap = () => context.push('/terms-of-service');
    _privacyRecognizer = TapGestureRecognizer()..onTap = () => context.push('/privacy-policy');
  }

  void _validatePhone() {
    final text = _phoneController.text;
    final isValid = RegExp(r'^[0-9]{10}$').hasMatch(text);
    if (isValid != _isPhoneValid) {
      setState(() {
        _isPhoneValid = isValid;
      });
    }
  }

  @override
  void dispose() {
    _termsRecognizer.dispose();
    _privacyRecognizer.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  void _onSubmit() {
    if (_formKey.currentState!.validate() && _isAgeAccepted) {
      ref.read(authProvider.notifier).sendOtp(_phoneController.text);
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<AuthState>(authProvider, (previous, next) {
      if (next.status == AuthStatus.codeSent) {
        context.push('/otp', extra: _phoneController.text);
      } else if (next.status == AuthStatus.error) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.errorMessage ?? 'An error occurred'),
            backgroundColor: AppTheme.primaryRed,
          ),
        );
      }
    });

    final authState = ref.watch(authProvider);
    final isButtonEnabled = _isPhoneValid && _isAgeAccepted && authState.status != AuthStatus.loading;

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: Padding(
          padding: const EdgeInsets.only(left: 12.0, top: 8.0, bottom: 8.0),
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0x1AFFFFFF), // 10% white
              borderRadius: BorderRadius.circular(12),
            ),
            child: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new, size: 16),
              onPressed: () => context.go('/language'),
            ),
          ),
        ),
        title: Text(
          'Get Started',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
      ),
      body: Stack(
        children: [
          // Background Aura Glows
          Positioned(
            top: -120,
            left: -120,
            child: Container(
              width: 320,
              height: 320,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Color(0x24D22C2C), // primaryRed with ~14% opacity
              ),
            ),
          ),
          Positioned(
            bottom: 40,
            right: -120,
            child: Container(
              width: 340,
              height: 340,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Color(0x1210B981), // emeraldGreen with ~7% opacity
              ),
            ),
          ),

          // Scrollable Content
          SafeArea(
            child: CustomScrollView(
              physics: const BouncingScrollPhysics(),
              slivers: [
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const SizedBox(height: 16),

                          // Brand Banner Cards
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0x331F2937), Color(0x1A1F2937)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(24),
                              border: Border.all(color: const Color(0x1FFFFFFF)),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: const Color(0x26D22C2C), // primaryRed with ~15% opacity
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: const Icon(
                                    Icons.lock_person_rounded,
                                    color: AppTheme.primaryRed,
                                    size: 32,
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'SECURE VERIFICATION',
                                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                              color: AppTheme.primaryRed,
                                              fontWeight: FontWeight.w900,
                                              fontSize: 11,
                                              letterSpacing: 1.0,
                                            ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'Register with phone to claim rewards.',
                                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                              color: AppTheme.greyLight,
                                              fontWeight: FontWeight.w500,
                                            ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 36),

                          // Header Text
                          Text(
                            'Enter Mobile',
                            style: Theme.of(context).textTheme.displayMedium?.copyWith(
                                  fontWeight: FontWeight.w900,
                                  fontSize: 32,
                                ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Provide a valid 10-digit number. We will send a one-time passcode.',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: AppTheme.greyMedium,
                                ),
                          ),
                          const SizedBox(height: 28),

                          // Form Field
                          TextFormField(
                            controller: _phoneController,
                            keyboardType: TextInputType.phone,
                            maxLength: 10,
                            enabled: authState.status != AuthStatus.loading,
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                  letterSpacing: 2.5,
                                  fontWeight: FontWeight.bold,
                                ),
                            decoration: InputDecoration(
                              counterText: '',
                              prefixIcon: Padding(
                                padding: const EdgeInsets.only(left: 18.0, right: 10.0),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Text(
                                      '🇮🇳',
                                      style: TextStyle(fontSize: 20),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      '+91',
                                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                            color: AppTheme.white,
                                            fontWeight: FontWeight.bold,
                                            letterSpacing: 1.0,
                                          ),
                                    ),
                                    const SizedBox(width: 8),
                                    Container(
                                      height: 20,
                                      width: 1.5,
                                      color: const Color(0x33FFFFFF), // 20% white
                                    ),
                                  ],
                                ),
                              ),
                              hintText: '00000 00000',
                              hintStyle: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    color: AppTheme.greyDark,
                                    letterSpacing: 2.0,
                                  ),
                              suffixIcon: _isPhoneValid
                                  ? Container(
                                      margin: const EdgeInsets.only(right: 12.0),
                                      child: const Icon(
                                        Icons.check_circle_rounded,
                                        color: AppTheme.emeraldGreen,
                                        size: 26,
                                      ),
                                    )
                                  : null,
                            ),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                  return 'Please enter mobile number';
                              }
                              if (!RegExp(r'^[0-9]{10}$').hasMatch(value)) {
                                return 'Enter a valid 10-digit number';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 24),

                          // Custom Age Check Card
                          InkWell(
                            onTap: authState.status == AuthStatus.loading
                                ? null
                                : () {
                                    setState(() {
                                      _isAgeAccepted = !_isAgeAccepted;
                                    });
                                  },
                            borderRadius: BorderRadius.circular(20),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: _isAgeAccepted
                                    ? const Color(0x0DFFFFFF) // 5% white
                                    : const Color(0x08FFFFFF), // ~3% white
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: _isAgeAccepted
                                      ? AppTheme.emeraldGreen.withAlpha(80)
                                      : const Color(0x1FFFFFFF),
                                ),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Styled Checkbox
                                  Container(
                                    width: 22,
                                    height: 22,
                                    margin: const EdgeInsets.only(top: 2),
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: _isAgeAccepted
                                          ? AppTheme.emeraldGreen
                                          : Colors.transparent,
                                      border: Border.all(
                                        color: _isAgeAccepted
                                            ? AppTheme.emeraldGreen
                                            : AppTheme.greyMedium,
                                        width: 2,
                                      ),
                                    ),
                                    child: _isAgeAccepted
                                        ? const Icon(
                                            Icons.check,
                                            size: 14,
                                            color: AppTheme.white,
                                          )
                                        : null,
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: RichText(
                                      text: TextSpan(
                                        text: 'I certify that I am ',
                                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                              color: AppTheme.greyLight,
                                              fontSize: 13,
                                            ),
                                        children: [
                                          TextSpan(
                                            text: '18+ years of age',
                                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                                  fontWeight: FontWeight.bold,
                                                  color: AppTheme.white,
                                                  fontSize: 13,
                                                ),
                                          ),
                                          const TextSpan(text: ' and I agree to the platform\'s '),
                                          TextSpan(
                                            text: 'Terms & Conditions',
                                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                                  color: AppTheme.primaryRed,
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 13,
                                                ),
                                            recognizer: _termsRecognizer,
                                          ),
                                          const TextSpan(text: ' and '),
                                          TextSpan(
                                            text: 'Privacy Policy',
                                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                                  color: AppTheme.primaryRed,
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 13,
                                                ),
                                            recognizer: _privacyRecognizer,
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),

                          const Spacer(),
                          const SizedBox(height: 24),

                          // Gradient Action Button
                          Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(16),
                              gradient: isButtonEnabled
                                  ? AppTheme.primaryGradient
                                  : null,
                              color: isButtonEnabled ? null : const Color(0xFF1F2937),
                              boxShadow: isButtonEnabled
                                  ? [
                                      BoxShadow(
                                        color: AppTheme.primaryRed.withAlpha(60),
                                        blurRadius: 15,
                                        offset: const Offset(0, 5),
                                      ),
                                    ]
                                  : null,
                            ),
                            child: ElevatedButton(
                              onPressed: isButtonEnabled ? _onSubmit : null,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.transparent,
                                disabledBackgroundColor: Colors.transparent,
                                shadowColor: Colors.transparent,
                                padding: const EdgeInsets.symmetric(vertical: 18),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                              ),
                              child: authState.status == AuthStatus.loading
                                  ? const SizedBox(
                                      width: 24,
                                      height: 24,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2.5,
                                        valueColor: AlwaysStoppedAnimation<Color>(AppTheme.white),
                                      ),
                                    )
                                  : Text(
                                      'GET OTP',
                                      style: Theme.of(context).textTheme.labelLarge?.copyWith(
                                            fontWeight: FontWeight.bold,
                                            letterSpacing: 1.2,
                                            fontSize: 16,
                                            color: isButtonEnabled
                                                ? AppTheme.white
                                                : AppTheme.greyMedium,
                                          ),
                                    ),
                            ),
                          ),
                          const SizedBox(height: 12),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

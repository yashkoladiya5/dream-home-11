import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/user_profile_provider.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _emailController;
  String _selectedAvatar = 'default';
  bool _isSaving = false;

  final List<Map<String, dynamic>> _presets = [
    {'code': 'default', 'icon': Icons.person_rounded, 'name': 'Classic', 'color': AppTheme.white},
    {'code': 'gamer', 'icon': Icons.sports_esports_rounded, 'name': 'Gamer', 'color': AppTheme.primaryRed},
    {'code': 'champion', 'icon': Icons.emoji_events_rounded, 'name': 'Winner', 'color': AppTheme.goldYellow},
    {'code': 'elite', 'icon': Icons.workspace_premium_rounded, 'name': 'Elite', 'color': AppTheme.emeraldGreen},
    {'code': 'lightning', 'icon': Icons.flash_on_rounded, 'name': 'Volt', 'color': Colors.cyan},
    {'code': 'star', 'icon': Icons.star_rounded, 'name': 'Star', 'color': Colors.amber},
  ];

  @override
  void initState() {
    super.initState();
    final profile = ref.read(userProfileProvider).value;
    _nameController = TextEditingController(text: profile?.fullName ?? '');
    _emailController = TextEditingController(text: profile?.email ?? '');
    _selectedAvatar = profile?.avatarUrl ?? 'default';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSaving = true;
    });

    final success = await ref.read(userProfileProvider.notifier).updateProfile(
          fullName: _nameController.text.trim(),
          email: _emailController.text.trim().isEmpty ? '' : _emailController.text.trim(),
          avatarUrl: _selectedAvatar,
        );

    if (mounted) {
      setState(() {
        _isSaving = false;
      });
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppTheme.emeraldGreen,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            content: const Text(
              'Profile updated successfully!',
              style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.white),
            ),
          ),
        );
        Navigator.of(context).pop();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppTheme.primaryRed,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            content: const Text(
              'Failed to update profile. Please try again.',
              style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.white),
            ),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        backgroundColor: AppTheme.darkSlate,
        elevation: 0,
        title: const Text('Edit Profile'),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Avatar Selection Title
                Text(
                  'CHOOSE YOUR AVATAR',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.greyMedium,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.2,
                        fontSize: 11,
                      ),
                ),
                const SizedBox(height: 16),

                // Avatar Grid Layout
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _presets.length,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    childAspectRatio: 0.95,
                  ),
                  itemBuilder: (context, index) {
                    final preset = _presets[index];
                    final code = preset['code'] as String;
                    final icon = preset['icon'] as IconData;
                    final name = preset['name'] as String;
                    final color = preset['color'] as Color;
                    final isSelected = _selectedAvatar == code;

                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          _selectedAvatar = code;
                        });
                      },
                      child: Container(
                        decoration: BoxDecoration(
                          color: const Color(0x0CFFFFFF),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: isSelected ? AppTheme.primaryRed : const Color(0x0FFFFFFF),
                            width: isSelected ? 2 : 1,
                          ),
                          boxShadow: isSelected
                              ? [
                                  BoxShadow(
                                    color: AppTheme.primaryRed.withValues(alpha: 0.15),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ]
                              : null,
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: isSelected
                                    ? AppTheme.primaryRed.withValues(alpha: 0.1)
                                    : const Color(0x08FFFFFF),
                                border: isSelected
                                    ? Border.all(color: AppTheme.primaryRed.withValues(alpha: 0.3), width: 1.5)
                                    : null,
                              ),
                              child: Icon(icon, color: isSelected ? AppTheme.primaryRed : color, size: 24),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              name,
                              style: TextStyle(
                                color: isSelected ? AppTheme.white : AppTheme.greyMedium,
                                fontSize: 11,
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 32),

                // Form Fields
                Text(
                  'ACCOUNT DETAILS',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.greyMedium,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.2,
                        fontSize: 11,
                      ),
                ),
                const SizedBox(height: 16),

                // Full Name Input
                TextFormField(
                  controller: _nameController,
                  style: const TextStyle(color: AppTheme.white, fontSize: 15),
                  decoration: const InputDecoration(
                    labelText: 'Full Name',
                    hintText: 'Enter your full name',
                    prefixIcon: Icon(Icons.person_outline_rounded, color: AppTheme.greyMedium),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Please enter your full name';
                    }
                    if (value.trim().length < 2) {
                      return 'Name must be at least 2 characters long';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 20),

                // Email Input
                TextFormField(
                  controller: _emailController,
                  style: const TextStyle(color: AppTheme.white, fontSize: 15),
                  decoration: const InputDecoration(
                    labelText: 'Email Address',
                    hintText: 'Enter your email address',
                    prefixIcon: Icon(Icons.mail_outline_rounded, color: AppTheme.greyMedium),
                  ),
                  keyboardType: TextInputType.emailAddress,
                  validator: (value) {
                    if (value != null && value.trim().isNotEmpty) {
                      final emailRegExp = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
                      if (!emailRegExp.hasMatch(value.trim())) {
                        return 'Please enter a valid email address';
                      }
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 40),

                // Save Profile Button
                ElevatedButton(
                  onPressed: _isSaving ? null : _saveProfile,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    backgroundColor: AppTheme.primaryRed,
                  ),
                  child: _isSaving
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            color: AppTheme.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Text(
                          'SAVE CHANGES',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                          ),
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

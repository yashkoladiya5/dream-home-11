import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AgeVerificationPage extends StatefulWidget {
  final VoidCallback onVerified;

  const AgeVerificationPage({super.key, required this.onVerified});

  @override
  State<AgeVerificationPage> createState() => _AgeVerificationPageState();
}

class _AgeVerificationPageState extends State<AgeVerificationPage> {
  DateTime? _selectedDate;
  String? _error;

  bool get _isOldEnough {
    if (_selectedDate == null) return false;
    final today = DateTime.now();
    final age = today.year - _selectedDate!.year;
    final monthDiff = today.month - _selectedDate!.month;
    final dayDiff = today.day - _selectedDate!.day;
    if (monthDiff < 0 || (monthDiff == 0 && dayDiff < 0)) {
      return age - 1 >= 18;
    }
    return age >= 18;
  }

  Future<void> _verify() async {
    if (!_isOldEnough) {
      setState(() => _error = 'You must be 18 or older to use this platform');
      return;
    }
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('date_of_birth', _selectedDate!.toIso8601String());
    if (!mounted) return;
    widget.onVerified();
  }

  Future<void> _pickDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now().subtract(const Duration(days: 6570)), // ~18 years
      firstDate: DateTime(1950),
      lastDate: DateTime.now(),
    );
    if (date != null) {
      setState(() {
        _selectedDate = date;
        _error = null;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      child: Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.verified_user, size: 64, color: Theme.of(context).colorScheme.primary),
                const SizedBox(height: 24),
                Text(
                  'Age Verification',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                Text(
                  'You must be 18 years or older to use Dream Home 11. Please verify your date of birth.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 32),
                InkWell(
                  onTap: _pickDate,
                  child: InputDecorator(
                    decoration: InputDecoration(
                      labelText: 'Date of Birth',
                      hintText: 'Select your date of birth',
                      border: const OutlineInputBorder(),
                      suffixIcon: const Icon(Icons.calendar_today),
                      errorText: _error,
                    ),
                    child: _selectedDate != null
                        ? Text(
                            '${_selectedDate!.day}/${_selectedDate!.month}/${_selectedDate!.year}',
                            style: Theme.of(context).textTheme.bodyLarge,
                          )
                        : null,
                  ),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: _selectedDate != null ? _verify : null,
                    child: const Text('Verify Age'),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Your date of birth is stored securely and used only for age verification.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Theme.of(context).colorScheme.outline),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

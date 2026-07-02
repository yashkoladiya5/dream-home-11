import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/app_theme.dart';

class SecurityGuardScreen extends StatelessWidget {
  final List<String> indicators;

  const SecurityGuardScreen({super.key, this.indicators = const []});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.shield_outlined,
                  size: 80,
                  color: AppTheme.primaryRed,
                ),
                const SizedBox(height: 24),
                Text(
                  'Device Compromised',
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                        color: Colors.white,
                      ),
                ),
                const SizedBox(height: 12),
                Text(
                  'This app cannot run on a rooted or jailbroken device for security reasons.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.greyMedium,
                      ),
                ),
                if (indicators.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  Flexible(
                    child: Container(
                      constraints: const BoxConstraints(maxHeight: 200),
                      child: ListView.builder(
                        shrinkWrap: true,
                        itemCount: indicators.length,
                        itemBuilder: (context, index) {
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 4),
                            child: Row(
                              children: [
                                const Icon(Icons.warning_amber_rounded,
                                    size: 18, color: AppTheme.primaryRed),
                                const SizedBox(width: 8),
                                Flexible(
                                  child: Text(
                                    indicators[index],
                                    style: Theme.of(context).textTheme.bodyMedium,
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => SystemNavigator.pop(),
                    child: const Text('Exit App'),
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

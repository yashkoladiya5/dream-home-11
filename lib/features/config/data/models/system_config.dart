class SystemConfig {
  final String appName;
  final String appVersion;
  final String apiVersion;
  final String environment;
  final bool maintenanceMode;
  final String minAppVersionAndroid;
  final String minAppVersionIos;
  final double maxWithdrawalAmount;
  final double minWithdrawalAmount;
  final bool dailySpinEnabled;
  final bool pollsEnabled;
  final bool feedEnabled;
  final bool chatEnabled;
  final bool referralEnabled;
  final int maxDailyPosts;
  final int maxDailySpins;
  final String supportEmail;
  final List<String> restrictedStates;

  SystemConfig({
    required this.appName,
    required this.appVersion,
    required this.apiVersion,
    required this.environment,
    required this.maintenanceMode,
    required this.minAppVersionAndroid,
    required this.minAppVersionIos,
    required this.maxWithdrawalAmount,
    required this.minWithdrawalAmount,
    required this.dailySpinEnabled,
    required this.pollsEnabled,
    required this.feedEnabled,
    required this.chatEnabled,
    required this.referralEnabled,
    required this.maxDailyPosts,
    required this.maxDailySpins,
    required this.supportEmail,
    required this.restrictedStates,
  });

  factory SystemConfig.fromJson(Map<String, dynamic> json) {
    return SystemConfig(
      appName: json['appName'] as String? ?? 'Dream Home 11',
      appVersion: json['appVersion'] as String? ?? '1.0.0',
      apiVersion: json['apiVersion'] as String? ?? 'v1',
      environment: json['environment'] as String? ?? 'production',
      maintenanceMode: json['maintenanceMode'] as bool? ?? false,
      minAppVersionAndroid: json['minAppVersionAndroid'] as String? ?? '1.0.0',
      minAppVersionIos: json['minAppVersionIos'] as String? ?? '1.0.0',
      maxWithdrawalAmount: _parseDouble(json['maxWithdrawalAmount']),
      minWithdrawalAmount: _parseDouble(json['minWithdrawalAmount']),
      dailySpinEnabled: json['dailySpinEnabled'] as bool? ?? true,
      pollsEnabled: json['pollsEnabled'] as bool? ?? true,
      feedEnabled: json['feedEnabled'] as bool? ?? true,
      chatEnabled: json['chatEnabled'] as bool? ?? true,
      referralEnabled: json['referralEnabled'] as bool? ?? true,
      maxDailyPosts: _parseInt(json['maxDailyPosts']),
      maxDailySpins: _parseInt(json['maxDailySpins']),
      supportEmail: json['supportEmail'] as String? ?? 'support@dreamhome11.com',
      restrictedStates: (json['restrictedStates'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          ['Assam', 'Odisha', 'Telangana'],
    );
  }

  static double _parseDouble(dynamic value) {
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0;
    return 0;
  }

  static int _parseInt(dynamic value) {
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? 0;
    if (value is double) return value.toInt();
    return 0;
  }
}

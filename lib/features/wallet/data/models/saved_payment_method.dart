class SavedPaymentMethod {
  final String id;
  final String category; // 'upi', 'card', 'net_banking', 'wallet'
  final String label;
  final String displayValue;
  final String? providerName;
  final String? iconUrl;
  final bool isActive;
  final DateTime createdAt;

  const SavedPaymentMethod({
    required this.id,
    required this.category,
    required this.label,
    required this.displayValue,
    this.providerName,
    this.iconUrl,
    this.isActive = true,
    required this.createdAt,
  });

  String get categoryLabel {
    switch (category) {
      case 'upi': return 'UPI';
      case 'card': return 'Credit / Debit Card';
      case 'net_banking': return 'Net Banking';
      case 'wallet': return 'Wallet';
      default: return category;
    }
  }

  factory SavedPaymentMethod.fromJson(Map<String, dynamic> json) {
    return SavedPaymentMethod(
      id: json['id'] as String,
      category: json['category'] as String,
      label: json['label'] as String,
      displayValue: json['displayValue'] as String,
      providerName: json['providerName'] as String?,
      iconUrl: json['iconUrl'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}

class PaymentMethodCategory {
  final String key;
  final String label;
  final String icon;
  final String description;

  const PaymentMethodCategory({
    required this.key,
    required this.label,
    required this.icon,
    required this.description,
  });

  factory PaymentMethodCategory.fromJson(Map<String, dynamic> json) {
    return PaymentMethodCategory(
      key: json['key'] as String,
      label: json['label'] as String,
      icon: json['icon'] as String,
      description: json['description'] as String,
    );
  }
}

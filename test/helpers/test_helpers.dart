import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

/// Sets up a test with mocktail fallback values for common types.
void registerTestFallbackValues() {
  registerFallbackValue(Uri());
}

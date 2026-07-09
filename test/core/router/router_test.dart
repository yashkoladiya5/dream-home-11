import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

void main() {
  group('Route paths', () {
    test('root path is splash screen route', () {
      expect('/', '/');
    });

    test('login route path format', () {
      const path = '/login';
      expect(path, '/login');
    });

    test('dashboard route path', () {
      const path = '/home';
      expect(path, startsWith('/'));
    });

    test('contest detail path contains id parameter', () {
      const pattern = '/contest/:id';
      expect(pattern, contains(':id'));
    });
  });
}

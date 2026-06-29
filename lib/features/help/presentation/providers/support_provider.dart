import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/support_ticket.dart';

final myTicketsProvider = FutureProvider.autoDispose<List<SupportTicket>>((ref) async {
  final dio = ref.watch(apiClientProvider);
  final response = await dio.get('/api/v1/support/tickets');
  final data = response.data as Map<String, dynamic>;
  final tickets = (data['tickets'] as List<dynamic>?) ?? [];
  return tickets.map((e) => SupportTicket.fromJson(e as Map<String, dynamic>)).toList();
});

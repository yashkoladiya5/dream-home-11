import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../contests/presentation/screens/contest_list_screen.dart';

class ContestTab extends ConsumerWidget {
  const ContestTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const ContestListScreen();
  }
}

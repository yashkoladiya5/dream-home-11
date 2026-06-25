import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/prize_home_provider.dart';
import '../../data/models/prize_home.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';

class HomeGalleryScreen extends ConsumerWidget {
  const HomeGalleryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final prizeHomesAsync = ref.watch(prizeHomeProvider);

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Prize Homes'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: prizeHomesAsync.when(
        loading: () => SingleChildScrollView(
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.only(bottom: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const ShimmerLine(width: 180, height: 28),
                    const SizedBox(height: 8),
                    const ShimmerLine(width: 220, height: 16),
                  ],
                ),
              ),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      children: [
                        const ShimmerCard(height: 280),
                        const SizedBox(height: 12),
                        const ShimmerCard(height: 280),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      children: [
                        const ShimmerCard(height: 280),
                        const SizedBox(height: 12),
                        const ShimmerCard(height: 280),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.error_outline_rounded,
                  size: 64,
                  color: AppTheme.greyMedium,
                ),
                const SizedBox(height: 16),
                Text(
                  'Failed to load prize homes',
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  error.toString(),
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(color: AppTheme.greyMedium),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: () => ref.invalidate(prizeHomeProvider),
                  icon: const Icon(Icons.refresh_rounded),
                  label: const Text('RETRY'),
                ),
              ],
            ),
          ),
        ),
        data: (homes) {
          if (homes.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.home_rounded,
                      size: 64,
                      color: AppTheme.greyMedium,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'No prize homes available',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Check back later for exciting prize home giveaways!',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.greyMedium,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(prizeHomeProvider);
              await ref.read(prizeHomeProvider.future);
            },
            child: CustomScrollView(
              slivers: [
                // SliverPadding(
                //   padding: const EdgeInsets.only(left: 20, right: 20, top: 20),
                //   sliver: SliverToBoxAdapter(
                //     child: Column(
                //       crossAxisAlignment: CrossAxisAlignment.start,
                //       children: [
                //         Text(
                //           'Prize Homes',
                //           style: Theme.of(context).textTheme.displayMedium?.copyWith(
                //             fontWeight: FontWeight.bold,
                //           ),
                //         ),
                //         const SizedBox(height: 4),
                //         Text(
                //           'Explore the dream homes you can win',
                //           style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                //             color: AppTheme.greyMedium,
                //           ),
                //         ),
                //       ],
                //     ),
                //   ),
                // ),
                SliverPadding(
                  padding: const EdgeInsets.only(
                    left: 20,
                    right: 20,
                    top: 16,
                    bottom: 20,
                  ),
                  sliver: SliverGrid(
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                          childAspectRatio: 0.72,
                        ),
                    delegate: SliverChildBuilderDelegate((context, index) {
                      final home = homes[index];
                      return GestureDetector(
                        onTap: () => context.push('/prize-homes/${home.id}'),
                        child: Container(
                          decoration: BoxDecoration(
                            gradient: AppTheme.darkCardGradient,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0x1FFFFFFF)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                height: 130,
                                decoration: BoxDecoration(
                                  borderRadius: const BorderRadius.vertical(
                                    top: Radius.circular(16),
                                  ),
                                ),
                                clipBehavior: Clip.antiAlias,
                                child: home.imageUrl != null
                                    ? Image.network(
                                        home.imageUrl!,
                                        fit: BoxFit.cover,
                                        width: double.infinity,
                                        height: 130,
                                        errorBuilder: (_, _, _) =>
                                            _buildGalleryPlaceholder(home),
                                        loadingBuilder: (_, child, progress) {
                                          if (progress == null) return child;
                                          return _buildGalleryPlaceholder(home);
                                        },
                                      )
                                    : _buildGalleryPlaceholder(home),
                              ),
                              Padding(
                                padding: const EdgeInsets.all(12),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      home.title,
                                      style: Theme.of(context)
                                          .textTheme
                                          .titleSmall
                                          ?.copyWith(
                                            fontWeight: FontWeight.bold,
                                            color: AppTheme.white,
                                          ),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        Icon(
                                          Icons.location_on_rounded,
                                          size: 12,
                                          color: AppTheme.greyMedium,
                                        ),
                                        const SizedBox(width: 4),
                                        Expanded(
                                          child: Text(
                                            home.city,
                                            style: Theme.of(context)
                                                .textTheme
                                                .bodySmall
                                                ?.copyWith(
                                                  color: AppTheme.greyMedium,
                                                  fontSize: 11,
                                                ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        gradient: AppTheme.goldGradient,
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        home.formattedValue,
                                        style: const TextStyle(
                                          color: AppTheme.white,
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }, childCount: homes.length),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

Widget _buildGalleryPlaceholder(PrizeHome home) {
  return Container(
    decoration: BoxDecoration(
      gradient: LinearGradient(
        colors: [
          AppTheme.goldYellow.withValues(alpha: 0.8),
          AppTheme.darkSlate,
        ],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
    ),
    child: Center(
      child: Text(
        home.emoji ?? '\u{1F3E0}',
        style: const TextStyle(fontSize: 48),
      ),
    ),
  );
}

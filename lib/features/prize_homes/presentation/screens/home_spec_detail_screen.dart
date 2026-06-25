import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/prize_home_provider.dart';
import '../../data/models/prize_home.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';

class HomeSpecDetailScreen extends ConsumerWidget {
  final String prizeHomeId;

  const HomeSpecDetailScreen({super.key, required this.prizeHomeId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final homeAsync = ref.watch(prizeHomeDetailProvider(prizeHomeId));
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      body: homeAsync.when(
        loading: () => SingleChildScrollView(
          physics: const NeverScrollableScrollPhysics(),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const ShimmerCard(height: 260),
                const SizedBox(height: 20),
                const ShimmerLine(width: 200, height: 28),
                const SizedBox(height: 12),
                const ShimmerLine(width: 160, height: 16),
                const SizedBox(height: 20),
                const ShimmerCard(height: 60),
                const SizedBox(height: 12),
                const ShimmerCard(height: 60),
                const SizedBox(height: 12),
                const ShimmerCard(height: 60),
              ],
            ),
          ),
        ),
        error: (err, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline_rounded,
                size: 64,
                color: AppTheme.greyMedium,
              ),
              const SizedBox(height: 16),
              Text(
                'Failed to load home details',
                style: theme.textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () =>
                    ref.invalidate(prizeHomeDetailProvider(prizeHomeId)),
                child: const Text('RETRY'),
              ),
            ],
          ),
        ),
        data: (home) {
          final hasFeatures =
              home.features != null && home.features!.isNotEmpty;
          final hasSpecs =
              home.bedrooms != null ||
              home.bathrooms != null ||
              home.area != null;
          final hasDescription = home.description != null;

          print("HAS IMAGE ::: ${home.imageUrl}");

          return CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 280,
                pinned: false,
                stretch: false,
                scrolledUnderElevation: 0,
                surfaceTintColor: Colors.transparent,
                backgroundColor: AppTheme.darkSlate,
                flexibleSpace: FlexibleSpaceBar(
                  background: Stack(
                    fit: StackFit.expand,
                    children: [
                      if (home.imageUrl != null)
                        Image.network(
                          home.imageUrl!,
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) =>
                              _buildHeroGradient(home, theme),
                          loadingBuilder: (_, child, progress) {
                            if (progress == null) return child;
                            return _buildHeroGradient(home, theme);
                          },
                        )
                      else
                        _buildHeroGradient(home, theme),
                      Container(
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Colors.transparent,
                              Colors.transparent,
                              Color(0xCC121826),
                            ],
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            stops: [0.0, 0.5, 1.0],
                          ),
                        ),
                      ),
                      Positioned(
                        left: 20,
                        right: 20,
                        bottom: 20,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              home.title,
                              style: theme.textTheme.headlineMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Icon(
                                  Icons.location_on_rounded,
                                  size: 16,
                                  color: AppTheme.greyLight,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  home.locationDisplay,
                                  style: theme.textTheme.bodyMedium?.copyWith(
                                    color: AppTheme.greyLight,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      Positioned(
                        right: 20,
                        bottom: 20,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            gradient: AppTheme.goldGradient,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            home.formattedValue,
                            style: const TextStyle(
                              color: AppTheme.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SliverList(
                delegate: SliverChildListDelegate([
                  if (hasFeatures) ...[
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                      child: Text(
                        'Features',
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: home.features!
                            .map(
                              (feature) => Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 7,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0x0CFFFFFF),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: AppTheme.goldYellow.withValues(
                                      alpha: 0.3,
                                    ),
                                  ),
                                ),
                                child: Text(
                                  feature,
                                  style: const TextStyle(
                                    color: AppTheme.goldYellow,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            )
                            .toList(),
                      ),
                    ),
                  ],
                  if (hasSpecs) ...[
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          if (home.bedrooms != null)
                            Expanded(
                              child: _SpecItem(
                                icon: Icons.bed_rounded,
                                label: 'Beds',
                                value: '${home.bedrooms}',
                              ),
                            ),
                          if (home.bathrooms != null)
                            Expanded(
                              child: _SpecItem(
                                icon: Icons.bathtub_rounded,
                                label: 'Baths',
                                value: '${home.bathrooms}',
                              ),
                            ),
                          if (home.area != null)
                            Expanded(
                              child: _SpecItem(
                                icon: Icons.square_foot_rounded,
                                label: 'Area',
                                value: home.area!,
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                  if (hasDescription) ...[
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
                      child: Text(
                        'About this Home',
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                      child: Text(
                        home.description!,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: AppTheme.greyMedium,
                          height: 1.5,
                        ),
                      ),
                    ),
                  ],
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: AppTheme.darkCardGradient,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0x1FFFFFFF)),
                      ),
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(
                                Icons.stars_rounded,
                                color: AppTheme.goldYellow,
                              ),
                              const SizedBox(width: 10),
                              Text(
                                'Estimated Value',
                                style: theme.textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 20,
                            ),
                            decoration: BoxDecoration(
                              gradient: AppTheme.goldGradient,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              home.formattedValue,
                              style: const TextStyle(
                                color: AppTheme.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 18,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                ]),
              ),
            ],
          );
        },
      ),
    );
  }
}

Widget _buildHeroGradient(PrizeHome home, ThemeData theme) {
  return Container(
    decoration: const BoxDecoration(
      gradient: LinearGradient(
        colors: [AppTheme.goldYellow, Color(0xFFD97706), AppTheme.darkSlate],
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        stops: [0.0, 0.4, 0.9],
      ),
    ),
    child: Center(
      child: Text(
        home.emoji ?? '\u{1F3E0}',
        style: const TextStyle(fontSize: 80),
      ),
    ),
  );
}

class _SpecItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _SpecItem({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      decoration: BoxDecoration(
        color: const Color(0x0CFFFFFF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Column(
        children: [
          Icon(icon, color: AppTheme.goldYellow, size: 22),
          const SizedBox(height: 6),
          Text(
            label,
            style: const TextStyle(color: AppTheme.greyMedium, fontSize: 11),
          ),
          Text(
            value,
            style: const TextStyle(
              color: AppTheme.white,
              fontSize: 15,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

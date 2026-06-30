import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../../core/theme/app_theme.dart';

class JobPosition {
  final String title;
  final String department;
  final String location;
  final String experience;
  final String description;
  final IconData icon;
  final List<String> requirements;

  const JobPosition({
    required this.title,
    required this.department,
    required this.location,
    required this.experience,
    required this.description,
    required this.icon,
    required this.requirements,
  });
}

class PerkItem {
  final String title;
  final String description;
  final IconData icon;
  const PerkItem({
    required this.title,
    required this.description,
    required this.icon,
  });
}

const List<PerkItem> perks = [
  PerkItem(
    title: 'Pay & Equity',
    description: 'Competitive packages with equity options.',
    icon: Icons.payments_rounded,
  ),
  PerkItem(
    title: 'Flexible Work',
    description: 'Flexible hours and remote-friendly options.',
    icon: Icons.home_work_rounded,
  ),
  PerkItem(
    title: 'L&D Budget',
    description: '₹50,000 annual learning & courses budget.',
    icon: Icons.menu_book_rounded,
  ),
  PerkItem(
    title: 'Health Cover',
    description: 'Comprehensive family health insurance.',
    icon: Icons.health_and_safety_rounded,
  ),
];

const List<JobPosition> jobOpenings = [
  JobPosition(
    title: 'Flutter Developer',
    department: 'Engineering',
    location: 'Bangalore / Hybrid',
    experience: '2-4 years',
    description:
        'Build and maintain beautiful, performant UI for our gamification platform.',
    icon: Icons.code_rounded,
    requirements: [
      'Strong knowledge of Dart and Flutter SDK.',
      'Experience with Riverpod or other state management solutions.',
      'Experience with custom painters and rich visual animations.',
      'Eye for pixel-perfect design and responsive layouts.',
    ],
  ),
  JobPosition(
    title: 'NestJS Backend Developer',
    department: 'Engineering',
    location: 'Bangalore / Hybrid',
    experience: '3-5 years',
    description:
        'Design and build scalable REST APIs powering our real-time contest engine.',
    icon: Icons.dns_rounded,
    requirements: [
      'Expertise in Node.js, NestJS, and TypeScript.',
      'Deep understanding of PostgreSQL and TypeORM.',
      'Experience with Redis (caching and pub/sub) and WebSockets.',
      'Knowledge of microservices architecture and clean code principles.',
    ],
  ),
  JobPosition(
    title: 'Product Designer',
    department: 'Design',
    location: 'Remote',
    experience: '2-3 years',
    description:
        'Own the UI/UX of our gamification platform, creating intuitive and delightful interfaces.',
    icon: Icons.palette_rounded,
    requirements: [
      'Proficiency in Figma and design prototyping tools.',
      'Experience with motion design and micro-interactions.',
      'Ability to translate complex game mechanics into simple user flows.',
      'Strong portfolio demonstrating UI/UX excellence.',
    ],
  ),
  JobPosition(
    title: 'DevOps Engineer',
    department: 'Infrastructure',
    location: 'Bangalore',
    experience: '4-6 years',
    description:
        'Manage and scale our AWS infrastructure running Docker and Kubernetes.',
    icon: Icons.cloud_rounded,
    requirements: [
      'Strong experience with AWS services and Kubernetes (EKS).',
      'Proficiency in IaC tools like Terraform.',
      'Experience setting up CI/CD pipelines (GitHub Actions).',
      'Knowledge of monitoring tools like Prometheus and Grafana.',
    ],
  ),
  JobPosition(
    title: 'Quality Assurance Engineer',
    department: 'QA',
    location: 'Bangalore',
    experience: '1-3 years',
    description:
        'Ensure the quality of our Flutter application and backend services.',
    icon: Icons.bug_report_rounded,
    requirements: [
      'Experience in manual testing and test case design.',
      'Familiarity with Flutter integration tests or Appium.',
      'Experience with API testing (Postman, Jest).',
      'Strong bug tracking and documentation skills.',
    ],
  ),
];

class JobsScreen extends StatelessWidget {
  const JobsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Careers'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildHero(context),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 12),
                  _buildSectionHeader(context, 'Why Work With Us'),
                  const SizedBox(height: 12),
                  _buildPerksGrid(),
                  const SizedBox(height: 24),
                  _buildSectionHeader(context, 'Open Positions'),
                  const SizedBox(height: 12),
                  ...jobOpenings.map((job) => _buildJobCard(context, job)),
                  const SizedBox(height: 24),
                  _buildInternshipsCard(context),
                  const SizedBox(height: 24),
                  _buildHowToApply(context),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHero(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 32, 24, 32),
      decoration: const BoxDecoration(
        color: Color(0x05FFFFFF),
        border: Border(bottom: BorderSide(color: Color(0x0FFFFFFF))),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: AppTheme.primaryRed.withOpacity(0.12),
              borderRadius: BorderRadius.circular(30),
              border: Border.all(
                color: AppTheme.primaryRed.withOpacity(0.35),
                width: 1.2,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.rocket_launch_rounded,
                  color: AppTheme.primaryRed,
                  size: 14,
                ),
                const SizedBox(width: 8),
                Text(
                  'WE ARE HIRING',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: AppTheme.primaryRed,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.5,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Build the Future of Gaming',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.w800,
              letterSpacing: -0.5,
              color: AppTheme.white,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'Dream Home 11 is on a mission to revolutionize the gamified loyalty experience in India. Join our high-performing team and build legendary experiences.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppTheme.greyMedium,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    return Text(
      title,
      style: Theme.of(context).textTheme.titleLarge?.copyWith(
        fontWeight: FontWeight.bold,
        color: AppTheme.white,
      ),
    );
  }

  Widget _buildPerksGrid() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.35,
      ),
      itemCount: perks.length,
      itemBuilder: (context, index) {
        final perk = perks[index];
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0x0CFFFFFF),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0x0FFFFFFF)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(perk.icon, color: AppTheme.goldYellow, size: 24),
              const Spacer(),
              Text(
                perk.title,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppTheme.white,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                perk.description,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppTheme.greyMedium,
                  fontSize: 11,
                  height: 1.3,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildJobCard(BuildContext context, JobPosition job) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        decoration: BoxDecoration(
          gradient: AppTheme.darkCardGradient,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0x1FFFFFFF)),
        ),
        child: Theme(
          data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
          child: ExpansionTile(
            shape: const Border(),
            collapsedShape: const Border(),
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0x0CFFFFFF),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(job.icon, color: AppTheme.primaryRed, size: 20),
            ),
            title: Text(
              job.title,
              style: Theme.of(
                context,
              ).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
            subtitle: Padding(
              padding: const EdgeInsets.only(top: 4.0),
              child: Row(
                children: [
                  Icon(
                    Icons.location_on_outlined,
                    size: 12,
                    color: AppTheme.greyMedium,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    job.location,
                    style: Theme.of(
                      context,
                    ).textTheme.bodySmall?.copyWith(color: AppTheme.greyMedium),
                  ),
                  const SizedBox(width: 12),
                  Icon(
                    Icons.work_history_outlined,
                    size: 12,
                    color: AppTheme.greyMedium,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    job.experience,
                    style: Theme.of(
                      context,
                    ).textTheme.bodySmall?.copyWith(color: AppTheme.greyMedium),
                  ),
                ],
              ),
            ),
            childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            iconColor: AppTheme.primaryRed,
            collapsedIconColor: AppTheme.greyMedium,
            children: [
              const Divider(color: Color(0x0FFFFFFF), height: 16),
              Text(
                job.description,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppTheme.white,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Requirements:',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppTheme.goldYellow,
                ),
              ),
              const SizedBox(height: 6),
              ...job.requirements.map(
                (req) => Padding(
                  padding: const EdgeInsets.only(bottom: 4.0),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Padding(
                        padding: EdgeInsets.only(top: 5.0, right: 6.0),
                        child: Icon(
                          Icons.circle,
                          size: 6,
                          color: AppTheme.primaryRed,
                        ),
                      ),
                      Expanded(
                        child: Text(
                          req,
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: AppTheme.greyMedium,
                                height: 1.4,
                              ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInternshipsCard(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0x08FFFFFF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x0FFFFFFF)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.goldYellow.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.school_rounded,
              color: AppTheme.goldYellow,
              size: 28,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Looking for Internships?',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppTheme.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'We run a 3-month paid program for students in Tech, Design, & Growth. Stipend: ₹25,000/mo.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppTheme.greyMedium,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHowToApply(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppTheme.primaryGradient,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryRed.withValues(alpha: 0.2),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Icon(
                Icons.mail_outline_rounded,
                color: Colors.white,
                size: 28,
              ),
              const SizedBox(width: 12),
              Text(
                'How to Apply',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'To apply for any position, send your resume and relevant work/portfolio links directly to our careers team.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.white.withValues(alpha: 0.85),
              height: 1.4,
            ),
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: () {
              Clipboard.setData(
                const ClipboardData(text: 'careers@dreamhome11.com'),
              );
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  backgroundColor: AppTheme.emeraldGreen,
                  behavior: SnackBarBehavior.floating,
                  content: Text(
                    'Email copied to clipboard!',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: AppTheme.primaryRed,
              elevation: 0,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.copy_rounded, size: 18),
                SizedBox(width: 8),
                Text(
                  'careers@dreamhome11.com',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

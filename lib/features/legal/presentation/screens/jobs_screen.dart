import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class JobSection {
  final String title;
  final String content;
  final IconData icon;
  const JobSection({required this.title, required this.content, required this.icon});
}

const List<JobSection> jobsData = [
  JobSection(
    title: 'Join Our Team',
    content: 'Dream Home 11 is on a mission to revolutionize the fantasy sports and gamified loyalty experience in India. We are a passionate team of engineers, designers, and product thinkers building a platform that delights millions of users. Our culture is built on ownership, rapid experimentation, and user-first thinking. Every team member has a real impact on the product and the lives of our users. If you are looking for mission-driven work in a fast-paced, collaborative environment, Dream Home 11 is the place for you.',
    icon: Icons.groups_rounded,
  ),
  JobSection(
    title: 'Why Work With Us',
    content: 'We offer a competitive salary package with equity ownership so you share in the company\'s success. Enjoy flexible working hours and fully remote options for select roles. Every employee receives an annual learning and development budget of ₹50,000 for courses, conferences, and books. Comprehensive health insurance covers you and your family from day one. We also provide quarterly team offsites, a generous leave policy, and access to cutting-edge tools and infrastructure.',
    icon: Icons.workspace_premium_rounded,
  ),
  JobSection(
    title: 'Flutter Developer',
    content: 'We are looking for a Flutter Developer to build and maintain beautiful, performant UI for our gamification platform. You will work with Riverpod for state management, GoRouter for declarative routing, and custom painters for rich visual effects. You should have strong knowledge of Dart, experience with REST API integration, and an eye for pixel-perfect design. Location: Bangalore. Experience: 2-4 years.',
    icon: Icons.code_rounded,
  ),
  JobSection(
    title: 'NestJS Backend Developer',
    content: 'We are seeking a NestJS Backend Developer to design and build scalable REST APIs powering our real-time contest engine. You will work extensively with TypeORM, PostgreSQL, Redis for caching and pub/sub, and WebSockets for live score updates. Experience with microservices architecture, message queues, and writing clean, testable code is essential. Location: Bangalore. Experience: 3-5 years.',
    icon: Icons.dns_rounded,
  ),
  JobSection(
    title: 'Product Designer',
    content: 'We are hiring a Product Designer to own the UI/UX of our gamification platform. You will create intuitive, delightful interfaces for contests, rewards, and social features. Proficiency in Figma is required, and experience with motion design and micro-interactions is a strong plus. You will work closely with product managers and engineers in a fast-moving agile environment. Location: Remote. Experience: 2-3 years.',
    icon: Icons.palette_rounded,
  ),
  JobSection(
    title: 'DevOps Engineer',
    content: 'We need a DevOps Engineer to manage and scale our AWS infrastructure running Docker and Kubernetes. You will build and maintain CI/CD pipelines using GitHub Actions, set up monitoring and alerting with Prometheus and Grafana, and manage PostgreSQL and Redis database clusters. Experience with Terraform for infrastructure as code and incident response automation is highly valued. Location: Bangalore. Experience: 4-6 years.',
    icon: Icons.cloud_rounded,
  ),
  JobSection(
    title: 'Quality Assurance Engineer',
    content: 'We are looking for a QA Engineer to ensure the quality of our Flutter application and backend services. You will write and maintain manual test cases, automate regression suites using Flutter integration tests, and perform API testing with tools like Postman and Jest. You should have a strong understanding of the software development lifecycle and experience with bug tracking tools like Jira. Location: Bangalore. Experience: 1-3 years.',
    icon: Icons.bug_report_rounded,
  ),
  JobSection(
    title: 'How to Apply',
    content: 'To apply for any of the positions above, send your resume and a brief cover letter to careers@dreamhome11.com. Please include links to your GitHub profile, portfolio, or any relevant work samples in your application. Our hiring process typically includes an initial phone screen, a technical assignment or take-home project, a technical interview with the team, and a final culture-fit round. We aim to complete the entire process within two to three weeks.',
    icon: Icons.mail_rounded,
  ),
  JobSection(
    title: 'Internship Programs',
    content: 'Dream Home 11 runs a 3-month paid internship program for undergraduate and graduate students across three tracks: Technology (Flutter, backend, DevOps), Design (UI/UX, motion graphics), and Marketing (growth, content, social media). Interns receive a monthly stipend of ₹25,000, a certificate of completion, and the opportunity for a pre-placement offer based on performance. Applications for the next cohort open in January and July each year.',
    icon: Icons.school_rounded,
  ),
];

class JobsScreen extends StatelessWidget {
  const JobsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Jobs'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: jobsData.length,
        itemBuilder: (context, index) {
          final section = jobsData[index];
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Container(
              clipBehavior: Clip.antiAlias,
              decoration: BoxDecoration(
                gradient: AppTheme.darkCardGradient,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0x1FFFFFFF)),
              ),
              child: ExpansionTile(
                leading: Icon(section.icon, color: AppTheme.goldYellow, size: 20),
                title: Text(section.title, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
                childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                iconColor: AppTheme.primaryRed,
                collapsedIconColor: AppTheme.greyMedium,
                backgroundColor: Colors.transparent,
                collapsedBackgroundColor: Colors.transparent,
                children: [
                  Text(section.content, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppTheme.greyMedium, height: 1.5)),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

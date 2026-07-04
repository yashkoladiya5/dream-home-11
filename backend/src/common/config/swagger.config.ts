import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function createSwaggerConfig(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Dream Home 11 API')
    .setDescription(
      'Production-grade API for Dream Home 11 — fantasy home contest platform',
    )
    .setVersion('1.0.0')
    .setContact(
      'Developer Team',
      'https://dreamhome11.com',
      'dev@dreamhome11.com',
    )
    .setLicense('Proprietary', 'https://dreamhome11.com/license')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Enter JWT token obtained from auth/verify-otp or auth/mock-login',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'API key for admin endpoints',
      },
      'ApiKey-auth',
    )
    .addTag(
      'Auth',
      'Authentication endpoints — OTP verification, token refresh, mock login',
    )
    .addTag('Users', 'User profile, dashboard, settings, bank details')
    .addTag(
      'Contests',
      'Contest listing, joining, private contests, winners, leaderboards',
    )
    .addTag('Payments', 'Payment orders, verification, transaction history')
    .addTag('Wallet', 'Wallet balance, withdrawal requests, withdrawal history')
    .addTag('KYC', 'KYC submission, status check, document upload')
    .addTag('Rewards', 'Rewards catalog, redemption, redemption history')
    .addTag('Feed', 'Community posts, likes, comments')
    .addTag('Leaderboard', 'Global and contest-specific leaderboards')
    .addTag('Chat', 'Chat list, messages, chat details')
    .addTag('Gamification', 'Spin wheel, daily polls, achievements')
    .addTag('Admin', 'Admin dashboard, user management, KYC approval, config')
    .addTag('Health', 'Health check endpoints for monitoring')
    .addTag('Notifications', 'FCM tokens, reminders, notification history')
    .addTag('Points', 'Daily actions, streak tracking, point logs')
    .addTag('Prize Homes', 'Prize home catalog, cities, featured listings')
    .addTag('Referral', 'Referral code application, stats, history')
    .addTag('Support', 'Support ticket creation and management')
    .addTag('Config', 'System configuration, feature flags, maintenance mode')
    .addTag('Achievements', 'Achievement tracking and awards')
    .addTag('Transactions', 'Transaction history and balance summary')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'method',
      docExpansion: 'list',
      filter: true,
      tryItOutEnabled: true,
    },
    customSiteTitle: 'Dream Home 11 API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
  });
}

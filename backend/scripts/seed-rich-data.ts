import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { User, UserLevel } from '../src/users/entities/user.entity';
import { Transaction } from '../src/transactions/entities/transaction.entity';
import { Withdrawal, WithdrawalStatus } from '../src/withdrawals/entities/withdrawal.entity';
import { SupportTicket } from '../src/support/entities/support-ticket.entity';
import { Kyc, KycStatus } from '../src/kyc/entities/kyc.entity';
import { DataSource } from 'typeorm';

async function bootstrap() {
  console.log('[Seed Rich Data] Starting database injection...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const queryRunner = dataSource.createQueryRunner();

  await queryRunner.connect();

  try {
    // 1. Fetch all users
    const users = await queryRunner.manager.find(User);
    if (users.length === 0) {
      console.log('[Seed Rich Data] No users found. Creating mock users first...');
      const mockUserNames = [
        'Aarav Sharma', 'Priya Patel', 'Rahul Verma', 'Sneha Reddy', 
        'Vikram Singh', 'Ananya Gupta', 'Kabir Malhotra', 'Neha Joshi',
        'Yash Koladiya', 'John Doe'
      ];
      const tierNames = [UserLevel.BRONZE, UserLevel.SILVER, UserLevel.GOLD, UserLevel.PLATINUM];
      
      for (let i = 0; i < mockUserNames.length; i++) {
        const phone = `+9199999900${i}`;
        const tier = tierNames[i % tierNames.length];
        const user = queryRunner.manager.create(User, {
          phoneNumber: phone,
          fullName: mockUserNames[i],
          email: `${mockUserNames[i].toLowerCase().replace(/\s+/g, '')}@example.com`,
          currentTier: tier,
          pointsBalance: i * 1500 + 500,
          walletBalanceInr: i * 2000 + 1000,
          isActive: true,
          state: ['Maharashtra', 'Gujarat', 'Delhi', 'Karnataka'][i % 4],
          bankAccountNumber: '1234567890' + i,
          bankIfsc: 'HDFC000012' + i,
          bankName: 'HDFC Bank',
          upiId: `${mockUserNames[i].toLowerCase().replace(/\s+/g, '')}@okaxis`,
        });
        const saved = await queryRunner.manager.save(user);
        users.push(saved);
      }
      console.log(`[Seed Rich Data] Created ${users.length} mock users.`);
    } else {
      console.log(`[Seed Rich Data] Found ${users.length} existing users. Using them.`);
    }

    await queryRunner.startTransaction();

    // 2. Clear existing transactions, withdrawals, and KYC entries
    console.log('[Seed Rich Data] Cleaning existing transactions, withdrawals, support tickets, and KYC...');
    await queryRunner.query('DELETE FROM transactions');
    await queryRunner.query('DELETE FROM withdrawals');
    await queryRunner.query('DELETE FROM support_tickets');
    await queryRunner.query('DELETE FROM kyc');

    // Ensure users have KYC entries
    console.log('[Seed Rich Data] Seeding KYC details...');
    const kycStatuses = [KycStatus.APPROVED, KycStatus.PENDING, KycStatus.REJECTED];
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      let kyc = await queryRunner.manager.findOne(Kyc, { where: { userId: user.id } });
      if (!kyc) {
        kyc = queryRunner.manager.create(Kyc, {
          userId: user.id,
          aadhaarNumber: '32145678' + String(1000 + i).slice(-4),
          panNumber: 'ABCDE' + String(1000 + i).slice(-4) + 'F',
          status: kycStatuses[i % kycStatuses.length],
          aadhaarFrontUrl: `https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=600&q=80`,
          aadhaarBackUrl: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80`,
          panCardUrl: `https://images.unsplash.com/photo-1563013544-824ae1d704d3?auto=format&fit=crop&w=600&q=80`,
          selfieUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80`,
          rejectionReason: kycStatuses[i % kycStatuses.length] === KycStatus.REJECTED ? 'PAN Card name mismatch with bank profile' : undefined,
          verifiedAt: kycStatuses[i % kycStatuses.length] === KycStatus.APPROVED ? new Date() : undefined,
        });
        await queryRunner.manager.save(kyc);
      }
    }

    const paymentMethods = ['UPI (GPay)', 'UPI (PhonePe)', 'UPI (Paytm)', 'Netbanking (HDFC)', 'Netbanking (SBI)', 'Credit Card'];
    const depositDescriptions = [
      'Wallet deposit via UPI',
      'Instant cash deposit',
      'Netbanking wallet deposit',
      'Credit card add cash',
      'GPay cash deposit',
    ];

    const contestTitles = [
      'Mega Dream Home Contest',
      'Weekend Villa Clash',
      'Starter Dream Cottage',
      'Luxury Penthouse Showdown',
      'Beach Villa Bonanza',
    ];

    console.log('[Seed Rich Data] Seeding withdrawals...');
    const withdrawalList: Partial<Withdrawal>[] = [];
    const statusOptions = [WithdrawalStatus.APPROVED, WithdrawalStatus.PENDING, WithdrawalStatus.REJECTED];

    // Seed 5 withdrawals for each user to get a bulk log
    for (const user of users) {
      for (let j = 0; j < 5; j++) {
        const amount = [150, 300, 500, 1000, 2500, 5000, 12000][(j + Math.floor(Math.random() * 3)) % 7];
        const status = statusOptions[j % statusOptions.length];
        const isUpi = j % 2 === 0;

        withdrawalList.push(
          queryRunner.manager.create(Withdrawal, {
            userId: user.id,
            amount,
            status,
            bankAccountNumber: isUpi ? undefined : user.bankAccountNumber || 'XXXXXXXXXX' + Math.floor(1000 + Math.random() * 9000),
            bankIfsc: isUpi ? undefined : user.bankIfsc || 'HDFC0000123',
            bankName: isUpi ? undefined : user.bankName || 'HDFC Bank',
            upiId: isUpi ? user.upiId || `${user.fullName?.toLowerCase().replace(/\s+/g, '')}@okaxis` : undefined,
            utrNumber: status === WithdrawalStatus.APPROVED ? 'UTR' + Math.floor(1000000000 + Math.random() * 9000000000) : undefined,
            rejectionReason: status === WithdrawalStatus.REJECTED ? 'Bank server timeout. Please try again.' : undefined,
            createdAt: new Date(Date.now() - j * 3 * 24 * 60 * 60 * 1000 - Math.random() * 86400000),
          })
        );
      }
    }
    const savedWithdrawals = await queryRunner.manager.save(Withdrawal, withdrawalList);
    console.log(`[Seed Rich Data] Seeded ${savedWithdrawals.length} withdrawals.`);

    console.log('[Seed Rich Data] Seeding transactions...');
    const transactionList: Partial<Transaction>[] = [];

    // Seed transactions for each user
    for (const user of users) {
      // 1. Initial Deposit & Onboarding Points
      let balance = 0;
      let points = 0;

      balance += 5000;
      transactionList.push(
        queryRunner.manager.create(Transaction, {
          userId: user.id,
          type: 'deposit',
          cashAmount: 5000,
          pointsAmount: 0,
          cashBalanceBefore: 0,
          cashBalanceAfter: balance,
          description: 'Onboarding add cash bonus via UPI',
          status: 'completed',
          createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        })
      );

      points += 1000;
      transactionList.push(
        queryRunner.manager.create(Transaction, {
          userId: user.id,
          type: 'points_earned',
          cashAmount: 0,
          pointsAmount: 1000,
          pointsBalanceBefore: 0,
          pointsBalanceAfter: points,
          description: 'Welcome reward points',
          referenceType: 'onboarding',
          status: 'completed',
          createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        })
      );

      // 2. Play 8-12 activities
      const actsCount = 8 + Math.floor(Math.random() * 5);
      for (let k = 0; k < actsCount; k++) {
        const type = ['deposit', 'entry_fee', 'winnings', 'redemption', 'referral', 'points_bonus'][k % 6];
        let cashAmount = 0;
        let pointsAmount = 0;
        let desc = '';
        let refType = '';
        const date = new Date(Date.now() - (actsCount - k) * 2 * 24 * 60 * 60 * 1000);

        if (type === 'deposit') {
          cashAmount = [500, 1000, 2000, 5000][Math.floor(Math.random() * 4)];
          desc = `${depositDescriptions[Math.floor(Math.random() * depositDescriptions.length)]} using ${paymentMethods[Math.floor(Math.random() * paymentMethods.length)]}`;
        } else if (type === 'entry_fee') {
          cashAmount = -[49, 99, 149, 499][Math.floor(Math.random() * 4)];
          desc = `Entry Fee - ${contestTitles[Math.floor(Math.random() * contestTitles.length)]}`;
          refType = 'contest_entry';
        } else if (type === 'winnings') {
          cashAmount = [100, 500, 1000, 5000][Math.floor(Math.random() * 4)];
          desc = `Contest Winnings - ${contestTitles[Math.floor(Math.random() * contestTitles.length)]}`;
          refType = 'contest_winnings';
        } else if (type === 'redemption') {
          pointsAmount = -[100, 200, 500][Math.floor(Math.random() * 3)];
          desc = 'Store purchase item redemption';
          refType = 'reward_redemption';
        } else if (type === 'referral') {
          pointsAmount = 100;
          desc = 'Friend invitation referral reward';
          refType = 'referral';
        } else if (type === 'points_bonus') {
          pointsAmount = 250;
          desc = 'Spin the Wheel bonus points';
          refType = 'bonus';
        }

        const prevBal = balance;
        balance = Number((balance + cashAmount).toFixed(2));
        const prevPoints = points;
        points += pointsAmount;

        transactionList.push(
          queryRunner.manager.create(Transaction, {
            userId: user.id,
            type,
            cashAmount,
            pointsAmount,
            cashBalanceBefore: prevBal,
            cashBalanceAfter: balance,
            pointsBalanceBefore: prevPoints,
            pointsBalanceAfter: points,
            description: desc,
            referenceType: refType,
            status: 'completed',
            createdAt: date,
          })
        );
      }

      // Add matching transactions for approved & pending withdrawals for this user
      const userWithdrawals = savedWithdrawals.filter((w) => w.userId === user.id);
      for (const w of userWithdrawals) {
        if (w.status === WithdrawalStatus.APPROVED) {
          const prevBal = balance;
          balance = Number((balance - Number(w.amount)).toFixed(2));
          transactionList.push(
            queryRunner.manager.create(Transaction, {
              userId: user.id,
              type: 'withdrawal',
              cashAmount: -Number(w.amount),
              pointsAmount: 0,
              cashBalanceBefore: prevBal,
              cashBalanceAfter: balance,
              description: `Withdrawal transfer: ${w.upiId ? 'UPI (' + w.upiId + ')' : 'Bank (' + w.bankName + ')'}`,
              status: 'completed',
              createdAt: w.createdAt,
            })
          );
        } else if (w.status === WithdrawalStatus.PENDING) {
          const prevBal = balance;
          balance = Number((balance - Number(w.amount)).toFixed(2));
          transactionList.push(
            queryRunner.manager.create(Transaction, {
              userId: user.id,
              type: 'withdrawal',
              cashAmount: -Number(w.amount),
              pointsAmount: 0,
              cashBalanceBefore: prevBal,
              cashBalanceAfter: balance,
              description: `Withdrawal request submitted: ${w.upiId ? 'UPI' : 'Bank'}`,
              status: 'pending',
              createdAt: w.createdAt,
            })
          );
        }
      }

      // Update user balances in DB
      await queryRunner.manager.update(User, user.id, {
        walletBalanceInr: balance,
        pointsBalance: points,
      });
    }

    const savedTransactions = await queryRunner.manager.save(Transaction, transactionList);
    console.log(`[Seed Rich Data] Seeded ${savedTransactions.length} transactions.`);

    // 3. Seed Support Tickets
    console.log('[Seed Rich Data] Seeding support tickets...');
    const ticketList: Partial<SupportTicket>[] = [];
    const subjects = [
      'KYC documents rejected multiple times',
      'Money debited but not added to wallet',
      'Unable to join Mega Contest',
      'Withdrawal approved but bank transfer not received',
      'App crashing during spin wheel',
      'Points not credited for friend referral',
    ];
    const messages = [
      'Hi support team, I uploaded my Aadhaar front and back along with my PAN card but it was rejected twice. Please help verify my profile.',
      'I made a deposit of ₹1,000 using GPay. The amount was debited from my bank but the wallet still shows ₹0. Transaction ID is TXN8927182.',
      'Whenever I try to join the Mega Contest, it says "Something went wrong". The slots are still open. Please check why.',
      'My withdrawal request for ₹2,500 was marked approved yesterday and UTR is visible, but my bank statement shows no credit. Please check the status.',
      'Every time I click the spin wheel, the app freezes and closes. I lost my daily free spin because of this.',
      'My friend Aarav registered using my referral code, but I did not receive the referral points. Please credit them.',
    ];
    const categories = ['kyc', 'payment', 'contest', 'payment', 'other', 'account'];
    const ticketStatuses = ['open', 'in_progress', 'resolved', 'closed'];

    for (let i = 0; i < 15; i++) {
      const user = users[i % users.length];
      const idx = i % subjects.length;
      ticketList.push(
        queryRunner.manager.create(SupportTicket, {
          userId: user.id,
          subject: subjects[idx],
          message: messages[idx],
          category: categories[idx],
          status: ticketStatuses[i % ticketStatuses.length],
          createdAt: new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000),
        })
      );
    }
    const savedTickets = await queryRunner.manager.save(SupportTicket, ticketList);
    console.log(`[Seed Rich Data] Seeded ${savedTickets.length} support tickets.`);

    console.log('[Seed Rich Data] Database seed successfully completed!');
  } catch (error) {
    console.error('[Seed Rich Data] Seeding error:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await app.close();
  }
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});

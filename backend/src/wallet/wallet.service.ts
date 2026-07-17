import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from '../transactions/entities/transaction.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    private readonly dataSource: DataSource,
  ) {}

  async getWallet(userId: string): Promise<Wallet> {
    const wallet = await this.walletRepo.findOne({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  async initializeWallet(userId: string): Promise<Wallet> {
    const wallet = this.walletRepo.create({ userId });
    return this.walletRepo.save(wallet);
  }

  async creditBalance(
    userId: string,
    amount: number,
    reference: { type: string; id: string; description: string },
    manager?: import('typeorm').EntityManager,
  ): Promise<{ wallet: Wallet; transaction: Transaction }> {
    if (amount <= 0) throw new BadRequestException('Amount must be greater than 0');

    const execute = async (entityManager: import('typeorm').EntityManager) => {
      const wallet = await entityManager.findOne(Wallet, {
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!wallet) throw new NotFoundException('Wallet not found');

      const balanceBefore = Number(wallet.balanceInr);
      wallet.balanceInr = balanceBefore + amount;
      const savedWallet = await entityManager.save(wallet);

      const txType = reference.type === 'contest' ? 'prize' : 'deposit';
      const transaction = entityManager.create(Transaction, {
        userId,
        type: txType as any,
        cashAmount: amount,
        cashBalanceBefore: balanceBefore,
        cashBalanceAfter: Number(savedWallet.balanceInr),
        description: reference.description,
        referenceType: reference.type,
        referenceId: reference.id,
        status: 'completed',
      });
      const savedTransaction = await entityManager.save(transaction);

      // sync legacy user wallet balance field
      await entityManager.query('UPDATE users SET wallet_balance_inr = $1 WHERE id = $2', [wallet.balanceInr, userId]);

      return { wallet: savedWallet, transaction: savedTransaction };
    };

    return manager ? execute(manager) : this.dataSource.transaction(execute);
  }

  async debitBalance(
    userId: string,
    amount: number,
    reference: { type: string; id: string; description: string },
    manager?: import('typeorm').EntityManager,
  ): Promise<{ wallet: Wallet; transaction: Transaction }> {
    if (amount <= 0) throw new BadRequestException('Amount must be greater than 0');

    const execute = async (entityManager: import('typeorm').EntityManager) => {
      const wallet = await entityManager.findOne(Wallet, {
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!wallet) throw new NotFoundException('Wallet not found');

      const balanceBefore = Number(wallet.balanceInr);
      if (balanceBefore < amount) throw new BadRequestException('Insufficient balance');

      wallet.balanceInr = balanceBefore - amount;
      const savedWallet = await entityManager.save(wallet);

      const txType = reference.type === 'withdrawal' ? 'withdrawal' : 'entry_fee';
      const transaction = entityManager.create(Transaction, {
        userId,
        type: txType,
        cashAmount: amount,
        cashBalanceBefore: balanceBefore,
        cashBalanceAfter: Number(savedWallet.balanceInr),
        description: reference.description,
        referenceType: reference.type,
        referenceId: reference.id,
        status: 'completed',
      });
      const savedTransaction = await entityManager.save(transaction);

      // sync legacy user wallet balance field
      await entityManager.query('UPDATE users SET wallet_balance_inr = $1 WHERE id = $2', [wallet.balanceInr, userId]);

      return { wallet: savedWallet, transaction: savedTransaction };
    };

    return manager ? execute(manager) : this.dataSource.transaction(execute);
  }

  async lockBalance(userId: string, amount: number): Promise<Wallet> {
    if (amount <= 0) throw new BadRequestException('Amount must be greater than 0');

    return this.dataSource.transaction(async (entityManager) => {
      const wallet = await entityManager.findOne(Wallet, {
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!wallet) throw new NotFoundException('Wallet not found');

      const balance = Number(wallet.balanceInr);
      if (balance < amount) throw new BadRequestException('Insufficient balance to lock');

      wallet.balanceInr = balance - amount;
      wallet.lockedBalanceInr = Number(wallet.lockedBalanceInr) + amount;
      return entityManager.save(wallet);
    });
  }

  async unlockBalance(userId: string, amount: number): Promise<Wallet> {
    if (amount <= 0) throw new BadRequestException('Amount must be greater than 0');

    return this.dataSource.transaction(async (entityManager) => {
      const wallet = await entityManager.findOne(Wallet, {
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!wallet) throw new NotFoundException('Wallet not found');

      const locked = Number(wallet.lockedBalanceInr);
      if (locked < amount) throw new BadRequestException('Insufficient locked balance');

      wallet.lockedBalanceInr = locked - amount;
      wallet.balanceInr = Number(wallet.balanceInr) + amount;
      return entityManager.save(wallet);
    });
  }

  async creditPoints(
    userId: string,
    points: number,
    reference?: Record<string, any>,
    manager?: import('typeorm').EntityManager,
  ): Promise<Wallet> {
    if (points <= 0) throw new BadRequestException('Points must be greater than 0');

    const execute = async (entityManager: import('typeorm').EntityManager) => {
      const wallet = await entityManager.findOne(Wallet, {
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!wallet) throw new NotFoundException('Wallet not found');

      wallet.pointsBalance = Number(wallet.pointsBalance) + points;
      const savedWallet = await entityManager.save(wallet);
      
      // sync legacy user field
      await entityManager.query('UPDATE users SET points_balance = $1 WHERE id = $2', [wallet.pointsBalance, userId]);

      return savedWallet;
    };

    return manager ? execute(manager) : this.dataSource.transaction(execute);
  }

  async debitPoints(
    userId: string, 
    points: number,
    manager?: import('typeorm').EntityManager,
  ): Promise<Wallet> {
    if (points <= 0) throw new BadRequestException('Points must be greater than 0');

    const execute = async (entityManager: import('typeorm').EntityManager) => {
      const wallet = await entityManager.findOne(Wallet, {
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!wallet) throw new NotFoundException('Wallet not found');

      if (Number(wallet.pointsBalance) < points) throw new BadRequestException('Insufficient points');

      wallet.pointsBalance = Number(wallet.pointsBalance) - points;
      const savedWallet = await entityManager.save(wallet);
      
      // sync legacy user field
      await entityManager.query('UPDATE users SET points_balance = $1 WHERE id = $2', [wallet.pointsBalance, userId]);

      return savedWallet;
    };

    return manager ? execute(manager) : this.dataSource.transaction(execute);
  }

  async getBalance(userId: string): Promise<{ balanceInr: number; lockedBalanceInr: number; availableBalance: number; pointsBalance: number }> {
    const wallet = await this.getWallet(userId);
    const balanceInr = Number(wallet.balanceInr);
    const lockedBalanceInr = Number(wallet.lockedBalanceInr);
    return {
      balanceInr,
      lockedBalanceInr,
      availableBalance: balanceInr - lockedBalanceInr,
      pointsBalance: Number(wallet.pointsBalance),
    };
  }
}

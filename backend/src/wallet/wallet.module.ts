import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, Transaction]),
    TransactionsModule,
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService, TypeOrmModule],
})
export class WalletModule {}

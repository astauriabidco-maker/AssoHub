import { Controller, Get, Post, Body, Param, UseGuards, Query, Patch } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateTransactionDto, AdminCreditDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '@prisma/client';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    @Get('me')
    getMyWallet(@GetUser() user: User) {
        return this.walletService.getWallet(user.id);
    }

    @Get('me/history')
    getMyHistory(@GetUser() user: User, @Query('page') page = 1, @Query('limit') limit = 10) {
        return this.walletService.getHistory(user.id, +page, +limit);
    }

    @Post('top-up')
    requestTopUp(@GetUser() user: User, @Body() dto: CreateTransactionDto) {
        return this.walletService.requestTopUp(user.id, dto);
    }

    // Admin endpoints

    @Post('admin/credit')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'TREASURER', 'SUPER_ADMIN')
    adminCredit(@Body() dto: AdminCreditDto) {
        return this.walletService.adminCredit(dto.userId, dto.amount, dto.reference || 'ADMIN_CREDIT', dto.description || 'Adjustment manual');
    }

    @Patch('admin/validate/:id')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'TREASURER', 'SUPER_ADMIN')
    validateTransaction(@Param('id') id: string) {
        return this.walletService.validateTransaction(id);
    }

    @Patch('admin/reject/:id')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'TREASURER', 'SUPER_ADMIN')
    rejectTransaction(@Param('id') id: string) {
        return this.walletService.rejectTransaction(id);
    }
}

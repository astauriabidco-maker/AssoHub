import { Controller, Get, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
    constructor(private readonly statsService: StatsService) { }

    @Get('global')
    getGlobalStats(@GetUser('associationId') associationId: string) {
        return this.statsService.getGlobalStats(associationId);
    }
}

import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    UseGuards,
} from '@nestjs/common';
import { FamilyBranchesService } from './family-branches.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('family-branches')
export class FamilyBranchesController {
    constructor(private readonly service: FamilyBranchesService) { }

    @Post()
    create(
        @GetUser('associationId') associationId: string,
        @Body() dto: { name: string; founderName?: string; description?: string },
    ) {
        return this.service.create(associationId, dto);
    }

    @Get()
    findAll(@GetUser('associationId') associationId: string) {
        return this.service.findAll(associationId);
    }

    @Delete(':id')
    remove(
        @GetUser('associationId') associationId: string,
        @Param('id') id: string,
    ) {
        return this.service.remove(associationId, id);
    }
}

import { Controller, Get, Post, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { FamilyLinksService } from './family-links.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('family-links')
export class FamilyLinksController {
    constructor(private readonly familyLinksService: FamilyLinksService) { }

    /**
     * POST /family-links — Create a family link
     */
    @Post()
    async create(
        @Req() req: any,
        @Body() body: { fromUserId: string; toUserId: string; relationType: 'PARENT' | 'SPOUSE' },
    ) {
        const associationId = req.user.associationId;
        return this.familyLinksService.createLink(
            associationId,
            body.fromUserId,
            body.toUserId,
            body.relationType,
        );
    }

    /**
     * DELETE /family-links/:id — Remove a family link
     */
    @Delete(':id')
    async remove(@Req() req: any, @Param('id') id: string) {
        const associationId = req.user.associationId;
        return this.familyLinksService.removeLink(associationId, id);
    }

    /**
     * GET /family-links/tree — Full tree data
     */
    @Get('tree')
    async getTree(@Req() req: any) {
        const associationId = req.user.associationId;
        return this.familyLinksService.getTree(associationId);
    }

    /**
     * GET /family-links/user/:userId — Links for a specific member
     */
    @Get('user/:userId')
    async getForUser(@Req() req: any, @Param('userId') userId: string) {
        const associationId = req.user.associationId;
        return this.familyLinksService.getLinksForUser(associationId, userId);
    }
}

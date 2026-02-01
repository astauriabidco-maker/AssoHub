import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { PublicService } from './public.service';
import { JoinAssociationDto } from './dto/join-association.dto';

@Controller('public')
export class PublicController {
    constructor(private readonly publicService: PublicService) { }

    @Get('associations/:slug')
    getAssociationBySlug(@Param('slug') slug: string) {
        return this.publicService.getAssociationBySlug(slug);
    }

    @Post('associations/:slug/join')
    joinAssociation(
        @Param('slug') slug: string,
        @Body() dto: JoinAssociationDto,
    ) {
        return this.publicService.joinAssociation(slug, dto);
    }
}

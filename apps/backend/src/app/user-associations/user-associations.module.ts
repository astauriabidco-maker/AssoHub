import { Module } from '@nestjs/common';
import { UserAssociationsService } from './user-associations.service';
import { UserAssociationsController } from './user-associations.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [UserAssociationsController],
    providers: [UserAssociationsService],
    exports: [UserAssociationsService],
})
export class UserAssociationsModule { }

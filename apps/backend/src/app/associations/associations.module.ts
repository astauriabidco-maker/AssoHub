import { Module } from '@nestjs/common';
import { AssociationsService } from './associations.service';
import { AssociationsController } from './associations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesModule } from '../roles/roles.module';

@Module({
    imports: [PrismaModule, RolesModule],
    providers: [AssociationsService],
    controllers: [AssociationsController],
    exports: [AssociationsService],
})
export class AssociationsModule { }

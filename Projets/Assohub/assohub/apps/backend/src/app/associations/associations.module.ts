import { Module } from '@nestjs/common';
import { AssociationsService } from './associations.service';
import { AssociationsController } from './associations.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [AssociationsController],
    providers: [AssociationsService],
    exports: [AssociationsService],
})
export class AssociationsModule { }

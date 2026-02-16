import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AssociationsModule } from './associations/associations.module';
import { RolesModule } from './roles/roles.module';
import { FinanceModule } from './finance/finance.module';
import { AnnouncementsModule } from './announcements/announcements.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, AssociationsModule, RolesModule, FinanceModule, AnnouncementsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

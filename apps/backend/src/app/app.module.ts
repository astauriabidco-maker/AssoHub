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
import { EventsModule } from './events/events.module';
import { DocumentsModule } from './documents/documents.module';
import { FamilyLinksModule } from './family-links/family-links.module';
import { GroupsModule } from './groups/groups.module';
import { DirectoryModule } from './directory/directory.module';
import { WalletModule } from './wallet/wallet.module';
import { TestModule } from './test/test.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    AssociationsModule,
    RolesModule,
    FinanceModule,
    AnnouncementsModule,
    EventsModule,
    DocumentsModule,
    FamilyLinksModule,
    GroupsModule,
    DirectoryModule,
    WalletModule,
    TestModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

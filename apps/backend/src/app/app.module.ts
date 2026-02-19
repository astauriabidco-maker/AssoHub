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
import { UserAssociationsModule } from './user-associations/user-associations.module';
import { FamilyBranchesModule } from './family-branches/family-branches.module';
import { MailModule } from './mail/mail.module';
import { TestModule } from './test/test.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
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
    UserAssociationsModule,
    FamilyBranchesModule,
    MailModule,
    TestModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
}

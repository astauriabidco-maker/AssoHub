import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { FinanceModule } from './finance/finance.module';
import { EventsModule } from './events/events.module';
import { DocumentsModule } from './documents/documents.module';
import { StatsModule } from './stats/stats.module';
import { AssociationsModule } from './associations/associations.module';
import { GroupsModule } from './groups/groups.module';
import { PublicModule } from './public/public.module';
import { CommunicationModule } from './communication/communication.module';
import { SuperAdminModule } from './super-admin/super-admin.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    AuthModule,
    UsersModule,
    PrismaModule,
    FinanceModule,
    EventsModule,
    DocumentsModule,
    StatsModule,
    AssociationsModule,
    GroupsModule,
    PublicModule,
    CommunicationModule,
    SuperAdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

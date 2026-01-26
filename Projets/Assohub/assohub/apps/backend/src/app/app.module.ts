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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ActivitiesModule } from './activities/activities.module';
import { LocationsModule } from './locations/locations.module';
import { ActivityRegistrationsModule } from './activity-registrations/activity-registrations.module';
import { DatabaseModule } from './database/database.module';
import { TokenCleanupService } from './common/services/token-cleanup.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // makes config accessible everywhere without re-import
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    ActivitiesModule,
    LocationsModule,
    ActivityRegistrationsModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService, TokenCleanupService],
})
export class AppModule {}

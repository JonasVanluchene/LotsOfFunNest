import { Module } from '@nestjs/common';
import { ActivityRegistrationsController } from './activity-registrations.controller';
import { ActivityRegistrationsService } from './activity-registrations.service';

@Module({
  controllers: [ActivityRegistrationsController],
  providers: [ActivityRegistrationsService]
})
export class ActivityRegistrationsModule {}

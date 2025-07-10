import { Test, TestingModule } from '@nestjs/testing';
import { ActivityRegistrationsService } from './activity-registrations.service';

describe('ActivityRegistrationsService', () => {
  let service: ActivityRegistrationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActivityRegistrationsService],
    }).compile();

    service = module.get<ActivityRegistrationsService>(ActivityRegistrationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

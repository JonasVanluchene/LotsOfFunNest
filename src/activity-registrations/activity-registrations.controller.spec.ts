import { Test, TestingModule } from '@nestjs/testing';
import { ActivityRegistrationsController } from './activity-registrations.controller';

describe('ActivityRegistrationsController', () => {
  let controller: ActivityRegistrationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityRegistrationsController],
    }).compile();

    controller = module.get<ActivityRegistrationsController>(ActivityRegistrationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

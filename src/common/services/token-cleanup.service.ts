import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TokenService } from '../../auth/token.service';

@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(private readonly tokenService: TokenService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleTokenCleanup() {
    this.logger.log('Starting token cleanup job');
    try {
      await this.tokenService.cleanupExpiredTokens();
      this.logger.log('Token cleanup job completed successfully');
    } catch (error) {
      this.logger.error(`Token cleanup job failed: ${error.message}`, error.stack);
    }
  }
}

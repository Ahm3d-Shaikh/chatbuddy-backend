import { Body, Controller, Post } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly EmailService: EmailService) {}
  //POST -> /email
  @Post('')
  async sendEmail(
    @Body() event: string,
    mail: string,
    bot_id: string,
    lead_id: string,
  ) {
    if (event === 'limit_reach') {
      return await this.EmailService.LimitReachEmail(bot_id, lead_id);
    }
  }
}

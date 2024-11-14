import {
  Body,
  Controller,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { StripesService } from './stripes.service';

@Controller('stripes')
export class StripesController {
  constructor(private readonly StripesService: StripesService) {}
  //POST -> stripes/webhook
  @Post('webhook')
  async webhookHandler() {
    return [];
  }

  //PATCH -> stripes/cancel-subscription
  @Patch('cancel-subscription')
  async cancelSubscription(@Body('email') email: string) {
    try {
      await this.StripesService.cancelSubscription(email);
    } catch (error) {
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  //POST -> stripes/:planId/checkout
  @Post(':planId/checkout')
  async checkoutSessionCreator(
    @Param('planId') planId: string,
    @Body('percent') percent: string,
    @Body('mode') mode: string,
    @Body('email') email: string,
    @Body('success_url') success_url: string,
    @Body('cancel_url') cancel_url: string,
    @Body('trial') trial: string,
  ) {
    try {
      const defaultSuccessURL = 'https://www.facebook.com';
      const defaultCancelURL = 'https://www.google.com';

      const finalSuccessURL = success_url || defaultSuccessURL;
      const finalCancelURL = cancel_url || defaultCancelURL;

      return await this.StripesService.createSubscriptionCheckoutLink(
        email,
        planId,
        finalSuccessURL,
        finalCancelURL,
        percent,
        mode,
        trial,
      );
    } catch (error) {
      throw new InternalServerErrorException('Internal Server Error');
    }
  }
}

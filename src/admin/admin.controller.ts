import {
  Controller,
  Get,
  Param,
  Patch,
  InternalServerErrorException,
  Body,
} from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}
  //GET -> /admin
  @Get('')
  async getSubscribers() {
    try {
      return await this.adminService.getAllSubscribers();
    } catch (error) {
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  //PATCH -> admin/plan
  @Patch('plan')
  async updateSubscriberPlan(
    @Body('subscriber_id') subscriberId: string,
    @Body('plan') plan: string,
  ) {
    try {
      return await this.adminService.updateSubscriberPlan(subscriberId, plan);
    } catch (error) {
      throw new InternalServerErrorException('Internal Server Error');
    }
  }
}

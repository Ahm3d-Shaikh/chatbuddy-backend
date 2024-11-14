import {
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Param,
  InternalServerErrorException,
  Body,
  Req,
  Res,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import * as geoip from 'geoip-lite';
import { Request, Response } from 'express';

@Controller('leads')
export class LeadsController {
  constructor(private readonly LeadsService: LeadsService) {}

  //GET -> leads/:botId
  @Get(':botId')
  async getLeads(@Param('botId') botId: string) {
    try {
      return await this.LeadsService.getAllLeads(botId);
    } catch (error) {
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  //POST -> leads/:botId
  @Post(':botId')
  async addLead(
    @Param('botId') botId: string,
    @Body('name') name: any,
    @Body('phone') phone: any,
    @Body('email') email: any,
    @Body('userEmailToSendLeadEmail') userEmailToSendLeadEmail: any,
    @Body('country_name') country_name: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const geo = ip ? geoip.lookup(ip as string) : null;

      const country = geo?.country || 'Unknown';
      return await this.LeadsService.addLead(
        name,
        phone,
        email,
        botId,
        userEmailToSendLeadEmail,
        country,
      );
    } catch (error) {
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  //GET -> leads/:leadId
  @Get('specific/:leadId')
  async getSpecificLead(@Param('leadId') leadId: string) {
    try {
      return await this.LeadsService.getSingleLeadDataApi(leadId);
    } catch (error) {
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  //GET -> leads/:botId/time with query params start_time & end_time
  @Get(':botId/time')
  async getLeadInTimeFrame(
    @Param('botId') botId: string,
    @Query('start_time') start_time: any,
    @Query('end_time') end_time: any,
  ) {
    try {
      return await this.LeadsService.getLeadsByTime(
        start_time,
        end_time,
        botId,
      );
    } catch (error) {
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  //PATCH -> leads/:leadId with updatedMessages
  @Patch(':leadId')
  async updateLead(
    @Param('leadId') leadId: string,
    @Body('updatedMessages') updatedMessages: string,
  ) {
    try {
      return await this.LeadsService.updateLead(leadId, updatedMessages);
    } catch (error) {
      throw new InternalServerErrorException('Internal Server Error');
    }
  }
}

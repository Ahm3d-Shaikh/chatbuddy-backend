import {
  Controller,
  Get,
  InternalServerErrorException,
  Query,
  HttpException,
  HttpStatus,
  Post,
  Body,
  Param,
  Delete,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { DnsService } from './dns.service';

@Controller('dns')
export class DnsController {
  constructor(private readonly DnsService: DnsService) {}

  //GET -> dns/
  @Get('')
  async getDNS(@Query('domain') domain: string) {
    try {
      if (!domain) {
        throw new HttpException('Domain is Missing', HttpStatus.BAD_REQUEST);
      }

      if ((domain as string).includes('chatbuddy.io')) {
        throw new HttpException('Domain NOT ALLOWED', HttpStatus.FORBIDDEN);
      }

      if ((domain as string) === 'chat.mywebsite.com') {
        throw new HttpException(
          'Pls Dont use Example Domain',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (
        (domain as string)?.includes('http://') ||
        (domain as string)?.includes('https://') ||
        (domain as string)?.includes('/')
      ) {
        throw new HttpException('Invalid cname Record', HttpStatus.BAD_REQUEST);
      }

      return await this.DnsService.checkActivationStatus(domain as string);
    } catch (error) {
      console.log(
        `Error while getting the activation status of domain: ${JSON.stringify(error)}`,
      );
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  //GET -> dns/check-domain
  @Get('check-domain')
  async checkDomain(@Body('domain') domain: string, @Res() res: Response) {
    try {
      if (!domain) {
        return new HttpException('Domain is missing', HttpStatus.BAD_REQUEST);
      }
      if ((domain as string).includes('chatbuddy.io')) {
        return new HttpException('Domain NOT ALLOWED', HttpStatus.FORBIDDEN);
      }
      if ((domain as string) === 'chat.mywebsite.com') {
        return new HttpException(
          'Pls Dont use Example Domain',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (
        (domain as string)?.includes('http://') ||
        (domain as string)?.includes('https://') ||
        (domain as string)?.includes('/')
      ) {
        return new HttpException(
          'Invalid cname Record',
          HttpStatus.BAD_REQUEST,
        );
      }

      const status = await this.DnsService.getCustomDomainfromDB(domain);
      if (status?.error) {
        return res
          .status(HttpStatus.OK)
          .json({ data: null, error: 'No Record Found' });
      }
      return res.status(HttpStatus.OK).json({ data: status?.data });
    } catch (error) {
      console.log(`Error while testing the domain: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  //POST -> dns/:botId
  @Post(':botId')
  async addCustomDomain(
    @Body('domain') domain: string,
    @Param('botId') botId: string,
  ) {
    try {
      if (!domain) {
        throw new HttpException('Domain is Missing', HttpStatus.BAD_REQUEST);
      }
      if ((domain as string).includes('chatbuddy.io')) {
        throw new HttpException('Domain not ALLOWED', HttpStatus.FORBIDDEN);
      }
      if ((domain as string) === 'chat.mywebsite.com') {
        throw new HttpException(
          'Pls Dont use Example Domain',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (!botId) {
        throw new HttpException(
          'Chatbot ID is Missing',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (
        (domain as string)?.includes('http://') ||
        (domain as string)?.includes('https://') ||
        (domain as string)?.includes('/')
      ) {
        throw new HttpException('Invalid CName Record', HttpStatus.BAD_REQUEST);
      }

      return await this.DnsService.addCustomDomain(domain as string, botId);
    } catch (error) {
      console.log(`Error while adding custom domain: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  //DELETE -> dns/:botId
  @Delete(':botId')
  async deleteCustomDomain(
    @Body('domain') domain: string,
    @Param('botId') botId: string,
  ) {
    try {
      if (!domain) {
        throw new HttpException('Domain is Missing', HttpStatus.BAD_REQUEST);
      }
      if ((domain as string).includes('chatbuddy.io')) {
        throw new HttpException('Domain not ALLOWED', HttpStatus.FORBIDDEN);
      }
      if ((domain as string) === 'chat.mywebsite.com') {
        throw new HttpException(
          'Pls Dont use Example Domain',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (!botId) {
        throw new HttpException(
          'Chatbot ID is Missing',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (
        (domain as string)?.includes('http://') ||
        (domain as string)?.includes('https://') ||
        (domain as string)?.includes('/')
      ) {
        throw new HttpException('Invalid CName Record', HttpStatus.BAD_REQUEST);
      }

      return await this.DnsService.deleteCustomDomain(domain as string);
    } catch (error) {
      console.log(`Error while deleting domain: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  //GET -> dns/:botId/verify
  @Get(':botId/verify')
  async verifyDomain(
    @Body('domain') domain: string,
    @Param('botId') botId: string,
  ) {
    if (!domain || !botId) {
      throw new HttpException(
        'Domain and bot_id are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      const cnameVerified = await this.DnsService.verifyCNAME(domain as string);
      const txtVerified = await this.DnsService.verifyTXT(
        domain as string,
        botId as string,
      );
      const status = cnameVerified && txtVerified;

      return {
        status: status,
        cname_verified: cnameVerified,
        txt_verified: txtVerified,
        msg: status
          ? 'Domain verified successfully'
          : 'Domain verification failed',
      };
    } catch (error) {
      console.log(`Error while verifying domain: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }
}

import {
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Body,
  InternalServerErrorException,
  UploadedFile,
  UseInterceptors,
  HttpException,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly ChatbotService: ChatbotService) {}

  //GET -> chatbot/
  @Get('')
  async getChatbots(@Body('user_id') user_id: string) {
    try {
      return await this.ChatbotService.getAllBots(user_id);
    } catch (error) {
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  //POST -> chatbot/
  @Post('')
  @UseInterceptors(FileInterceptor('file'))
  async addChatbot(
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name: string,
    @Body('user_id') user_id: string,
  ) {
    try {
      if (!name || !user_id) {
        throw new HttpException(
          'Parameters are Missing.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const table = await this.ChatbotService.createBot(name, user_id);
      return table;
    } catch (error) {
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  //GET -> chatbot/:botId
  @Get(':botId')
  async getSpecificBot(
    @Body('user_id') user_id: string,
    @Param('botId') botId: string,
  ) {
    try {
      await this.ChatbotService.getAbot(user_id, botId);
    } catch (error) {
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  //GET -> chatbot/:botId/files
  @Get(':botId/files')
  async getFilesOfBot(
    @Body('user_id') user_id: string,
    @Param('botId') botId: string,
  ) {
    try {
      if (!user_id || !botId) {
        throw new HttpException('Invalid Request', HttpStatus.BAD_REQUEST);
      }

      return await this.ChatbotService.getBotFiles(user_id, botId);
    } catch (error) {
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  //PATCH -> chatbot/:botId
  @Patch(':botId')
  async updateBot(
    @Param('botId') botId: string,
    @Body('user_id') user_id: string,
    @Body('settings') settings: any,
    @Body('name') name: any,
  ) {
    try {
      return await this.ChatbotService.updateBot(
        user_id,
        botId,
        settings,
        name,
      );
    } catch (error) {
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  //DELETE -> chatbot/:botId
  @Delete(':botId')
  async deleteBot(
    @Body('user_id') user_id: string,
    @Param('botId') botId: string,
  ) {
    try {
      return await this.ChatbotService.deleteBot(user_id, botId);
    } catch (error) {
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  //GET -> chatbot/:botId/dashboard
  @Get(':botId/dashboard')
  async getDataForDashboard(@Param('botId') botId: string) {
    try {
      return await this.ChatbotService.fetchDashboardDetails(botId);
    } catch (error) {
      console.log(
        `Error while fetching dashboard data: ${JSON.stringify(error)}`,
      );
      throw new InternalServerErrorException('Internal Server Error');
    }
  }
}

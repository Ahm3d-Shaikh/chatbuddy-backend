import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  Post,
} from '@nestjs/common';
import { PromptsService } from './prompts.service';

@Controller('prompts')
export class PromptsController {
  constructor(private readonly PromptsService: PromptsService) {}

  // GET -> prompts/
  @Get('')
  async getPrompts(
    @Body('user_id') user_id: string,
    @Body('chatbot_id') chatbot_id: string,
  ) {
    try {
      return await this.PromptsService.getAllPrompts(user_id, chatbot_id);
    } catch (error) {
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  // POST -> prompts/
  @Post('')
  async addPrompt(
    @Body('user_id') user_id: string,
    @Body('chatbot_id') chatbot_id: string,
    @Body('name') name: string,
    @Body('type') type: string,
    @Body('action') action: string,
    @Body('prompt') prompt: string,
    @Body('color') color: string,
  ) {
    try {
      return await this.PromptsService.addPrompt(
        user_id,
        chatbot_id,
        name,
        type,
        action,
        prompt,
        color,
      );
    } catch (error) {
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  //DELETE -> prompts/:promptId
  @Delete(':promptId')
  async deletePrompt(
    @Body('user_id') user_id: string,
    @Param('promptId') promptId: string,
  ) {
    try {
      await this.PromptsService.deletePrompt(user_id, promptId);
    } catch (error) {
      throw new InternalServerErrorException('Internal Server Error');
    }
  }
}

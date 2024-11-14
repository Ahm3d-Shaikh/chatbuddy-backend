import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UploadedFile,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
  Res,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { SupabaseService } from 'src/supabase/supabase.service';
import { TrainingService } from './training.service';
import { WebsiteService } from './Content/Website/getWebsiteLinks';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('train')
export class TrainingController {
  constructor(
    private readonly SupabaseService: SupabaseService,
    private readonly TrainingService: TrainingService,
    private readonly WebsiteService: WebsiteService,
  ) {}

  //POST -> train/file/:botId
  @Post('file/:botId')
  @UseInterceptors(FileInterceptor('file'))
  async addFileContent(
    @Param('botId') botId: string,
    @Body('user_id') user_id: string,
    @Body('action') action: string,
    @Body('name') name: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      if (!botId || !name || !file) {
        throw new HttpException(
          'botId, name, or file is missing',
          HttpStatus.BAD_REQUEST,
        );
      }

      const output = await this.TrainingService.addFileToBot(
        user_id,
        action,
        botId,
        name,
        file,
      );

      return output;
    } catch (error) {
      console.log(`Error while adding file content: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  //POST -> train/text/:botId
  @Post('text/:botId')
  async addTextContent(
    @Body('user_id') user_id: string,
    @Body('action') action: string,
    @Body('table') table: string,
    @Body('name') name: string,
    @Body('dataSource') dataSource: string,
  ) {
    try {
      return await this.TrainingService.addTextContent(
        user_id,
        action,
        table,
        name,
        dataSource,
      );
    } catch (error) {
      console.log(`Error while adding text content: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  //POST -> train/audio/:botId
  @Post('audio/:botId')
  async addAudioContent(
    @UploadedFile() file: Express.Multer.File,
    @Body('user_id') user_id: string,
    @Body('action') action: string,
    @Body('table') table: string,
    @Body('name') name: string,
  ) {
    try {
      return await this.TrainingService.addAudioContent(
        user_id,
        action,
        table,
        name,
        file,
      );
    } catch (error) {
      console.log(`Error while adding audio content: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  //POST -> train/youtube/:botId
  @Post('youtube/:botId')
  async addYoutubeContent(
    @Param('botId') botId: string,
    @Body('user_id') user_id: string,
    @Body('action') action: string,
    @Body('table') table: string,
    @Body('name') name: string,
    @Body('dataSource') dataSource: string,
  ) {
    try {
      return await this.TrainingService.addYoutubeContent(
        user_id,
        action,
        table,
        name,
        dataSource,
      );
    } catch (error) {
      console.log(
        `Error while adding youtube content: ${JSON.stringify(error)}`,
      );
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  //POST -> train/website/:botId
  @Post('website/:botId')
  async addWebsiteContent(
    @Param('botId') botId: string,
    @Body('user_id') user_id: string,
    @Body('scrapping_id') scrapping_id: string,
    @Body('dataSource') dataSource: any,
  ) {
    try {
      return await this.TrainingService.addWebsiteContent(
        user_id,
        botId,
        scrapping_id,
        dataSource,
      );
    } catch (error) {
      console.log(
        `Error while adding website content: ${JSON.stringify(error)}`,
      );
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  //GET -> train/website/:botId
  @Get('website/:botId')
  async getWebsiteData(
    @Param('botId') botId: string,
    @Query('source') source: string,
  ) {
    if (source !== 'website') {
      throw new HttpException(
        'Invalid source parameter',
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      return await this.WebsiteService.getWebsiteLinks(source, botId);
    } catch (error) {
      console.log(
        `Error while getting website content: ${JSON.stringify(error)}`,
      );
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  //GET -> train/link/:botId
  @Get('link/:botId')
  async getLinkInfo(
    @Param('botId') botId: string,
    @Query('source') source: string,
  ) {
    if (source !== 'link') {
      throw new HttpException(
        'Invalid source parameter',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.WebsiteService.getLinksInfo(source, botId);
    } catch (error) {
      console.log(`Error while getting link info: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  //POST -> retrain/:botId/:trainingId
  @Post('retrain/:botId/:trainingId')
  async retrainBot(
    @Param('botId') botId: string,
    @Param('trainingId') trainingId: string,
    @Body('user_id') user_id: string,
    @Body('file_id') file_id: string,
    @Res() res: Response,
  ) {
    try {
      if (!user_id || !botId || !file_id) {
        throw new HttpException('Invalid Request', HttpStatus.BAD_REQUEST);
      }
      const { data, error } = await this.SupabaseService.supabase
        .from('files')
        .select('*')
        .eq('id', file_id)
        .single();
      if (error || !data) {
        throw new HttpException('Training not found', HttpStatus.NOT_FOUND);
      }

      if (data?.type != 'website') {
        throw new HttpException(
          'Currently only website files are supported for retraining',
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.TrainingService.website_retrain(
        user_id,
        file_id,
        data.url as string,
        botId,
      );

      return res
        .status(HttpStatus.OK)
        .json({
          message:
            'Retraining is in progress. You will be notified once it is done',
        });
    } catch (error) {
      console.log(`Error while retraining the bot: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }
}

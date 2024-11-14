import { SupabaseService } from 'src/supabase/supabase.service';
import Website from './website';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class WebsiteService {
  constructor(private readonly SupabaseService: SupabaseService) {}

  async getWebsiteLinks(dataSource: string, chatbot_id: string) {
    if (!dataSource || !chatbot_id) {
      throw new HttpException(
        'DataSource or chatbot_id is missing',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const website = new Website(this.SupabaseService);
      const links = await website.scrapeLinks(dataSource);
      let getLinksinfo = await website.getLinksInfo(links);
      getLinksinfo = getLinksinfo.filter((link) => link.size !== null);
      website.close();

      if (getLinksinfo.length === 0) {
        return { error: 'No links found', getLinksinfo: [], scrappingId: null };
      }

      const { data, error } = await this.SupabaseService.supabase
        .from('tempdata')
        .insert([{ data: getLinksinfo, url: dataSource, chatbot_id }])
        .select('id')
        .single();

      if (error) {
        console.error('Error inserting data to Supabase:', error);
        throw new HttpException(
          'Error in scrapping website',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      getLinksinfo.forEach((link) => delete link.content);

      return { links: getLinksinfo, scrappingId: data?.id, error: null };
    } catch (err) {
      console.error('Error in getWebsiteLinks:', err);
      throw new HttpException(
        'Some error occurred',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getLinksInfo(dataSource: any, botId: string) {
    if (!dataSource || !botId) {
      throw new HttpException(
        'DataSource or botId is missing',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const website = new Website(this.SupabaseService);
      let links = await website.crawlMultipleLinks(dataSource);
      website.close();
      links = links.filter((linkObj) => linkObj.size !== null);

      const { data, error } = await this.SupabaseService.supabase
        .from('tempdata')
        .insert([{ data: links, url: dataSource }])
        .select('id')
        .single();

      if (error) {
        throw new HttpException(
          'Error in scrapping website: ' + error.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      links.forEach((link) => delete link.content);

      return { links, scrappingId: data?.id, error: null };
    } catch (err) {
      console.error('Error in getLinksInfo:', err);
      throw new HttpException(
        'An error occurred while processing links',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

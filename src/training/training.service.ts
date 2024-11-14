import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';
import { GenerateSummary } from './generateSummary';
import { Request, Response } from 'express';
import Website from './Content/Website/website';
import File from './Content/file';
import Text from './Content/text';
import Audio from './Content/audio';
import Youtube from './Content/youtube';
import { WebsiteData, AddWebsiteResult } from './interfaces';

@Injectable()
export class TrainingService {
  constructor(
    private readonly SupabaseService: SupabaseService,
    private readonly GenerateSummary: GenerateSummary,
  ) {}

  website_retrain = async (
    user_id: string,
    file_id: string,
    link: string,
    chatbot_id: string,
  ) => {
    const website = new Website(this.SupabaseService);
    await this.SupabaseService.supabase
      .from('files')
      .update({ status: 4 })
      .eq('id', file_id);
    try {
      let FetchedLinkData = await website.crawelSingleLink(link);
      await website.updateBotTrainingTime(chatbot_id);
      if (FetchedLinkData.size > 20) {
        await this.SupabaseService.supabase
          .from(chatbot_id)
          .delete()
          .filter('metadata->>file_id', 'eq', file_id);
        await website.addWebsiteToBot(
          user_id,
          chatbot_id,
          FetchedLinkData.title as string,
          FetchedLinkData.content as string,
          file_id,
          FetchedLinkData,
        );
      }
    } catch (error) {
      console.log(error);
      await this.SupabaseService.supabase
        .from('files')
        .update({ status: 5 })
        .eq('id', file_id);
    }
    return true;
  };

  async addFileToBot(
    userid: string,
    action: string,
    chatbot_id: string,
    name: string,
    file: Express.Multer.File,
  ) {
    const fileObj = new File(file, this.SupabaseService);
    try {
      const output = await fileObj.addFileToBot(
        userid,
        action,
        chatbot_id,
        name,
        file,
      );

      if (output) {
        const { data: customer, error: selectError } =
          await this.SupabaseService.supabase
            .from('customer')
            .select('source_links_allowed')
            .eq('uuid', userid)
            .single();

        if (selectError) {
          console.error('Error fetching customer:', selectError);
          throw new HttpException(
            'Error fetching customer',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        if (customer) {
          const links = (customer.source_links_allowed as number) - 1;
          const { error: updateError } = await this.SupabaseService.supabase
            .from('customer')
            .update({ source_links_allowed: links })
            .eq('uuid', userid);

          if (updateError) {
            console.error('Error updating source_links_allowed:', updateError);
            throw new HttpException(
              'Error updating source links allowed',
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }
        } else {
          console.error('Customer not found');
          throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
        }
      }

      return { output, error: null };
    } catch (err) {
      console.error('Error in addFileToBot:', err);
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async addTextContent(
    userid: string,
    action: string,
    table: string,
    name: string,
    dataSource: string,
  ) {
    const text = new Text(this.SupabaseService);

    try {
      await text.addTextToBot(userid, action, table, name, dataSource);
      await text.updateBotTrainingTime(table);

      if (userid) {
        const { data: customer, error: selectError } =
          await this.SupabaseService.supabase
            .from('customer')
            .select('source_links_allowed')
            .eq('uuid', userid)
            .single();

        if (selectError) {
          throw new HttpException(
            'Error fetching customer',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        if (customer) {
          const links = (customer.source_links_allowed as number) - 1;
          const { error: updateError } = await this.SupabaseService.supabase
            .from('customer')
            .update({ source_links_allowed: links })
            .eq('uuid', userid);

          if (updateError) {
            throw new HttpException(
              'Error updating source_links_allowed',
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }
        } else {
          throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
        }
      }

      return { message: `${dataSource} added successfully` };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async addAudioContent(
    userid: string,
    action: string,
    table: string,
    name: string,
    file: Express.Multer.File,
  ) {
    const audio = new Audio(this.SupabaseService);

    try {
      const output = await audio.addAudioToBot(
        userid,
        action,
        table,
        name,
        file,
      );

      if (output) {
        const { data: customer, error: selectError } =
          await this.SupabaseService.supabase
            .from('customer')
            .select('source_links_allowed')
            .eq('uuid', userid)
            .single();

        if (selectError) {
          throw new HttpException(
            'Error fetching customer',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        if (customer) {
          const links = (customer.source_links_allowed as number) - 1;
          const { error: updateError } = await this.SupabaseService.supabase
            .from('customer')
            .update({ source_links_allowed: links })
            .eq('uuid', userid);

          if (updateError) {
            throw new HttpException(
              'Error updating source_links_allowed',
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }
        } else {
          throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
        }
      }

      return { output };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async addYoutubeContent(
    userid: string,
    action: string,
    table: string,
    name: string,
    dataSource: string,
  ) {
    const youtube = new Youtube(this.SupabaseService);

    try {
      const output = await youtube.addYoutubeToBot(
        userid,
        action,
        table,
        name,
        dataSource,
      );

      if (output) {
        const { data: customer, error: selectError } =
          await this.SupabaseService.supabase
            .from('customer')
            .select('source_links_allowed')
            .eq('uuid', userid)
            .single();

        if (selectError) {
          throw new HttpException(
            'Error fetching customer',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        if (customer) {
          const links = (customer.source_links_allowed as number) - 1;
          const { error: updateError } = await this.SupabaseService.supabase
            .from('customer')
            .update({ source_links_allowed: links })
            .eq('uuid', userid);

          if (updateError) {
            throw new HttpException(
              'Error updating source_links_allowed',
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }
        } else {
          throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
        }
      }

      return { output };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  fetchScrappingData = async (scrapping_id: string): Promise<WebsiteData[]> => {
    const { data, error } = await this.SupabaseService.supabase
      .from('tempdata')
      .select('*')
      .eq('id', scrapping_id)
      .single();

    if (error || !data) {
      throw new Error(
        error
          ? `Error fetching scrapping data: ${error.message}`
          : 'Scrapping data not found',
      );
    }

    // Assuming 'data' is an object with a 'data' field that contains an array of WebsiteData
    if (!Array.isArray(data.data)) {
      throw new Error('Scrapping data format is incorrect');
    }

    return data.data as WebsiteData[];
  };

  filterDataSource(
    scrappingData: WebsiteData[],
    dataSource: string[] | undefined,
  ): WebsiteData[] {
    if (!dataSource || dataSource.length === 0) {
      return scrappingData;
    }

    return scrappingData.filter((site) =>
      dataSource.some((ds: any) =>
        typeof ds === 'string' ? ds === site.link : ds.link === site.link,
      ),
    );
  }

  processWebsites = async (
    chatbot_id: string,
    source: WebsiteData[],
  ): Promise<AddWebsiteResult[]> => {
    const website = new Website(this.SupabaseService);
    const results = await Promise.all(
      source.map(async (site) => {
        const FileDataID = await website.addWebsiteStatusInSupabase({
          chatbot_id,
          name: site.title,
          url: site.link,
          status: 1,
          size: site.size,
        });
        return { FileDataID, site };
      }),
    );

    return results; // Return the results array to fulfill the Promise<AddWebsiteResult[]> return type
  };

  updateCustomerSourceLinks = async (
    userid: string,
    usedLinks: number,
  ): Promise<void> => {
    try {
      const { data: customer, error: selectError } =
        await this.SupabaseService.supabase
          .from('customer')
          .select('source_links_allowed')
          .eq('uuid', userid)
          .single();

      if (selectError) {
        console.error('Error fetching customer:', selectError);
        return;
      }

      if (!customer) {
        console.error('Customer not found');
        return;
      }

      const links = Math.max(
        0,
        (customer.source_links_allowed as number) - usedLinks,
      );
      const { error: updateError } = await this.SupabaseService.supabase
        .from('customer')
        .update({ source_links_allowed: links })
        .eq('uuid', userid);

      if (updateError) {
        console.error('Error updating source_links_allowed:', updateError);
      }
    } catch (err) {
      console.error('Error in updateCustomerSourceLinks:', err);
    }
  };

  addWebsitesToBot = async (
    userid: string,
    chatbot_id: string,
    results: AddWebsiteResult[],
  ): Promise<void> => {
    const website = new Website(this.SupabaseService);
    await Promise.all(
      results.map(async ({ FileDataID, site }) => {
        if (FileDataID) {
          await website.addWebsiteToBot(
            userid,
            chatbot_id,
            site.title,
            site.content,
            FileDataID,
            site,
          );
        }
      }),
    );
  };

  updateUserSourceLinks = async (
    userid: string | undefined,
    sourceCount: number,
  ): Promise<void> => {
    if (userid) {
      await this.updateCustomerSourceLinks(userid, sourceCount);
    }
  };

  deleteTempData = async (scrapping_id: string): Promise<void> => {
    await this.SupabaseService.supabase
      .from('tempdata')
      .delete()
      .eq('id', scrapping_id);
  };

  handleError = async (
    err: Error,
    res: Response,
    chatbot_id: string,
    scrapping_id: string,
  ): Promise<void> => {
    console.error('Error in addWebsiteContent:', err);

    const { data: errorRecord } = await this.SupabaseService.supabase
      .from('error')
      .insert([
        {
          where: 'backend',
          err: {
            message: err.message,
            stackTrace: err.stack,
            timestamp: new Date(),
          },
          module: 'AddWebsite',
        },
      ])
      .select('id')
      .single();

    res.status(500).json({
      error: 'Internal server error',
      msg: `Training has failed. Internal error occurred. Log ID: ${errorRecord?.id}`,
      chatbot_id,
      scrapping_id,
    });
  };

  Company_Data_Rebaser = async (
    chatbot_id: string,
    optimizer: boolean = true,
    pushUpdate: boolean = true,
  ): Promise<any> => {
    try {
      const Summary = await this.GenerateSummary.generateSummary(
        chatbot_id,
        optimizer,
      );
      const data = {
        summary: Summary.summary,
        token_cost: Summary.tokenCost.cost,
        inputTokens: Summary.tokenCost.tokens.input,
        outputTokens: Summary.tokenCost.tokens.output,
        last_updated: new Date().toISOString(),
      };
      if (pushUpdate) {
        await Promise.all([
          this.SupabaseService.supabase
            .from('chatbots')
            .update({
              summary: data,
            })
            .eq('id', chatbot_id),
          this.SupabaseService.supabase.from('usage_pricing').insert({
            chatbot_id: chatbot_id,
            user_id: 'system',
            data: data,
            used_for: optimizer
              ? 'summarization_with_optimizer'
              : 'summarization',
          }),
        ]);
      }
      return data;
    } catch (e) {
      return e;
    }
  };

  async addWebsiteContent(
    userid: string,
    chatbot_id: string,
    scrapping_id: string,
    dataSource: any,
  ) {
    if (!chatbot_id || !scrapping_id) {
      throw new HttpException(
        'Chatbot_id or scrapping_id is missing',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const scrappingData = await this.fetchScrappingData(scrapping_id);
      const source = this.filterDataSource(scrappingData, dataSource);

      if (source.length === 0) {
        throw new HttpException(
          'No source links found in the database',
          HttpStatus.BAD_REQUEST,
        );
      }

      const addWebsiteStatusResults = await this.processWebsites(
        chatbot_id,
        source,
      );
      const fileIds = addWebsiteStatusResults
        .map(({ FileDataID }) => FileDataID)
        .filter(Boolean);

      await Promise.all([
        this.addWebsitesToBot(userid, chatbot_id, addWebsiteStatusResults),
        this.updateUserSourceLinks(userid, source.length),
        this.deleteTempData(scrapping_id),
      ]);
      await this.Company_Data_Rebaser(chatbot_id, true, true);

      return {
        msg: 'Training has started',
        chatbot_id,
        scrapping_id,
        file_id: fileIds,
      };
    } catch (error) {
      throw new HttpException(
        'Error processing website content',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

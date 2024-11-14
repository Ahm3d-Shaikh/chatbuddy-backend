import { CharacterTextSplitter } from "langchain/text_splitter";
import Datasource from "../../utils/DataSources";
import { YoutubeTranscript } from "youtube-transcript";
import { SupabaseService } from "src/supabase/supabase.service";
import { google } from 'googleapis';



class Youtube extends Datasource {
    protected SupabaseService: SupabaseService;
  constructor(SupabaseService: SupabaseService) {
    super(SupabaseService);
    this.splitter = new CharacterTextSplitter({
      separator: " ",
      chunkSize: 3000,
      chunkOverlap: 500,
    });
  }
  
    updateCustomerSourceLinks = async(userid: string, usedLinks: number): Promise<void> => {
    try {
        const { data: customer, error: selectError } = await this.SupabaseService.supabase
            .from("customer")
            .select("source_links_allowed")
            .eq("uuid", userid)
            .single();

        if (selectError) {
            console.error('Error fetching customer:', selectError);
            return;
        }

        if (!customer) {
            console.error('Customer not found');
            return;
        }

        const links = Math.max(0, (customer.source_links_allowed as number) - usedLinks);
        const { error: updateError } = await this.SupabaseService.supabase
            .from("customer")
            .update({ source_links_allowed: links })
            .eq("uuid", userid);

        if (updateError) {
            console.error('Error updating source_links_allowed:', updateError);
        }
    } catch (err) {
        console.error('Error in updateCustomerSourceLinks:', err);
    }
}

  async addYoutubeToDb(data: {
    table: string;
    name: string;
    types: string;
    url: string;
    status: number;
    size: number;
  }): Promise<any> {
    const { data: userData, error } = await this.SupabaseService.supabase
      .from("files")
      .insert([
        {
          chatbot_id: data.table,
          name: data.name,
          type: data.types,
          url: data.url,
          status: data.status,
          size: data.size,
        },
      ])
      .select("id")
      .single();

    if (error) {
      throw new Error(`Error in addYoutubeToDb: ${error.message}`);
    }

    return userData;
  }

  async getVideoTitle(url: string): Promise<string> {
    const videoId = this.extractVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    try {
      const response = await this.SupabaseService.youtube.videos.list({
        id: [videoId],
        part: ['snippet'],
        fields: 'items/snippet/title'
      });

      return response.data.items?.[0]?.snippet?.title || 'N/A';
    } catch (err) {
      console.error("Error fetching video title:", err);
      return 'N/A';
    }
  }

  extractVideoId(url: string): string | null {
    const regex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|.*?v=|.*?\/v\/|.*?\/videos\/|.*?\/watch\?.*?&v=|.*?youtu\.be\/|.*?\/v\/|.*?\/embed\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  async extractTranscription(url: string): Promise<string> {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(url);
      return transcript.map(obj => obj.text).join(' ');
    } catch (err) {
      console.error("Error in extractTranscription:", err);
      throw new Error(`Error in extractTranscription: ${err}`);
    }
  }

  public async addYoutubeToBot(
    userid: string,
    action: string,
    table: string,
    name: string,
    dataSource: string
  ): Promise<any> {
    let youtubeId = null;
    try {
      const [title, transcription] = await Promise.all([
        this.getVideoTitle(dataSource),
        this.extractTranscription(dataSource)
      ]);

      const size = transcription.length;

      const FileRecord = await this.addYoutubeToDb({
        table,
        name: title || name,
        types: action,
        url: dataSource,
        status: 1,
        size,
      });
      youtubeId = FileRecord?.id;
      const output = this.saveDataToSupabase({
        name: title || name,
        userid,
        content: transcription,
        types: action,
        table,
        fileId: FileRecord?.id,
      });
      await Promise.all([
        this.updateAnyFileInDb({ id: FileRecord?.id, status: 2 }),
        this.updateBotTrainingTime(table),
        userid ? this.updateCustomerSourceLinks(userid, 1) : null,
      ]);
      return output;
    } catch (error) {
      if (youtubeId) {
        await this.updateAnyFileInDb({ id: youtubeId, status: 3 });
      }
      throw error;
    }
  }
}

export default Youtube;
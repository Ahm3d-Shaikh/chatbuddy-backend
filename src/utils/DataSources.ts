import {
  CharacterTextSplitter,
  RecursiveCharacterTextSplitter,
} from 'langchain/text_splitter';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OpenAIEmbeddings } from '@langchain/openai';
//../../utilsimport supabase from "../../Models/supabase";
import 'dotenv/config';
import { SupabaseService } from 'src/supabase/supabase.service';

class Datasource {
  protected SupabaseService: SupabaseService;
  content: string | undefined;
  limit: number;
  splitter: any;

  constructor(SupabaseService: SupabaseService) {
    this.content = '';
    this.limit = 400000;
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 3000,
      chunkOverlap: 500,
    });
  }

  getLimit() {
    return this.limit;
  }

  setLimit(limit: number) {
    this.limit = limit;
  }

  async updateBotTrainingTime(chatbot_id: any) {
    await this.SupabaseService.supabase
      .from('chatbots')
      .update({
        last_trained_at: 'now()',
      })
      .eq('id', chatbot_id);
  }

  async updateAnyFileInDb(data: any) {
    console.log(data);
    try {
      console.log(data);
      if (data?.id === null) {
        return;
      }
      console.log(data);
      const { error } = await this.SupabaseService.supabase
        .from('files')
        .update({
          status: data?.status,
        })
        .eq('id', data?.id);
      if (error) {
        throw new Error('Error updateAnyFileInDb' + error);
      }

      return data ? data[0] : null;
    } catch (err) {
      throw new Error('Error in updateAnyFileInDb: ' + err);
    }
  }

  async createEmbeddings(data: any) {
    try {
      if (data?.length === 0) {
        return 1;
      }
      let chunks: any = [];
      if (data?.types === 'file' || data?.types === 'website') {
        if (this.splitter === undefined || this.splitter === null) {
          this.splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 3000,
            chunkOverlap: 200,
          });
        }

        chunks = await this.splitter.splitDocuments(data?.content);
        for (const chunk of chunks) {
          if (chunk && chunk.metadata) {
            chunk.metadata.file_id = data?.fileId;
            //console.log(data?.extraInfo);
            if (data?.extraInfo) {
              chunk.pageContent +=
                ' \nSource_Title:' +
                data?.extraInfo?.title +
                ' \nSource_URL:' +
                data?.extraInfo?.link;
            }
          }
          // console.log("chunks", chunks);
        }
        await SupabaseVectorStore.fromDocuments(
          chunks,
          new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAPI_KEY,
            batchSize: 48,
          }),
          {
            client: this.SupabaseService.supabase,
            tableName: data?.table,
            queryName: 'match_documents',
          },
        );
      } else {
        if (this.splitter === undefined || this.splitter === null) {
          this.splitter = new CharacterTextSplitter({
            chunkSize: 3000,
            chunkOverlap: 500,
          });
        }

        chunks = await this.splitter.splitText(data?.content);
        //console.log("chunks", chunks);
        const meta = Array(chunks?.length).fill({
          user_id: data?.userid,
          name: data?.name,
          file_id: data?.fileId,
        });

        // console.log("meta", meta);
        // console.log("chunks", chunks);
        // console.log("data", data);

        await SupabaseVectorStore.fromTexts(
          chunks,
          meta,
          new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAPI_KEY,
            batchSize: 48,
          }),
          {
            client: this.SupabaseService.supabase,
            tableName: data?.table,
            queryName: 'match_documents',
          },
        );
      }

      return 1;
    } catch (error) {
      console.error('Error in createEmbeddings:');
      console.error(error);
      throw error;
    }
  }

  async saveDataToSupabase(data: any) {
    try {
      const tableId = data?.table;
      if (data?.types === 'file' || data?.types === 'website') {
        await this.createEmbeddings({
          ...data,
          table: tableId,
        });
      } else {
        const content = data?.content || '';
        const chunkSize = 24000;

        for (let i = 0; i < content.length; i += chunkSize) {
          const chunk = content.slice(i, i + chunkSize);
          await this.createEmbeddings({
            ...data,
            content: chunk,
            table: tableId,
          });
        }
      }

      return data ? data[0] : null;
    } catch (err) {
      console.error('Error:', err);
      throw new Error(
        'Internal server error while Creating Embeddings in DataSource',
      );
    }
  }

  async deleteFile(data: any): Promise<any> {
    try {
      const { error: embeddingError } = await this.SupabaseService.supabase
        .from(data?.chatbot_id)
        .delete()
        .filter('metadata->>file_id', 'eq', data?.id);

      const { error: fileError } = await this.SupabaseService.supabase
        .from('files')
        .delete()
        .eq('id', data?.id);

      if (fileError) {
        throw new Error('Error deleting file: ' + fileError?.message);
      }
      if (embeddingError) {
        throw new Error('Error deleting embedding: ' + embeddingError?.message);
      }

      return data || null;
    } catch (err) {
      console.error('Error in deletingFile:', err);
      throw err;
    }
  }
}

export default Datasource;

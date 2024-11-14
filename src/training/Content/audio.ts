import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { CharacterTextSplitter } from "langchain/text_splitter";
//import Datasource from "../../utils/DataLayouts/DataSources";
import OpenAI from "openai";
import { SupabaseService } from "src/supabase/supabase.service";
import Datasource from "../../utils/DataSources";


class Audio extends Datasource {
    protected SupabaseService: SupabaseService;
  constructor(SupabaseService: SupabaseService) {
    super(SupabaseService);
    this.splitter = new CharacterTextSplitter({
      separator: " ",
      chunkSize: 3000,
      chunkOverlap: 500,
    });
  }

    openai = new OpenAI({ apiKey: this.SupabaseService.openai });
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

  async addAudioToDb(data: any) {
    try {
      const { data: userData, error: userError } = await this.SupabaseService.supabase
        .from("files")
        .insert([
          {
            chatbot_id: data?.table,
            name: data?.name,
            type: data?.types,
            original_name: data?.fileName,
            status: data?.status,
            size: data?.size,
          },
        ])
        .select()
        .single();

      if (userError) {
        throw new Error("Error in addAudioToDb: " + userError);
      }

      return userData;
    } catch (error) {
      throw new Error("Error adding audio to database: " + error);
    }
  }

  async exractTranscription(file: any) {
    try {
      const filename = file.originalname;
      const filePath = path.join(__dirname, filename);

      fs.writeFileSync(filePath, file.buffer);

      const transcription = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: "whisper-1",
      });

      fs.unlinkSync(filePath);

      return transcription?.text;
    } catch (err) {
      console.error("Error in exractTranscription:", err);
      throw new Error("Error in exractTranscription:" + err);
    }
  }

  async addAudioToBot(
    userid: any,
    action: any,
    table: any,
    name: any,
    file: any
  ) {
    let audioId = null;
    try {
      const transcription = await this.exractTranscription(file);
      const size = transcription.length;

      const audioData = await this.addAudioToDb({
        table,
        name,
        types: action,
        fileName: file.originalname,
        status: 1,
        size,
      });


      // const output = await this.saveDataToSupabase({
      //   name,
      //   userid,
      //   content: transcription,
      //   types: action,
      //   table,
      //   fileId: audioData?.id,
      // });
      // await this.updateAnyFileInDb({ id: audioId, status: 2 });
      const [output, _, __] = await Promise.all([
        this.saveDataToSupabase({
          name,
          userid,
          content: transcription,
          types: action,
          table,
          fileId: audioData?.id,
        }),
        this.updateBotTrainingTime(table),
        userid ? this.updateCustomerSourceLinks(userid, 1) : null,
      ])
      await this.updateAnyFileInDb({ id: audioId, status: 2 });
      return output;
    } catch (error) {
      await this.updateAnyFileInDb({ id: audioId, status: 3 });
    }
  }
}

export default Audio;

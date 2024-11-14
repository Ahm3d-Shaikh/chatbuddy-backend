import { CharacterTextSplitter } from "langchain/text_splitter";
import Datasource from "../../utils/DataSources";
import { SupabaseService } from "src/supabase/supabase.service";


class Text extends Datasource {
  protected SupabaseService: SupabaseService;
  
  constructor(SupabaseService: SupabaseService) {
    super(SupabaseService);
    this.splitter = new CharacterTextSplitter({
      separator: " ",
      chunkSize: 3000,
      chunkOverlap: 500,
    });
  }

    updateCustomerSourceLinks = async (userid: string, usedLinks: number): Promise<void> => {
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

        const links = Math.max(0, customer.source_links_allowed as number - usedLinks);
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

  async addTextToDb(data: any) {
    try {
      const { data: userData, error: userError } = await this.SupabaseService.supabase
        .from("files")
        .insert([
          {
            chatbot_id: data?.table,
            name: data?.name,
            type: data?.types,
            status: data?.status,
            size: data?.size,
          },
        ])
        .select()
        .single();

      if (userError) {
        throw new Error("Error in addTextToDb: " + userError);
      }

      return userData;
    } catch (error) {
      throw new Error("Error adding audio to database: " + error);
    }
  }

  async addTextToBot(
    userid: any,
    action: any,
    table: any,
    name: any,
    dataSource: any
  ) {
    let textId = null;
    try {
      let size = dataSource?.length;

      if (size > this.limit) {
        throw new Error(
          `Text length exceeds the maximum limit of ${this.limit} characters.`
        );
      }

      const textData = await this.addTextToDb({
        table,
        name,
        types: action,
        status: 1,
        size,
      });

      textId = textData?.id;

      const [output, _, __] = await Promise.all([
        this.saveDataToSupabase({
          name,
          userid,
          content: dataSource,
          types: action,
          table,
          fileId: textId,
        }),
        this.updateCustomerSourceLinks(userid, 1),
        this.updateBotTrainingTime(table)]
      );
      await this.updateAnyFileInDb({ id: textId, status: 2 });

      return output;
    } catch (err: any) {
      await this.updateAnyFileInDb({ id: textId, status: 3 });
      // console.log(err)
      throw new Error(err);
    }
  }
}

export default Text;

import Datasource from "../../utils/DataSources";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import tmp from "tmp-promise";
import fs from "fs/promises";
import path from "path";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { SupabaseService } from "src/supabase/supabase.service";

class File extends Datasource {
  file: any;
  protected SupabaseService: SupabaseService;

  constructor(file: any, SupabaseService: SupabaseService) {
    super(SupabaseService);
    this.file = file;
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
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

  async addFileToDb(data: any): Promise<any> {
    try {
      const { data: userData, error: userError } = await this.SupabaseService.supabase
        .from("files")
        .insert([
          {
            chatbot_id: data?.table,
            name: data?.name,
            type: data?.types,
            original_name: data?.fileName,
            file_name: data?.source,
            status: data?.status,
            size: data?.size,
          },
        ])
        .select()
        .single();

      if (userError) {
        console.log(userError)
        throw new Error("Error in addFileToDb: " + userError);
      }

      return userData;
    } catch (error) {
      console.log(error);
      throw new Error("Error adding file to database: " + error);
    }
  }

  async fileService() {
    try {
      const { path: folderPath } = await tmp.dir({ unsafeCleanup: true });

      if (!folderPath) {
        return {
          data: null,
          error: "Error creating temporary directory",
          status: 500,
        };
      }

      try {
        const tempFilePath = path.join(folderPath, this.file.originalname);

        await fs.writeFile(tempFilePath, this.file.buffer);
        const fileExtension = path.extname(tempFilePath).toLowerCase();

        let output: any;

        if (fileExtension === ".pdf") {
          console.log("File extension is pdf");

          const pdfLoader = new PDFLoader(tempFilePath);
          output = await pdfLoader.load();
        } else if (fileExtension === ".docx" || fileExtension === ".doc") {
          console.log(`File extension is ${fileExtension}`);

          const docsLoader = new DocxLoader(tempFilePath);

          output = await docsLoader.load();
        } else if (fileExtension === ".txt") {
          console.log("File extension is txt");

          const textLoader = new TextLoader(tempFilePath);
          output = await textLoader.load();
        } else {
          return {
            data: null,
            error: "File extension not supported",
            status: 400,
            fileExtension: fileExtension
          };
        }

        return {
          data: output,
          error: null,
          status: 200,
          fileExtension: fileExtension
        };
      } finally {
        try {
          await fs.rm(folderPath, { recursive: true });
        } catch (cleanupError) {
          console.error(
            "Error cleaning up temporary directory in create chatbot services:",
            cleanupError
          );
          return {
            data: null,
            error: cleanupError,
            status: 500,
          };
        }
      }
    } catch (error) {
      return {
        data: null,
        error: error,
        status: 500,
      };
    }
  }

  async addFileToBot(
    userid: any,
    action: any,
    table: any,
    name: any,
    file: any
  ) {
    let fileId = null;
    try {
      const fileName = file.originalname;
      const { data } = await this.fileService();

      let size: number = 0;

      data.map((obj: any) => {
        size += obj?.pageContent?.length;
      });

      console.log(data)
      const fileData = await this.addFileToDb({
        table,
        name,
        types: action,
        fileName,
        source: data[0]?.metadata?.source,
        status: 1,
        size,
      });

      fileId = fileData?.id;
      const [output, _, __] = await Promise.all([
        this.saveDataToSupabase({
          name,
          userid,
          content: data,
          types: action,
          table,
          fileId: fileId,
        }),
        this.updateBotTrainingTime(table),
        userid ? this.updateCustomerSourceLinks(userid, 1) : null,
      ])

      await this.updateAnyFileInDb({ id: fileId, status: 2 });

      return output;
    } catch (err) {
      await this.updateAnyFileInDb({ id: fileId, status: 3 });
      //console.error("Error in addFileToBot:", err);
      //throw new Error("Error in addFileToBot:" + err);
    }
  }
}

export default File;

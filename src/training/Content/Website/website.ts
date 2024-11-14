import puppeteer, { Browser, Page, PuppeteerLaunchOptions } from "puppeteer";
import { SupabaseService } from "src/supabase/supabase.service";
import axios from "axios";
import * as cheerio from 'cheerio';
import { headersForWorkAround } from "../../headers";
import { Document } from "@langchain/core/documents";
import Datasource from "../../../utils/DataSources";
import { filterUrls, isValidURL } from "../../../utils/url";

async function startBrowser(): Promise<Browser> {
  const options: PuppeteerLaunchOptions = {
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
    ],
    headless: true
  };

  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    options.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const browser = await puppeteer.launch(options);
  return browser;
}
class Website extends Datasource {
  private browser: Browser | null = null;

  constructor(SupabaseService: SupabaseService) {
      super(SupabaseService);
    console.log("Website Service Initialized");
  }

  async scrapeLinks(url: string) {
    try {
      const response = await axios.get(url, {
        headers: headersForWorkAround
      });
      const html = response.data;

      const contentType = response.headers['content-type'];
      console.log('Content type:', contentType);
      if (contentType && contentType.includes('xml')) {
        const $ = cheerio.load(html, { xmlMode: true });
        const links = $('loc')
          .map((_: any, el: cheerio.BasicAcceptedElems<any> | undefined) => $(el).text())
          .get();
        return links;
      } else if (contentType && contentType.includes('html')) {
        const $ = cheerio.load(html);
        const bundledScriptSrc = $('script[src]')
          .map((_, el) => $(el).attr('src'))
          .get()
          .find(src => src.includes('.js'));

        console.log('HTML content type', contentType);
        console.log('bundledScriptSrc', bundledScriptSrc);

        if (bundledScriptSrc) {
          if (!this.browser) {
            this.browser = await startBrowser();
          }
          const page = await this.browser.newPage();
          await page.setExtraHTTPHeaders(headersForWorkAround);
          await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });
          const links = await page.$$eval('a', (links: any[]) => links.map((link) => link.href));
          const httpsLinks = links.filter((link: string | string[]) => link.includes('https'));

          return filterUrls(httpsLinks, url);

          // try {
          //   await page.setRequestInterception(true);
          //   page.on('request', (request: { resourceType: () => any; abort: () => void; continue: () => void; }) => {
          //     const resourceType = request.resourceType();
          //     const blockedResourceTypes = ['stylesheet', 'image', 'font', 'media'];
          //     if (blockedResourceTypes.includes(resourceType)) {
          //       request.abort();
          //     } else {
          //       request.continue();
          //     }
          //   });
          //   await page.setExtraHTTPHeaders(headersForWorkAround);
          //   await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });
          //   const links = await page.$$eval('a', (links: any[]) => links.map((link) => link.href));
          //   const httpsLinks = links.filter((link: string | string[]) => link.includes('https'));

          //   return filterUrls(httpsLinks, url);
          // } catch (e) {
          //   console.log("Error in browser new page");

          // }
        } else {
          const links = $('a')
            .map((_: any, el: any) => $(el).attr('href'))
            .get()
            .filter(isValidURL);
          return filterUrls(links, url);
        }
      }
      console.warn(`Unsupported content type: ${contentType}`);
      return [];
    } catch (error) {
      console.error('Error:', error);
      return [];
    }
  }

  async getLinksInfo(links: string[]) {
    if (!this.browser) {
      this.browser = await startBrowser();
    }

    const linksInfoPromises = links.map(async (link) => {
      if (!this.browser) {
        this.browser = await startBrowser();
      }
      const page = await this.browser.newPage();
      const { content, title } = await this.crawler(page, link);
      await page.close();
      return {
        link,
        content,
        size: content?.length,
        title,
      };
    });

    const linksInfo = await Promise.all(linksInfoPromises);
    return linksInfo;
  }

  async crawlMultipleLinks(links: string[]) {
    if (!this.browser) {
      this.browser = await startBrowser();
    }
    const linksInfoPromises = links.map(async (link) => {
      if (!this.browser) {
        throw new Error("Browser is not initialized.");
      }
      const page = await this.browser.newPage();
      await page.setExtraHTTPHeaders(headersForWorkAround);

      const { content, title } = await this.crawler(page, link);
      await page.close();
      return {
        link,
        content,
        size: content?.length,
        title,
      };
    });
    let linksInfo = await Promise.all(linksInfoPromises);
    linksInfo = linksInfo.filter((val: any) => val?.size && val?.content);
    console.log(linksInfo);
    return linksInfo;
  }

  async crawelSingleLink(link: string) {
    if (!this.browser) {
      this.browser = await startBrowser();
    }
    const page = await this.browser.newPage();
    await page.setExtraHTTPHeaders(headersForWorkAround);

    const { content, title } = await this.crawler(page, link);
    await page.close();
    return {
      link,
      content,
      size: content?.length || 0,
      title,
    };
  }

  async crawler_prev_implementation(page: Page, link: string): Promise<{ content: string | undefined; title: string | undefined }> {
    const maxRetries = 3;
    let retries = 0;
    await page.setExtraHTTPHeaders(headersForWorkAround);

    async function navigateWithRetries(url: string): Promise<void> {
      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });
      } catch (error: any) {
        if (error.message.includes('net::ERR_ABORTED') && retries < maxRetries) {
          retries++;
          console.error(`Navigation aborted. Retrying ${retries}/${maxRetries}...`);
          await navigateWithRetries(url);
        } else {
          throw error;
        }
      }
    }

    try {
      await navigateWithRetries(link);
      const title = await page.title();
      const content = await page.$$eval('*', (elements: any) =>
        elements.map((el: any) => el.textContent).join(' ')
      );
      return { content, title };
    } catch (err) {
      console.error('Error in crawler:', err);
      return { content: undefined, title: undefined };
    }
  }

  async crawler(page: Page, link: string): Promise<{ content: string | undefined; title: string | undefined }> {
    const maxRetries = 3;
    let retries = 0;

    await page.setExtraHTTPHeaders(headersForWorkAround);

    async function setupRequestInterception(): Promise<void> {
      // try {
      //   await page.setRequestInterception(true);
      //   page.on('request', (request) => {
      //     if (['stylesheet', 'image', 'media', 'font'].includes(request.resourceType())) {
      //       request.abort();
      //     } else {
      //       request.continue();
      //     }
      //   });
      // } catch (err) {
      //   console.error('Error in setting request interception:', err);
      //   await page.setRequestInterception(false);
      // }
    }

    async function navigateWithRetries(url: string): Promise<void> {
      try {
        await page.goto(url, {
          waitUntil: 'networkidle0',
          timeout: 120000
        });
        await page.waitForNetworkIdle({ idleTime: 1000, timeout: 15000 }).catch(() => { });
      } catch (error: any) {
        if (error.message.includes('net::ERR_ABORTED') && retries < maxRetries) {
          retries++;
          console.error(`Navigation aborted. Retrying ${retries}/${maxRetries}...`);
          await navigateWithRetries(url);
        } else {
          throw error;
        }
      }
    }

    async function extractContent(): Promise<string> {
      return page.evaluate(() => {
        document.querySelectorAll('[role="navigation"]').forEach(el => el.remove());
        document.querySelectorAll('script, style').forEach(el => el.remove());

        function extractText(element: Element): string {
          if (element.nodeType === Node.TEXT_NODE) {
            return element.textContent?.trim() || '';
          }

          if (element.nodeType !== Node.ELEMENT_NODE) {
            return '';
          }

          const tagName = element.tagName.toLowerCase();
          if (tagName === 'a') {
            return element.outerHTML;
          }
          if (['br', 'p', 'div', 'section', 'article', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
            return '\n' + Array.from(element.childNodes)
              .map(child => extractText(child as Element))
              .join(' ');
          }

          if (tagName === 'li') {
            return '\n ' + Array.from(element.childNodes)
              .map(child => extractText(child as Element))
              .join(' ');
          }

          return Array.from(element.childNodes)
            .map(child => extractText(child as Element))
            .join(' ');
        }

        return extractText(document.body)
          .replace(/\n{3,}/g, '\n\n')
          .trim();
      });
    }

    try {
      await setupRequestInterception();
      await navigateWithRetries(link);

      const title = await page.title();
      let content = await extractContent();
      content = content.replace('\n', ' ').trim();

      return { content, title };
    } catch (err) {
      console.error('Error in crawler:', err);
      return { content: undefined, title: undefined };
    } finally {
      // Always disable request interception after we're done
      await page.setRequestInterception(false).catch(err => console.error('Error disabling request interception:', err));
    }
  }

  async addWebsiteStatusInSupabase(data: any): Promise<any> {
    if (!data?.chatbot_id || !data?.name || !data?.url || !data?.status || !data?.size) {
      return null;
    }
    try {
      console.log(data);
      const { data: userData, error: userError } = await this.SupabaseService.supabase
        .from("files")
        .insert([
          {
            chatbot_id: data?.chatbot_id,
            name: data?.name,
            url: data?.url,
            status: data?.status,
            size: data?.size,
            type: "website",
          },
        ])
        .select("id")
        .single();
      if (userError) {
        console.log(userError);
        return null;
      }
      return userData?.id;
    } catch (error) {
      throw new Error("Error adding website to database");
    }
  }

  async addWebsiteToBot(userid: string, chatbot_id: string, name: string, data: string, FileDataID: string, site: any) {
    try {
      // console.log("Website Service Initialized");
      // console.log(userid, chatbot_id, name, FileDataID);
      // console.log(data);


      const convertedData = new Document({
        pageContent: data as string,
        metadata: {
          source: site.link
        }
      });

      // console.log("\n\n*****************\n\n");
      // console.log([convertedData]);
      // console.log("\n\n*****************\n\n");

      const output = await this.saveDataToSupabase({
        name,
        userid,
        content: [convertedData],
        chatbot_id: chatbot_id,
        table: chatbot_id,
        fileId: FileDataID,
        types: "website",
        extraInfo: {
          title: site.title,
          link: site.link
        }
      });

      await Promise.all([
        this.updateAnyFileInDb({ id: FileDataID, status: 2 }),
        this.updateBotTrainingTime(chatbot_id)
      ]);

      return output;
    } catch (err) {
      await this.updateAnyFileInDb({ id: FileDataID, status: 3 });
      console.error("Error in addWebsiteToBot:", err);
      throw new Error("Error in addWebsiteToBot: " + err);
    }
  }

  async addWebsiteToBots(userid: string, chatbot_id: string, name: string, data: string, FileDataID: string, site: { link: string }) {
    try {
      console.log("Website Service Initialized");
      console.log(userid, chatbot_id, name, FileDataID);
      console.log(data);

      const convertedData = null;
      // const convertedData: Document = {
      //   Document: {
      //     pageContent: data,
      //     metadata: {
      //       source: site.link,
      //       name: name,
      //       file_id: FileDataID
      //     },
      //     id: FileDataID
      //   }
      // };

      console.log("\n\n*****************\n\n");
      console.log(convertedData);
      console.log("\n\n*****************\n\n");

      const output = await this.saveDataToSupabase({
        name,
        userid,
        content: convertedData,
        chatbot_id: chatbot_id,
        table: chatbot_id,
        fileId: FileDataID,
        types: "website"
      });

      await Promise.all([
        this.updateAnyFileInDb({ id: FileDataID, status: 2 }),
        this.updateBotTrainingTime(chatbot_id)
      ]);

      return output;
    } catch (err) {
      await this.updateAnyFileInDb({ id: FileDataID, status: 3 });
      console.error("Error in addWebsiteToBot:", err);
      throw new Error("Error in addWebsiteToBot: " + err);
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export default Website;

export interface WebsiteData {
    link: string;
    size: number;
    title: string;
    content: string;
  }
  
export interface AddWebsiteResult {
    FileDataID: string | null;
    site: WebsiteData;
  }
import { Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';
import axios from 'axios';
import * as dns from 'dns';

@Injectable()
export class DnsService {
  private API_TOKEN;
  private ACCOUNT_ID;
  private PROJECT_NAME;
  private baseURL;

  constructor(private readonly SupabaseService: SupabaseService) {
    this.API_TOKEN = 'oM--MVGLqyFWjFSq5hXp_Hv7Os7ln528-O-FtH2f';
    this.ACCOUNT_ID = 'b82eb164bed89d9dbe84e83fa7d987f2';
    this.PROJECT_NAME = 'chatbuddy';
    this.baseURL = 'https://api.cloudflare.com/client/v4';
    dns.setServers(['8.8.8.8', '8.8.4.4']);
  }

  LogErrorToDB = async (err: any, module: string) => {
    try {
      const { data: error_id } = await this.SupabaseService.supabase
        .from('error')
        .insert([
          {
            where: 'backend',
            err: {
              message: err?.message,
              stackTrace: err?.stack,
              timestamp: new Date(),
            },
            module: 'AddWebsite',
          },
        ])
        .select('id')
        .single();

      return error_id?.id;
    } catch (err) {
      return null;
    }
  };

  checkActivationStatus = async (CUSTOM_DOMAIN: string) => {
    const url = `${this.baseURL}/accounts/${this.ACCOUNT_ID}/pages/projects/${this.PROJECT_NAME}/domains/${CUSTOM_DOMAIN}/activation`;
    const headers = {
      Authorization: `Bearer ${this.API_TOKEN}`,
    };

    try {
      const response = await axios.get(url, { headers });
      try {
        await this.SupabaseService.supabase
          .from('cname_records')
          .update({ status: response?.data?.result?.status })
          .eq('domain', CUSTOM_DOMAIN);
      } catch (e) {
        await this.LogErrorToDB(e, 'CNameRecordManualUpdation');
      }

      console.log('Activation status:', response?.data);
      return {
        status: true,
        record_status: response?.data?.result?.status,
        status_code: response?.status,
        msg: response?.statusText,
        failure_message:
          response?.data?.result?.validation_data?.error_message || null,
        error: null,
        verification_status: response?.data?.result?.verification_data?.status,
        error_message: response?.data?.result?.verification_data?.error_message,
        validation_method: response?.data?.result?.validation_data?.method,
        certificate_authority: response?.data?.result?.certificate_authority,
        created_on: response?.data?.result?.created_on,
        // data: response?.data
      };
    } catch (error: any) {
      console.error(
        'failed to fetch activation status:',
        error?.response?.data ?? error?.message,
      );

      return {
        status: false,
        status_code: error?.response?.status,
        error: error?.response?.statusText,
        failure_message: error?.response?.data?.errors[0].message,
        record_status: 'null',
        //error_code: await LogErrorToDB(error, 'CNAMERecordCheck')
      };
    }
  };

  addCustomDomain = async (CUSTOM_DOMAIN: string, chatbot_id: string) => {
    const url = `${this.baseURL}/accounts/${this.ACCOUNT_ID}/pages/projects/${this.PROJECT_NAME}/domains`;

    const headers = {
      Authorization: `Bearer ${this.API_TOKEN}`,
      'Content-Type': 'application/json',
    };

    const payload = {
      name: CUSTOM_DOMAIN,
    };

    try {
      const response = await axios.post(url, payload, { headers });

      try {
        await this.SupabaseService.supabase
          .from('cname_records')
          .update({ status: 'active' })
          .eq('domain', CUSTOM_DOMAIN)
          .eq('chatbot', chatbot_id);
      } catch (error) {
        await this.LogErrorToDB(error, 'CNameRecordManualUpdation');
      }
      return {
        status: 'success',
        msg: 'Custom domain added successfully',
        status_msg: response?.data?.result?.status,
        data: response?.data,
        status_code: response?.status,
        failure_message: null,
      };
    } catch (error: any) {
      let errorDetails;
      let error_code = await this.LogErrorToDB(error, 'CNAMERecordAdd');

      if (error?.response) {
        // Request made and server responded with a status code outside the range of 2xx
        errorDetails = {
          status: 'failed',
          status_code: error?.response?.status,
          msg: error?.response?.statusText,
          failure_message:
            error?.response?.data?.errors[0]?.message ?? 'Unknown error',
          details: error?.response?.data,
          error_code: error_code,
        };
      } else if (error?.request) {
        // Request made but no response received
        errorDetails = {
          status: 'failed',
          status_code: null,
          msg: 'No response received from server',
          failure_message: error?.message,
          details: null,
          error_code: error_code,
        };
      } else {
        // Something happened in setting up the request that triggered an error
        errorDetails = {
          status: 'failed',
          status_code: null,
          msg: 'Request setup error',
          failure_message: error?.message,
          details: null,
          error_code: error_code,
        };
      }

      console.error('failed to add custom domain:', errorDetails);
      return errorDetails;
    }
  };

  deleteCustomDomain = async (CUSTOM_DOMAIN: string) => {
    const url = `${this.baseURL}/accounts/${this.ACCOUNT_ID}/pages/projects/${this.PROJECT_NAME}/domains/${CUSTOM_DOMAIN}`;

    const headers = {
      Authorization: `Bearer ${this.API_TOKEN}`,
    };

    try {
      const response = await axios.delete(url, { headers });
      return {
        status: 'success',
        data: response.data,
        status_code: response.status,
        msg: response.statusText,
        failure_message: null,
      };
    } catch (error: any) {
      let errorDetails;
      const error_code = await this.LogErrorToDB(error, 'CNAMERecordDelete');
      if (error.response) {
        errorDetails = {
          status: 'failed',
          status_code: error.response.status,
          msg: error.response.statusText,
          failure_message:
            error.response.data?.errors[0]?.message ?? 'Unknown error',
          details: error.response.data,
          error_code: error_code,
        };
      } else if (error.request) {
        errorDetails = {
          status: 'failed',
          status_code: null,
          msg: 'No response received from server',
          failure_message: error.message,
          details: null,
          error_code: error_code,
        };
      } else {
        errorDetails = {
          status: 'failed',
          status_code: null,
          msg: 'Request setup error',
          failure_message: error.message,
          details: null,
          error_code: error_code,
        };
      }
      return errorDetails;
    }
  };

  getCustomDomainfromDB = async (CUSTOM_DOMAIN: string) => {
    return await this.SupabaseService.supabase
      .from('cname_records')
      .select('*')
      .eq('domain', CUSTOM_DOMAIN)
      .single();
  };

  verifyCNAME = async (domain: string) => {
    try {
      const records: any = await dns.promises.resolveCname(domain);
      console.log('CNAME records:');
      console.log(records);
      return records.some(
        (record) => record.toLowerCase() === 'app.chatbuddy.io',
      );
    } catch (error) {
      console.error('CNAME verification error:', error);
      return false;
    }
  };

  normalize(domain: string): string {
    domain = domain.trim().toLowerCase();
    if (domain.startsWith('*.')) {
      domain = domain.slice(2);
    }
    const parts = domain.split('.');
    if (parts.length > 2) {
      return parts.slice(-2).join('.');
    }
    return domain;
  }

  verifyTXT = async (domain: string, chatbot_id: string) => {
    try {
      let expectedTXT = `_chatbuddy=${chatbot_id}`;

      // console.log(normalize('app.texagon.io')); // Should output: texagon.io
      // console.log(normalize('*.texagon.io')); // Should output: texagon.io
      // console.log(normalize('texagon.io')); // Should output: texagon.io
      // console.log(normalize('  subdomain.texagon.io  ')); // Should output: texagon.io
      // console.log(normalize('sub.sub.texagon.io')); // Should output: texagon.io

      const records = await dns.promises.resolveTxt(this.normalize(domain));
      console.log('TXT records:');
      console.log(records);
      return records.some((record) => record[0] === expectedTXT);
    } catch (error) {
      console.error('TXT verification error:', error);
      return false;
    }
  };
}

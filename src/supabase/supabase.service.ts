import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { google } from 'googleapis';

@Injectable()
export class SupabaseService {
  public supabase: ReturnType<typeof createClient>;
  public AuthSupabase: ReturnType<typeof createClient>;
  public openai;
  public youtube;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');
    const openAIKey = this.configService.get<string>('OPENAI_API_KEY');
    const youtubeAPIKey = this.configService.get<string>('YOUTUBE_API_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_KEY are required in the environment variables.',
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.AuthSupabase = createClient(supabaseUrl, supabaseKey);
    this.openai = new OpenAI({
      apiKey: openAIKey,
    });

    this.youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY,
    });
  }
}

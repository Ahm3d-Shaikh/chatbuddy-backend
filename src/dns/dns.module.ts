import { Module } from '@nestjs/common';
import { DnsController } from './dns.controller';
import { DnsService } from './dns.service';
import { SupabaseModule } from 'src/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [DnsController],
  providers: [DnsService]
})
export class DnsModule {}

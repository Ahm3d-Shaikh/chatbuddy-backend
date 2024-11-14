import { Test, TestingModule } from '@nestjs/testing';
import { DnsService } from './dns.service';

describe('DnsService', () => {
  let service: DnsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DnsService],
    }).compile();

    service = module.get<DnsService>(DnsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

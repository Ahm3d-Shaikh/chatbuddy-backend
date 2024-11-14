import { Test, TestingModule } from '@nestjs/testing';
import { DnsController } from './dns.controller';

describe('DnsController', () => {
  let controller: DnsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DnsController],
    }).compile();

    controller = module.get<DnsController>(DnsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

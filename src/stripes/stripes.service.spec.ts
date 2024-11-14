import { Test, TestingModule } from '@nestjs/testing';
import { StripesService } from './stripes.service';

describe('StripesService', () => {
  let service: StripesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StripesService],
    }).compile();

    service = module.get<StripesService>(StripesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

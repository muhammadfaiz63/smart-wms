import { Test, TestingModule } from '@nestjs/testing';
import { QuarantineService } from './quarantine.service';

describe('QuarantineService', () => {
  let service: QuarantineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuarantineService],
    }).compile();

    service = module.get<QuarantineService>(QuarantineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

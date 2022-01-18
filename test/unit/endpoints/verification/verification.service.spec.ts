import { Test, TestingModule } from '@nestjs/testing';
import { dateTimeProxyMockFactory, MockType } from '../../mock';
import { when } from 'jest-when';
import { DateTimeProxy } from '../../../../src/common/proxies/date-time';
import { RewardService } from '../../../../src/common/modules/reward/reward.service';
import { VerificationService } from '../../../../src/endpoints/verification/verification.service';
import { RewardDto } from '../../../../src/common/modules/reward/dto/reward.dto';
import { SubstrateService } from '../../../../src/common';
import {
  convertToDbioUnitString,
  sendRewards,
  updateLabVerificationStatus,
} from '../../../../src/common/polkadot-provider';

jest.mock('../../../../src/common/polkadot-provider', () => ({
  sendRewards: jest.fn(),
  updateLabVerificationStatus: jest.fn(),
  convertToDbioUnitString: jest.fn(),
}));

describe('Verification Service Unit Tests', () => {
  let verificationService: VerificationService;
  let rewardServiceMock: MockType<RewardService>;
  let dateTimeProxyMock: MockType<DateTimeProxy>;

  let substrateServiceMock: MockType<SubstrateService>;

  const API = 'API';
  const PAIR = 'PAIR';

  const substrateServiceMockFactory: () => MockType<SubstrateService> = jest.fn(
    () => ({
      onModuleInit: jest.fn(),
      startListen: jest.fn(),
      stopListen: jest.fn(),
    }),
  );

  const rewardServiceMockFactory: () => MockType<RewardService> = jest.fn(
    () => ({
      insert: jest.fn((entity) => entity),
    }),
  );

  // Arrange before each iteration
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationService,
        { provide: RewardService, useFactory: rewardServiceMockFactory },
        { provide: SubstrateService, useFactory: substrateServiceMockFactory },
        { provide: DateTimeProxy, useFactory: dateTimeProxyMockFactory },
      ],
    }).compile();

    verificationService = module.get(VerificationService);
    rewardServiceMock = module.get(RewardService);

    dateTimeProxyMock = module.get(DateTimeProxy);

    substrateServiceMock = module.get(SubstrateService);
    Reflect.set(substrateServiceMock, 'api', API);
    Reflect.set(substrateServiceMock, 'pair', PAIR);

    (updateLabVerificationStatus as jest.Mock).mockClear();
    (sendRewards as jest.Mock).mockClear();
    (convertToDbioUnitString as jest.Mock).mockClear();
  });

  it('should be defined', () => {
    // Assert
    expect(verificationService).toBeDefined();
  });

  it('should not send reward', async () => {
    // Arrange
    const NOW = 0;
    const ACCOUNT_ID = 'ACCOUNT_ID';
    const VERIFICATION_STATUS = 'Unverified';

    const PARAM: RewardDto = {
      address: ACCOUNT_ID,
      ref_number: '-',
      reward_amount: 2,
      reward_type: 'Lab Verified',
      currency: 'DBIO',
      created_at: new Date(NOW),
    };

    const EXPECTED_RESULTS = 'EXPECTED_RESULTS';
    when(rewardServiceMock.insert)
      .calledWith(PARAM)
      .mockReturnValue(EXPECTED_RESULTS);
    dateTimeProxyMock.now.mockReturnValue(NOW);

    // Act
    const RESULTS = await verificationService.vericationLab(
      ACCOUNT_ID,
      VERIFICATION_STATUS,
    );

    // Assert
    expect(RESULTS).toEqual(EXPECTED_RESULTS);
    expect(updateLabVerificationStatus).toHaveBeenCalledTimes(1);
    expect(updateLabVerificationStatus).toHaveBeenCalledWith(
      API,
      PAIR,
      ACCOUNT_ID,
      VERIFICATION_STATUS,
    );
    expect(rewardServiceMock.insert).toHaveBeenCalledTimes(1);
    expect(rewardServiceMock.insert).toHaveBeenCalledWith(PARAM);
    expect(sendRewards).toHaveBeenCalledTimes(0);
  });

  it('should send reward', async () => {
    // Arrange
    const NOW = 0;
    const ACCOUNT_ID = 'ACCOUNT_ID';
    const VERIFICATION_STATUS = 'Verified';
    const REWARD_AMOUNT = 2;
    const PARAM: RewardDto = {
      address: ACCOUNT_ID,
      ref_number: '-',
      reward_amount: REWARD_AMOUNT,
      reward_type: 'Lab Verified',
      currency: 'DBIO',
      created_at: new Date(NOW),
    };

    const EXPECTED_RESULTS = 'EXPECTED_RESULTS';
    when(rewardServiceMock.insert)
      .calledWith(PARAM)
      .mockReturnValue(EXPECTED_RESULTS);
    dateTimeProxyMock.now.mockReturnValue(NOW);

    // Act
    const RESULTS = await verificationService.vericationLab(
      ACCOUNT_ID,
      VERIFICATION_STATUS,
    );

    // Assert
    expect(RESULTS).toEqual(EXPECTED_RESULTS);
    expect(updateLabVerificationStatus).toHaveBeenCalledTimes(1);
    expect(updateLabVerificationStatus).toHaveBeenCalledWith(
      API,
      PAIR,
      ACCOUNT_ID,
      VERIFICATION_STATUS,
    );
    expect(rewardServiceMock.insert).toHaveBeenCalledTimes(1);
    expect(rewardServiceMock.insert).toHaveBeenCalledWith(PARAM);
    expect(sendRewards).toHaveBeenCalledTimes(1);
    expect(convertToDbioUnitString).toHaveBeenCalledTimes(1);
  });
});
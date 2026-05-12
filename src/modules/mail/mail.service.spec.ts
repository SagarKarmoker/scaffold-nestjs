import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { Queue } from 'bullmq';

describe('MailService', () => {
    let service: MailService;
    let mockQueue: jest.Mocked<Queue>;

    beforeEach(async () => {
        mockQueue = {
            add: jest.fn().mockResolvedValue({ id: '123' }),
        } as unknown as jest.Mocked<Queue>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MailService,
                {
                    provide: 'BullQueue_email',
                    useValue: mockQueue,
                },
            ],
        }).compile();

        service = module.get<MailService>(MailService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('sendWelcomeEmail', () => {
        it('should add welcome email job to queue', async () => {
            const email = 'test@example.com';
            const name = 'Test User';

            await service.sendWelcomeEmail(email, name);

            expect(mockQueue.add).toHaveBeenCalledWith(
                'send-welcome-email',
                { email, name },
            );
        });

        it('should throw error when queue fails', async () => {
            mockQueue.add.mockRejectedValueOnce(new Error('Queue error'));

            await expect(
                service.sendWelcomeEmail('test@example.com', 'Test'),
            ).rejects.toThrow('Queue error');
        });
    });

    describe('sendPasswordResetEmail', () => {
        it('should add password reset email job to queue', async () => {
            const email = 'test@example.com';
            const token = 'reset-token-123';

            await service.sendPasswordResetEmail(email, token);

            expect(mockQueue.add).toHaveBeenCalledWith(
                'send-password-reset-email',
                { email, token },
            );
        });

        it('should throw error when queue fails', async () => {
            mockQueue.add.mockRejectedValueOnce(new Error('Queue error'));

            await expect(
                service.sendPasswordResetEmail('test@example.com', 'token'),
            ).rejects.toThrow('Queue error');
        });
    });
});
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { S3Client } from '@aws-sdk/client-s3';
import type { SESClient } from '@aws-sdk/client-ses';

const mockGetSignedUrl = vi.fn();
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: (...args: unknown[]) => mockGetSignedUrl(...args),
}));

import {
  deleteObjectFromS3,
  uploadObjectToS3,
} from '../../src/services/aws-s3.service';
import { sendSesEmail } from '../../src/services/aws-ses.service';
import { UploadService } from '../../src/services/upload.service';
import * as sesService from '../../src/services/aws-ses.service';
import * as s3Service from '../../src/services/aws-s3.service';
import { sendOtpEmail } from '../../src/utils/email.util';

describe('AWS SDK v3 Integration (S3 & SES)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockGetSignedUrl.mockReset();
    delete process.env.AWS_S3_BUCKET;
    delete process.env.STORAGE_PROVIDER;
    delete process.env.SES_FROM_EMAIL;
    delete process.env.EMAIL_PROVIDER;
  });

  it('uploads buffer to S3 and returns a presigned download URL', async () => {
    process.env.AWS_S3_BUCKET = 'test-garage-bucket';
    const mockSend = vi.fn().mockResolvedValue({});
    const fakeS3 = { send: mockSend } as unknown as S3Client;
    mockGetSignedUrl.mockResolvedValue('https://test-garage-bucket.s3.amazonaws.com/invoices/1.pdf?sig=abc');

    const result = await uploadObjectToS3(
      {
        buffer: Buffer.from('pdf-bytes'),
        key: 'invoices/1.pdf',
        contentType: 'application/pdf',
      },
      fakeS3
    );

    expect(mockSend).toHaveBeenCalledTimes(1);
    const putCommand = mockSend.mock.calls[0][0];
    expect(putCommand.input).toEqual({
      Bucket: 'test-garage-bucket',
      Key: 'invoices/1.pdf',
      Body: Buffer.from('pdf-bytes'),
      ContentType: 'application/pdf',
    });
    expect(mockGetSignedUrl).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      bucket: 'test-garage-bucket',
      key: 'invoices/1.pdf',
      url: 'https://test-garage-bucket.s3.amazonaws.com/invoices/1.pdf?sig=abc',
    });
  });

  it('throws clear error if AWS_S3_BUCKET is missing', async () => {
    const fakeS3 = { send: vi.fn() } as unknown as S3Client;
    await expect(
      uploadObjectToS3({ buffer: Buffer.from('x'), key: 'k' }, fakeS3)
    ).rejects.toThrow('AWS_S3_BUCKET is not configured');
  });

  it('deletes object from S3 with DeleteObjectCommand', async () => {
    process.env.AWS_S3_BUCKET = 'test-garage-bucket';
    const mockSend = vi.fn().mockResolvedValue({});
    const fakeS3 = { send: mockSend } as unknown as S3Client;

    await deleteObjectFromS3('invoices/1.pdf', undefined, fakeS3);

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend.mock.calls[0][0].input).toEqual({
      Bucket: 'test-garage-bucket',
      Key: 'invoices/1.pdf',
    });
  });

  it('sends UTF-8 HTML email via Amazon SES', async () => {
    process.env.SES_FROM_EMAIL = 'no-reply@autocare.vn';
    const mockSend = vi.fn().mockResolvedValue({ MessageId: 'ses-msg-123' });
    const fakeSes = { send: mockSend } as unknown as SESClient;

    const res = await sendSesEmail(
      {
        to: 'customer@example.com',
        subject: 'Xác nhận lịch hẹn',
        html: '<p>Xin chào</p>',
      },
      fakeSes
    );

    expect(res.messageId).toBe('ses-msg-123');
    expect(mockSend).toHaveBeenCalledTimes(1);
    const sendCmd = mockSend.mock.calls[0][0];
    expect(sendCmd.input.Source).toBe('no-reply@autocare.vn');
    expect(sendCmd.input.Destination.ToAddresses).toEqual(['customer@example.com']);
    expect(sendCmd.input.Message.Subject.Charset).toBe('UTF-8');
    expect(sendCmd.input.Message.Body.Html.Charset).toBe('UTF-8');
  });

  it('throws clear error if SES_FROM_EMAIL is missing', async () => {
    const fakeSes = { send: vi.fn() } as unknown as SESClient;
    await expect(
      sendSesEmail({ to: 'a@b.com', subject: 's', html: '<p>x</p>' }, fakeSes)
    ).rejects.toThrow('SES_FROM_EMAIL is not configured');
  });

  it('routes UploadService.uploadImage to S3 when STORAGE_PROVIDER=s3', async () => {
    process.env.STORAGE_PROVIDER = 's3';
    process.env.AWS_S3_BUCKET = 'test-garage-bucket';

    const uploadSpy = vi.spyOn(s3Service, 'uploadObjectToS3').mockResolvedValue({
      bucket: 'test-garage-bucket',
      key: 'inspections/test-id',
      url: 'https://signed.example.com/inspections/test-id',
    });

    const url = await UploadService.uploadImage(Buffer.from('img'), '/inspections/', 'image/png');

    expect(uploadSpy).toHaveBeenCalledTimes(1);
    expect(uploadSpy.mock.calls[0][0].contentType).toBe('image/png');
    expect(uploadSpy.mock.calls[0][0].key).toMatch(/^inspections\//);
    expect(url).toBe('https://signed.example.com/inspections/test-id');
  });

  it('routes sendOtpEmail to SES when EMAIL_PROVIDER=ses', async () => {
    process.env.EMAIL_PROVIDER = 'ses';
    const sesSpy = vi.spyOn(sesService, 'sendSesEmail').mockResolvedValue({ messageId: 'otp-1' });

    await sendOtpEmail('user@example.com', '123456', 'register');

    expect(sesSpy).toHaveBeenCalledTimes(1);
    expect(sesSpy.mock.calls[0][0].to).toBe('user@example.com');
    expect(sesSpy.mock.calls[0][0].html).toContain('1');
  });
});

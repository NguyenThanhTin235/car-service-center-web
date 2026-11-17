import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import logger from '../loggers/logger';

let defaultS3Client: S3Client | null = null;

export const getS3Client = (): S3Client => {
  if (!defaultS3Client) {
    defaultS3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-southeast-1',
    });
  }
  return defaultS3Client;
};

const resolveBucket = (bucket?: string): string => {
  const resolved = bucket || process.env.AWS_S3_BUCKET;
  if (!resolved) {
    throw new Error('AWS_S3_BUCKET is not configured');
  }
  return resolved;
};

export interface UploadS3Params {
  buffer: Buffer;
  key: string;
  contentType?: string;
  bucket?: string;
  expiresInSeconds?: number;
}

export interface UploadS3Result {
  bucket: string;
  key: string;
  url: string;
}

export const getPresignedDownloadUrl = async (
  key: string,
  expiresInSeconds: number = 3600,
  bucket?: string,
  client: S3Client = getS3Client()
): Promise<string> => {
  const targetBucket = resolveBucket(bucket);
  const command = new GetObjectCommand({
    Bucket: targetBucket,
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
};

export const uploadObjectToS3 = async (
  params: UploadS3Params,
  client: S3Client = getS3Client()
): Promise<UploadS3Result> => {
  const targetBucket = resolveBucket(params.bucket);
  const command = new PutObjectCommand({
    Bucket: targetBucket,
    Key: params.key,
    Body: params.buffer,
    ContentType: params.contentType || 'application/octet-stream',
  });

  await client.send(command);

  const url = await getPresignedDownloadUrl(
    params.key,
    params.expiresInSeconds ?? 3600,
    targetBucket,
    client
  );

  logger.info('Uploaded object to S3', { bucket: targetBucket, key: params.key });

  return {
    bucket: targetBucket,
    key: params.key,
    url,
  };
};

export const deleteObjectFromS3 = async (
  key: string,
  bucket?: string,
  client: S3Client = getS3Client()
): Promise<void> => {
  const targetBucket = resolveBucket(bucket);
  const command = new DeleteObjectCommand({
    Bucket: targetBucket,
    Key: key,
  });

  await client.send(command);
  logger.info('Deleted object from S3', { bucket: targetBucket, key });
};

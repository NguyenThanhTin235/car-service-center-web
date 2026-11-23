import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import logger from '../loggers/logger';

let defaultSesClient: SESClient | null = null;

export const getSesClient = (): SESClient => {
  if (!defaultSesClient) {
    defaultSesClient = new SESClient({
      region: process.env.AWS_REGION || 'ap-southeast-1',
    });
  }
  return defaultSesClient;
};

export interface SendSesEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface SendSesEmailResult {
  messageId?: string;
}

export const sendSesEmail = async (
  params: SendSesEmailParams,
  client: SESClient = getSesClient()
): Promise<SendSesEmailResult> => {
  const source = params.from || process.env.SES_FROM_EMAIL;
  if (!source) {
    throw new Error('SES_FROM_EMAIL is not configured');
  }

  const toAddresses = Array.isArray(params.to) ? params.to : [params.to];

  const command = new SendEmailCommand({
    Source: source,
    Destination: {
      ToAddresses: toAddresses,
    },
    Message: {
      Subject: {
        Data: params.subject,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: params.html,
          Charset: 'UTF-8',
        },
        ...(params.text
          ? {
              Text: {
                Data: params.text,
                Charset: 'UTF-8',
              },
            }
          : {}),
      },
    },
  });

  const response = await client.send(command);
  logger.info('Email sent via Amazon SES', {
    messageId: response.MessageId,
    recipientCount: toAddresses.length,
  });

  return { messageId: response.MessageId };
};

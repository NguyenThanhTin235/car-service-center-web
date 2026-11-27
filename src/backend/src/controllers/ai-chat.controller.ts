import { Request, Response } from 'express';
import logger from '../loggers/logger';
import { aiCustomerChatService } from '../services/ai-chat/ai-customer-chat.service';
import { getAiMetricsSnapshot } from '../utils/ai-telemetry.util';
import { getGeminiClientHealth } from '../utils/ai-client.util';

function sendSuccess<T>(res: Response, data: T, message: string, code = 200): void {
  res.status(code).json({
    success: true,
    code,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

function sendError(
  res: Response,
  code: number,
  errorCode: string,
  message: string,
  details?: unknown
): void {
  res.status(code).json({
    success: false,
    code,
    message,
    error: {
      code: errorCode,
      ...(details !== undefined ? { details } : {}),
    },
    timestamp: new Date().toISOString(),
  });
}

export const getMetrics = async (_req: Request, res: Response): Promise<void> => {
  sendSuccess(
    res,
    {
      metrics: getAiMetricsSnapshot(),
      llmGateway: getGeminiClientHealth(),
    },
    'Lấy chỉ số giám sát AI Chatbot thành công.'
  );
};

export const getWelcome = async (req: Request, res: Response): Promise<void> => {
  try {
    const contextPage =
      typeof req.query.contextPage === 'string' ? req.query.contextPage.trim() : undefined;
    const traceId = (req as Request & { requestId?: string }).requestId;
    const data = await aiCustomerChatService.getWelcomePayload(req.user?.id, contextPage, traceId);
    sendSuccess(res, data, 'Khởi tạo trợ lý AI thành công.');
  } catch (err) {
    logger.error('[AiChatController.getWelcome] Error', {
      error: err instanceof Error ? err.message : String(err),
    });
    sendError(
      res,
      500,
      'AI_WELCOME_ERROR',
      'Không thể khởi tạo lời chào trợ lý AI. Vui lòng thử lại sau.'
    );
  }
};

export const postMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, history, contextPage, context_page } = req.body || {};

    if (typeof message !== 'string' || message.trim().length === 0) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Nội dung tin nhắn không được để trống.', {
        field: 'message',
      });
      return;
    }

    if (message.trim().length > 1000) {
      sendError(
        res,
        400,
        'VALIDATION_ERROR',
        'Tin nhắn không được vượt quá 1000 ký tự.',
        { field: 'message', maxLength: 1000 }
      );
      return;
    }

    if (history !== undefined) {
      if (!Array.isArray(history) || history.length > 20) {
        sendError(
          res,
          400,
          'VALIDATION_ERROR',
          'Lịch sử hội thoại phải là mảng tối đa 20 phần tử.',
          { field: 'history' }
        );
        return;
      }
    }

    const resolvedContextPage =
      typeof contextPage === 'string'
        ? contextPage.trim().slice(0, 200)
        : typeof context_page === 'string'
          ? context_page.trim().slice(0, 200)
          : undefined;

    const traceId = (req as Request & { requestId?: string }).requestId;
    const wantsStream =
      typeof req.headers.accept === 'string' &&
      req.headers.accept.includes('text/event-stream');

    if (wantsStream) {
      const abortController = new AbortController();
      let clientClosed = false;

      const onClose = () => {
        if (!res.writableEnded) {
          clientClosed = true;
          abortController.abort();
        }
      };
      res.on('close', onClose);

      res.status(200);
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();

      const writeSse = (event: string, payload: unknown) => {
        if (clientClosed || res.writableEnded) return;
        res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
      };

      try {
        writeSse('ack', { traceId: traceId || null, phase: 'thinking' });

        // Anti-IDOR: strictly use req.user?.id verified from JWT, never body customer_id
        const data = await aiCustomerChatService.streamMessage(
          {
            userId: req.user?.id,
            message,
            history,
            contextPage: resolvedContextPage,
            traceId,
          },
          {
            signal: abortController.signal,
            onDelta: (reply) => writeSse('delta', { reply }),
          }
        );

        if (!clientClosed) {
          writeSse('done', { success: true, data });
          res.end();
        }
      } catch (streamErr) {
        if (!clientClosed && !(streamErr instanceof Error && streamErr.name === 'AbortError')) {
          logger.error('[AiChatController.postMessage] Unexpected SSE stream error', {
            error: streamErr instanceof Error ? streamErr.message : String(streamErr),
          });
          writeSse('error', {
            code: 'AI_CHAT_ERROR',
            message: 'Hệ thống trợ lý AI đang bận, vui lòng thử lại hoặc gọi Hotline 1900 6868.',
          });
          if (!res.writableEnded) {
            res.end();
          }
        }
      } finally {
        res.off('close', onClose);
      }
      return;
    }

    // Anti-IDOR: strictly use req.user?.id verified from JWT, never body customer_id
    const data = await aiCustomerChatService.sendMessage({
      userId: req.user?.id,
      message,
      history,
      contextPage: resolvedContextPage,
      traceId,
    });

    sendSuccess(res, data, 'Phản hồi từ trợ lý AI thành công.');
  } catch (err) {
    logger.error('[AiChatController.postMessage] Unexpected error', {
      error: err instanceof Error ? err.message : String(err),
    });
    sendError(
      res,
      500,
      'AI_CHAT_ERROR',
      'Hệ thống trợ lý AI đang bận, vui lòng thử lại hoặc gọi Hotline 1900 6868.'
    );
  }
};

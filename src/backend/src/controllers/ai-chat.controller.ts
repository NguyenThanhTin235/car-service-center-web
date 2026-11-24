import { Request, Response } from 'express';
import { aiCustomerChatService } from '../services/ai-chat/ai-customer-chat.service';

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

export const getWelcome = async (req: Request, res: Response): Promise<void> => {
  try {
    const contextPage =
      typeof req.query.contextPage === 'string' ? req.query.contextPage.trim() : undefined;
    const data = await aiCustomerChatService.getWelcomePayload(req.user?.id, contextPage);
    sendSuccess(res, data, 'Khởi tạo trợ lý AI thành công.');
  } catch (err) {
    console.error('[AiChatController.getWelcome] Error:', err);
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

    // Anti-IDOR: strictly use req.user?.id verified from JWT, never body customer_id
    const data = await aiCustomerChatService.sendMessage({
      userId: req.user?.id,
      message,
      history,
      contextPage: resolvedContextPage,
    });

    sendSuccess(res, data, 'Phản hồi từ trợ lý AI thành công.');
  } catch (err) {
    console.error('[AiChatController.postMessage] Unexpected error:', err);
    sendError(
      res,
      500,
      'AI_CHAT_ERROR',
      'Hệ thống trợ lý AI đang bận, vui lòng thử lại hoặc gọi Hotline 1900 6868.'
    );
  }
};

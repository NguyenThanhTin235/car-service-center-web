'use client';

import React from 'react';
import {
  MarkdownInlineSpan,
  parseSafeMarkdownLines,
  StoredChatActionItem,
  StoredChatMessage,
} from './aiChatUtils';

interface ChatMessageBubbleProps {
  message: StoredChatMessage;
  isLatestAssistant: boolean;
  onSelectQuestion: (question: string) => void;
  onTriggerAction: (action: StoredChatActionItem) => void;
  onConfirmBooking?: (messageId: string, action: StoredChatActionItem) => void;
  isBookingSubmitting?: boolean;
  bookingError?: string | null;
  disabled?: boolean;
}

function formatDisplayDate(dateStr?: string | null): string {
  if (!dateStr) return 'Chưa rõ ngày';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

export function renderInlineSpans(spans: MarkdownInlineSpan[]) {
  return spans.map((span, idx) => {
    if (span.type === 'bold') {
      const hasMonetaryOrCode = /[0-9].*[₫]|WO-|QT-|INV-|[0-9]{2}[A-Z]/i.test(span.value);
      return (
        <strong
          key={idx}
          className={
            hasMonetaryOrCode
              ? 'font-bold font-mono tabular-nums text-ink-primary'
              : 'font-bold text-ink-primary'
          }
        >
          {span.value}
        </strong>
      );
    }
    if (span.type === 'code') {
      return (
        <span
          key={idx}
          className="font-mono font-semibold tabular-nums text-ink-primary"
        >
          {span.value}
        </span>
      );
    }
    return <React.Fragment key={idx}>{span.value}</React.Fragment>;
  });
}

export function MarkdownMessageBody({ content }: { content: string }) {
  const parsedLines = parseSafeMarkdownLines(content);
  return (
    <div className="text-sm leading-relaxed space-y-1.5 break-words">
      {parsedLines.map((line, lineIdx) => {
        if (line.kind === 'spacer') {
          return <div key={lineIdx} className="h-1" />;
        }
        if (line.kind === 'bullet') {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-0.5">
              <span className="text-accent font-bold mt-0.5">•</span>
              <span className="flex-1">{renderInlineSpans(line.spans)}</span>
            </div>
          );
        }
        return <p key={lineIdx}>{renderInlineSpans(line.spans)}</p>;
      })}
    </div>
  );
}

export default function ChatMessageBubble({
  message,
  isLatestAssistant,
  onSelectQuestion,
  onTriggerAction,
  onConfirmBooking,
  isBookingSubmitting = false,
  bookingError = null,
  disabled = false,
}: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-accent text-white px-4 py-2.5 shadow-xs">
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      </div>
    );
  }

  const confirmBookingAction = (message.actions || []).find((a) => a.type === 'CONFIRM_BOOKING');
  const standardActions = (message.actions || []).filter((a) => a.type !== 'CONFIRM_BOOKING');

  const actionLabels = new Set(
    standardActions.map((a) => a.label.trim().toLowerCase())
  );
  const visibleSuggestions =
    isLatestAssistant && message.suggestedQuestions
      ? message.suggestedQuestions.filter(
          (q) => !actionLabels.has(q.trim().toLowerCase())
        )
      : [];
  const hasActions = standardActions.length > 0;
  const hasSuggestions = visibleSuggestions.length > 0;

  return (
    <div className="flex flex-col items-start gap-2.5 max-w-[92%]">
      <div className="flex items-start gap-2 w-full">
        <div className="w-7 h-7 rounded-full bg-accent-soft text-accent flex items-center justify-center shrink-0 mt-0.5 border border-accent/15">
          <span className="material-symbols-outlined text-[16px]">smart_toy</span>
        </div>

        <div className="flex-1 min-w-0 rounded-2xl rounded-tl-sm bg-surface-subtle border border-hairline px-3.5 py-2.5 text-ink-primary">
          <MarkdownMessageBody content={message.content} />
        </div>
      </div>

      {/* In-Chat Booking Confirmation Card */}
      {confirmBookingAction && (
        <div className="pl-9 w-full">
          <div
            data-testid="ai-chat-booking-card"
            className="rounded-2xl border border-accent/25 bg-surface-elevated p-3.5 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-7 h-7 rounded-lg bg-accent-soft text-accent flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[17px]">event_available</span>
                </span>
                <span className="text-xs font-bold text-ink-primary truncate">
                  Thông tin lịch hẹn dự kiến
                </span>
              </div>
              {message.bookingResult && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold shrink-0">
                  Đã đặt #{message.bookingResult.appointmentId}
                </span>
              )}
            </div>

            <div className="space-y-1.5 text-xs bg-surface-subtle/80 rounded-xl p-2.5 border border-hairline">
              <div className="flex items-start justify-between gap-2">
                <span className="text-ink-muted shrink-0">Phương tiện:</span>
                <span className="font-semibold text-ink-primary text-right">
                  {confirmBookingAction.payload?.vehicleLabel || 'Xe đã chọn'}
                </span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-ink-muted shrink-0">Dịch vụ / Mô tả:</span>
                <span className="font-semibold text-ink-primary text-right">
                  {confirmBookingAction.payload?.serviceNames?.length
                    ? confirmBookingAction.payload.serviceNames.join(', ')
                    : confirmBookingAction.payload?.notes || 'Kiểm tra theo yêu cầu'}
                </span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-ink-muted shrink-0">Thời gian:</span>
                <span className="font-bold font-mono tabular-nums text-accent text-right">
                  {confirmBookingAction.payload?.preferredTime || '--:--'} —{' '}
                  {formatDisplayDate(confirmBookingAction.payload?.preferredDate)}
                </span>
              </div>
              <div className="flex items-start justify-between gap-2 pt-1 border-t border-hairline">
                <span className="text-ink-muted shrink-0">Chi phí dự kiến:</span>
                {typeof confirmBookingAction.payload?.estimatedTotal === 'number' ? (
                  <span className="font-bold font-mono tabular-nums text-ink-primary text-right">
                    {confirmBookingAction.payload.estimatedTotal.toLocaleString('vi-VN')} ₫ (0% VAT)
                  </span>
                ) : (
                  <span className="font-semibold text-ink-secondary text-right">
                    Báo giá sau kiểm tra thực tế
                  </span>
                )}
              </div>
            </div>

            {bookingError && !message.bookingResult && (
              <div
                role="alert"
                className="rounded-xl bg-status-danger-soft border border-status-danger/20 px-3 py-2 text-xs text-status-danger font-medium"
              >
                {bookingError}
              </div>
            )}

            {message.bookingResult ? (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <span className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  <span>Đã gửi yêu cầu đặt lịch (Chờ xác nhận)</span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onTriggerAction({
                      type: 'NAVIGATE',
                      label: 'Xem lịch hẹn',
                      icon: 'calendar_today',
                      target: '/customer/profile?tab=appointments',
                    })
                  }
                  className="min-h-[36px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Xem lịch hẹn
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={disabled || isBookingSubmitting}
                  onClick={() => onConfirmBooking?.(message.id, confirmBookingAction)}
                  data-testid="ai-chat-confirm-booking-btn"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-60 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {isBookingSubmitting ? (
                    <>
                      <svg
                        className="w-4 h-4 shrink-0 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="9" className="opacity-25" />
                        <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
                      </svg>
                      <span>Đang đặt lịch...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                      <span>Xác nhận đặt lịch ngay</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={disabled || isBookingSubmitting}
                  onClick={() =>
                    onTriggerAction({
                      type: 'OPEN_BOOKING_MODAL',
                      label: 'Chỉnh sửa trên biểu mẫu',
                      icon: 'edit_calendar',
                      target: 'modal:booking',
                      payload: confirmBookingAction.payload,
                    })
                  }
                  data-testid="ai-chat-edit-booking-btn"
                  className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-hairline bg-surface-subtle hover:bg-surface-muted/70 disabled:opacity-50 text-ink-primary text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] text-ink-secondary">edit_calendar</span>
                  <span>Chỉnh sửa trên biểu mẫu</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Unified Smart Action & Quick Reply Chips (>= 44px touch target) */}
      {(hasActions || hasSuggestions) && (
        <div className="pl-9 flex flex-wrap gap-2 w-full">
          {standardActions.map((action, idx) => (
            <button
              key={`${action.type}-${idx}`}
              type="button"
              disabled={disabled}
              onClick={() => onTriggerAction(action)}
              data-testid={`ai-chat-action-${action.type}`}
              className="min-h-[44px] px-3 py-2 rounded-xl border border-accent/25 bg-white hover:bg-accent-soft/60 text-accent-ink text-xs font-semibold inline-flex items-center gap-1.5 text-left transition-colors cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px] text-accent">
                {action.icon || 'arrow_forward'}
              </span>
              <span>{action.label}</span>
            </button>
          ))}

          {visibleSuggestions.map((question, idx) => (
            <button
              key={`sq-${idx}`}
              type="button"
              disabled={disabled}
              onClick={() => onSelectQuestion(question)}
              className="min-h-[44px] px-3 py-2 rounded-xl border border-accent/25 bg-white hover:bg-accent-soft/60 text-accent-ink text-xs font-semibold text-left transition-colors cursor-pointer disabled:opacity-50"
            >
              {question}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
  disabled?: boolean;
}

function renderInlineSpans(spans: MarkdownInlineSpan[]) {
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
    return <React.Fragment key={idx}>{span.value}</React.Fragment>;
  });
}

export default function ChatMessageBubble({
  message,
  isLatestAssistant,
  onSelectQuestion,
  onTriggerAction,
  disabled = false,
}: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';
  const parsedLines = parseSafeMarkdownLines(message.content);

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-accent text-white px-4 py-2.5 shadow-xs">
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      </div>
    );
  }

  const actionLabels = new Set(
    (message.actions || []).map((a) => a.label.trim().toLowerCase())
  );
  const visibleSuggestions =
    isLatestAssistant && message.suggestedQuestions
      ? message.suggestedQuestions.filter(
          (q) => !actionLabels.has(q.trim().toLowerCase())
        )
      : [];
  const hasActions = Boolean(message.actions && message.actions.length > 0);
  const hasSuggestions = visibleSuggestions.length > 0;

  return (
    <div className="flex flex-col items-start gap-2.5 max-w-[92%]">
      <div className="flex items-start gap-2 w-full">
        <div className="w-7 h-7 rounded-full bg-accent-soft text-accent flex items-center justify-center shrink-0 mt-0.5 border border-accent/15">
          <span className="material-symbols-outlined text-[16px]">smart_toy</span>
        </div>

        <div className="flex-1 min-w-0 rounded-2xl rounded-tl-sm bg-surface-subtle border border-hairline px-3.5 py-2.5 text-ink-primary">
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

          {message.isFallback && (
            <p className="mt-2 pt-1.5 border-t border-hairline text-[11px] text-ink-muted flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">offline_bolt</span>
              <span>Phản hồi nhanh từ dữ liệu trực tiếp của xưởng</span>
            </p>
          )}
        </div>
      </div>

      {/* Unified Smart Action & Quick Reply Chips (>= 44px touch target) */}
      {(hasActions || hasSuggestions) && (
        <div className="pl-9 flex flex-wrap gap-2 w-full">
          {message.actions?.map((action, idx) => (
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

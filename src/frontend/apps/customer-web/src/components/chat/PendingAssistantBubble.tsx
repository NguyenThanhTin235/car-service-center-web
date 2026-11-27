'use client';

import React, { useEffect, useState } from 'react';
import { MarkdownMessageBody } from './ChatMessageBubble';

interface PendingAssistantBubbleProps {
  preamble: string;
  stageMessage: string | null;
  streamingReply: string;
}

/**
 * Unified waiting + live streaming assistant bubble.
 * Uses identical container geometry to ChatMessageBubble so transitioning into the
 * finalized response produces zero flicker or layout shift.
 */
export default function PendingAssistantBubble({
  preamble,
  stageMessage,
  streamingReply,
}: PendingAssistantBubbleProps) {
  const statusText = stageMessage || preamble;
  const [visibleChars, setVisibleChars] = useState<number>(statusText.length);

  // Progressive typing reveal for local preamble / wait stage messages (respects reduced motion)
  useEffect(() => {
    if (streamingReply) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setVisibleChars(statusText.length);
      return;
    }

    setVisibleChars((prev) => (stageMessage ? 0 : Math.min(prev, 2)));

    const timer = window.setInterval(() => {
      setVisibleChars((prev) => {
        if (prev >= statusText.length) {
          window.clearInterval(timer);
          return prev;
        }
        return Math.min(statusText.length, prev + 2);
      });
    }, 16);

    return () => window.clearInterval(timer);
  }, [statusText, stageMessage, streamingReply]);

  const typedStatus = statusText.slice(0, visibleChars);
  const isTypingStatus = !streamingReply && visibleChars < statusText.length;

  return (
    <div
      className="flex flex-col items-start gap-2.5 max-w-[92%]"
      data-testid="ai-chat-loading"
      aria-live="polite"
    >
      <div className="flex items-start gap-2 w-full">
        <div className="w-7 h-7 rounded-full bg-accent-soft text-accent flex items-center justify-center shrink-0 mt-0.5 border border-accent/15">
          <span className="material-symbols-outlined text-[16px]">smart_toy</span>
        </div>

        <div className="flex-1 min-w-0 rounded-2xl rounded-tl-sm bg-surface-subtle border border-hairline px-3.5 py-2.5 text-ink-primary transition-opacity duration-150 motion-reduce:transition-none">
          {streamingReply ? (
            <div className="relative" data-testid="ai-chat-streaming-reply">
              <MarkdownMessageBody content={streamingReply} />
              <span
                aria-hidden="true"
                className="inline-block w-1.5 h-3.5 align-middle bg-accent/70 rounded-xs mt-1 animate-pulse motion-reduce:animate-none"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <p className="text-sm leading-relaxed text-ink-primary min-h-[22px]">
                {typedStatus}
                {isTypingStatus && (
                  <span
                    aria-hidden="true"
                    className="inline-block w-1 h-3.5 ml-0.5 align-middle bg-accent/60 animate-pulse motion-reduce:animate-none"
                  />
                )}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-ink-muted">
                <span className="inline-flex gap-1" aria-hidden="true">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/80 animate-bounce motion-reduce:animate-none" />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/80 animate-bounce [animation-delay:120ms] motion-reduce:animate-none" />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/80 animate-bounce [animation-delay:240ms] motion-reduce:animate-none" />
                </span>
                <span>{stageMessage ? 'Đang xử lý...' : 'Đang tra cứu dữ liệu xưởng'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

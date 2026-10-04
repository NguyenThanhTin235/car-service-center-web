'use client';
import React, { useState } from 'react';

type Activity = {
  id: string;
  user: string;
  avatar: string;
  action: string;
  timestamp: string;
  content: string;
  type: 'log' | 'message' | 'system';
};

export default function ChatterSidebar() {
  const [tab, setTab] = useState<'message' | 'note' | 'activities'>('activities');

  const activities: Activity[] = [
    {
      id: '1',
      user: 'Mike',
      avatar: 'M',
      action: 'logged a note',
      timestamp: 'today 13:04',
      content: 'Check-in signed by customer. Authorised to start. T&C v3 acknowledged.',
      type: 'log'
    },
    {
      id: '2',
      user: 'Jil Wang',
      avatar: 'J',
      action: 'completed inspection',
      timestamp: 'today 16:02',
      content: 'Inspection done — 3 findings recorded. Rear bumper + boot lid to body shop.',
      type: 'system'
    },
    {
      id: '3',
      user: 'John',
      avatar: 'J',
      action: 'approved',
      timestamp: '16 Jun 09:10',
      content: 'AIG LOA approved at S$1,660.94. Frozen on the quote.',
      type: 'log'
    }
  ];

  return (
    <div className="flex flex-col w-full h-full bg-surface-container-lowest border-l border-outline-variant shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]">
      {/* Chatter Tabs */}
      <div className="flex items-center gap-1 p-2 border-b border-outline-variant/60">
        <button 
          onClick={() => setTab('message')}
          className={`flex-1 py-1.5 text-label-sm font-bold rounded ${tab === 'message' ? 'bg-surface-container-high text-on-surface' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
        >
          Gửi tin nhắn
        </button>
        <button 
          onClick={() => setTab('note')}
          className={`flex-1 py-1.5 text-label-sm font-bold rounded ${tab === 'note' ? 'bg-surface-container-high text-on-surface' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
        >
          Ghi chú nội bộ
        </button>
        <button 
          onClick={() => setTab('activities')}
          className={`flex-1 py-1.5 text-label-sm font-bold rounded ${tab === 'activities' ? 'bg-surface-container-high text-on-surface' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
        >
          Hoạt động
        </button>
      </div>

      {/* Input Area */}
      {(tab === 'message' || tab === 'note') && (
        <div className="p-3 border-b border-outline-variant/60 bg-surface-container-lowest">
          <textarea 
            className="w-full h-24 p-3 bg-surface-container-lowest border border-outline-variant rounded-md text-body-sm focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container resize-none"
            placeholder={tab === 'message' ? "Gửi tin nhắn cho người theo dõi..." : "Ghi chú nội bộ..."}
          ></textarea>
          <div className="flex justify-end mt-2">
            <button className="px-4 py-1.5 bg-primary text-white rounded text-label-sm font-bold hover:bg-primary/90 transition-colors">
              {tab === 'message' ? 'Gửi' : 'Lưu'}
            </button>
          </div>
        </div>
      )}

      {/* Followers Status */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-outline-variant/40 text-label-sm text-on-surface-variant">
        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">group</span> 4 người theo dõi</span>
        <span className="flex items-center gap-1 text-tertiary"><span className="material-symbols-outlined text-[14px]">notifications</span> 1 nhắc nhở</span>
      </div>

      {/* Activities List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        {activities.map(activity => (
          <div key={activity.id} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-label-md shrink-0 border border-outline-variant/50">
              {activity.avatar}
            </div>
            <div className="flex flex-col">
              <div className="text-label-sm text-on-surface-variant">
                <span className="font-bold text-on-surface">{activity.user}</span> <span className="text-outline">· {activity.timestamp}</span>
              </div>
              <div className="text-body-sm text-on-surface mt-1 bg-surface-container-low p-2 rounded-md border border-outline-variant/30 leading-relaxed relative">
                {activity.content}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  deleteNotification,
  getNotifications,
  GetNotificationsParams,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationItem,
} from '@/lib/api/notification.api';

export interface NotificationState {
  items: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  socketConnected: boolean;
  latestRealtime: NotificationItem | null;
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
  loading: false,
  error: null,
  hasMore: false,
  page: 1,
  socketConnected: false,
  latestRealtime: null,
};

export interface FetchNotificationsArg extends GetNotificationsParams {
  append?: boolean;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message ===
      'string'
  ) {
    return (error as { response: { data: { message: string } } }).response.data.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (params: FetchNotificationsArg = {}, { rejectWithValue }) => {
    try {
      const { append, ...query } = params;
      const result = await getNotifications(query);
      return {
        ...result,
        append: Boolean(append),
        isDelta: Boolean(query.since),
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Không thể tải danh sách thông báo'));
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      return await getUnreadCount();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Không thể tải số thông báo chưa đọc'));
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (id: number, { rejectWithValue }) => {
    try {
      return await markNotificationRead(id);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Không thể đánh dấu đã đọc'));
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      return await markAllNotificationsRead();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Không thể đánh dấu tất cả đã đọc'));
    }
  }
);

export const removeNotification = createAsyncThunk(
  'notifications/removeNotification',
  async (id: number, { rejectWithValue }) => {
    try {
      await deleteNotification(id);
      return id;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Không thể xóa thông báo'));
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    prependRealtimeNotification: (state, action: PayloadAction<NotificationItem>) => {
      const incoming = action.payload;
      const exists = state.items.some((item) => item.id === incoming.id);
      if (!exists) {
        state.items.unshift(incoming);
      } else {
        state.items = state.items.map((item) => (item.id === incoming.id ? incoming : item));
      }
      state.latestRealtime = incoming;
    },
    syncReadFromSocket: (
      state,
      action: PayloadAction<{ id?: number; all?: boolean; readAt?: string | null }>
    ) => {
      const readAt = action.payload.readAt ?? new Date().toISOString();
      if (action.payload.all) {
        state.items = state.items.map((item) =>
          item.isRead ? item : { ...item, isRead: true, readAt }
        );
        state.unreadCount = 0;
      } else if (action.payload.id !== undefined) {
        state.items = state.items.map((item) =>
          item.id === action.payload.id ? { ...item, isRead: true, readAt } : item
        );
      }
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = Math.max(0, action.payload);
    },
    setSocketConnected: (state, action: PayloadAction<boolean>) => {
      state.socketConnected = action.payload;
    },
    clearLatestRealtime: (state) => {
      state.latestRealtime = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        const { items, meta, append, isDelta } = action.payload;

        if (isDelta) {
          const existingIds = new Set(state.items.map((item) => item.id));
          const newItems = items.filter((item) => !existingIds.has(item.id));
          if (newItems.length > 0) {
            state.items = [...newItems, ...state.items];
          }
          return;
        }

        if (append) {
          const existingIds = new Set(state.items.map((item) => item.id));
          const nextItems = items.filter((item) => !existingIds.has(item.id));
          state.items = [...state.items, ...nextItems];
        } else {
          state.items = items;
        }

        state.page = meta.page;
        state.hasMore = meta.page < meta.totalPages;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Không thể tải danh sách thông báo';
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = Math.max(0, action.payload);
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const updated = action.payload;
        const prev = state.items.find((item) => item.id === updated.id);
        if (prev && !prev.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.items = state.items.map((item) => (item.id === updated.id ? updated : item));
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        const now = new Date().toISOString();
        state.items = state.items.map((item) =>
          item.isRead ? item : { ...item, isRead: true, readAt: item.readAt ?? now }
        );
        state.unreadCount = 0;
      })
      .addCase(removeNotification.fulfilled, (state, action) => {
        const removedId = action.payload;
        const target = state.items.find((item) => item.id === removedId);
        if (target && !target.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.items = state.items.filter((item) => item.id !== removedId);
      });
  },
});

export const {
  prependRealtimeNotification,
  syncReadFromSocket,
  setUnreadCount,
  setSocketConnected,
  clearLatestRealtime,
} = notificationSlice.actions;

export default notificationSlice.reducer;

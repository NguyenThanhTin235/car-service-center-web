import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  NotificationItem,
  NotificationMeta,
  GetNotificationsParams,
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '@/lib/api/notification.api';

interface NotificationState {
  items: NotificationItem[];
  unreadCount: number;
  meta: NotificationMeta;
  loading: boolean;
  error: string | null;
  lastSyncedAt: string | null;
  socketConnected: boolean;
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
  meta: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  loading: false,
  error: null,
  lastSyncedAt: null,
  socketConnected: false,
};

function getErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || e?.message || fallback;
}

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchList',
  async (params: GetNotificationsParams | undefined, { rejectWithValue }) => {
    try {
      return await getNotifications(params);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, 'Không thể tải danh sách thông báo'));
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      return await getUnreadCount();
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, 'Không thể tải số thông báo chưa đọc'));
    }
  }
);

export const syncNotificationsSince = createAsyncThunk(
  'notifications/syncSince',
  async (since: string, { rejectWithValue }) => {
    try {
      return await getNotifications({ since, limit: 50 });
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, 'Không thể đồng bộ thông báo mới'));
    }
  }
);

export const markAsReadThunk = createAsyncThunk(
  'notifications/markAsRead',
  async (id: number, { rejectWithValue }) => {
    try {
      return await markNotificationRead(id);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, 'Không thể đánh dấu đã đọc'));
    }
  }
);

export const markAllAsReadThunk = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      return await markAllNotificationsRead();
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, 'Không thể đánh dấu tất cả đã đọc'));
    }
  }
);

export const deleteNotificationThunk = createAsyncThunk(
  'notifications/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await deleteNotification(id);
      return id;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, 'Không thể xóa thông báo'));
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    receiveNewNotification: (state, action: PayloadAction<NotificationItem>) => {
      const incoming = action.payload;
      const exists = state.items.some((item) => item.id === incoming.id);
      if (!exists) {
        state.items = [incoming, ...state.items];
        state.meta.total += 1;
      }
      state.lastSyncedAt = incoming.createdAt || new Date().toISOString();
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = Math.max(0, action.payload);
    },
    applyNotificationRead: (
      state,
      action: PayloadAction<{ id?: number; all?: boolean; readAt?: string }>
    ) => {
      const readAt = action.payload.readAt ?? new Date().toISOString();
      if (action.payload.all) {
        state.items = state.items.map((item) =>
          item.isRead ? item : { ...item, isRead: true, readAt }
        );
        state.unreadCount = 0;
        return;
      }
      if (action.payload.id !== undefined) {
        state.items = state.items.map((item) =>
          item.id === action.payload.id ? { ...item, isRead: true, readAt } : item
        );
      }
    },
    setSocketConnected: (state, action: PayloadAction<boolean>) => {
      state.socketConnected = action.payload;
    },
    resetNotifications: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.meta = action.payload.meta;
        state.lastSyncedAt = new Date().toISOString();
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Không thể tải danh sách thông báo';
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(syncNotificationsSince.fulfilled, (state, action) => {
        const incoming = action.payload.items;
        if (incoming.length > 0) {
          const existingIds = new Set(state.items.map((item) => item.id));
          const uniqueNew = incoming.filter((item) => !existingIds.has(item.id));
          if (uniqueNew.length > 0) {
            state.items = [...uniqueNew, ...state.items];
            state.meta.total += uniqueNew.length;
          }
        }
        state.lastSyncedAt = new Date().toISOString();
      })
      .addCase(markAsReadThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        let decremented = false;
        state.items = state.items.map((item) => {
          if (item.id === updated.id) {
            if (!item.isRead && updated.isRead) {
              decremented = true;
            }
            return updated;
          }
          return item;
        });
        if (decremented) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllAsReadThunk.fulfilled, (state) => {
        const now = new Date().toISOString();
        state.items = state.items.map((item) =>
          item.isRead ? item : { ...item, isRead: true, readAt: now }
        );
        state.unreadCount = 0;
      })
      .addCase(deleteNotificationThunk.fulfilled, (state, action) => {
        const removedId = action.payload;
        const target = state.items.find((item) => item.id === removedId);
        if (target && !target.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.items = state.items.filter((item) => item.id !== removedId);
        state.meta.total = Math.max(0, state.meta.total - 1);
      });
  },
});

export const {
  receiveNewNotification,
  setUnreadCount,
  applyNotificationRead,
  setSocketConnected,
  resetNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer;

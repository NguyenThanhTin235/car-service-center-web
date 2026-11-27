import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { registerAuthHandlers } from '@/lib/axios';
import authReducer, { logout, setCredentials } from './slices/authSlice';
import appointmentReducer from './slices/appointmentSlice';
import intakeReducer from './slices/intakeSlice';
import inventoryReducer from './slices/inventorySlice';
import billingReducer from './slices/billingSlice';
import notificationReducer from './slices/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    appointments: appointmentReducer,
    intake: intakeReducer,
    inventory: inventoryReducer,
    billing: billingReducer,
    notifications: notificationReducer,
  },
});

registerAuthHandlers({
  onCredentialsRefreshed: (creds) => store.dispatch(setCredentials(creds)),
  onForceLogout: () => store.dispatch(logout()),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

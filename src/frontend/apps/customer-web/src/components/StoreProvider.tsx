"use client";

import { Provider } from 'react-redux';
import { store } from '../store';
import SessionWatcher from './shared/SessionWatcher';

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <SessionWatcher />
      {children}
    </Provider>
  );
}

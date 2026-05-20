import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type AppScreen = 'dashboard' | 'spreadsheet';

export interface NotificationState {
  message: string;
  kind: 'success' | 'error' | 'info';
}

interface UiState {
  screen: AppScreen;
  isCreateDocumentModalOpen: boolean;
  notification: NotificationState | null;
}

const initialState: UiState = {
  screen: 'dashboard',
  isCreateDocumentModalOpen: false,
  notification: null,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openDashboard(state) {
      state.screen = 'dashboard';
    },
    openSpreadsheet(state) {
      state.screen = 'spreadsheet';
    },
    openCreateDocumentModal(state) {
      state.isCreateDocumentModalOpen = true;
    },
    closeCreateDocumentModal(state) {
      state.isCreateDocumentModalOpen = false;
    },
    showNotification(state, action: PayloadAction<NotificationState>) {
      state.notification = action.payload;
    },
    clearNotification(state) {
      state.notification = null;
    },
  },
});

export const {
  clearNotification,
  closeCreateDocumentModal,
  openCreateDocumentModal,
  openDashboard,
  openSpreadsheet,
  showNotification,
} = uiSlice.actions;
export const uiReducer = uiSlice.reducer;

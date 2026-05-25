import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type AppScreen = 'dashboard' | 'spreadsheet';

export interface NotificationState {
  message: string;
  kind: 'success' | 'error' | 'info';
}

interface UiState {
  screen: AppScreen;
  isCreateDocumentModalOpen: boolean;
  isDoomModeOpen: boolean;
  notification: NotificationState | null;
}

const initialState: UiState = {
  screen: 'dashboard',
  isCreateDocumentModalOpen: false,
  isDoomModeOpen: false,
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
    openDoomMode(state) {
      state.isDoomModeOpen = true;
    },
    closeDoomMode(state) {
      state.isDoomModeOpen = false;
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
  closeDoomMode,
  openCreateDocumentModal,
  openDoomMode,
  openDashboard,
  openSpreadsheet,
  showNotification,
} = uiSlice.actions;
export const uiReducer = uiSlice.reducer;

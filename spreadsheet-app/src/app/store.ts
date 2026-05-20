import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { authReducer } from '@/features/auth/authSlice';
import { documentsReducer, saveActiveDocument, setSaveStatus } from '@/features/documents/documentsSlice';
import {
  applyCellStyle,
  clearCell,
  clearSelection,
  deleteCol,
  deleteRow,
  insertCol,
  insertRow,
  pasteClipboard,
  redo,
  resizeCol,
  resizeRow,
  toggleCellStyle,
  undo,
  updateCell,
} from '@/features/spreadsheet/spreadsheetSlice';
import { spreadsheetReducer } from '@/features/spreadsheet/spreadsheetSlice';
import { uiReducer } from '@/features/ui/uiSlice';

const autoSaveListener = createListenerMiddleware();

export const store = configureStore({
  reducer: {
    auth: authReducer,
    documents: documentsReducer,
    spreadsheet: spreadsheetReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
    }).prepend(autoSaveListener.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

autoSaveListener.startListening({
  matcher: isAnyOf(
    updateCell,
    applyCellStyle,
    toggleCellStyle,
    clearCell,
    clearSelection,
    pasteClipboard,
    insertRow,
    deleteRow,
    insertCol,
    deleteCol,
    resizeCol,
    resizeRow,
    undo,
    redo,
  ),
  effect: async (_, listenerApi) => {
    listenerApi.cancelActiveListeners();
    const state = listenerApi.getState() as RootState;

    if (!state.documents.activeDocument) {
      return;
    }

    const dispatch = listenerApi.dispatch as AppDispatch;
    dispatch(setSaveStatus('saving'));
    await listenerApi.delay(500);
    await dispatch(saveActiveDocument());
  },
});

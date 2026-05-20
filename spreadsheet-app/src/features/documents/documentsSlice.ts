import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  ApiErrorPayload,
  AsyncStatus,
  DocumentSummary,
  SaveStatus,
  SpreadsheetDocument,
  SpreadsheetSnapshot,
} from '@/types';
import { documentService, ApiError } from '@/services/documentService';
import type { RootState } from '@/app/store';

interface DocumentsState {
  items: DocumentSummary[];
  activeDocument: SpreadsheetDocument | null;
  listStatus: AsyncStatus;
  activeStatus: AsyncStatus;
  saveStatus: SaveStatus;
  error: string | null;
  lastSavedAt: string | null;
}

export interface CreateDocumentPayload {
  title: string;
  rowCount: number;
  colCount: number;
}

export interface RenameDocumentPayload {
  id: string;
  title: string;
}

function toErrorPayload(error: unknown): ApiErrorPayload {
  if (error instanceof ApiError) {
    return { status: error.status, message: error.message };
  }

  if (error instanceof Error) {
    return { status: 500, message: error.message };
  }

  return { status: 500, message: 'Неизвестная ошибка' };
}

const initialState: DocumentsState = {
  items: [],
  activeDocument: null,
  listStatus: 'idle',
  activeStatus: 'idle',
  saveStatus: 'saved',
  error: null,
  lastSavedAt: null,
};

export const fetchDocuments = createAsyncThunk<
  DocumentSummary[],
  void,
  { state: RootState; rejectValue: ApiErrorPayload }
>('documents/fetchDocuments', async (_, { getState, rejectWithValue }) => {
  try {
    return await documentService.listDocuments(getState().auth.user.id);
  } catch (error) {
    return rejectWithValue(toErrorPayload(error));
  }
});

export const createDocument = createAsyncThunk<
  SpreadsheetDocument,
  CreateDocumentPayload,
  { state: RootState; rejectValue: ApiErrorPayload }
>('documents/createDocument', async (payload, { getState, rejectWithValue }) => {
  try {
    return await documentService.createDocument({
      ownerId: getState().auth.user.id,
      title: payload.title,
      rowCount: payload.rowCount,
      colCount: payload.colCount,
    });
  } catch (error) {
    return rejectWithValue(toErrorPayload(error));
  }
});

export const loadDocument = createAsyncThunk<
  SpreadsheetDocument,
  string,
  { state: RootState; rejectValue: ApiErrorPayload }
>('documents/loadDocument', async (documentId, { getState, rejectWithValue }) => {
  try {
    return await documentService.getDocument(getState().auth.user.id, documentId);
  } catch (error) {
    return rejectWithValue(toErrorPayload(error));
  }
});

export const renameDocument = createAsyncThunk<
  SpreadsheetDocument,
  RenameDocumentPayload,
  { state: RootState; rejectValue: ApiErrorPayload }
>('documents/renameDocument', async (payload, { getState, rejectWithValue }) => {
  try {
    return await documentService.updateDocument(getState().auth.user.id, payload.id, {
      title: payload.title,
    });
  } catch (error) {
    return rejectWithValue(toErrorPayload(error));
  }
});

export const deleteDocument = createAsyncThunk<
  string,
  string,
  { state: RootState; rejectValue: ApiErrorPayload }
>('documents/deleteDocument', async (documentId, { getState, rejectWithValue }) => {
  try {
    return await documentService.deleteDocument(getState().auth.user.id, documentId);
  } catch (error) {
    return rejectWithValue(toErrorPayload(error));
  }
});

export const duplicateDocument = createAsyncThunk<
  SpreadsheetDocument,
  string,
  { state: RootState; rejectValue: ApiErrorPayload }
>('documents/duplicateDocument', async (documentId, { getState, rejectWithValue }) => {
  try {
    return await documentService.duplicateDocument(getState().auth.user.id, documentId);
  } catch (error) {
    return rejectWithValue(toErrorPayload(error));
  }
});

export const saveActiveDocument = createAsyncThunk<
  SpreadsheetDocument,
  void,
  { state: RootState; rejectValue: ApiErrorPayload }
>('documents/saveActiveDocument', async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const activeDocument = state.documents.activeDocument;

    if (!activeDocument) {
      return rejectWithValue({ status: 400, message: 'Активный документ не выбран' });
    }

    return await documentService.updateDocument(state.auth.user.id, activeDocument.id, {
      spreadsheet: {
        rowCount: state.spreadsheet.rowCount,
        colCount: state.spreadsheet.colCount,
        cells: state.spreadsheet.cells,
        colWidths: state.spreadsheet.colWidths,
        rowHeights: state.spreadsheet.rowHeights,
      },
    });
  } catch (error) {
    return rejectWithValue(toErrorPayload(error));
  }
});

export const replaceActiveSpreadsheet = createAsyncThunk<
  SpreadsheetDocument,
  SpreadsheetSnapshot,
  { state: RootState; rejectValue: ApiErrorPayload }
>('documents/replaceActiveSpreadsheet', async (spreadsheet, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const activeDocument = state.documents.activeDocument;

    if (!activeDocument) {
      return rejectWithValue({ status: 400, message: 'Активный документ не выбран' });
    }

    return await documentService.updateDocument(state.auth.user.id, activeDocument.id, { spreadsheet });
  } catch (error) {
    return rejectWithValue(toErrorPayload(error));
  }
});

function documentToSummary(document: SpreadsheetDocument): DocumentSummary {
  return {
    id: document.id,
    ownerId: document.ownerId,
    title: document.title,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    preview: {
      cells: [
        [
          document.spreadsheet.cells.A1?.computedValue ?? '',
          document.spreadsheet.cells.B1?.computedValue ?? '',
          document.spreadsheet.cells.C1?.computedValue ?? '',
        ],
        [
          document.spreadsheet.cells.A2?.computedValue ?? '',
          document.spreadsheet.cells.B2?.computedValue ?? '',
          document.spreadsheet.cells.C2?.computedValue ?? '',
        ],
        [
          document.spreadsheet.cells.A3?.computedValue ?? '',
          document.spreadsheet.cells.B3?.computedValue ?? '',
          document.spreadsheet.cells.C3?.computedValue ?? '',
        ],
      ],
    },
    rowCount: document.spreadsheet.rowCount,
    colCount: document.spreadsheet.colCount,
  };
}

function upsertSummary(state: DocumentsState, document: SpreadsheetDocument): void {
  const summary = documentToSummary(document);
  const index = state.items.findIndex((item) => item.id === document.id);

  if (index >= 0) {
    state.items[index] = summary;
  } else {
    state.items.unshift(summary);
  }

  state.items.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function setRejected(state: DocumentsState, payload: ApiErrorPayload | undefined): void {
  state.error = payload?.message ?? 'Ошибка запроса';
}

export const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    clearActiveDocument(state) {
      state.activeDocument = null;
      state.activeStatus = 'idle';
      state.saveStatus = 'saved';
      state.error = null;
    },
    setSaveStatus(state, action: PayloadAction<SaveStatus>) {
      state.saveStatus = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocuments.pending, (state) => {
        state.listStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.listStatus = 'failed';
        setRejected(state, action.payload);
      })
      .addCase(createDocument.pending, (state) => {
        state.activeStatus = 'loading';
        state.error = null;
      })
      .addCase(createDocument.fulfilled, (state, action) => {
        state.activeStatus = 'succeeded';
        state.activeDocument = action.payload;
        state.saveStatus = 'saved';
        upsertSummary(state, action.payload);
      })
      .addCase(createDocument.rejected, (state, action) => {
        state.activeStatus = 'failed';
        setRejected(state, action.payload);
      })
      .addCase(loadDocument.pending, (state) => {
        state.activeStatus = 'loading';
        state.error = null;
      })
      .addCase(loadDocument.fulfilled, (state, action) => {
        state.activeStatus = 'succeeded';
        state.activeDocument = action.payload;
        state.saveStatus = 'saved';
        upsertSummary(state, action.payload);
      })
      .addCase(loadDocument.rejected, (state, action) => {
        state.activeStatus = 'failed';
        setRejected(state, action.payload);
      })
      .addCase(renameDocument.fulfilled, (state, action) => {
        upsertSummary(state, action.payload);

        if (state.activeDocument?.id === action.payload.id) {
          state.activeDocument = action.payload;
        }
      })
      .addCase(renameDocument.rejected, (state, action) => {
        setRejected(state, action.payload);
      })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);

        if (state.activeDocument?.id === action.payload) {
          state.activeDocument = null;
        }
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        setRejected(state, action.payload);
      })
      .addCase(duplicateDocument.fulfilled, (state, action) => {
        upsertSummary(state, action.payload);
      })
      .addCase(duplicateDocument.rejected, (state, action) => {
        setRejected(state, action.payload);
      })
      .addCase(saveActiveDocument.pending, (state) => {
        state.saveStatus = 'saving';
      })
      .addCase(saveActiveDocument.fulfilled, (state, action) => {
        state.saveStatus = 'saved';
        state.activeDocument = action.payload;
        state.lastSavedAt = action.payload.updatedAt;
        upsertSummary(state, action.payload);
      })
      .addCase(saveActiveDocument.rejected, (state, action) => {
        state.saveStatus = 'error';
        setRejected(state, action.payload);
      })
      .addCase(replaceActiveSpreadsheet.pending, (state) => {
        state.saveStatus = 'saving';
      })
      .addCase(replaceActiveSpreadsheet.fulfilled, (state, action) => {
        state.saveStatus = 'saved';
        state.activeDocument = action.payload;
        state.lastSavedAt = action.payload.updatedAt;
        upsertSummary(state, action.payload);
      })
      .addCase(replaceActiveSpreadsheet.rejected, (state, action) => {
        state.saveStatus = 'error';
        setRejected(state, action.payload);
      });
  },
});

export const { clearActiveDocument, setSaveStatus } = documentsSlice.actions;
export const documentsReducer = documentsSlice.reducer;

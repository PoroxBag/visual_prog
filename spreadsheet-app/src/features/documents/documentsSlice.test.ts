import { describe, expect, it } from 'vitest';
import {
  createDocument,
  documentsReducer,
  fetchDocuments,
  saveActiveDocument,
} from '@/features/documents/documentsSlice';
import type { DocumentSummary, SpreadsheetDocument } from '@/types';
import { createSpreadsheetSnapshot } from '@/utils/spreadsheet';

const document: SpreadsheetDocument = {
  id: 'doc-1',
  ownerId: 'user-1',
  title: 'Таблица',
  createdAt: '2026-05-20T10:00:00.000Z',
  updatedAt: '2026-05-20T10:00:00.000Z',
  spreadsheet: createSpreadsheetSnapshot(10, 5),
};

const summary: DocumentSummary = {
  id: document.id,
  ownerId: document.ownerId,
  title: document.title,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt,
  preview: {
    cells: [
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
    ],
  },
  rowCount: 10,
  colCount: 5,
};

describe('documentsSlice', () => {
  it('stores fetched document summaries', () => {
    let state = documentsReducer(undefined, fetchDocuments.pending('', undefined));
    state = documentsReducer(state, fetchDocuments.fulfilled([summary], '', undefined));

    expect(state.items).toHaveLength(1);
    expect(state.items[0].title).toBe('Таблица');
    expect(state.listStatus).toBe('succeeded');
  });

  it('sets active document after creation and updates save status', () => {
    let state = documentsReducer(
      undefined,
      createDocument.fulfilled(document, '', { title: 'Таблица', rowCount: 10, colCount: 5 }),
    );
    state = documentsReducer(state, saveActiveDocument.pending('', undefined));
    state = documentsReducer(state, saveActiveDocument.fulfilled(document, '', undefined));

    expect(state.activeDocument?.id).toBe('doc-1');
    expect(state.saveStatus).toBe('saved');
  });
});

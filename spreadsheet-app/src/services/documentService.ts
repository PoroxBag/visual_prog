import type { DocumentSummary, SpreadsheetDocument, SpreadsheetSnapshot } from '@/types';
import { createSpreadsheetSnapshot, spreadsheetPreview } from '@/utils/spreadsheet';
import { setCellValue } from '@/utils/spreadsheet';

interface StoredDatabase {
  documents: SpreadsheetDocument[];
}

export interface CreateDocumentRequest {
  ownerId: string;
  title: string;
  rowCount: number;
  colCount: number;
}

export interface UpdateDocumentRequest {
  title?: string;
  spreadsheet?: SpreadsheetSnapshot;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const STORAGE_KEY = 'spreadsheet-documents-v2';
const MOCK_DELAY = 150;

function wait(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, MOCK_DELAY);
  });
}

function now(): string {
  return new Date().toISOString();
}

function createId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function toSummary(document: SpreadsheetDocument): DocumentSummary {
  return {
    id: document.id,
    ownerId: document.ownerId,
    title: document.title,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    preview: { cells: spreadsheetPreview(document.spreadsheet) },
    rowCount: document.spreadsheet.rowCount,
    colCount: document.spreadsheet.colCount,
  };
}

function createSeedDocument(ownerId: string): SpreadsheetDocument {
  let spreadsheet = createSpreadsheetSnapshot(1000, 26);
  spreadsheet = {
    ...spreadsheet,
    cells: setCellValue(spreadsheet.cells, 'A1', '10'),
  };
  spreadsheet = {
    ...spreadsheet,
    cells: setCellValue(spreadsheet.cells, 'A2', '20'),
  };
  spreadsheet = {
    ...spreadsheet,
    cells: setCellValue(spreadsheet.cells, 'B1', '=SUM(A1:A2)'),
  };

  const createdAt = now();

  return {
    id: 'doc_demo_personal',
    ownerId,
    title: 'Моя первая таблица',
    createdAt,
    updatedAt: createdAt,
    spreadsheet,
  };
}

function createForeignSeedDocument(): SpreadsheetDocument {
  const createdAt = now();

  return {
    id: 'doc_foreign_hidden',
    ownerId: 'other-user',
    title: 'Чужой документ',
    createdAt,
    updatedAt: createdAt,
    spreadsheet: createSpreadsheetSnapshot(100, 26),
  };
}

function readDatabase(ownerId: string): StoredDatabase {
  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    const database = { documents: [createSeedDocument(ownerId), createForeignSeedDocument()] };
    writeDatabase(database);
    return database;
  }

  try {
    const parsed = JSON.parse(raw) as StoredDatabase;

    if (!Array.isArray(parsed.documents)) {
      throw new Error('Invalid storage');
    }

    return parsed;
  } catch {
    const database = { documents: [createSeedDocument(ownerId), createForeignSeedDocument()] };
    writeDatabase(database);
    return database;
  }
}

function writeDatabase(database: StoredDatabase): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
}

function findDocument(database: StoredDatabase, ownerId: string, documentId: string): SpreadsheetDocument {
  const document = database.documents.find((item) => item.id === documentId);

  if (!document) {
    throw new ApiError(404, 'Документ не найден');
  }

  if (document.ownerId !== ownerId) {
    throw new ApiError(403, 'Нет доступа к документу');
  }

  return document;
}

export const documentService = {
  async listDocuments(ownerId: string): Promise<DocumentSummary[]> {
    await wait();
    const database = readDatabase(ownerId);
    return database.documents
      .filter((document) => document.ownerId === ownerId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map(toSummary);
  },

  async createDocument(request: CreateDocumentRequest): Promise<SpreadsheetDocument> {
    await wait();
    const database = readDatabase(request.ownerId);
    const createdAt = now();
    const document: SpreadsheetDocument = {
      id: createId(),
      ownerId: request.ownerId,
      title: request.title.trim() || 'Новая таблица',
      createdAt,
      updatedAt: createdAt,
      spreadsheet: createSpreadsheetSnapshot(request.rowCount, request.colCount),
    };

    database.documents.push(document);
    writeDatabase(database);
    return document;
  },

  async getDocument(ownerId: string, documentId: string): Promise<SpreadsheetDocument> {
    await wait();
    const database = readDatabase(ownerId);
    return findDocument(database, ownerId, documentId);
  },

  async updateDocument(
    ownerId: string,
    documentId: string,
    request: UpdateDocumentRequest,
  ): Promise<SpreadsheetDocument> {
    await wait();
    const database = readDatabase(ownerId);
    const document = findDocument(database, ownerId, documentId);
    const updatedDocument: SpreadsheetDocument = {
      ...document,
      title: request.title ?? document.title,
      spreadsheet: request.spreadsheet ?? document.spreadsheet,
      updatedAt: now(),
    };

    database.documents = database.documents.map((item) => (item.id === documentId ? updatedDocument : item));
    writeDatabase(database);
    return updatedDocument;
  },

  async deleteDocument(ownerId: string, documentId: string): Promise<string> {
    await wait();
    const database = readDatabase(ownerId);
    findDocument(database, ownerId, documentId);
    database.documents = database.documents.filter((document) => document.id !== documentId);
    writeDatabase(database);
    return documentId;
  },

  async duplicateDocument(ownerId: string, documentId: string): Promise<SpreadsheetDocument> {
    await wait();
    const database = readDatabase(ownerId);
    const source = findDocument(database, ownerId, documentId);
    const createdAt = now();
    const duplicate: SpreadsheetDocument = {
      ...source,
      id: createId(),
      title: `${source.title} — копия`,
      createdAt,
      updatedAt: createdAt,
      spreadsheet: {
        ...source.spreadsheet,
        cells: Object.fromEntries(
          Object.entries(source.spreadsheet.cells).map(([id, cell]) => [id, { ...cell }]),
        ),
        colWidths: { ...source.spreadsheet.colWidths },
        rowHeights: { ...source.spreadsheet.rowHeights },
      },
    };

    database.documents.push(duplicate);
    writeDatabase(database);
    return duplicate;
  },
};

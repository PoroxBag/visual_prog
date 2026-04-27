// npm install
// npm run dev
// npm run test:run
// npm run build
// z

import { useEffect, useState } from "react";
import BookCard from "./components/BookCard";
import type { ApiBook } from "./types";
import { fetchCoverBlob } from "./lib/books";

type ViewBook = ApiBook & { imageBlob: Blob | null };

export default function App() {
  const [books, setBooks] = useState<ViewBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("https://fakeapi.extendsclass.com/books");
        const data: ApiBook[] = await res.json();

        const list = await Promise.all(
          data.map(async (book) => ({
            ...book,
            imageBlob: await fetchCoverBlob(book.isbn, book.title),
          }))
        );

        setBooks(list);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="app">
      {loading ? (
        <div className="app__loading">Загрузка...</div>
      ) : (
        <div className="books">
          {books.map((book) => (
            <BookCard
              key={book.id}
              title={book.title}
              authors={book.authors}
              imageBlob={book.imageBlob}
            />
          ))}
        </div>
      )}
    </main>
  );
}
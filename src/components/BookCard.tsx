import { useEffect, useState } from "react";

type Props = {
  title: string;
  authors: string[];
  imageBlob: Blob | null;
};

export default function BookCard({ title, authors, imageBlob }: Props) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (!imageBlob) {
      setSrc("");
      return;
    }

    const url = URL.createObjectURL(imageBlob);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [imageBlob]);

  return (
    <article className="book-card">
      {src ? (
        <img className="book-card__img" src={src} alt={title} />
      ) : (
        <div className="book-card__img book-card__img--empty">Нет обложки</div>
      )}

      <h3 className="book-card__title">{title}</h3>
      <p className="book-card__authors">{authors.join(", ")}</p>
    </article>
  );
}
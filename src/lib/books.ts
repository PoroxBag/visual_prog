type GoogleBooksResponse = {
  items?: {
    volumeInfo?: {
      imageLinks?: {
        thumbnail?: string;
        smallThumbnail?: string;
      };
    };
  }[];
};

export function getCoverUrl(data: GoogleBooksResponse) {
  const url =
    data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail ??
    data.items?.[0]?.volumeInfo?.imageLinks?.smallThumbnail ??
    null;

  return url ? url.replace(/^http:\/\//, "https://") : null;
}

export async function fetchCoverBlob(isbn: string, title: string) {
  const res = await fetch(
    `/api/cover?isbn=${encodeURIComponent(isbn)}&title=${encodeURIComponent(title)}`
  );

  return res.ok ? await res.blob() : null;
}
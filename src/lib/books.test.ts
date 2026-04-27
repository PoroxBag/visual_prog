import { describe, expect, it } from "vitest";
import { getCoverUrl } from "./books";
import "@testing-library/jest-dom/vitest";

describe("getCoverUrl", () => {
  it("takes thumbnail and converts http to https", () => {
    const url = getCoverUrl({
      items: [{ volumeInfo: { imageLinks: { thumbnail: "http://a.com/x.jpg" } } }],
    });

    expect(url).toBe("https://a.com/x.jpg");
  });

  it("falls back to smallThumbnail", () => {
    const url = getCoverUrl({
      items: [
        { volumeInfo: { imageLinks: { smallThumbnail: "https://a.com/y.jpg" } } },
      ],
    });

    expect(url).toBe("https://a.com/y.jpg");
  });
});
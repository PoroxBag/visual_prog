import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BookCard from "./BookCard";
import "@testing-library/jest-dom/vitest";

describe("BookCard", () => {
  it("renders title and authors", () => {
    render(
      <BookCard
        title="Test book"
        authors={["Author 1", "Author 2"]}
        imageBlob={null}
      />
    );

    expect(screen.getByText("Test book")).toBeTruthy();
    expect(screen.getByText("Author 1, Author 2")).toBeTruthy();
  });

  it("renders image when blob exists", async () => {
    render(
      <BookCard
        title="Test book"
        authors={["Author"]}
        imageBlob={new Blob(["x"], { type: "image/png" })}
      />
    );

    expect(await screen.findByAltText("Test book")).toBeTruthy();
  });
});
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { FlashcardsPageClient } from "./FlashcardsPageClient";

// Mock fetch API
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.location
Object.defineProperty(window, "location", {
  value: {
    origin: "http://localhost:3000",
  },
  writable: true,
});

describe("FlashcardsPageClient", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        flashcards: [],
        pagination: { page: 1, limit: 10, total: 0 },
      }),
    });
  });

  it("powinien renderować loading state na początku", () => {
    render(<FlashcardsPageClient />);
    expect(screen.getByText("Ładowanie fiszek...")).toBeInTheDocument();
  });
}); 
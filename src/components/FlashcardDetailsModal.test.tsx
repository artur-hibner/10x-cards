import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { FlashcardDetailsModal } from "./FlashcardDetailsModal";

// Mock fetch API
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("FlashcardDetailsModal", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("powinien nie renderować nic gdy modal jest zamknięty", () => {
    render(<FlashcardDetailsModal isOpen={false} onClose={mockOnClose} flashcardId={1} />);

    expect(screen.queryByText("Szczegóły fiszki ID: 1")).not.toBeInTheDocument();
  });

  it("powinien wyświetlać loading state podczas pobierania danych", () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<FlashcardDetailsModal isOpen={true} onClose={mockOnClose} flashcardId={1} />);

    expect(screen.getByText("Szczegóły fiszki ID: 1")).toBeInTheDocument();
    expect(screen.getByText("Pobieranie szczegółów...")).toBeInTheDocument();
  });

  it("powinien resetować stan gdy modal się zamyka", () => {
    const { rerender } = render(<FlashcardDetailsModal isOpen={true} onClose={mockOnClose} flashcardId={1} />);

    rerender(<FlashcardDetailsModal isOpen={false} onClose={mockOnClose} flashcardId={1} />);

    // Po zamknięciu modala, nie powinno być loading state
    expect(screen.queryByText("Pobieranie szczegółów...")).not.toBeInTheDocument();
  });
}); 
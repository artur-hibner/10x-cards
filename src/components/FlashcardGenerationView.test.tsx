import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FlashcardGenerationView from "./FlashcardGenerationView";
import type { CreateGenerationResponseDTO } from "../types";

// Mockowanie fetch API
global.fetch = vi.fn();

// Tworzymy typ dla mocka fetch
interface MockFetchResponse {
  mockResolvedValue: (value: Partial<Response>) => void;
}

const mockGenerationResponse: Partial<CreateGenerationResponseDTO> = {
  generation_id: 123,
  flashcards_proposals: [
    { id: "test1", front: "Pytanie 1", back: "Odpowiedź 1" },
    { id: "test2", front: "Pytanie 2", back: "Odpowiedź 2" },
  ],
};

describe("FlashcardGenerationView", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Mockowanie odpowiedzi z API
    (global.fetch as unknown as MockFetchResponse).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockGenerationResponse),
    });
  });

  it("powinien renderować się poprawnie", () => {
    render(<FlashcardGenerationView />);
    expect(screen.getByText("Generuj fiszki")).toBeInTheDocument();
  });

  it("powinien walidować minimalną długość tekstu", async () => {
    render(<FlashcardGenerationView />);

    const textArea = screen.getByRole("textbox");
    await userEvent.type(textArea, "Za krótki tekst");
    fireEvent.blur(textArea);

    expect(screen.getByText("Tekst musi zawierać przynajmniej 1000 znaków")).toBeInTheDocument();
  });

  it("powinien walidować maksymalną długość tekstu", async () => {
    render(<FlashcardGenerationView />);

    const textArea = screen.getByRole("textbox");
    const longText = "a".repeat(10001);
    fireEvent.change(textArea, { target: { value: longText } });
    fireEvent.blur(textArea);

    expect(screen.getByText("Tekst nie może przekraczać 10000 znaków")).toBeInTheDocument();
  });

  it("powinien wywoływać API podczas generowania fiszek", async () => {
    render(<FlashcardGenerationView />);

    // Wprowadź wystarczająco długi tekst
    const textArea = screen.getByRole("textbox");
    const validText = "a".repeat(1000);
    fireEvent.change(textArea, { target: { value: validText } });

    // Kliknij przycisk generowania
    const generateButton = screen.getByText("Generuj fiszki");
    await userEvent.click(generateButton);

    // Sprawdź, czy fetch został wywołany z odpowiednimi parametrami
    expect(global.fetch).toHaveBeenCalledWith("/api/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ source_text: validText }),
    });
  });

  it("powinien wyświetlać propozycje fiszek po udanym generowaniu", async () => {
    render(<FlashcardGenerationView />);

    // Wprowadź wystarczająco długi tekst
    const textArea = screen.getByRole("textbox");
    const validText = "a".repeat(1000);
    fireEvent.change(textArea, { target: { value: validText } });

    // Kliknij przycisk generowania
    const generateButton = screen.getByText("Generuj fiszki");
    await userEvent.click(generateButton);

    // Sprawdź, czy propozycje fiszek zostały wyświetlone
    await waitFor(() => {
      expect(screen.getByText("Pytanie 1")).toBeInTheDocument();
      expect(screen.getByText("Odpowiedź 1")).toBeInTheDocument();
      expect(screen.getByText("Pytanie 2")).toBeInTheDocument();
      expect(screen.getByText("Odpowiedź 2")).toBeInTheDocument();
    });
  });

  it("powinien obsługiwać błąd API", async () => {
    // Mockowanie błędu z API
    (global.fetch as unknown as MockFetchResponse).mockResolvedValue({
      ok: false,
      status: 500,
    });

    render(<FlashcardGenerationView />);

    // Wprowadź wystarczająco długi tekst
    const textArea = screen.getByRole("textbox");
    const validText = "a".repeat(1000);
    fireEvent.change(textArea, { target: { value: validText } });

    // Kliknij przycisk generowania
    const generateButton = screen.getByText("Generuj fiszki");
    await userEvent.click(generateButton);

    // Sprawdź, czy wyświetlono błąd
    await waitFor(() => {
      expect(screen.getByText("Wystąpił błąd podczas generowania fiszek. Spróbuj ponownie.")).toBeInTheDocument();
    });
  });

  it("powinien zapisywać wszystkie fiszki", async () => {
    render(<FlashcardGenerationView />);

    // Wprowadź wystarczająco długi tekst i wygeneruj fiszki
    const textArea = screen.getByRole("textbox");
    const validText = "a".repeat(1000);
    fireEvent.change(textArea, { target: { value: validText } });

    const generateButton = screen.getByText("Generuj fiszki");
    await userEvent.click(generateButton);

    // Poczekaj na wyświetlenie fiszek
    await waitFor(() => {
      expect(screen.getByText("Pytanie 1")).toBeInTheDocument();
    });

    // Mockujemy kolejne wywołanie API do zapisywania fiszek
    (global.fetch as unknown as MockFetchResponse).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ flashcards: [1, 2] }),
    });

    // Kliknij przycisk zapisu wszystkich fiszek
    const saveAllButton = screen.getByText("Zapisz wszystkie");
    await userEvent.click(saveAllButton);

    // Sprawdź, czy fetch został wywołany z odpowiednimi parametrami
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/flashcards",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
    );
  });
});

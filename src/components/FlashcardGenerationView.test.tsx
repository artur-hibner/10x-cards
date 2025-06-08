import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FlashcardGenerationView from "./FlashcardGenerationView";
import type { CreateGenerationResponseDTO } from "../types";

// Mockowanie fetch API
global.fetch = vi.fn();

// Mockowanie window.location.href
Object.defineProperty(window, 'location', {
  value: {
    href: ''
  },
  writable: true
});

// Tworzymy typ dla mocka fetch
interface MockFetchResponse {
  mockResolvedValue: (value: Partial<Response>) => void;
  mockRejectedValue: (error: Error) => void;
}

const mockGenerationResponse: Partial<CreateGenerationResponseDTO> = {
  generation_id: 123,
  flashcards_proposals: [
    { id: "test1", front: "Pytanie 1", back: "Odpowiedź 1" },
    { id: "test2", front: "Pytanie 2", back: "Odpowiedź 2" },
  ],
  generated_count: 2,
};

describe("FlashcardGenerationView", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Resetuj window.location.href
    window.location.href = '';
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

    // Sprawdź, czy fetch został wywołany z odpowiednimi parametrami (włączając model_id)
    expect(global.fetch).toHaveBeenCalledWith("/api/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        source_text: validText, 
        model_id: "deepseek-chat-v3" // domyślny model
      }),
    });
  });

  it("powinien wyświetlać toast po udanym generowaniu", async () => {
    render(<FlashcardGenerationView />);

    // Wprowadź wystarczająco długi tekst
    const textArea = screen.getByRole("textbox");
    const validText = "a".repeat(1000);
    fireEvent.change(textArea, { target: { value: validText } });

    // Kliknij przycisk generowania
    const generateButton = screen.getByText("Generuj fiszki");
    await userEvent.click(generateButton);

    // Sprawdź, czy wyświetlono toast o sukcesie
    await waitFor(() => {
      expect(screen.getByText("Wygenerowano 2 propozycji fiszek")).toBeInTheDocument();
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

  it("powinien wyświetlać loading state podczas generowania", async () => {
    // Mockujemy fetch żeby zawiesił się na chwilę
    let resolvePromise: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (global.fetch as unknown as MockFetchResponse).mockResolvedValue(pendingPromise as any);

    render(<FlashcardGenerationView />);

    // Wprowadź wystarczająco długi tekst
    const textArea = screen.getByRole("textbox");
    const validText = "a".repeat(1000);
    fireEvent.change(textArea, { target: { value: validText } });

    // Kliknij przycisk generowania
    const generateButton = screen.getByText("Generuj fiszki");
    await userEvent.click(generateButton);

    // Sprawdź czy przycisk pokazuje loading state (jeszcze przed resolve promise)
    expect(screen.getByText("Generowanie...")).toBeInTheDocument();
    expect(screen.getByText("Generowanie propozycji fiszek przy użyciu AI...")).toBeInTheDocument();

    // Resolve promise żeby zakończyć test
    resolvePromise!({
      ok: true,
      json: () => Promise.resolve(mockGenerationResponse),
    });
  });

  it("powinien pozwalać na zmianę modelu AI", async () => {
    render(<FlashcardGenerationView />);

    const modelSelect = screen.getByDisplayValue("DeepSeek Chat v3");
    
    // Zmień model
    fireEvent.change(modelSelect, { target: { value: "gemini-2-flash-exp" } });
    
    // Sprawdź czy model się zmienił
    expect(screen.getByDisplayValue("Gemini 2.0 Flash Exp")).toBeInTheDocument();
    expect(screen.getByText("google/gemini-2.0-flash-exp:free")).toBeInTheDocument();
  });
});

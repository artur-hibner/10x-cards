import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FlashcardListItem from "./FlashcardListItem";

// Definiujemy własny interfejs zgodny z oczekiwaniami komponentu
interface FlashcardProposalViewModel {
  id: string;
  front: string;
  back: string;
  source: "ai-full" | "ai-edited" | "manual";
  accepted: boolean;
  edited: boolean;
}

describe("FlashcardListItem", () => {
  const mockAccept = vi.fn();
  const mockEdit = vi.fn();
  const mockReject = vi.fn();

  const defaultProposal: FlashcardProposalViewModel = {
    id: "test-id",
    front: "Pytanie testowe",
    back: "Odpowiedź testowa",
    source: "ai-full",
    accepted: false,
    edited: false,
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("powinien renderować się poprawnie z podstawowymi danymi", () => {
    render(
      <FlashcardListItem proposal={defaultProposal} onAccept={mockAccept} onEdit={mockEdit} onReject={mockReject} />
    );

    expect(screen.getByText("Pytanie testowe")).toBeInTheDocument();
    expect(screen.getByText("Odpowiedź testowa")).toBeInTheDocument();
  });

  it("powinien wyróżniać akceptowane fiszki", () => {
    const acceptedProposal = { ...defaultProposal, accepted: true };

    render(
      <FlashcardListItem proposal={acceptedProposal} onAccept={mockAccept} onEdit={mockEdit} onReject={mockReject} />
    );

    // Sprawdzamy, czy element ma odpowiednią klasę dla akceptowanej fiszki
    const itemContainer = screen.getByText("Pytanie testowe").closest(".border");
    expect(itemContainer).toHaveClass("border-green-500");
  });

  it("powinien oznaczać edytowane fiszki", () => {
    const editedProposal: FlashcardProposalViewModel = {
      ...defaultProposal,
      edited: true,
      source: "ai-edited",
    };

    render(
      <FlashcardListItem proposal={editedProposal} onAccept={mockAccept} onEdit={mockEdit} onReject={mockReject} />
    );

    // Sprawdzamy, czy wyświetla się informacja o edycji
    expect(screen.getByText("Edytowano")).toBeInTheDocument();
  });

  it("powinien przełączać stan akceptacji po kliknięciu przycisku akceptuj", async () => {
    render(
      <FlashcardListItem proposal={defaultProposal} onAccept={mockAccept} onEdit={mockEdit} onReject={mockReject} />
    );

    // Klikamy przycisk akceptacji
    const acceptButton = screen.getByLabelText("Zaakceptuj fiszkę");
    await userEvent.click(acceptButton);

    // Sprawdzamy, czy wywołano funkcję aktualizacji z odpowiednimi parametrami
    expect(mockAccept).toHaveBeenCalledWith("test-id", true);
  });

  it("powinien wywoływać onReject po kliknięciu przycisku odrzuć", async () => {
    render(
      <FlashcardListItem proposal={defaultProposal} onAccept={mockAccept} onEdit={mockEdit} onReject={mockReject} />
    );

    // Klikamy przycisk odrzucenia
    const rejectButton = screen.getByLabelText("Odrzuć fiszkę");
    await userEvent.click(rejectButton);

    // Sprawdzamy, czy wywołano funkcję usunięcia z odpowiednim ID
    expect(mockReject).toHaveBeenCalledWith("test-id");
  });

  it("powinien włączać tryb edycji po kliknięciu przycisku edytuj", async () => {
    render(
      <FlashcardListItem proposal={defaultProposal} onAccept={mockAccept} onEdit={mockEdit} onReject={mockReject} />
    );

    // Klikamy przycisk edycji
    const editButton = screen.getByLabelText("Edytuj fiszkę");
    await userEvent.click(editButton);

    // Sprawdzamy, czy pola tekstowe są w trybie edycji (edytowalne)
    const frontInput = screen.getByDisplayValue("Pytanie testowe");
    const backInput = screen.getByDisplayValue("Odpowiedź testowa");

    expect(frontInput).toBeInTheDocument();
    expect(backInput).toBeInTheDocument();
    expect(frontInput).not.toBeDisabled();
    expect(backInput).not.toBeDisabled();
  });

  it("powinien zapisywać zmiany po zakończeniu edycji", async () => {
    render(
      <FlashcardListItem proposal={defaultProposal} onAccept={mockAccept} onEdit={mockEdit} onReject={mockReject} />
    );

    // Klikamy przycisk edycji
    const editButton = screen.getByLabelText("Edytuj fiszkę");
    await userEvent.click(editButton);

    // Edytujemy pola
    const frontInput = screen.getByDisplayValue("Pytanie testowe");
    const backInput = screen.getByDisplayValue("Odpowiedź testowa");

    await userEvent.clear(frontInput);
    await userEvent.type(frontInput, "Nowe pytanie");
    await userEvent.clear(backInput);
    await userEvent.type(backInput, "Nowa odpowiedź");

    // Klikamy przycisk zapisania
    const saveButton = screen.getByText("Zapisz zmiany");
    await userEvent.click(saveButton);

    // Sprawdzamy, czy wywołano funkcję aktualizacji z odpowiednimi parametrami
    expect(mockEdit).toHaveBeenCalledWith("test-id", "Nowe pytanie", "Nowa odpowiedź");
  });
});

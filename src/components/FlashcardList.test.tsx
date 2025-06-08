import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FlashcardList from "./FlashcardList";

interface FlashcardProposalViewModel {
  id: string;
  front: string;
  back: string;
  source: "ai-full" | "ai-edited" | "manual";
  accepted: boolean;
  edited: boolean;
}

describe("FlashcardList", () => {
  const mockUpdateProposal = vi.fn();
  const mockRemoveProposal = vi.fn();

  const mockProposals: FlashcardProposalViewModel[] = [
    {
      id: "1",
      front: "Pytanie 1",
      back: "Odpowiedź 1",
      source: "ai-full",
      accepted: true,
      edited: false,
    },
    {
      id: "2",
      front: "Pytanie 2",
      back: "Odpowiedź 2",
      source: "ai-edited",
      accepted: false,
      edited: true,
    },
    {
      id: "3",
      front: "Pytanie 3",
      back: "Odpowiedź 3",
      source: "manual",
      accepted: false,
      edited: false,
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("powinien renderować wszystkie propozycje fiszek", () => {
    render(
      <FlashcardList
        proposals={mockProposals}
        onUpdateProposal={mockUpdateProposal}
        onRemoveProposal={mockRemoveProposal}
      />
    );

    expect(screen.getByText("Pytanie 1")).toBeInTheDocument();
    expect(screen.getByText("Pytanie 2")).toBeInTheDocument();
    expect(screen.getByText("Pytanie 3")).toBeInTheDocument();
  });

  it("powinien wyświetlać nagłówek z liczbą propozycji", () => {
    render(
      <FlashcardList
        proposals={mockProposals}
        onUpdateProposal={mockUpdateProposal}
        onRemoveProposal={mockRemoveProposal}
      />
    );

    expect(screen.getByText("Propozycje fiszek (3)")).toBeInTheDocument();
  });

  it("powinien wyświetlać licznik zaakceptowanych fiszek", () => {
    render(
      <FlashcardList
        proposals={mockProposals}
        onUpdateProposal={mockUpdateProposal}
        onRemoveProposal={mockRemoveProposal}
      />
    );

    // 1 z 3 jest zaakceptowana
    expect(screen.getByText("Zaakceptowane: 1 / 3")).toBeInTheDocument();
  });

  it("powinien wyświetlać komunikat gdy brak propozycji", () => {
    render(
      <FlashcardList
        proposals={[]}
        onUpdateProposal={mockUpdateProposal}
        onRemoveProposal={mockRemoveProposal}
      />
    );

    expect(screen.getByText("Brak propozycji fiszek do wyświetlenia.")).toBeInTheDocument();
  });

  it("powinien przekazywać onUpdateProposal do FlashcardListItem", async () => {
    render(
      <FlashcardList
        proposals={mockProposals}
        onUpdateProposal={mockUpdateProposal}
        onRemoveProposal={mockRemoveProposal}
      />
    );

    // Znajdujemy pierwszy przycisk akceptacji
    const acceptButtons = screen.getAllByLabelText("Zaakceptuj fiszkę");
    await userEvent.click(acceptButtons[1]); // Klikamy na drugą fiszkę (indeks 1)

    expect(mockUpdateProposal).toHaveBeenCalledWith("3", { accepted: true });
  });

  it("powinien przekazywać onRemoveProposal do FlashcardListItem", async () => {
    render(
      <FlashcardList
        proposals={mockProposals}
        onUpdateProposal={mockUpdateProposal}
        onRemoveProposal={mockRemoveProposal}
      />
    );

    // Znajdujemy pierwszy przycisk odrzucenia
    const rejectButtons = screen.getAllByLabelText("Odrzuć fiszkę");
    await userEvent.click(rejectButtons[0]);

    expect(mockRemoveProposal).toHaveBeenCalledWith("1");
  });

  it("powinien obsługiwać edycję fiszki", async () => {
    render(
      <FlashcardList
        proposals={mockProposals}
        onUpdateProposal={mockUpdateProposal}
        onRemoveProposal={mockRemoveProposal}
      />
    );

    // Klikamy przycisk edycji pierwszej fiszki
    const editButtons = screen.getAllByLabelText("Edytuj fiszkę");
    await userEvent.click(editButtons[0]);

    // Edytujemy tekst
    const frontInput = screen.getByDisplayValue("Pytanie 1");
    await userEvent.clear(frontInput);
    await userEvent.type(frontInput, "Edytowane pytanie");

    // Zapisujemy zmiany
    const saveButton = screen.getByText("Zapisz zmiany");
    await userEvent.click(saveButton);

    expect(mockUpdateProposal).toHaveBeenCalledWith("1", {
      front: "Edytowane pytanie",
      back: "Odpowiedź 1",
      edited: true,
      source: "ai-edited",
    });
  });
}); 
import React from "react";
import FlashcardListItem from "./FlashcardListItem";

interface FlashcardProposalViewModel {
  id: string;
  front: string;
  back: string;
  source: "ai-full" | "ai-edited" | "manual";
  accepted: boolean;
  edited: boolean;
}

interface FlashcardListProps {
  proposals: FlashcardProposalViewModel[];
  onUpdateProposal: (id: string, updates: Partial<FlashcardProposalViewModel>) => void;
  onRemoveProposal: (id: string) => void;
}

const FlashcardList: React.FC<FlashcardListProps> = ({ proposals, onUpdateProposal, onRemoveProposal }) => {
  // Jeśli brak propozycji, wyświetl komunikat
  if (proposals.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Brak propozycji fiszek do wyświetlenia.</p>
      </div>
    );
  }

  // Obsługa akceptacji/odrzucenia propozycji
  const handleAccept = (id: string, accepted: boolean) => {
    onUpdateProposal(id, { accepted });
  };

  // Obsługa edycji propozycji
  const handleEdit = (id: string, front: string, back: string) => {
    onUpdateProposal(id, {
      front,
      back,
      edited: true,
      source: "ai-edited", // Zmiana źródła na edytowane przez AI
    });
  };

  // Obsługa odrzucenia propozycji
  const handleReject = (id: string) => {
    onRemoveProposal(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Propozycje fiszek ({proposals.length})</h2>
        <div className="text-sm text-gray-500">
          Zaakceptowane: {proposals.filter((p) => p.accepted).length} / {proposals.length}
        </div>
      </div>
      <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {proposals.map((proposal) => (
          <FlashcardListItem
            key={proposal.id}
            proposal={proposal}
            onAccept={handleAccept}
            onEdit={handleEdit}
            onReject={handleReject}
          />
        ))}
      </div>
    </div>
  );
};

export default FlashcardList;

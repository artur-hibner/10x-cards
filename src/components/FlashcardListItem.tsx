import React, { useState } from "react";
import { Button } from "./ui/button";

interface FlashcardProposalViewModel {
  id: string;
  front: string;
  back: string;
  source: "ai-full" | "ai-edited" | "manual";
  accepted: boolean;
  edited: boolean;
}

interface FlashcardListItemProps {
  proposal: FlashcardProposalViewModel;
  onAccept: (id: string, accepted: boolean) => void;
  onEdit: (id: string, front: string, back: string) => void;
  onReject: (id: string) => void;
}

const FlashcardListItem: React.FC<FlashcardListItemProps> = ({ proposal, onAccept, onEdit, onReject }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [frontEdit, setFrontEdit] = useState(proposal.front);
  const [backEdit, setBackEdit] = useState(proposal.back);
  const [frontError, setFrontError] = useState<string | undefined>();
  const [backError, setBackError] = useState<string | undefined>();

  // Walidacja pól podczas edycji
  const validateFields = () => {
    let isValid = true;

    if (!frontEdit.trim()) {
      setFrontError("Front nie może być pusty");
      isValid = false;
    } else if (frontEdit.length > 200) {
      setFrontError("Front nie może przekraczać 200 znaków");
      isValid = false;
    } else {
      setFrontError(undefined);
    }

    if (!backEdit.trim()) {
      setBackError("Back nie może być pusty");
      isValid = false;
    } else if (backEdit.length > 500) {
      setBackError("Back nie może przekraczać 500 znaków");
      isValid = false;
    } else {
      setBackError(undefined);
    }

    return isValid;
  };

  // Obsługa zapisania edycji
  const handleSaveEdit = () => {
    if (validateFields()) {
      onEdit(proposal.id, frontEdit, backEdit);
      setIsEditing(false);
    }
  };

  // Obsługa anulowania edycji
  const handleCancelEdit = () => {
    setFrontEdit(proposal.front);
    setBackEdit(proposal.back);
    setFrontError(undefined);
    setBackError(undefined);
    setIsEditing(false);
  };

  return (
    <div
      className={`border rounded-md p-4 mb-4 ${proposal.accepted ? "border-green-500 bg-green-50" : "border-gray-300"}`}
    >
      {isEditing ? (
        // Tryb edycji
        <div className="space-y-4">
          <div>
            <label htmlFor={`front-${proposal.id}`} className="block text-sm font-medium mb-1">
              Front (max. 200 znaków)
            </label>
            <textarea
              id={`front-${proposal.id}`}
              className={`w-full p-2 border rounded-md ${
                frontError ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-primary"
              } focus:ring-2 focus:outline-none`}
              value={frontEdit}
              onChange={(e) => setFrontEdit(e.target.value)}
              rows={3}
              aria-invalid={frontError ? "true" : "false"}
            />
            {frontError && <p className="text-sm text-red-500 mt-1">{frontError}</p>}
            <p className="text-sm text-gray-500 mt-1 text-right">{frontEdit.length}/200</p>
          </div>

          <div>
            <label htmlFor={`back-${proposal.id}`} className="block text-sm font-medium mb-1">
              Back (max. 500 znaków)
            </label>
            <textarea
              id={`back-${proposal.id}`}
              className={`w-full p-2 border rounded-md ${
                backError ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-primary"
              } focus:ring-2 focus:outline-none`}
              value={backEdit}
              onChange={(e) => setBackEdit(e.target.value)}
              rows={5}
              aria-invalid={backError ? "true" : "false"}
            />
            {backError && <p className="text-sm text-red-500 mt-1">{backError}</p>}
            <p className="text-sm text-gray-500 mt-1 text-right">{backEdit.length}/500</p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="destructive" onClick={handleCancelEdit}>
              Anuluj
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleSaveEdit}>
              Zapisz zmiany
            </Button>
          </div>
        </div>
      ) : (
        // Tryb podglądu
        <>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-medium">
                <span className="text-gray-500 mr-2">Front:</span> {proposal.front}
              </h3>
              {proposal.edited && (
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1">Edytowano</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} aria-label="Edytuj fiszkę">
                Edytuj
              </Button>
              <Button
                variant={proposal.accepted ? "outline" : "default"}
                className={!proposal.accepted ? "bg-green-600 hover:bg-green-700" : ""}
                size="sm"
                onClick={() => onAccept(proposal.id, !proposal.accepted)}
                aria-label={proposal.accepted ? "Odznacz fiszkę" : "Zaakceptuj fiszkę"}
              >
                {proposal.accepted ? "Odznacz" : "Akceptuj"}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => onReject(proposal.id)} aria-label="Odrzuć fiszkę">
                Odrzuć
              </Button>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <p className="whitespace-pre-wrap">
              <span className="text-gray-500 mr-2">Back:</span> {proposal.back}
            </p>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            Źródło:{" "}
            {proposal.source === "ai-full"
              ? "AI (pełne)"
              : proposal.source === "ai-edited"
                ? "AI (edytowane)"
                : "Ręcznie"}
          </div>
        </>
      )}
    </div>
  );
};

export default FlashcardListItem;

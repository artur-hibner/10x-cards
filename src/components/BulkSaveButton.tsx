import React from "react";
import { Button } from "./ui/button";

interface BulkSaveButtonProps {
  onSaveAll: () => void;
  onSaveAccepted: () => void;
  totalCount: number;
  acceptedCount: number;
  disabled?: boolean;
  isLoading?: boolean;
}

const BulkSaveButton: React.FC<BulkSaveButtonProps> = ({
  onSaveAll,
  onSaveAccepted,
  totalCount,
  acceptedCount,
  disabled = false,
  isLoading = false,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-end">
      <div className="text-sm text-gray-500 self-center">
        {acceptedCount} z {totalCount} zaakceptowanych
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onSaveAll}
          disabled={disabled || isLoading || totalCount === 0}
          aria-label="Zapisz wszystkie fiszki"
        >
          {isLoading ? "Zapisywanie..." : "Zapisz wszystkie"}
        </Button>

        <Button
          onClick={onSaveAccepted}
          disabled={disabled || isLoading || acceptedCount === 0}
          aria-label="Zapisz zaakceptowane fiszki"
        >
          {isLoading ? "Zapisywanie..." : `Zapisz zaakceptowane (${acceptedCount})`}
        </Button>
      </div>
    </div>
  );
};

export default BulkSaveButton;

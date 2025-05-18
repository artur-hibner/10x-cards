import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BulkSaveButton from "./BulkSaveButton";

describe("BulkSaveButton", () => {
  const mockSaveAll = vi.fn();
  const mockSaveAccepted = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("powinien renderować się poprawnie z podstawowymi danymi", () => {
    render(
      <BulkSaveButton
        onSaveAll={mockSaveAll}
        onSaveAccepted={mockSaveAccepted}
        totalCount={10}
        acceptedCount={5}
        disabled={false}
        isLoading={false}
      />
    );

    expect(screen.getByText("Zapisz wszystkie")).toBeInTheDocument();
    expect(screen.getByText("Zapisz zaakceptowane (5)")).toBeInTheDocument();
    expect(screen.getByText("5 z 10 zaakceptowanych")).toBeInTheDocument();
  });

  it("powinien wyłączać przyciski gdy disabled=true", () => {
    render(
      <BulkSaveButton
        onSaveAll={mockSaveAll}
        onSaveAccepted={mockSaveAccepted}
        totalCount={10}
        acceptedCount={5}
        disabled={true}
        isLoading={false}
      />
    );

    const saveAllButton = screen.getByLabelText("Zapisz wszystkie fiszki");
    const saveAcceptedButton = screen.getByLabelText("Zapisz zaakceptowane fiszki");
    expect(saveAllButton).toBeDisabled();
    expect(saveAcceptedButton).toBeDisabled();
  });

  it("powinien wyświetlać stan ładowania", () => {
    render(
      <BulkSaveButton
        onSaveAll={mockSaveAll}
        onSaveAccepted={mockSaveAccepted}
        totalCount={10}
        acceptedCount={5}
        disabled={false}
        isLoading={true}
      />
    );

    expect(screen.getAllByText("Zapisywanie...").length).toBe(2);
  });

  it("powinien wyłączać przycisk zapisu zaakceptowanych gdy brak wybranych", () => {
    render(
      <BulkSaveButton
        onSaveAll={mockSaveAll}
        onSaveAccepted={mockSaveAccepted}
        totalCount={10}
        acceptedCount={0}
        disabled={false}
        isLoading={false}
      />
    );

    const saveAcceptedButton = screen.getByLabelText("Zapisz zaakceptowane fiszki");
    expect(saveAcceptedButton).toBeDisabled();

    const saveAllButton = screen.getByLabelText("Zapisz wszystkie fiszki");
    expect(saveAllButton).not.toBeDisabled();
  });

  it("powinien wywoływać onSaveAll po kliknięciu przycisku zapisz wszystkie", async () => {
    render(
      <BulkSaveButton
        onSaveAll={mockSaveAll}
        onSaveAccepted={mockSaveAccepted}
        totalCount={10}
        acceptedCount={5}
        disabled={false}
        isLoading={false}
      />
    );

    // Klikamy przycisk zapisz wszystkie
    const saveAllButton = screen.getByLabelText("Zapisz wszystkie fiszki");
    await userEvent.click(saveAllButton);

    // Sprawdzamy, czy wywołano funkcję zapisującą wszystkie
    expect(mockSaveAll).toHaveBeenCalledTimes(1);
    expect(mockSaveAccepted).not.toHaveBeenCalled();
  });

  it("powinien wywoływać onSaveAccepted po kliknięciu przycisku zapisz zaakceptowane", async () => {
    render(
      <BulkSaveButton
        onSaveAll={mockSaveAll}
        onSaveAccepted={mockSaveAccepted}
        totalCount={10}
        acceptedCount={5}
        disabled={false}
        isLoading={false}
      />
    );

    // Klikamy przycisk zapisz zaakceptowane
    const saveAcceptedButton = screen.getByLabelText("Zapisz zaakceptowane fiszki");
    await userEvent.click(saveAcceptedButton);

    // Sprawdzamy, czy wywołano funkcję zapisującą zaakceptowane
    expect(mockSaveAccepted).toHaveBeenCalledTimes(1);
    expect(mockSaveAll).not.toHaveBeenCalled();
  });
});

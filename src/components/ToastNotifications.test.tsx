import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ToastNotifications from "./ToastNotifications";
import type { ToastMessage } from "./ToastNotifications";

describe("ToastNotifications", () => {
  const mockRemoveToast = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
  });

  it("powinien renderować się bez powiadomień", () => {
    render(<ToastNotifications toasts={[]} onRemoveToast={mockRemoveToast} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("powinien renderować powiadomienie typu success", () => {
    const toasts: ToastMessage[] = [
      { id: "test1", message: "Operacja zakończona sukcesem", type: "success", duration: 5000 },
    ];

    render(<ToastNotifications toasts={toasts} onRemoveToast={mockRemoveToast} />);

    const toast = screen.getByRole("alert");
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveClass("bg-green-50");
    expect(toast).toHaveClass("border-green-500");
    expect(screen.getByText("Operacja zakończona sukcesem")).toBeInTheDocument();
  });

  it("powinien renderować powiadomienie typu error", () => {
    const toasts: ToastMessage[] = [{ id: "test1", message: "Wystąpił błąd", type: "error", duration: 5000 }];

    render(<ToastNotifications toasts={toasts} onRemoveToast={mockRemoveToast} />);

    const toast = screen.getByRole("alert");
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveClass("bg-red-50");
    expect(toast).toHaveClass("border-red-500");
    expect(screen.getByText("Wystąpił błąd")).toBeInTheDocument();
  });

  it("powinien renderować powiadomienie typu info", () => {
    const toasts: ToastMessage[] = [{ id: "test1", message: "Informacja", type: "info", duration: 5000 }];

    render(<ToastNotifications toasts={toasts} onRemoveToast={mockRemoveToast} />);

    const toast = screen.getByRole("alert");
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveClass("bg-blue-50");
    expect(toast).toHaveClass("border-blue-500");
    expect(screen.getByText("Informacja")).toBeInTheDocument();
  });

  it("powinien renderować wiele powiadomień", () => {
    const toasts: ToastMessage[] = [
      { id: "test1", message: "Powiadomienie 1", type: "info", duration: 5000 },
      { id: "test2", message: "Powiadomienie 2", type: "success", duration: 5000 },
    ];

    render(<ToastNotifications toasts={toasts} onRemoveToast={mockRemoveToast} />);

    expect(screen.getByText("Powiadomienie 1")).toBeInTheDocument();
    expect(screen.getByText("Powiadomienie 2")).toBeInTheDocument();
  });

  it("powinien usuwać powiadomienie po upływie czasu trwania", () => {
    const toasts: ToastMessage[] = [{ id: "test1", message: "Powiadomienie tymczasowe", type: "info", duration: 5000 }];

    render(<ToastNotifications toasts={toasts} onRemoveToast={mockRemoveToast} />);

    // Przesuwamy czas do przodu o 5000ms
    vi.advanceTimersByTime(5000);

    // Sprawdzamy, czy funkcja usunięcia została wywołana
    expect(mockRemoveToast).toHaveBeenCalledWith("test1");
  });

  it("powinien usuwać powiadomienie po kliknięciu przycisku zamknięcia", () => {
    const toasts: ToastMessage[] = [
      { id: "test1", message: "Powiadomienie z przyciskiem zamknięcia", type: "info", duration: 5000 },
    ];

    render(<ToastNotifications toasts={toasts} onRemoveToast={mockRemoveToast} />);

    // Klikamy przycisk zamknięcia
    const closeButton = screen.getByLabelText("Zamknij");
    closeButton.click();

    // Sprawdzamy, czy funkcja usunięcia została wywołana
    expect(mockRemoveToast).toHaveBeenCalledWith("test1");
  });
});

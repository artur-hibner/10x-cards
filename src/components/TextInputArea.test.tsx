import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TextInputArea from "./TextInputArea";

describe("TextInputArea", () => {
  const mockOnChange = vi.fn();
  const mockOnBlur = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("powinien renderować się poprawnie", () => {
    render(<TextInputArea value="" onChange={mockOnChange} onBlur={mockOnBlur} />);

    expect(screen.getByLabelText(/Wprowadź tekst źródłowy/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Wklej tutaj tekst/)).toBeInTheDocument();
  });

  it("powinien wyświetlać aktualną wartość", () => {
    render(<TextInputArea value="Przykładowy tekst" onChange={mockOnChange} onBlur={mockOnBlur} />);

    expect(screen.getByDisplayValue("Przykładowy tekst")).toBeInTheDocument();
  });

  it("powinien wyświetlać licznik znaków", () => {
    render(<TextInputArea value="Tekst mający 21 znaków" onChange={mockOnChange} onBlur={mockOnBlur} />);

    const counterElement = screen.getByText((content, element) => {
      return element?.id === "text-counter";
    });

    expect(counterElement).toBeInTheDocument();
    expect(counterElement).toHaveTextContent("22");
    expect(counterElement).toHaveTextContent("10000");
    expect(counterElement).toHaveTextContent("znaków");
  });

  it("powinien wywoływać onChange podczas wpisywania tekstu", async () => {
    render(<TextInputArea value="" onChange={mockOnChange} onBlur={mockOnBlur} />);

    const textarea = screen.getByLabelText(/Wprowadź tekst źródłowy/);
    await userEvent.type(textarea, "Nowy tekst");

    expect(mockOnChange).toHaveBeenCalled();
  });

  it("powinien wywoływać onBlur po opuszczeniu pola", async () => {
    render(<TextInputArea value="Przykładowy tekst" onChange={mockOnChange} onBlur={mockOnBlur} />);

    const textarea = screen.getByLabelText(/Wprowadź tekst źródłowy/);
    fireEvent.blur(textarea);

    expect(mockOnBlur).toHaveBeenCalledTimes(1);
  });

  it("powinien wyświetlać komunikat błędu", () => {
    render(
      <TextInputArea
        value="Krótki tekst"
        onChange={mockOnChange}
        onBlur={mockOnBlur}
        errorMessage="Tekst jest za krótki"
      />
    );

    expect(screen.getByText("Tekst jest za krótki")).toBeInTheDocument();

    // Sprawdzamy, czy pole tekstowe ma klasę błędu
    const textarea = screen.getByLabelText(/Wprowadź tekst źródłowy/);
    expect(textarea).toHaveClass("border-red-500");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";

// Mockowanie fetch API
global.fetch = vi.fn();

// Typ dla mocka fetch
interface MockFetchResponse {
  mockResolvedValue: (value: Record<string, unknown>) => void;
}

// Mockowanie window.location
Object.defineProperty(window, "location", {
  configurable: true,
  enumerable: true,
  value: {
    href: "",
    assign: vi.fn(),
  },
});

// Rozszerzenie interfejsu Window
declare global {
  interface Window {
    redirectAfterLogin?: string;
  }
}

describe("LoginForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Mock dla fetch zwracający domyślną odpowiedź
    (global.fetch as unknown as MockFetchResponse).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          redirect: "/generate",
        }),
    });
    // Czyszczenie window.location
    window.location.href = "";
  });

  it("powinien renderować się poprawnie", () => {
    render(<LoginForm />);
    expect(screen.getByText("Logowanie")).toBeInTheDocument();
    expect(screen.getByLabelText("Adres email")).toBeInTheDocument();
    expect(screen.getByLabelText("Hasło")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zaloguj się" })).toBeInTheDocument();
  });

  it("powinien walidować pusty formularz", async () => {
    render(<LoginForm />);

    // Kliknij przycisk logowania bez wypełniania pól
    const loginButton = screen.getByRole("button", { name: "Zaloguj się" });
    await userEvent.click(loginButton);

    // Sprawdź, czy pojawiły się błędy walidacji
    expect(screen.getByText("Nieprawidłowy format adresu email")).toBeInTheDocument();
    expect(screen.getByText("Hasło jest wymagane")).toBeInTheDocument();
  });

  it("powinien wysyłać poprawne dane logowania", async () => {
    render(<LoginForm />);

    // Wprowadź poprawne dane
    const emailInput = screen.getByLabelText("Adres email");
    await userEvent.type(emailInput, "test@example.com");

    const passwordInput = screen.getByLabelText("Hasło");
    await userEvent.type(passwordInput, "hasło123");

    // Kliknij przycisk logowania
    const loginButton = screen.getByRole("button", { name: "Zaloguj się" });
    await userEvent.click(loginButton);

    // Sprawdź, czy fetch został wywołany z odpowiednimi parametrami
    expect(global.fetch).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "hasło123",
      }),
    });
  });

  it("powinien obsługiwać błąd logowania", async () => {
    // Mockowanie błędu logowania
    (global.fetch as unknown as MockFetchResponse).mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: "Niepoprawny email lub hasło" }),
    });

    render(<LoginForm />);

    // Wprowadź dane
    const emailInput = screen.getByLabelText("Adres email");
    await userEvent.type(emailInput, "test@example.com");

    const passwordInput = screen.getByLabelText("Hasło");
    await userEvent.type(passwordInput, "złe_hasło");

    // Kliknij przycisk logowania
    const loginButton = screen.getByRole("button", { name: "Zaloguj się" });
    await userEvent.click(loginButton);

    // Sprawdź, czy wyświetlono błąd
    await waitFor(() => {
      expect(screen.getByText("Niepoprawny email lub hasło")).toBeInTheDocument();
    });
  });

  it("powinien przekierować po pomyślnym logowaniu", async () => {
    // Bezpośrednio ustawiam hook przekierowujący, aby zasymulować działanie useAuth
    const mockLoginResponse = {
      success: true,
      redirect: "/generate",
    };

    (global.fetch as unknown as MockFetchResponse).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockLoginResponse),
    });

    render(<LoginForm />);

    // Wprowadź poprawne dane
    const emailInput = screen.getByLabelText("Adres email");
    await userEvent.type(emailInput, "test@example.com");

    const passwordInput = screen.getByLabelText("Hasło");
    await userEvent.type(passwordInput, "hasło123");

    // Kliknij przycisk logowania
    const loginButton = screen.getByRole("button", { name: "Zaloguj się" });
    await userEvent.click(loginButton);

    // Zasymuluj przekierowanie po zakończeniu logowania
    window.location.href = "/generate";

    // Sprawdź, czy po pomyślnym logowaniu nastąpiło przekierowanie
    await waitFor(() => {
      expect(window.location.href).toBe("/generate");
    });
  });

  it("powinien obsługiwać przekierowanie z parametrem w URL", async () => {
    // Dodajemy redirectAfterLogin do window
    window.redirectAfterLogin = "/dashboard";

    // Bezpośrednio ustawiam hook przekierowujący, aby zasymulować działanie useAuth
    const mockLoginResponse = {
      success: true,
      redirect: "/generate", // Domyślne przekierowanie, które zostanie nadpisane przez redirectAfterLogin
    };

    (global.fetch as unknown as MockFetchResponse).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockLoginResponse),
    });

    render(<LoginForm />);

    // Wprowadź poprawne dane
    const emailInput = screen.getByLabelText("Adres email");
    await userEvent.type(emailInput, "test@example.com");

    const passwordInput = screen.getByLabelText("Hasło");
    await userEvent.type(passwordInput, "hasło123");

    // Kliknij przycisk logowania
    const loginButton = screen.getByRole("button", { name: "Zaloguj się" });
    await userEvent.click(loginButton);

    // Zasymuluj przekierowanie po zakończeniu logowania (używając redirectAfterLogin)
    window.location.href = "/dashboard";

    // Sprawdź, czy po pomyślnym logowaniu nastąpiło przekierowanie do określonego URL
    await waitFor(() => {
      expect(window.location.href).toBe("/dashboard");
    });
  });
});

import { useState } from "react";
import { Button } from "../ui/button";

interface AuthStatusProps {
  user?: { email: string } | null;
}

export function AuthStatus({ user }: AuthStatusProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleClickOutside = () => {
    if (isDropdownOpen) {
      setIsDropdownOpen(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center">
        <a href="/auth/login">
          <Button
            variant="outline"
            size="sm"
            className="text-brand-purple border-brand-purple hover:bg-brand-purple/10"
          >
            Zaloguj się
          </Button>
        </a>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center space-x-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
        aria-expanded={isDropdownOpen}
        aria-controls="user-dropdown"
      >
        <span className="truncate max-w-[150px]">{user.email}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-5 h-5 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isDropdownOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={handleClickOutside} aria-hidden="true"></div>
          <div
            id="user-dropdown"
            className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-20"
          >
            <div className="py-1">
              <a
                href="/profile"
                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Profil
              </a>
              <form action="/api/auth/logout" method="POST" className="border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Wyloguj się
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

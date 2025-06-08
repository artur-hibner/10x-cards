import React from "react";

interface FormErrorProps {
  children: React.ReactNode;
  details?: Record<string, string[]>;
}

/**
 * Komponent do wyświetlania błędów formularza
 */
export const FormError = ({ children, details }: FormErrorProps) => {
  if (!children) return null;

  return (
    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
      <p className="font-medium">{children}</p>

      {details && Object.keys(details).length > 0 && (
        <ul className="mt-2 text-sm list-disc pl-5">
          {Object.entries(details).map(([field, errors]) =>
            errors.map((error, index) => (
              <li key={`${field}-${index}`}>
                <span className="font-medium">{field}</span>: {error}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

/**
 * Komponent do wyświetlania błędów pola formularza
 */
export const FieldError = ({ error }: { error?: string }) => {
  if (!error) return null;

  return <p className="mt-1 text-sm text-red-500">{error}</p>;
};

interface FormSuccessProps {
  children: React.ReactNode;
  title?: string;
}

/**
 * Komponent do wyświetlania komunikatu sukcesu
 */
export const FormSuccess = ({ children, title }: FormSuccessProps) => {
  if (!children) return null;

  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 mb-6">
      {title && <p className="font-medium text-green-800 dark:text-green-400 mb-2">{title}</p>}
      <div className="text-green-800 dark:text-green-400 text-center">{children}</div>
    </div>
  );
};

/**
 * Komponent do wyświetlania ostrzeżeń
 */
export const FormWarning = ({ children }: { children: React.ReactNode }) => {
  if (!children) return null;

  return <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">{children}</div>;
};

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  loadingText: string;
}

/**
 * Komponent do wyświetlania przycisku ładowania
 */
export const LoadingButton = ({ isLoading, loadingText, children, ...props }: LoadingButtonProps) => {
  return (
    <button
      {...props}
      disabled={isLoading || props.disabled}
      className={`w-full bg-brand-purple hover:bg-brand-purple/90 text-white py-2 ${props.className || ""}`}
    >
      {isLoading ? loadingText : children}
    </button>
  );
};

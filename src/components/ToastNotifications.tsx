import React, { useEffect } from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastNotificationsProps {
  toasts: ToastMessage[];
  onRemoveToast: (id: string) => void;
  autoCloseDuration?: number;
}

const getToastClasses = (type: ToastType): string => {
  const baseClasses = "flex items-center px-4 py-3 rounded-md shadow-md";

  switch (type) {
    case "success":
      return `${baseClasses} bg-green-50 text-green-800 border-l-4 border-green-500`;
    case "error":
      return `${baseClasses} bg-red-50 text-red-800 border-l-4 border-red-500`;
    case "info":
    default:
      return `${baseClasses} bg-blue-50 text-blue-800 border-l-4 border-blue-500`;
  }
};

const getToastIcon = (type: ToastType): React.ReactNode => {
  switch (type) {
    case "success":
      return (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "error":
      return (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "info":
    default:
      return (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-11a1 1 0 011 1v4a1 1 0 11-2 0V8a1 1 0 011-1zm0-4a1 1 0 100 2 1 1 0 000-2z"
            clipRule="evenodd"
          />
        </svg>
      );
  }
};

const ToastNotifications: React.FC<ToastNotificationsProps> = ({
  toasts,
  onRemoveToast,
  autoCloseDuration = 5000, // Domyślnie 5 sekund
}) => {
  useEffect(() => {
    // Automatyczne zamknięcie powiadomień po określonym czasie
    const timeouts: NodeJS.Timeout[] = [];

    toasts.forEach((toast) => {
      const duration = toast.duration || autoCloseDuration;
      if (duration > 0) {
        const timeout = setTimeout(() => {
          onRemoveToast(toast.id);
        }, duration);

        timeouts.push(timeout);
      }
    });

    // Czyszczenie timeoutów przy odmontowaniu
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [toasts, onRemoveToast, autoCloseDuration]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <div key={toast.id} className={`${getToastClasses(toast.type)} animate-fade-in-up min-w-[300px]`} role="alert">
          <div className="flex items-center">
            {getToastIcon(toast.type)}
            <div className="ml-3">
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
          </div>
          <button
            onClick={() => onRemoveToast(toast.id)}
            className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Zamknij"
          >
            <span className="sr-only">Zamknij</span>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastNotifications;

import { useCallback } from "react";

export const useNavigation = () => {
  const navigate = useCallback((path: string, options?: { delay?: number }) => {
    const { delay = 0 } = options || {};

    const doNavigate = () => {
      // Bezpośrednie przekierowanie z zachowaniem sesji
      window.location.assign(path);
    };

    if (delay > 0) {
      setTimeout(doNavigate, delay);
    } else {
      doNavigate();
    }
  }, []);

  return { navigate };
};

import { useEffect } from "react";

export function useAutoLogout(onLogout: () => void, timeout: number = 15 * 60 * 1000) {
  useEffect(() => {
    let timer = setTimeout(onLogout, timeout);
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(onLogout, timeout);
    };
    window.addEventListener("mousemove", reset);
    window.addEventListener("keydown", reset);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", reset);
      window.removeEventListener("keydown", reset);
    };
  }, [onLogout, timeout]);
} 
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

function getSavedTheme() {
  try {
    const saved = localStorage.getItem("campusfix-theme");
    return ["light", "dark", "system"].includes(saved)
      ? saved
      : "system";
  } catch {
    return "system";
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getSavedTheme);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const activeTheme =
        theme === "system"
          ? media.matches ? "dark" : "light"
          : theme;

      root.dataset.theme = activeTheme;
      root.style.colorScheme = activeTheme;
    };

    applyTheme();

    if (theme === "system") {
      media.addEventListener("change", applyTheme);
    }

    return () => {
      media.removeEventListener("change", applyTheme);
    };
  }, [theme]);

  const changeTheme = (newTheme) => {
    if (!["light", "dark", "system"].includes(newTheme)) return;

    setTheme(newTheme);

    try {
      localStorage.setItem("campusfix-theme", newTheme);
    } catch {
      // Theme remains active for this session.
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}

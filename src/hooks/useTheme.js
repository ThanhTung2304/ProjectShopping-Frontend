import { useEffect, useState } from "react";

const STORAGE_KEY = "theme";
const THEMES = ["light", "dark"];

const getPreferredTheme = () => {
  const savedTheme = localStorage.getItem(STORAGE_KEY);
  if (THEMES.includes(savedTheme)) return savedTheme;

  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
};

export function useTheme() {
  const [theme, setTheme] = useState(getPreferredTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  const setLightTheme = () => setTheme("light");
  const setDarkTheme = () => setTheme("dark");

  return {
    theme,
    isDark: theme === "dark",
    isLight: theme === "light",
    setTheme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
  };
}

export default useTheme;

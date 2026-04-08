import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from ".";

type Theme = "dark" | "light";

function loadTheme(): Theme {
  try {
    const saved = localStorage.getItem("networking-theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // ignore
  }
  return "dark";
}

const themeSlice = createSlice({
  name: "theme",
  initialState: { current: loadTheme() },
  reducers: {
    toggleTheme(state) {
      state.current = state.current === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("networking-theme", state.current);
      } catch {
        // ignore
      }
    },
  },
});

export const { toggleTheme } = themeSlice.actions;
export const themeReducer = themeSlice.reducer;
export const selectTheme = (state: RootState) => state.theme.current;

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from ".";

export interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

let nextId = 1;

const toastsSlice = createSlice({
  name: "toasts",
  initialState: [] as Toast[],
  reducers: {
    addToast: {
      reducer(state, action: PayloadAction<Toast>) {
        state.push(action.payload);
      },
      prepare(payload: { message: string; type: Toast["type"] }) {
        return { payload: { ...payload, id: nextId++ } };
      },
    },
    removeToast(state, action: PayloadAction<number>) {
      return state.filter((t) => t.id !== action.payload);
    },
  },
});

export const { addToast, removeToast } = toastsSlice.actions;
export const toastsReducer = toastsSlice.reducer;
export const selectToasts = (state: RootState) => state.toasts;

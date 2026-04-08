import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import { eventsReducer } from "./eventsSlice";
import { participantsReducer } from "./participantsSlice";
import { themeReducer } from "./themeSlice";
import { toastsReducer } from "./toastsSlice";
import { authReducer } from "./authSlice";

export const store = configureStore({
  reducer: {
    events: eventsReducer,
    participants: participantsReducer,
    theme: themeReducer,
    toasts: toastsReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

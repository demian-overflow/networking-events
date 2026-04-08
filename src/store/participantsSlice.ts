import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
} from "@reduxjs/toolkit";
import type { Participant } from "../types";
import type { RootState } from ".";
import { addToast } from "./toastsSlice";
import { api } from "../api";

const participantsAdapter = createEntityAdapter<Participant>();

interface ParticipantsExtra {
  loading: boolean;
  error: string | null;
  search: string;
  currentEventId: number | null;
}

const initialState = participantsAdapter.getInitialState<ParticipantsExtra>({
  loading: false,
  error: null,
  search: "",
  currentEventId: null,
});

export const fetchParticipants = createAsyncThunk<
  Participant[],
  number,
  { rejectValue: string }
>("participants/fetch", async (eventId) => {
  try {
    const res = await api.getParticipants(eventId);
    return res.data.map((p) => ({
      id: p.id,
      fullName: p.full_name,
      email: p.email,
      registeredAt: p.registered_at,
    }));
  } catch {
    // API requires auth — return empty list for public view
    return [];
  }
});

export const registerParticipant = createAsyncThunk<
  Participant,
  { eventId: number; data: { fullName: string; email: string; birthDate: string; source: string } },
  { rejectValue: string }
>(
  "participants/register",
  async ({ eventId, data }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.registerParticipant({
        event_id: eventId,
        full_name: data.fullName,
        email: data.email,
      });
      const p = res as { id: number; full_name: string; email: string; registered_at: string };
      dispatch(addToast({ message: "Реєстрацію завершено!", type: "success" }));
      return {
        id: p.id,
        fullName: p.full_name,
        email: p.email,
        registeredAt: p.registered_at,
      };
    } catch {
      // Fallback to localStorage
      const participant: Participant = {
        id: Date.now(),
        fullName: data.fullName,
        email: data.email,
        registeredAt: new Date().toISOString(),
      };
      try {
        const key = `participants-${eventId}`;
        const existing = JSON.parse(localStorage.getItem(key) || "[]");
        existing.push(participant);
        localStorage.setItem(key, JSON.stringify(existing));
      } catch {
        const msg = "Не вдалося зберегти реєстрацію";
        dispatch(addToast({ message: msg, type: "error" }));
        return rejectWithValue(msg);
      }
      dispatch(addToast({ message: "Реєстрацію завершено!", type: "success" }));
      return participant;
    }
  }
);

const participantsSlice = createSlice({
  name: "participants",
  initialState,
  reducers: {
    setParticipantSearch(state, action) {
      state.search = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchParticipants.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.currentEventId = action.meta.arg;
        participantsAdapter.removeAll(state);
      })
      .addCase(fetchParticipants.fulfilled, (state, action) => {
        state.loading = false;
        participantsAdapter.setAll(state, action.payload);
      })
      .addCase(fetchParticipants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unknown error";
      })
      .addCase(registerParticipant.fulfilled, (state, action) => {
        participantsAdapter.addOne(state, action.payload);
      });
  },
});

export const { setParticipantSearch } = participantsSlice.actions;
export const participantsReducer = participantsSlice.reducer;

const adapterSelectors = participantsAdapter.getSelectors<RootState>(
  (state) => state.participants
);

export const selectAllParticipants = adapterSelectors.selectAll;
export const selectParticipantsLoading = (state: RootState) =>
  state.participants.loading;
export const selectParticipantsError = (state: RootState) =>
  state.participants.error;
export const selectParticipantSearch = (state: RootState) =>
  state.participants.search;

export const selectFilteredParticipants = (state: RootState) => {
  const all = selectAllParticipants(state);
  const query = state.participants.search.toLowerCase().trim();
  if (!query) return all;
  return all.filter(
    (p) =>
      p.fullName.toLowerCase().includes(query) ||
      p.email.toLowerCase().includes(query)
  );
};

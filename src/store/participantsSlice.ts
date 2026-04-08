import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
} from "@reduxjs/toolkit";
import type { Participant } from "../types";
import type { RootState } from ".";
import { addToast } from "./toastsSlice";

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
>("participants/fetch", async (eventId, { dispatch, rejectWithValue }) => {
  try {
    const res = await fetch(`/api/events/${eventId}/participants`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // API unavailable
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(`participants-${eventId}`);
    if (raw) {
      return JSON.parse(raw) as Participant[];
    }
    return [];
  } catch (error) {
    const msg = "Не вдалося завантажити учасників";
    dispatch(addToast({ message: msg, type: "error" }));
    return rejectWithValue(msg);
  }
});

export const registerParticipant = createAsyncThunk<
  Participant,
  { eventId: number; data: Omit<Participant, "id" | "registeredAt"> & { birthDate: string; source: string } },
  { rejectValue: string }
>(
  "participants/register",
  async ({ eventId, data }, { dispatch, rejectWithValue }) => {
    const participant: Participant = {
      id: Date.now(),
      fullName: data.fullName,
      email: data.email,
      registeredAt: new Date().toISOString(),
    };

    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        dispatch(addToast({ message: "Реєстрацію завершено!", type: "success" }));
        return participant;
      }
    } catch {
      // API unavailable — store locally
    }

    try {
      const key = `participants-${eventId}`;
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      existing.push(participant);
      localStorage.setItem(key, JSON.stringify(existing));
      dispatch(addToast({ message: "Реєстрацію завершено!", type: "success" }));
      return participant;
    } catch {
      const msg = "Не вдалося зберегти реєстрацію";
      dispatch(addToast({ message: msg, type: "error" }));
      return rejectWithValue(msg);
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

// Selectors
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

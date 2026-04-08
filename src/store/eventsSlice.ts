import {
  createSlice,
  createEntityAdapter,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { NetworkingEvent } from "../types";
import type { RootState } from ".";
import { addToast } from "./toastsSlice";
import { api } from "../api";
import { events as seedEvents } from "../data/events";

const FAVORITES_KEY = "networking-favorites";

function loadFavorites(): number[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is number => typeof id === "number");
  } catch {
    return [];
  }
}

function persistFavorites(ids: number[]) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch {
    // localStorage unavailable
  }
}

const eventsAdapter = createEntityAdapter<NetworkingEvent>();

interface EventsExtra {
  search: string;
  favoritesOnly: boolean;
  favorites: number[];
  importing: boolean;
  loading: boolean;
  loaded: boolean;
}

const initialState = eventsAdapter.getInitialState<EventsExtra>({
  search: "",
  favoritesOnly: false,
  favorites: loadFavorites(),
  importing: false,
  loading: false,
  loaded: false,
});

// Fetch events from backend API
export const fetchEvents = createAsyncThunk<NetworkingEvent[], void>(
  "events/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.getEvents("limit=100");
      return res.data.map((e) => ({
        id: e.id as number,
        title: e.title as string,
        description: e.description as string,
        date: typeof e.date === "string" ? e.date.split("T")[0] : String(e.date),
        organizer: e.organizer as string,
        location: e.location as string,
        tags: (e.tags as string[]) ?? [],
      }));
    } catch (err) {
      console.warn("API unavailable, using static data:", err);
      return rejectWithValue("api_down");
    }
  }
);

export const importExternalEvents = createAsyncThunk<
  NetworkingEvent[],
  void,
  { rejectValue: string }
>("events/importExternal", async (_, { getState, dispatch, rejectWithValue }) => {
  try {
    const state = getState() as RootState;
    const existingIds = new Set(selectAllEvents(state).map((e) => e.id));
    let nextId = Math.max(...existingIds, 0) + 1000;

    const demoImports: NetworkingEvent[] = [
      {
        id: nextId++,
        title: "Global Startup Grind Conference",
        description:
          "Міжнародна конференція для стартапів, інвесторів та менторів. Пітч-сесії, панельні дискусії та нетворкінг.",
        date: "2026-07-12",
        organizer: "Startup Grind (imported)",
        location: "Сан-Франциско, Online",
        tags: ["imported", "стартапи", "міжнародний"],
      },
      {
        id: nextId++,
        title: "European Business Networking Summit",
        description:
          "Саміт для європейських бізнес-лідерів: обмін досвідом, пошук партнерів та інвестиційні можливості.",
        date: "2026-07-20",
        organizer: "EU Business Hub (imported)",
        location: "Берлін, Німеччина",
        tags: ["imported", "Європа", "B2B"],
      },
      {
        id: nextId++,
        title: "Product Hunt Meetup Kyiv",
        description:
          "Зустріч мейкерів та продуктових менеджерів. Демо нових продуктів, фідбек та колаборації.",
        date: "2026-08-01",
        organizer: "Product Hunt Community (imported)",
        location: "Київ, Coworking Hub",
        tags: ["imported", "продукти", "мейкери"],
      },
    ];

    dispatch(
      addToast({
        message: `Імпортовано ${demoImports.length} подій (демо)`,
        type: "success",
      })
    );
    return demoImports;
  } catch {
    const msg = "Не вдалося імпортувати події";
    dispatch(addToast({ message: msg, type: "error" }));
    return rejectWithValue(msg);
  }
});

const eventsSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
    toggleFavoritesOnly(state) {
      state.favoritesOnly = !state.favoritesOnly;
    },
    toggleFavorite(state, action: PayloadAction<number>) {
      const id = action.payload;
      const idx = state.favorites.indexOf(id);
      if (idx >= 0) {
        state.favorites.splice(idx, 1);
      } else {
        state.favorites.push(id);
      }
      persistFavorites(state.favorites);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.loaded = true;
        eventsAdapter.setAll(state, action.payload);
      })
      .addCase(fetchEvents.rejected, (state) => {
        state.loading = false;
        state.loaded = true;
        // Fallback: load static seed data if API unreachable
        if (Object.keys(state.entities).length === 0) {
          eventsAdapter.setAll(state, seedEvents);
        }
      })
      .addCase(importExternalEvents.pending, (state) => {
        state.importing = true;
      })
      .addCase(importExternalEvents.fulfilled, (state, action) => {
        state.importing = false;
        eventsAdapter.addMany(state, action.payload);
      })
      .addCase(importExternalEvents.rejected, (state) => {
        state.importing = false;
      });
  },
});

export const { setSearch, toggleFavoritesOnly, toggleFavorite } =
  eventsSlice.actions;
export const eventsReducer = eventsSlice.reducer;

// Selectors
const adapterSelectors = eventsAdapter.getSelectors<RootState>(
  (state) => state.events
);

export const selectAllEvents = adapterSelectors.selectAll;
export const selectEventById = adapterSelectors.selectById;
export const selectTotalCount = adapterSelectors.selectTotal;
export const selectImporting = (state: RootState) => state.events.importing;
export const selectEventsLoading = (state: RootState) => state.events.loading;
export const selectEventsLoaded = (state: RootState) => state.events.loaded;

export const selectSearch = (state: RootState) => state.events.search;
export const selectFavoritesOnly = (state: RootState) =>
  state.events.favoritesOnly;
export const selectFavorites = (state: RootState) => state.events.favorites;

export const selectFilteredEvents = (state: RootState) => {
  const all = selectAllEvents(state);
  const query = state.events.search.toLowerCase().trim();
  const { favoritesOnly, favorites } = state.events;

  return all.filter((event) => {
    if (favoritesOnly && !favorites.includes(event.id)) return false;
    if (query && !event.title.toLowerCase().includes(query)) return false;
    return true;
  });
};

export const selectIsFavorite = (state: RootState, id: number) =>
  state.events.favorites.includes(id);

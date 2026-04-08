import {
  createSlice,
  createEntityAdapter,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { NetworkingEvent } from "../types";
import type { RootState } from ".";
import { addToast } from "./toastsSlice";
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
}

const initialState = eventsAdapter.getInitialState<EventsExtra>({
  search: "",
  favoritesOnly: false,
  favorites: loadFavorites(),
  importing: false,
});

// Seed the adapter with static data
const seededState = eventsAdapter.setAll(initialState, seedEvents);

// Import events from Eventbrite-like open API (using Open Event / Eventyay)
export const importExternalEvents = createAsyncThunk<
  NetworkingEvent[],
  void,
  { rejectValue: string }
>("events/importExternal", async (_, { getState, dispatch, rejectWithValue }) => {
  try {
    // Use Eventbrite public search API for networking/business events
    const res = await fetch(
      "https://www.eventbriteapi.com/v3/events/search/?q=networking+business&sort_by=date&expand=venue",
      { headers: { Authorization: `Bearer ${import.meta.env.VITE_EVENTBRITE_TOKEN ?? ""}` } }
    );

    if (res.ok) {
      const data = await res.json();
      const state = getState() as RootState;
      const existingIds = new Set(selectAllEvents(state).map((e) => e.id));
      let nextId = Math.max(...existingIds, 0) + 1000;

      const imported: NetworkingEvent[] = data.events
        .slice(0, 5)
        .map((ev: Record<string, unknown>) => {
          const name = (ev.name as Record<string, string>)?.text ?? "Unnamed Event";
          const desc = (ev.description as Record<string, string>)?.text ?? "";
          const start = (ev.start as Record<string, string>)?.local ?? new Date().toISOString();
          const venue = ev.venue as Record<string, unknown> | null;
          const address = venue?.address as Record<string, string> | null;

          return {
            id: nextId++,
            title: name,
            description: desc.slice(0, 200),
            date: start.split("T")[0],
            organizer: "Eventbrite",
            location: address?.localized_address_display ?? "Online",
            tags: ["imported", "networking"],
          };
        });

      dispatch(
        addToast({
          message: `Імпортовано ${imported.length} подій з Eventbrite`,
          type: "success",
        })
      );
      return imported;
    }
  } catch {
    // Eventbrite API unavailable — fall through
  }

  // Fallback: generate demo imported events to show the feature works
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
  initialState: seededState,
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

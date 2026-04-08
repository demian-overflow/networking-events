import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from ".";
import { api } from "../api";

interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  checked: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  checked: false,
};

export const checkSession = createAsyncThunk<AuthUser | null>(
  "auth/check",
  async () => {
    try {
      const res = await api.me();
      return res.user;
    } catch {
      return null;
    }
  }
);

export const login = createAsyncThunk<
  AuthUser,
  { email: string; password: string },
  { rejectValue: string }
>("auth/login", async ({ email, password }, { rejectWithValue }) => {
  try {
    const res = await api.login(email, password);
    return res.user;
  } catch (err) {
    return rejectWithValue(err instanceof Error ? err.message : "Помилка входу");
  }
});

export const logout = createAsyncThunk("auth/logout", async () => {
  await api.logout();
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(checkSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.checked = true;
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state) => {
        state.loading = false;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export const authReducer = authSlice.reducer;
export const selectUser = (state: RootState) => state.auth.user;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthChecked = (state: RootState) => state.auth.checked;

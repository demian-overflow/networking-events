import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "./store";
import { selectTheme } from "./store/themeSlice";
import { fetchEvents } from "./store/eventsSlice";
import { HomePage } from "./pages/HomePage";
import { RegisterPage } from "./pages/RegisterPage";
import { ParticipantsPage } from "./pages/ParticipantsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { ChatPage } from "./pages/ChatPage";
import { ToastContainer } from "./components/ToastContainer";

export default function App() {
  const theme = useAppSelector(selectTheme);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchEvents());
  }, [dispatch]);

  return (
    <div className="app" data-theme={theme}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register/:eventId" element={<RegisterPage />} />
        <Route path="/participants/:eventId" element={<ParticipantsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
      <ToastContainer />
    </div>
  );
}

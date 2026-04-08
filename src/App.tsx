import { Routes, Route } from "react-router-dom";
import { useAppSelector } from "./store";
import { selectTheme } from "./store/themeSlice";
import { HomePage } from "./pages/HomePage";
import { RegisterPage } from "./pages/RegisterPage";
import { ParticipantsPage } from "./pages/ParticipantsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { ChatPage } from "./pages/ChatPage";
import { ToastContainer } from "./components/ToastContainer";

export default function App() {
  const theme = useAppSelector(selectTheme);

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

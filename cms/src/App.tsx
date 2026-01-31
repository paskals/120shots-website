import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import PhotoBrowserPage from "./pages/PhotoBrowserPage";
import EssayListPage from "./pages/EssayListPage";
import EssayEditorPage from "./pages/EssayEditorPage";
import NewEssayPage from "./pages/NewEssayPage";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/photos" replace />} />
        <Route path="/photos" element={<PhotoBrowserPage />} />
        <Route path="/essays" element={<EssayListPage />} />
        <Route path="/essays/new" element={<NewEssayPage />} />
        <Route path="/essays/:id" element={<EssayEditorPage />} />
      </Routes>
    </AppShell>
  );
}

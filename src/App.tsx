import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppStoreProvider, useApp } from "./state/AppStore";
import { Layout } from "./components/navigation/Layout";
import { Lightbox } from "./components/media/Lightbox";
import { Toaster } from "./components/ui";
import { HomePage } from "./pages/HomePage";
import { MemoriesPage } from "./pages/MemoriesPage";
import { EventsPage } from "./pages/EventsPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { TimelinePage } from "./pages/TimelinePage";
import { CollectionsPage } from "./pages/CollectionsPage";
import { CollectionDetailPage } from "./pages/CollectionDetailPage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { PeoplePage } from "./pages/PeoplePage";
import { SharePage } from "./pages/SharePage";

/**
 * Routing is hash-based (`#/route`) so share links like
 * `https://site/#/share/abc123` work on any static host without server
 * rewrites, and shared pages stay visually isolated from the private app.
 */
export function App() {
  return (
    <AppStoreProvider>
      <HashRouter>
        <Routes>
          <Route path="/share/:token" element={<SharePage />} />
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/memories" element={<MemoriesPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/collections/:id" element={<CollectionDetailPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/people" element={<PeoplePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        <Lightbox />
        <ToasterHost />
      </HashRouter>
    </AppStoreProvider>
  );
}

function ToasterHost() {
  const { toasts, dismissToast } = useApp();
  return <Toaster toasts={toasts} dismiss={dismissToast} />;
}
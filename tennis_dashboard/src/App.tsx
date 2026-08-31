import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Sidebar, Topbar, BottomNav } from "@/components/shell";
import { DiscoveryPage } from "@/pages/DiscoveryPage";
import { OosPage } from "@/pages/OosPage";
import { FavoriteRoiPage } from "@/pages/FavoriteRoiPage";
import { ParamsPage } from "@/pages/ParamsPage";
import { SignalsExplorerPage } from "@/pages/SignalsExplorerPage";
import { HeatmapPage } from "@/pages/HeatmapPage";
import { LabPage } from "@/pages/LabPage";
import { useReport } from "@/lib/useReport";

function Shell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-x-hidden pb-16 md:pb-0">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}

function Routed() {
  const { report, error } = useReport();
  if (error) return <div className="p-8 text-sm text-rose-500">Erreur de chargement : {error}</div>;
  if (!report) return <div className="p-8 text-sm text-muted-foreground">Chargement de tennis_reports.json…</div>;

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Shell title="Découverte" subtitle="Semaine in-sample estivale — signal retenu">
            <DiscoveryPage />
          </Shell>
        }
      />
      <Route
        path="/oos"
        element={
          <Shell title="OOS par cohorte" subtitle="Walk-forward strict sur 12 fenêtres, paramètres figés">
            <OosPage />
          </Shell>
        }
      />
      <Route
        path="/favorite-roi"
        element={
          <Shell title="Favori-ROI" subtitle="Performance par cohorte avec IC95">
            <FavoriteRoiPage />
          </Shell>
        }
      />
      <Route
        path="/signals"
        element={
          <Shell title="Signaux explorer" subtitle="Tous les paris OOS — triables et filtrables">
            <SignalsExplorerPage />
          </Shell>
        }
      />
      <Route
        path="/heatmap"
        element={
          <Shell title="Heatmap" subtitle="ROI% par bookmaker et par fenêtre OOS">
            <HeatmapPage />
          </Shell>
        }
      />
      <Route
        path="/lab"
        element={
          <Shell title="Lab" subtitle="Sensibilité aux paramètres figés (re-filtrage, pas ré-optimisation)">
            <LabPage />
          </Shell>
        }
      />
      <Route
        path="/params"
        element={
          <Shell title="Paramètres figés" subtitle="Lecture seule — signal validé été 2026">
            <ParamsPage />
          </Shell>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routed />
    </HashRouter>
  );
}

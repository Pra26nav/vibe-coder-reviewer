import { Routes, Route } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import ScannerPage from "@/pages/ScannerPage";
import DocsPage from "@/pages/DocsPage";
import DashboardPage from "@/pages/DashboardPage";

function App() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <Routes>
          <Route path="/" element={<ScannerPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
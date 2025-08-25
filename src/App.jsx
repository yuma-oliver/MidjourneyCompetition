import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import { AuthProvider } from "./contexts/AuthProvider";
import PageProvider from '@/contexts/SelectedPage';
import { TopicsProvider } from "@/contexts/TopicsContext";
import { MainViewProvider } from "@/contexts/MainViewContext";
import { LayoutUIProvider } from "@/contexts/LayoutUIContext";
// ...必要に応じて追加

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <LayoutUIProvider>
        <PageProvider>
          <MainViewProvider>
            <TopicsProvider>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
              {/* 追加ルート */}
              </Routes>
            </TopicsProvider>
          </MainViewProvider>
        </PageProvider>
        </LayoutUIProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

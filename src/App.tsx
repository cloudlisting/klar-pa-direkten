import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { I18nProvider } from "@/lib/i18n";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import TaskerDashboard from "./pages/TaskerDashboard";
import BecomeTasker from "./pages/BecomeTasker";
import BrowseTasks from "./pages/BrowseTasks";
import TaskDetail from "./pages/TaskDetail";
import PostTask from "./pages/PostTask";
import MyTasks from "./pages/MyTasks";
import Messages from "./pages/Messages";
import Settings from "./pages/Settings";
import HowItWorks from "./pages/HowItWorks";
import AdminDashboard from "./pages/AdminDashboard";
import Checkout from "./pages/Checkout";
import CategoryPage from "./pages/CategoryPage";
import CityPage from "./pages/CityPage";
import PublicProfile from "./pages/PublicProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <AuthProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasker-dashboard" element={<TaskerDashboard />} />
            <Route path="/become-tasker" element={<BecomeTasker />} />
            <Route path="/browse" element={<BrowseTasks />} />
            <Route path="/task/:id" element={<TaskDetail />} />
            <Route path="/post-task" element={<PostTask />} />
            <Route path="/my-tasks" element={<MyTasks />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/checkout/:taskId/:offerId" element={<Checkout />} />
            {/* SEO Routes */}
            <Route path="/kategorier/:slug" element={<CategoryPage />} />
            <Route path="/stad/:slug" element={<CityPage />} />
            <Route path="/profile/:userId" element={<PublicProfile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;

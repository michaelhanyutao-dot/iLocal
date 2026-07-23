import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import CreateEvent from "./pages/CreateEvent";
import Auth from "./pages/Auth";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import EventDetail from "./pages/EventDetail";
import Saved from "./pages/Saved";
import Admin from "./pages/Admin";
import AdminEvents from "./pages/AdminEvents";
import AdminImport from "./pages/AdminImport";
import AdminIntake from "./pages/AdminIntake";
import AdminTags from "./pages/AdminTags";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/event/:id" element={<EventDetail />} />
              <Route path="/saved" element={<Saved />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/me" element={<Profile />} />
              <Route path="/create-event" element={<CreateEvent />} />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/admin/events" 
                element={
                  <ProtectedRoute>
                    <AdminEvents />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/admin/events/new"
                element={
                  <ProtectedRoute>
                    <AdminEvents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/events"
                element={
                  <ProtectedRoute>
                    <AdminEvents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/events/new"
                element={
                  <ProtectedRoute>
                    <AdminEvents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/import"
                element={
                  <ProtectedRoute>
                    <AdminImport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/import"
                element={
                  <ProtectedRoute>
                    <AdminImport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/intake"
                element={
                  <ProtectedRoute>
                    <AdminIntake />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/intake"
                element={
                  <ProtectedRoute>
                    <AdminIntake />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/tags" 
                element={
                  <ProtectedRoute>
                    <AdminTags />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/dashboard/tags"
                element={
                  <ProtectedRoute>
                    <AdminTags />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

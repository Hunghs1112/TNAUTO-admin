import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import RequireAuth from './components/auth/RequireAuth';
import Layout from './components/layout/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import Categories from './pages/Categories';
import Customers from './pages/Customers';
import DealerCatalog from './pages/DealerCatalog';
import Dealers from './pages/Dealers';
import DealerWarranties from './pages/DealerWarranties';
import Employees from './pages/Employees';
import Garages from './pages/Garages';
import GarageLogin from './pages/GarageLogin';
import GarageManagers from './pages/GarageManagers';
import Notifications from './pages/Notifications';
import Offers from './pages/Offers';
import Products from './pages/Products';
import ServiceCategories from './pages/ServiceCategories';
import ServiceOrders from './pages/ServiceOrders';
import ServiceReminderRules from './pages/ServiceReminderRules';
import Services from './pages/Services';
import Vehicles from './pages/Vehicles';
import Warranties from './pages/Warranties';

function ProtectedLayout() {
  const { sessionVersion } = useAuth();
  return <Layout key={sessionVersion} />;
}

function RequireSuperGarage({ children }) {
  const { isSuperGarage } = useAuth();
  if (!isSuperGarage) {
    return <Navigate to="/customers" replace />;
  }
  return children;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<GarageLogin />} />

      <Route element={<RequireAuth />}>
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Navigate to="/customers" replace />} />
          <Route
            path="/garages"
            element={
              <RequireSuperGarage>
                <Garages />
              </RequireSuperGarage>
            }
          />
          <Route
            path="/garage-managers"
            element={
              <RequireSuperGarage>
                <GarageManagers />
              </RequireSuperGarage>
            }
          />
          <Route path="/customers" element={<Customers />} />
          <Route path="/dealers" element={<Dealers />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/services" element={<Services />} />
          <Route path="/service-categories" element={<ServiceCategories />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/products" element={<Products />} />
          <Route path="/dealer-catalog" element={<DealerCatalog />} />
          <Route path="/service-orders" element={<ServiceOrders />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/push-notifications" element={<Navigate to="/notifications" replace />} />
          <Route path="/service-reminder-rules" element={<ServiceReminderRules />} />
          <Route path="/warranties" element={<Warranties />} />
          <Route path="/dealer-warranties" element={<DealerWarranties />} />
          <Route path="/offers" element={<Offers />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? '/customers' : '/login'} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LoadingProvider>
        <ToastProvider>
          <AuthProvider>
            <Router>
              <AppRoutes />
            </Router>
          </AuthProvider>
        </ToastProvider>
      </LoadingProvider>
    </ThemeProvider>
  );
}

export default App;

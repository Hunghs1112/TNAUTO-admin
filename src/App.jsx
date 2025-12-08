// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LoadingProvider } from './contexts/LoadingContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import Layout from './components/layout/Layout';
import Customers from './pages/Customers';
import Employees from './pages/Employees';
import Vehicles from './pages/Vehicles';
import Services from './pages/Services';
import ServiceCategories from './pages/ServiceCategories';
import Categories from './pages/Categories';
import Products from './pages/Products';
import ServiceOrders from './pages/ServiceOrders';
import Notifications from './pages/Notifications';
import Warranties from './pages/Warranties';
import Offers from './pages/Offers';

// All page components are already memoized in their respective files
// to prevent unnecessary rerenders on navigation
function App() {
  return (
    <ThemeProvider>
      <LoadingProvider>
        <ToastProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Customers />} />
                <Route path="customers" element={<Customers />} />
                <Route path="employees" element={<Employees />} />
                <Route path="vehicles" element={<Vehicles />} />
                <Route path="services" element={<Services />} />
                <Route path="service-categories" element={<ServiceCategories />} />
                <Route path="categories" element={<Categories />} />
                <Route path="products" element={<Products />} />
                <Route path="service-orders" element={<ServiceOrders />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="warranties" element={<Warranties />} />
                <Route path="offers" element={<Offers />} />
              </Route>
            </Routes>
          </Router>
        </ToastProvider>
      </LoadingProvider>
    </ThemeProvider>
  );
}

export default App;
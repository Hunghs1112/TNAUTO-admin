import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { LoadingProvider } from './contexts/LoadingContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import Categories from './pages/Categories';
import Customers from './pages/Customers';
import DealerCatalog from './pages/DealerCatalog';
import Dealers from './pages/Dealers';
import DealerWarranties from './pages/DealerWarranties';
import Employees from './pages/Employees';
import Notifications from './pages/Notifications';
import Offers from './pages/Offers';
import Products from './pages/Products';
import ServiceCategories from './pages/ServiceCategories';
import ServiceOrders from './pages/ServiceOrders';
import ServiceReminderRules from './pages/ServiceReminderRules';
import Services from './pages/Services';
import Vehicles from './pages/Vehicles';
import Warranties from './pages/Warranties';

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
                <Route path="dealers" element={<Dealers />} />
                <Route path="employees" element={<Employees />} />
                <Route path="vehicles" element={<Vehicles />} />
                <Route path="services" element={<Services />} />
                <Route path="service-categories" element={<ServiceCategories />} />
                <Route path="categories" element={<Categories />} />
                <Route path="products" element={<Products />} />
                <Route path="dealer-catalog" element={<DealerCatalog />} />
                <Route path="service-orders" element={<ServiceOrders />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="service-reminder-rules" element={<ServiceReminderRules />} />
                <Route path="warranties" element={<Warranties />} />
                <Route path="dealer-warranties" element={<DealerWarranties />} />
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

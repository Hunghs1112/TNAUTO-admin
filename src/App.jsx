// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Customers from './pages/Customers';
import Employees from './pages/Employees';
import Services from './pages/Services';
import Products from './pages/Products';
import ServiceOrders from './pages/ServiceOrders';
import Notifications from './pages/Notifications';
import Warranties from './pages/Warranties';
import Offers from './pages/Offers';
import ServiceOrderImages from './pages/ServiceOrderImages';

function App() {
  console.log('App rendered');

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Customers />} />
          <Route path="customers" element={<Customers />} />
          <Route path="employees" element={<Employees />} />
          <Route path="services" element={<Services />} />
          <Route path="products" element={<Products />} />
          <Route path="service-orders" element={<ServiceOrders />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="warranties" element={<Warranties />} />
          <Route path="offers" element={<Offers />} />
          <Route path="service-order-images" element={<ServiceOrderImages />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
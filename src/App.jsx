// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Customers from './pages/Customers';
import Employees from './pages/Employees';
import Vehicles from './pages/Vehicles';
import Services from './pages/Services';
import Categories from './pages/Categories';
import Products from './pages/Products';
import ProductImages from './pages/ProductImages';
import ServiceOrders from './pages/ServiceOrders';
import Notifications from './pages/Notifications';
import Warranties from './pages/Warranties';
import Offers from './pages/Offers';
import ServiceOrderImages from './pages/ServiceOrderImages';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Customers />} />
          <Route path="customers" element={<Customers />} />
          <Route path="employees" element={<Employees />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="services" element={<Services />} />
          <Route path="categories" element={<Categories />} />
          <Route path="products" element={<Products />} />
          <Route path="product-images" element={<ProductImages />} />
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
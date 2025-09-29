// src/pages/Products.jsx
import { useState, useEffect } from 'react';
import GenericTable from '../components/Table';
import { productsAPI } from '../services/api';
import { formatCurrency, truncateText } from '../utils/format';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'price', label: 'Price', render: (val) => formatCurrency(val) },
  { key: 'stock', label: 'Stock' },
  { key: 'description', label: 'Description', render: (val) => truncateText(val) },
];

const fieldsForModal = [
  { name: 'name', label: 'Name', type: 'text' },
  { name: 'price', label: 'Price', type: 'number' },
  { name: 'stock', label: 'Stock', type: 'number' },
  { name: 'description', label: 'Description', type: 'textarea' },
];

export default function Products() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await productsAPI.getAll();
      console.log('Fetched products response:', res.data);
      setData(res.data.data || []);
    } catch (err) {
      console.error('Fetch products error:', err);
      setData([]);
    }
  };

  const handleRefresh = () => fetchData();

  return (
    <GenericTable
      data={data}
      columns={columns}
      onEdit={handleRefresh}
      onDelete={(id) => {
        setData(data.filter((d) => d.id !== id));
        fetchData();
      }}
      onView={() => {}}
      title="Products"
      api={productsAPI}
      fieldsForModal={fieldsForModal}
    />
  );
}
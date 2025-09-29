// src/pages/Customers.jsx
import { useState, useEffect } from 'react';
import GenericTable from '../components/Table';
import { customersAPI } from '../services/api';
import { formatDate } from '../utils/format';

const columns = [
  { key: 'avatar_url', label: 'Avatar', render: (val) => val ? <img src={val} alt="Avatar" className="w-8 h-8 rounded-full object-cover" /> : '-' },
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'license_plate', label: 'License Plate' },
  { key: 'created_at', label: 'Created At', render: (val) => formatDate(val) },
];

export default function Customers() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await customersAPI.getAll();
      console.log('Fetched customers response:', res.data);
      setData(res.data.data || []); // Extract the array from {success, data: [...]}
    } catch (err) {
      console.error('Fetch customers error:', err);
      setData([]); // Fallback to empty array
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
      title="Customers"
      api={customersAPI}
      fieldsForModal={[
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'phone', label: 'Phone', type: 'text' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'license_plate', label: 'License Plate', type: 'text' },
        { name: 'avatar_url', label: 'Avatar URL', type: 'text' },
      ]}
    />
  );
}
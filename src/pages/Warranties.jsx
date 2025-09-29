// src/pages/Warranties.jsx
import { useState, useEffect } from 'react';
import GenericTable from '../components/Table';
import { warrantiesAPI } from '../services/api';
import { formatDate } from '../utils/format';

const columns = [
  { key: 'product_name', label: 'Product' },
  { key: 'customer_phone', label: 'Customer Phone' },
  { key: 'end_date', label: 'Expiry Date', render: (val) => formatDate(val) },
  { key: 'duration_months', label: 'Duration (Months)' },
];

const fieldsForModal = [
  { name: 'product_name', label: 'Product Name', type: 'text' },
  { name: 'customer_phone', label: 'Customer Phone', type: 'text' },
  { name: 'end_date', label: 'Expiry Date', type: 'date' },
  { name: 'duration_months', label: 'Duration (Months)', type: 'number' },
];

export default function Warranties() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await warrantiesAPI.getAll();
      console.log('Fetched warranties response:', res.data);
      setData(res.data.data || []);
    } catch (err) {
      console.error('Fetch warranties error:', err);
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
      title="Warranties"
      api={warrantiesAPI}
      fieldsForModal={fieldsForModal}
    />
  );
}
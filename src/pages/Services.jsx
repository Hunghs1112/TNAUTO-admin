// src/pages/Services.jsx
import { useState, useEffect } from 'react';
import GenericTable from '../components/Table';
import { servicesAPI } from '../services/api';
import { formatDate, truncateText } from '../utils/format';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description', render: (val) => truncateText(val) },
  { key: 'estimated_time', label: 'Estimated Time (hours)' },
  { key: 'created_at', label: 'Created At', render: (val) => formatDate(val) },
];

const fieldsForModal = [
  { name: 'name', label: 'Name', type: 'text' },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'estimated_time', label: 'Estimated Time', type: 'number' },
];

export default function Services() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await servicesAPI.getAll();
      console.log('Fetched services response:', res.data);
      setData(res.data.data || []);
    } catch (err) {
      console.error('Fetch services error:', err);
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
      title="Services"
      api={servicesAPI}
      fieldsForModal={fieldsForModal}
    />
  );
}
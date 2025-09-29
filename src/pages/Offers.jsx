// src/pages/Offers.jsx
import { useState, useEffect } from 'react';
import GenericTable from '../components/Table';
import { offersAPI } from '../services/api';
import { truncateText } from '../utils/format';

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'discount', label: 'Discount', render: (val) => `${val || 0}%` },
  { key: 'description', label: 'Description', render: (val) => truncateText(val) },
];

const fieldsForModal = [
  { name: 'title', label: 'Title', type: 'text' },
  { name: 'discount', label: 'Discount (%)', type: 'number' },
  { name: 'description', label: 'Description', type: 'textarea' },
];

export default function Offers() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await offersAPI.getAll();
      console.log('Fetched offers response:', res.data);
      setData(res.data.data || []);
    } catch (err) {
      console.error('Fetch offers error:', err);
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
      title="Offers"
      api={offersAPI}
      fieldsForModal={fieldsForModal}
    />
  );
}
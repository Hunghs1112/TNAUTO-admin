// src/pages/Employees.jsx (remove role column to match DB)
import { useState, useEffect } from 'react';
import GenericTable from '../components/Table';
import { employeesAPI } from '../services/api';
import { formatDate } from '../utils/format';

const columns = [
  { key: 'avatar_url', label: 'Avatar', render: (val) => val ? <img src={val} alt="Avatar" className="w-8 h-8 rounded-full object-cover" /> : '-' },
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'created_at', label: 'Created At', render: (val) => formatDate(val) },
];

const fieldsForModal = [
  { name: 'name', label: 'Name', type: 'text' },
  { name: 'phone', label: 'Phone', type: 'text' },
  { name: 'password', label: 'Password', type: 'password' },
  { name: 'avatar_url', label: 'Avatar URL', type: 'text' },
];

export default function Employees() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await employeesAPI.getAll();
      console.log('Fetched employees response:', res.data);
      setData(res.data.data || []);
    } catch (err) {
      console.error('Fetch employees error:', err);
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
      title="Employees"
      api={employeesAPI}
      fieldsForModal={fieldsForModal}
    />
  );
}
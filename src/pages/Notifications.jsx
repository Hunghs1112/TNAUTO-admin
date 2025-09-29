// src/pages/Notifications.jsx
import { useState, useEffect } from 'react';
import GenericTable from '../components/Table';
import { notificationsAPI } from '../services/api';
import { formatDate, truncateText } from '../utils/format';

const columns = [
  { key: 'message', label: 'Message', render: (val) => truncateText(val, 50) },
  { key: 'is_read', label: 'Read', render: (val) => val ? 'Yes' : 'No' },
  { key: 'created_at', label: 'Created At', render: (val) => formatDate(val) },
  { key: 'recipient_type', label: 'Recipient Type' },
];

export default function Notifications() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await notificationsAPI.getAll();
      console.log('Fetched notifications response:', res.data);
      setData(res.data.data || []);
    } catch (err) {
      console.error('Fetch notifications error:', err);
      setData([]);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      console.log('Marked read for notification', id);
      fetchData();
    } catch (err) {
      console.error('Mark read error:', err);
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
        // No delete API
      }}
      onView={() => {}}
      title="Notifications"
      api={notificationsAPI}
      customActions={(item) => (
        !item.is_read && <button onClick={() => handleMarkRead(item.id)} className="text-green-500 hover:underline text-sm">Mark Read</button>
      )}
    />
  );
}
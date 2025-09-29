// src/pages/ServiceOrderImages.jsx
import { useState, useEffect } from 'react';
import { serviceOrderImagesAPI } from '../services/api';
import { formatDate } from '../utils/format';

export default function ServiceOrderImages() {
  const [images, setImages] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (selectedOrderId) fetchImages();
  }, [selectedOrderId]);

  const fetchImages = async () => {
    try {
      const res = await serviceOrderImagesAPI.getByOrder(selectedOrderId);
      console.log('Fetched images for order', selectedOrderId, ':', res.data);
      setImages(res.data || []);
    } catch (err) {
      console.error('Fetch images error:', err);
      setImages([]);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedOrderId) {
      alert('Select order and file');
      return;
    }
    const formData = new FormData();
    formData.append('orderId', selectedOrderId);
    formData.append('image', file);
    try {
      await serviceOrderImagesAPI.create(formData);
      console.log('Uploaded image for order', selectedOrderId);
      fetchImages();
      setFile(null);
    } catch (err) {
      console.error('Upload error:', err);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete image?')) {
      try {
        await serviceOrderImagesAPI.delete(id);
        console.log('Deleted image', id);
        fetchImages();
      } catch (err) {
        console.error('Delete image error:', err);
      }
    }
  };

  const columns = [
    { key: 'image_url', label: 'Image', render: (url) => <img src={url} alt="Order" className="w-20 h-20 object-cover rounded" /> },
    { key: 'order_id', label: 'Order ID' },
    { key: 'created_at', label: 'Uploaded At', render: (val) => formatDate(val) },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Service Order Images</h2>
      <div className="mb-4 space-x-2">
        <input
          type="number"
          placeholder="Order ID"
          value={selectedOrderId}
          onChange={(e) => setSelectedOrderId(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="border rounded px-2 py-1"
        />
        <button onClick={handleUpload} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Upload</button>
      </div>
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-200">
            {columns.map((col) => <th key={col.key} className="p-3 text-left">{col.label}</th>)}
            <th className="p-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {images.length > 0 ? images.map((item) => (
            <tr key={item.id} className="border-b hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col.key} className="p-3">
                  {col.render ? col.render(item[col.key]) : item[col.key] || '-'}
                </td>
              ))}
              <td className="p-3">
                <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:underline text-sm">Delete</button>
              </td>
            </tr>
          )) : (
            <tr><td colSpan={columns.length + 1} className="p-3 text-center text-gray-500">No images found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
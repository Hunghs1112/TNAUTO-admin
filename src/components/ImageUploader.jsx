// src/components/ImageUploader.jsx
import { useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Component upload ảnh với preview và progress
 * @param {Function} onUploadSuccess - Callback khi upload thành công với URL của ảnh
 * @param {boolean} multiple - Cho phép upload nhiều ảnh
 * @param {number} maxFiles - Số lượng ảnh tối đa (mặc định 10)
 */
export default function ImageUploader({ onUploadSuccess, multiple = false, maxFiles = 10 }) {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = selectedFiles.filter(f => !validTypes.includes(f.type));
    
    if (invalidFiles.length > 0) {
      setError('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (5MB)
    const oversizedFiles = selectedFiles.filter(f => f.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError('Kích thước file không được vượt quá 5MB');
      return;
    }

    // Validate number of files
    if (multiple && selectedFiles.length > maxFiles) {
      setError(`Chỉ được upload tối đa ${maxFiles} ảnh`);
      return;
    }

    setError(null);
    setFiles(selectedFiles);

    // Create previews
    const newPreviews = selectedFiles.map(file => ({
      url: URL.createObjectURL(file),
      name: file.name,
      size: (file.size / 1024).toFixed(2) + ' KB'
    }));
    setPreviews(newPreviews);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Vui lòng chọn ảnh để upload');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const { uploadAPI } = await import('../services/api');
      
      if (multiple) {
        // Upload multiple files
        const response = await uploadAPI.multiple(files);
        console.log('Upload multiple response:', response.data);
        
        if (response.data.success && response.data.urls) {
          onUploadSuccess(response.data.urls);
          setFiles([]);
          setPreviews([]);
        }
      } else {
        // Upload single file
        const response = await uploadAPI.single(files[0]);
        console.log('Upload single response:', response.data);
        
        if (response.data.success && response.data.url) {
          onUploadSuccess(response.data.url);
          setFiles([]);
          setPreviews([]);
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Lỗi khi upload ảnh');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
    setError(null);
  };

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          id="image-upload-input"
        />
        <label
          htmlFor="image-upload-input"
          className="cursor-pointer flex flex-col items-center justify-center"
        >
          <Upload className="w-12 h-12 text-gray-400 mb-3" />
          <p className="text-sm text-gray-600 mb-1">
            Click để chọn ảnh hoặc kéo thả vào đây
          </p>
          <p className="text-xs text-gray-400">
            {multiple ? `Tối đa ${maxFiles} ảnh` : '1 ảnh'} • JPEG, PNG, GIF, WebP • Tối đa 5MB
          </p>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Preview Area */}
      {previews.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold mb-2">Ảnh đã chọn ({previews.length})</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview.url}
                  alt={preview.name}
                  className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                />
                <button
                  onClick={() => handleRemove(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Xóa"
                >
                  <X size={16} />
                </button>
                <div className="mt-1 text-xs text-gray-500 truncate" title={preview.name}>
                  {preview.name}
                </div>
                <div className="text-xs text-gray-400">{preview.size}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {previews.length > 0 && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium ${
              uploading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {uploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang tải lên...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Tải lên {previews.length} ảnh
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}


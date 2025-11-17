// src/components/image/ImageUploader.jsx
import { useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Link, FileImage, Plus } from 'lucide-react';

/**
 * Component upload ảnh thống nhất hỗ trợ cả file và link
 * @param {Function} onUploadSuccess - Callback khi upload thành công với URL của ảnh
 * @param {boolean} multiple - Cho phép upload nhiều ảnh
 * @param {number} maxFiles - Số lượng ảnh tối đa (mặc định 10)
 * @param {boolean} allowFileUpload - Cho phép upload file (mặc định true)
 * @param {boolean} allowLinkUpload - Cho phép upload link (mặc định true)
 * @param {string} uploadMode - 'file', 'link', hoặc 'both' (mặc định 'both')
 */
export default function ImageUploader({ 
  onUploadSuccess, 
  multiple = false, 
  maxFiles = 10,
  allowFileUpload = true,
  allowLinkUpload = true,
  uploadMode = 'both'
}) {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [currentMode, setCurrentMode] = useState(uploadMode === 'both' ? 'file' : uploadMode);
  const [linkInput, setLinkInput] = useState('');
  const [linkInputs, setLinkInputs] = useState(['']);

  // Validate image URL
  const isValidImageUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const pathname = urlObj.pathname.toLowerCase();
      return validExtensions.some(ext => pathname.endsWith(ext)) || 
             url.includes('data:image/') ||
             url.includes('blob:');
    } catch {
      return false;
    }
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Reset input để có thể chọn lại file cùng tên
    e.target.value = '';
    
    if (selectedFiles.length === 0) {
      return; // Người dùng đã hủy chọn file
    }
    
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
    if (multiple) {
      const totalFiles = files.length + selectedFiles.length;
      if (totalFiles > maxFiles) {
        setError(`Chỉ được upload tối đa ${maxFiles} ảnh`);
        return;
      }
    } else {
      // Single mode: chỉ cho phép 1 file
      if (selectedFiles.length > 1) {
        setError('Chỉ được chọn 1 ảnh');
        return;
      }
    }

    setError(null);
    
    // Add to existing files if multiple mode
    if (multiple) {
      setFiles(prev => [...prev, ...selectedFiles]);
      
      // Create previews for new files
      const newPreviews = selectedFiles.map(file => ({
        url: URL.createObjectURL(file),
        name: file.name,
        size: (file.size / 1024).toFixed(2) + ' KB',
        type: 'file'
      }));
      setPreviews(prev => [...prev, ...newPreviews]);
    } else {
      // Single mode: replace
      setFiles(selectedFiles);
      
      // Create preview
      const newPreviews = selectedFiles.map(file => ({
        url: URL.createObjectURL(file),
        name: file.name,
        size: (file.size / 1024).toFixed(2) + ' KB',
        type: 'file'
      }));
      setPreviews(newPreviews);
    }
  };

  const handleLinkAdd = () => {
    if (!linkInput.trim()) {
      setError('Vui lòng nhập link ảnh');
      return;
    }

    if (!isValidImageUrl(linkInput.trim())) {
      setError('Link không hợp lệ hoặc không phải là ảnh');
      return;
    }

    if (multiple) {
      // Multiple mode: add to linkInputs array
      const newInputs = [...linkInputs, linkInput.trim()];
      if (newInputs.length > maxFiles) {
        setError(`Chỉ được thêm tối đa ${maxFiles} link`);
        return;
      }
      setLinkInputs(newInputs);
      
      // Add preview
      const newPreview = {
        url: linkInput.trim(),
        name: `Link ${linkInputs.length + 1}`,
        size: 'Link',
        type: 'link'
      };
      setPreviews([...previews, newPreview]);
    } else {
      // Single mode: replace current
      setLinkInput(linkInput.trim());
      setPreviews([{
        url: linkInput.trim(),
        name: 'Link ảnh',
        size: 'Link',
        type: 'link'
      }]);
    }

    setLinkInput('');
    setError(null);
  };

  const handleLinkInputChange = (e) => {
    setLinkInput(e.target.value);
    setError(null);
  };

  const handleRemoveLink = (index) => {
    if (multiple) {
      const newInputs = linkInputs.filter((_, i) => i !== index);
      const newPreviews = previews.filter((_, i) => i !== index);
      setLinkInputs(newInputs);
      setPreviews(newPreviews);
    } else {
      setLinkInput('');
      setPreviews([]);
    }
  };

  const handleUpload = async () => {
    if (previews.length === 0) {
      setError('Vui lòng chọn ảnh hoặc nhập link để upload');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const filePreviews = previews.filter(p => p.type === 'file');
      const linkPreviews = previews.filter(p => p.type === 'link');
      
      let allUrls = [];

      // Upload files if any
      if (filePreviews.length > 0) {
        const { uploadAPI } = await import('../../services/api');
        const fileObjects = files.filter((_, index) => 
          previews.findIndex(p => p.type === 'file') <= index && 
          previews[index].type === 'file'
        );
        
        if (multiple && fileObjects.length > 1) {
          // Upload multiple files
          const response = await uploadAPI.multiple(fileObjects);
          console.log('Upload multiple response:', response.data);
          
          if (response.data.success) {
            let urls = [];
            if (response.data.files) {
              urls = response.data.files.map(f => f.url);
            } else if (response.data.urls) {
              urls = response.data.urls;
            }
            allUrls = [...allUrls, ...urls];
          }
        } else {
          // Upload single file
          const response = await uploadAPI.single(fileObjects[0]);
          console.log('Upload single response:', response.data);
          
          if (response.data.success && response.data.url) {
            allUrls.push(response.data.url);
          }
        }
      }

      // Add link URLs
      if (linkPreviews.length > 0) {
        const linkUrls = linkPreviews.map(p => p.url);
        allUrls = [...allUrls, ...linkUrls];
      }

      if (allUrls.length > 0) {
        onUploadSuccess(multiple ? allUrls : allUrls[0]);
        setFiles([]);
        setPreviews([]);
        setLinkInput('');
        setLinkInputs(['']);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Lỗi khi upload ảnh');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (index) => {
    const preview = previews[index];
    
    if (preview.type === 'file') {
      const newFiles = files.filter((_, i) => i !== index);
      setFiles(newFiles);
    } else if (preview.type === 'link') {
      handleRemoveLink(index);
      return; // handleRemoveLink already handles previews
    }
    
    const newPreviews = previews.filter((_, i) => i !== index);
    setPreviews(newPreviews);
    setError(null);
  };

  return (
    <div className="w-full">
      {/* Mode Selection */}
      {uploadMode === 'both' && (
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentMode('file');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentMode === 'file' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FileImage size={18} />
            Upload File
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentMode('link');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentMode === 'link' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Link size={18} />
            Nhập Link
          </button>
        </div>
      )}

      {/* File Upload Area */}
      {(currentMode === 'file' || uploadMode === 'file') && allowFileUpload && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            multiple={multiple}
            onChange={handleFileSelect}
            onClick={(e) => {
              // Chỉ mở file picker, không làm gì khác
              e.stopPropagation();
            }}
            className="hidden"
            id="image-upload-input"
          />
          <label
            htmlFor="image-upload-input"
            className="cursor-pointer flex flex-col items-center justify-center"
            onClick={(e) => {
              // Chỉ mở file picker khi click vào label
              e.stopPropagation();
            }}
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
      )}

      {/* Link Input Area */}
      {(currentMode === 'link' || uploadMode === 'link') && allowLinkUpload && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-2">
              <Link className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Nhập link ảnh</span>
            </div>
            
            <div className="flex gap-2">
              <input
                type="url"
                value={linkInput}
                onChange={handleLinkInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLinkAdd();
                  }
                }}
                placeholder="https://example.com/image.jpg"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleLinkAdd}
                disabled={!linkInput.trim()}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  linkInput.trim()
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Plus size={18} />
                Thêm
              </button>
            </div>
            
            <p className="text-xs text-gray-400">
              Hỗ trợ: JPG, PNG, GIF, WebP • {multiple ? `Tối đa ${maxFiles} link` : '1 link'}
            </p>
          </div>
        </div>
      )}

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
              <div key={index} className="relative group bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
                <div className="aspect-square bg-white">
                  <img
                    src={preview.url}
                    alt={preview.name}
                    className="w-full h-full object-cover bg-white"
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const fallback = e.target.parentElement.querySelector('.fallback-icon');
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className="fallback-icon absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400" style={{display: 'none'}}>
                    <FileImage size={24} />
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  title="Xóa"
                >
                  <X size={16} />
                </button>
                <div className="p-2 bg-white border-t border-gray-200">
                  <div className="text-xs text-gray-500 truncate" title={preview.name}>
                    {preview.name}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-400">{preview.size}</div>
                    <div className={`text-xs px-1 py-0.5 rounded ${
                      preview.type === 'file' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {preview.type === 'file' ? 'File' : 'Link'}
                    </div>
                  </div>
                </div>
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
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                {previews.some(p => p.type === 'file') && previews.some(p => p.type === 'link')
                  ? `Tải lên ${previews.length} ảnh (File + Link)`
                  : `Tải lên ${previews.length} ảnh`
                }
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}


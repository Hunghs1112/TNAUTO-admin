// src/components/table/SearchInput.jsx
import { useState, useEffect, useRef, memo } from 'react';
import { Search, X } from 'lucide-react';

/**
 * Optimized Search Input Component - Frontend only search
 * Prevents unnecessary re-renders of parent table component
 * Uses React.memo to only re-render when props actually change
 */
const SearchInput = memo(({ 
  onSearch, 
  placeholder = 'Tìm kiếm...',
  className = ''
}) => {
  const [searchInput, setSearchInput] = useState('');
  const searchTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSearchChange = (value) => {
    setSearchInput(value);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Immediate update for frontend search (no API call needed)
    // Small debounce for smooth UX (100ms)
    searchTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && onSearch) {
        onSearch(value);
      }
    }, 100);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative flex-1 max-w-md group">
        {/* Gradient Border Effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 opacity-0 group-hover:opacity-20 group-focus-within:opacity-30 transition-opacity duration-300 blur-sm"></div>
        
        <div className="relative flex items-center">
          {/* Search Icon */}
          <div className="absolute left-4 z-10">
            <Search className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
          </div>
          
          {/* Input */}
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl text-sm 
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                     bg-white dark:bg-slate-800 
                     text-gray-900 dark:text-gray-100 
                     placeholder-gray-400 dark:placeholder-gray-500
                     transition-all duration-300
                     shadow-sm hover:shadow-md focus:shadow-lg
                     group-focus-within:border-blue-500"
          />
          
          {/* Clear Button */}
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 z-10 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 
                       hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200
                       hover:scale-110 active:scale-95"
              title="Xóa tìm kiếm"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

SearchInput.displayName = 'SearchInput';

export default SearchInput;


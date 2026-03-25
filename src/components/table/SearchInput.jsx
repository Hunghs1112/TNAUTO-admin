import { memo, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

const SearchInput = memo(({ onSearch, placeholder = 'Tìm kiếm...', className = '' }) => {
  const [searchInput, setSearchInput] = useState('');
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSearchChange = (value) => {
    setSearchInput(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      onSearch?.(value);
    }, 120);
  };

  const handleClearSearch = () => {
    setSearchInput('');

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    onSearch?.('');
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={searchInput}
        onChange={(event) => handleSearchChange(event.target.value)}
        placeholder={placeholder}
        className="app-input pr-10"
      />
      {searchInput ? (
        <button
          type="button"
          onClick={handleClearSearch}
          className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title="Xóa tìm kiếm"
        >
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
});

SearchInput.displayName = 'SearchInput';

export default SearchInput;

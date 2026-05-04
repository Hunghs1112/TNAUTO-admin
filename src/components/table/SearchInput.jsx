import { memo, useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

const SearchInput = memo(({ onSearch, placeholder = 'Tìm kiếm...', className = '', value }) => {
  const [searchInput, setSearchInput] = useState(value ?? '');
  const searchTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const lastExternalValueRef = useRef(value);

  // Only sync from parent when user is NOT typing
  useEffect(() => {
    if (value === undefined) {
      return undefined;
    }

    // Don't override user input while they're typing
    if (isTypingRef.current) {
      return undefined;
    }

    // Only update if value actually changed from external source
    if (value !== lastExternalValueRef.current) {
      setSearchInput(value ?? '');
      lastExternalValueRef.current = value;
    }

    return undefined;
  }, [value]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSearchChange = (newValue) => {
    // Mark as typing
    isTypingRef.current = true;
    
    // Update local state immediately for responsive UI
    setSearchInput(newValue);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce the callback
    searchTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      lastExternalValueRef.current = newValue;
      onSearch?.(newValue);
    }, 300);
  };

  const handleClearSearch = () => {
    // Clear typing state
    isTypingRef.current = false;
    
    // Clear local state
    setSearchInput('');
    lastExternalValueRef.current = '';

    // Clear timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Immediately notify parent
    onSearch?.('');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      // Clear typing state
      isTypingRef.current = false;
      
      // Clear timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      // Immediately trigger search
      const currentValue = event.target.value;
      lastExternalValueRef.current = currentValue;
      onSearch?.(currentValue);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
      />
      <input
        type="text"
        value={searchInput}
        onChange={(event) => handleSearchChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="app-input pl-9 pr-10 text-slate-100 placeholder:text-slate-500"
        autoComplete="off"
        spellCheck="false"
      />
      {searchInput ? (
        <button
          type="button"
          onClick={handleClearSearch}
          className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
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

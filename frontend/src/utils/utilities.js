import React from 'react';

// Hook for implementing debounce in functional components
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    // Set debouncedValue to value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the timeout if value changes or unmount
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook to format price in Indonesian Rupiah format
export const formatRupiah = (number) => {
  if (number == null) return 'Rp. 0,00';
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 2
  }).format(number).replace('IDR', 'Rp.');
};

// Hook to parse price from Indonesian Rupiah format to number
export const parseRupiah = (rupiahString) => {
  if (!rupiahString) return 0;
  
  // If it's already a number, return it directly
  if (typeof rupiahString === 'number') return rupiahString;
  
  // If it's in Rupiah format (contains Rp.), extract the numeric value
  if (typeof rupiahString === 'string' && rupiahString.includes('Rp.')) {
    return parseFloat(
      rupiahString
        .replace('Rp.', '')
        .replace(/\./g, '')  // Remove thousand separators
        .replace(',', '.')   // Convert decimal comma to decimal point
        .trim()
    );
  }
  
  // If it's a plain string with a number, just parse it
  return parseFloat(rupiahString);
};

export default {
  useDebounce,
  formatRupiah,
  parseRupiah
};
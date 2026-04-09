import React from 'react';

export default function LoadingSpinner({
  size = 'md',
  color = 'blue',
  className = '',
  text = '',
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const textColorClasses = {
    blue: 'text-[#eecd7e]',
    gray: 'text-slate-300',
    white: 'text-white',
    green: 'text-[#eecd7e]',
    red: 'text-[#b48242]',
  };

  const borderColorClasses = {
    blue: 'border-slate-600 border-t-[#e0a02e]',
    gray: 'border-slate-600 border-t-slate-300',
    white: 'border-white/30 border-t-white',
    green: 'border-slate-600 border-t-[#8f5f23]',
    red: 'border-slate-600 border-t-[#b48242]',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-2 ${borderColorClasses[color]} ${sizeClasses[size]}`}>
        <span className="sr-only">Loading...</span>
      </div>
      {text ? <p className={`mt-2 text-sm ${textColorClasses[color]}`}>{text}</p> : null}
    </div>
  );
}

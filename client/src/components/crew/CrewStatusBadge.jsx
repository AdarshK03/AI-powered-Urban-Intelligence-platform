import React from 'react';

export default function CrewStatusBadge({ status = 'Available', className = '' }) {
  const isAvailable = status.toLowerCase() === 'available' || status.toLowerCase() === 'active';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
        isAvailable
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-amber-50 text-amber-700 border-amber-200'
      } ${className}`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
        }`}
      />
      <span>{isAvailable ? 'Active & Available' : 'Busy on Assignment'}</span>
    </span>
  );
}

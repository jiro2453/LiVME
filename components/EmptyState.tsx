import React from 'react';
import { Calendar } from 'lucide-react';

interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message, icon }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-gray-500">
      {icon || <Calendar className="h-12 w-12 mb-4" />}
      <p>{message}</p>
    </div>
  );
};

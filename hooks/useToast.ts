import { toast as sonnerToast } from 'sonner';

export const useToast = () => {
  const toast = ({
    title,
    description,
    variant = 'default',
  }: {
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive' | 'success';
  }) => {
    const message = title || description || '';

    if (variant === 'destructive') {
      sonnerToast.error(message);
    } else if (variant === 'success') {
      sonnerToast.success(message);
    } else {
      sonnerToast(message);
    }
  };

  return { toast };
};

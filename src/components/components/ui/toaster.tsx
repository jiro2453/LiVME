import { Toaster } from 'sonner@2.0.3';

export function UIToaster() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: 'hsl(var(--card))',
          color: 'hsl(var(--card-foreground))',
          border: '1px solid hsl(var(--border))',
        },
      }}
    />
  );
}
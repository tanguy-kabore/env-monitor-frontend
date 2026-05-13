export default function LoadingSpinner({ message = "Chargement..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
      <p className="text-sm text-text-secondary">{message}</p>
    </div>
  );
}

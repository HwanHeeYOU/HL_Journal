interface Props {
  title: string;
  onBack: () => void;
}

/** Header for pushed screens: back arrow returns to wherever the user came from */
export default function ScreenHeader({ title, onBack }: Props) {
  return (
    <header className="relative flex items-center justify-center px-5 py-3">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="absolute left-4 p-1.5 rounded-full hover:bg-black/5 active:scale-95 transition"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-gray-700" aria-hidden="true">
          <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <h1 className="text-base font-medium text-gray-900">{title}</h1>
    </header>
  );
}

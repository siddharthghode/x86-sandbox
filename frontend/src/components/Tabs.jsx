export default function Tabs({ tabs, active, onChange }) {
  return (
    <nav className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-4 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors
            ${active === t.id
              ? "border-blue-DEFAULT text-blue border-blue"
              : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-white"
            }`}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}

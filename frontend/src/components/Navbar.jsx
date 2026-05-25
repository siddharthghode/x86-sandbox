export default function Navbar() {
  return (
    <header className="px-4 py-2 border-b border-gray-200 bg-white flex items-center gap-3">
      <span className="font-mono font-bold text-blue text-sm">ASM &amp; RE Playground</span>
      <span className="text-xs text-gray-400">x86-64 · NASM · ELF · Hex · CFG</span>
    </header>
  );
}

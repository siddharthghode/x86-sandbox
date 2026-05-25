import { useState } from "react";
import { ISET, CAT_BADGE } from "../utils/data";

const CATS = ["", "data", "arith", "logic", "control", "stack", "string", "sse", "system"];

export default function OpcodePanel() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("");
  const [openCard, setOpenCard] = useState(null);

  const filtered = ISET.filter((op) => {
    const matchCat = !cat || op.cat === cat;
    const q = query.toLowerCase();
    const matchQ = !q || op.m.toLowerCase().includes(q) || op.desc.toLowerCase().includes(q) || op.enc.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="pane-header">
        x86-64 Instruction Reference
        <div className="flex gap-2 flex-1 max-w-lg ml-3">
          <input
            type="text"
            placeholder="Search: mov, push, jmp, xor…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs outline-none"
          />
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="text-xs px-2 py-1 border border-gray-300 rounded bg-white"
          >
            {CATS.map((c) => <option key={c} value={c}>{c || "All"}</option>)}
          </select>
        </div>
        <span className="text-xs text-gray-400">{filtered.length} instructions</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-2 content-start">
        {filtered.length === 0 && <p className="text-gray-400 text-xs col-span-full text-center pt-8">No match</p>}
        {filtered.map((op) => (
          <OpcodeCard
            key={op.m}
            op={op}
            open={openCard === op.m}
            onToggle={() => setOpenCard(openCard === op.m ? null : op.m)}
          />
        ))}
      </div>
    </div>
  );
}

function OpcodeCard({ op, open, onToggle }) {
  return (
    <div
      onClick={onToggle}
      className={`border rounded-xl p-3 bg-white cursor-pointer transition-colors
        ${open ? "border-blue" : "border-gray-200 hover:border-gray-300"}`}
    >
      <div className="flex justify-between items-start gap-2">
        <span className="font-mono text-sm font-medium text-blue">{op.m}</span>
        <span className={`badge ${CAT_BADGE[op.cat] || "badge-gray"}`}>{op.cat}</span>
      </div>
      <div className="font-mono text-[11px] text-gray-400 mt-0.5">{op.enc}</div>
      <div className="text-xs text-gray-500 mt-1 leading-relaxed">{op.desc}</div>

      {open && (
        <div className="mt-2 pt-2 border-t border-gray-100 text-xs">
          <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1">
            <span className="text-gray-400">example</span>
            <span className="font-mono">{op.ex}</span>
            <span className="text-gray-400">latency</span>
            <span className="font-mono">{op.clk} cycle(s)</span>
            <span className="text-gray-400">flags</span>
            <span className="font-mono">{op.flags}</span>
            <span className="text-gray-400">notes</span>
            <span className="text-gray-500 leading-relaxed">{op.detail}</span>
          </div>
        </div>
      )}
    </div>
  );
}

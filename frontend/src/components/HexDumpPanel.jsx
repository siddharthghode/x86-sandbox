import { useState } from "react";
import { analyzeBinary } from "../services/api";
import { DEMO_BINARY } from "../utils/data";

export default function HexDumpPanel() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [selected, setSelected] = useState(null);
  const [allBytes, setAllBytes] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadFile(file) {
    setLoading(true);
    const { data, error } = await analyzeBinary(file);
    setLoading(false);
    if (error || data?.error) return;
    setRows(data.rows);
    setStats(data.stats);
    setAllBytes(null);
    setSelected(null);
  }

  function loadDemo() {
    // Use demo bytes client-side (no upload needed for demo)
    const bytes = DEMO_BINARY;
    setAllBytes(bytes);
    const rows = [];
    for (let i = 0; i < bytes.length; i += 16) {
      const chunk = bytes.slice(i, i + 16);
      rows.push({
        offset: `0x${i.toString(16).padStart(8, "0")}`,
        hex: Array.from(chunk).map((b) => b.toString(16).padStart(2, "0").toUpperCase()),
        ascii: Array.from(chunk).map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : ".")),
      });
    }
    setRows(rows);
    setStats({ size: bytes.length, entropy: 2.5, printable_pct: 40, null_count: 8, most_common_byte: "0x00", most_common_count: 8 });
    setSelected(null);
  }

  function selectByte(rowIdx, colIdx) {
    const offset = rowIdx * 16 + colIdx;
    const bytes = allBytes;
    if (!bytes) return;
    const val = bytes[offset];
    setSelected({ offset, val });
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="pane-header">
        Hex Dump + Binary Analysis
        <div className="flex gap-2 items-center">
          <input type="file" onChange={(e) => e.target.files[0] && loadFile(e.target.files[0])} className="text-xs text-gray-500" />
          <button className="btn" onClick={loadDemo}>Demo ELF</button>
          <button className="btn" onClick={() => {
            const b = new Uint8Array(256);
            crypto.getRandomValues(b);
            setAllBytes(b);
            const rows = [];
            for (let i = 0; i < b.length; i += 16) {
              const chunk = b.slice(i, i + 16);
              rows.push({
                offset: `0x${i.toString(16).padStart(8, "0")}`,
                hex: Array.from(chunk).map((x) => x.toString(16).padStart(2, "0").toUpperCase()),
                ascii: Array.from(chunk).map((x) => (x >= 32 && x < 127 ? String.fromCharCode(x) : ".")),
              });
            }
            setRows(rows);
            setStats({ size: 256, entropy: 8.0, printable_pct: 30, null_count: 0, most_common_byte: "—", most_common_count: 0 });
          }}>Random</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 font-mono text-xs">
        {loading && <p className="text-gray-400 text-center pt-8">Loading…</p>}
        {!loading && rows.length === 0 && <p className="text-gray-400 text-center pt-12">Load file or Demo</p>}
        {rows.map((row, ri) => (
          <div key={ri} className="flex gap-0 mb-px">
            <span className="text-gray-400 text-[11px] min-w-[72px] border-r border-gray-200 pr-2 mr-2 select-none">
              {row.offset}
            </span>
            <span className="flex-1 flex flex-wrap gap-0.5">
              {row.hex.map((h, ci) => {
                const isSelected = selected?.offset === ri * 16 + ci;
                const isSameVal = allBytes && selected && allBytes[ri * 16 + ci] === selected.val && !isSelected;
                return (
                  <span
                    key={ci}
                    onClick={() => selectByte(ri, ci)}
                    className={`cursor-pointer px-0.5 rounded text-[11.5px] transition-colors
                      ${isSelected ? "bg-blue text-white" : isSameVal ? "bg-green-bg text-green-text" : "hover:bg-blue-bg hover:text-blue-text"}`}
                  >
                    {h}
                  </span>
                );
              })}
            </span>
            <span className="min-w-[118px] text-gray-400 border-l border-gray-200 pl-2 ml-1 tracking-wide text-[11px]">
              {row.ascii.join("")}
            </span>
          </div>
        ))}
      </div>

      {selected && (
        <div className="border-t border-gray-200 bg-gray-50 px-3 py-2 flex gap-4 flex-wrap font-mono text-xs">
          {[
            ["offset", `0x${selected.offset.toString(16).padStart(8, "0")}`],
            ["hex", `0x${selected.val.toString(16).padStart(2, "0").toUpperCase()}`],
            ["dec (u)", selected.val],
            ["dec (s)", selected.val > 127 ? selected.val - 256 : selected.val],
            ["ascii", selected.val >= 32 && selected.val < 127 ? String.fromCharCode(selected.val) : "(non-printable)"],
          ].map(([label, val]) => (
            <div key={label}>
              <b className="block text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</b>
              {val}
            </div>
          ))}
        </div>
      )}

      {stats && (
        <div className="border-t border-gray-200 bg-gray-50 px-3 py-2 flex gap-2 flex-wrap items-center text-xs">
          {[
            ["size", `${stats.size} B`],
            ["entropy", `${stats.entropy}/8`],
            ["printable", `${stats.printable_pct}%`],
            ["nulls", stats.null_count],
          ].map(([label, val]) => (
            <div key={label} className="bg-white border border-gray-200 rounded px-2 py-1">
              <b className="block text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</b>
              {val}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { parseElf } from "../services/api";
import { DEMO_ELF } from "../utils/data";

const FLAG_BADGE = {
  R: "badge-blue", "R+X": "badge-green", RX: "badge-green",
  "R+W": "badge-amber", RW: "badge-amber", X: "badge-red", "—": "badge-gray",
};

function Section({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        className="w-full px-3 py-2 bg-gray-50 text-xs font-medium flex justify-between items-center hover:bg-gray-100"
        onClick={() => setOpen(!open)}
      >
        {title}
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="p-3 font-mono text-xs overflow-x-auto">{children}</div>}
    </div>
  );
}

function KVRows({ obj }) {
  return Object.entries(obj).map(([k, v]) => (
    <div key={k} className="grid grid-cols-[200px_1fr] gap-2 py-0.5 border-b border-gray-100 last:border-0">
      <span className="text-gray-500 text-[11.5px]">{k}</span>
      <span className="text-gray-900 text-[11.5px] break-all">{String(v)}</span>
    </div>
  ));
}

export default function ElfPanel() {
  const [elf, setElf] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const { data, error: err } = await parseElf(file);
    setLoading(false);
    if (err || data?.error) { setError(err || data.error); return; }
    setElf(data);
    setError(null);
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="pane-header">
        ELF Inspector
        <div className="flex gap-2 items-center">
          <input type="file" onChange={handleFile} className="text-xs text-gray-500" />
          <button className="btn" onClick={() => { setElf(DEMO_ELF); setError(null); }}>Demo</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {loading && <p className="text-gray-400 text-center pt-8">Parsing…</p>}
        {error && <p className="text-red text-sm p-4">{error}</p>}
        {!elf && !loading && !error && (
          <p className="text-gray-400 text-center pt-12 text-sm">Upload ELF binary or load demo</p>
        )}

        {elf && (
          <>
            <Section title="ELF Header (Ehdr)">
              <KVRows obj={elf.header} />
            </Section>

            <Section title="Program Headers (Segments)">
              {elf.segments.map((s, i) => (
                <div key={i} className="grid grid-cols-[160px_1fr] gap-2 py-0.5 border-b border-gray-100 last:border-0">
                  <span className="text-gray-500 text-[11.5px]">{s.name}</span>
                  <span className="text-[11.5px]">
                    {s.vaddr}
                    <span className={`badge ml-2 ${FLAG_BADGE[s.flags] || "badge-gray"}`}>{s.flags}</span>
                    <span className="text-gray-400 ml-2">filesz: {s.filesz}</span>
                  </span>
                </div>
              ))}
            </Section>

            <Section title="Section Headers">
              <div className="grid grid-cols-[100px_130px_90px_50px_50px] gap-x-2 text-[10px] text-gray-400 border-b border-gray-200 pb-1 mb-1">
                <span>name</span><span>type</span><span>addr</span><span>size</span><span>flags</span>
              </div>
              {elf.sections.map((s, i) => (
                <div key={i} className="grid grid-cols-[100px_130px_90px_50px_50px] gap-x-2 text-[11.5px] py-0.5 border-b border-gray-100 last:border-0">
                  <span className="text-blue font-mono">{s.name}</span>
                  <span className="text-gray-500 text-[10.5px]">{s.type}</span>
                  <span className="font-mono text-[10.5px]">{s.addr}</span>
                  <span className="font-mono text-[10.5px]">{s.size}</span>
                  <span className="badge badge-gray">{s.flags || "—"}</span>
                </div>
              ))}
            </Section>

            {elf.symbols?.length > 0 && (
              <Section title="Symbol Table">
                <div className="grid grid-cols-[130px_90px_50px_65px_65px] gap-x-2 text-[10px] text-gray-400 border-b border-gray-200 pb-1 mb-1">
                  <span>name</span><span>value</span><span>size</span><span>type</span><span>binding</span>
                </div>
                {elf.symbols.map((s, i) => (
                  <div key={i} className="grid grid-cols-[130px_90px_50px_65px_65px] gap-x-2 text-[11.5px] py-0.5 border-b border-gray-100 last:border-0">
                    <span className="text-blue font-mono">{s.n}</span>
                    <span className="font-mono">{s.v}</span>
                    <span>{s.sz}</span>
                    <span className="badge badge-gray">{s.t}</span>
                    <span className={`badge ${s.b === "GLOBAL" ? "badge-blue" : "badge-gray"}`}>{s.b}</span>
                  </div>
                ))}
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

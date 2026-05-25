import { useState } from "react";
import { assembleSource } from "../services/api";
import { EXAMPLES } from "../utils/data";
import RegisterPanel from "./RegisterPanel";

// Mnemonic colour map — ported from original HTML
const MNEM_COLOR = {
  mov: "#185FA5", lea: "#185FA5", movaps: "#185FA5", addps: "#185FA5",
  push: "#854F0B", pop: "#854F0B",
  call: "#A32D2D", ret: "#A32D2D", jmp: "#A32D2D",
  jz: "#A32D2D", jnz: "#A32D2D", je: "#A32D2D", jne: "#A32D2D",
  jle: "#A32D2D", jge: "#A32D2D", jl: "#A32D2D", jg: "#A32D2D",
  add: "#3B6D11", sub: "#3B6D11", imul: "#3B6D11", inc: "#3B6D11", dec: "#3B6D11",
  xor: "#534AB7", and: "#534AB7", or: "#534AB7", not: "#534AB7",
  shl: "#534AB7", shr: "#534AB7", sar: "#534AB7",
  test: "#3B6D11", cmp: "#3B6D11",
  syscall: "#0F6E56", hlt: "#0F6E56", nop: "#888780",
};

// Simulate register side-effects (same logic as original HTML's simReg)
function simulateRegs(lines) {
  const state = {};
  const dirty = new Set();
  const REGS = ["rax","rbx","rcx","rdx","rdi","rsi","rsp","rbp",
                 "r8","r9","r10","r11","r12","r13","r14","r15"];
  REGS.forEach((r) => (state[r] = 0));

  const set = (r, v) => { if (r in state) { state[r] = v >>> 0; dirty.add(r); } };

  lines.forEach((l) => {
    if (l.type !== "instr") return;
    const norm = `${l.mnem} ${l.operands}`.trim();
    const movM = norm.match(/^mov (r\w+),\s*(.+)/);
    if (movM) {
      const v = parseInt(movM[2].replace(/^0x/i, ""), 16);
      if (!isNaN(v)) set(movM[1], v);
    }
    if (/^xor (\w+), \1/.test(norm)) set(norm.match(/^xor (\w+)/)[1], 0);
    if (norm.startsWith("inc ")) set(norm.slice(4).trim(), (state[norm.slice(4).trim()] || 0) + 1);
    if (norm.startsWith("dec ")) set(norm.slice(4).trim(), (state[norm.slice(4).trim()] || 0) - 1);
  });

  return { state, dirty };
}

export default function NasmPanel() {
  const [source, setSource] = useState(EXAMPLES.hello);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [regState, setRegState] = useState({});
  const [dirtyRegs, setDirtyRegs] = useState(new Set());

  async function handleAssemble() {
    setLoading(true);
    const { data, error } = await assembleSource(source);
    setLoading(false);
    if (error) { setResult({ error }); return; }
    setResult(data);
    const { state, dirty } = simulateRegs(data.lines || []);
    setRegState(state);
    setDirtyRegs(dirty);
  }

  function handleClear() {
    setSource("");
    setResult(null);
    setRegState({});
    setDirtyRegs(new Set());
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 grid grid-cols-2 gap-px bg-gray-200 min-h-0">
        {/* Left: editor */}
        <div className="flex flex-col bg-white">
          <div className="pane-header">
            NASM Source
            <div className="flex gap-1">
              <select
                className="text-xs px-2 py-1 border border-gray-300 rounded bg-white"
                onChange={(e) => setSource(EXAMPLES[e.target.value] || "")}
              >
                {Object.keys(EXAMPLES).map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
          </div>
          <textarea
            className="flex-1 font-mono text-xs p-3 resize-none outline-none leading-relaxed"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            spellCheck={false}
          />
          <div className="pane-header border-t border-b-0">
            <div className="flex gap-2 items-center">
              <button className="btn-primary" onClick={handleAssemble} disabled={loading}>
                {loading ? "Assembling…" : "▶ Assemble"}
              </button>
              <button className="btn" onClick={handleClear}>Clear</button>
              {result && (
                <span className={`text-xs ${result.error ? "text-red" : "text-green"}`}>
                  {result.error || `${result.total_bytes} bytes · OK`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: disassembly output */}
        <div className="flex flex-col bg-white">
          <div className="pane-header">
            Disassembly + Hex
            <span className="text-xs text-gray-400">{result?.total_bytes ? `${result.total_bytes} bytes` : ""}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed">
            {!result && <p className="text-gray-400 text-center pt-8">Click Assemble →</p>}
            {result?.lines?.map((line, i) => <DisasmLine key={i} line={line} />)}
          </div>
          <div className="pane-header border-t border-b-0">
            Register state <span className="text-[10px] text-gray-400">(simulated — amber = modified)</span>
          </div>
          <RegisterPanel regState={regState} dirtyRegs={dirtyRegs} />
        </div>
      </div>
    </div>
  );
}

function DisasmLine({ line }) {
  if (line.type === "blank") return <div className="h-1" />;
  if (line.type === "comment") return <div className="text-gray-400 text-[11px]">{line.text}</div>;
  if (line.type === "section") return <div className="text-gray-500 text-[11px] border-t border-gray-100 mt-1 pt-1">{line.text}</div>;
  if (line.type === "label") return <div className="text-amber font-medium text-[11.5px] my-0.5">{line.text}</div>;
  if (line.type === "directive") return <div className="text-gray-400 text-[11px]">{line.text}</div>;
  if (line.type === "error") return (
    <div className="text-red bg-red-bg px-2 py-0.5 rounded text-xs my-0.5">
      ✗ unencoded: <span className="font-mono">{line.text}</span>
    </div>
  );
  if (line.type === "data") return (
    <div className="flex gap-2 items-baseline py-px">
      <span className="text-gray-400 text-[11px] min-w-[72px]">{line.addr}</span>
      <span className="text-blue min-w-[120px]">{line.hex}</span>
      <span className="text-teal text-[11px]">{line.text}</span>
    </div>
  );
  // instr
  const col = MNEM_COLOR[line.mnem] || "#111";
  return (
    <div className="flex gap-2 items-baseline py-px">
      <span className="text-gray-400 text-[11px] min-w-[72px]">{line.addr}</span>
      <span className="text-blue min-w-[120px] text-[11.5px]">{line.hex}</span>
      <span style={{ color: col }} className="font-medium min-w-[65px]">{line.mnem}</span>
      <span className="text-green-text">{line.operands}</span>
    </div>
  );
}

// Register names for x86-64
const REGS = ["rax","rbx","rcx","rdx","rdi","rsi","rsp","rbp",
               "r8","r9","r10","r11","r12","r13","r14","r15"];

export default function RegisterPanel({ regState, dirtyRegs }) {
  return (
    <div className="border-t border-gray-200 p-2 bg-gray-50 grid grid-cols-4 gap-1">
      {REGS.map((r) => {
        const dirty = dirtyRegs.has(r);
        const val = "0x" + ((regState[r] || 0) >>> 0).toString(16).padStart(8, "0");
        return (
          <div
            key={r}
            className={`border rounded p-1.5 font-mono text-xs
              ${dirty ? "border-amber bg-amber-bg" : "border-gray-200 bg-white"}`}
          >
            <span className="block text-gray-400 text-[10px]">{r}</span>
            <span className={dirty ? "text-amber-text font-medium" : "text-blue font-medium"}>
              {val}
            </span>
          </div>
        );
      })}
    </div>
  );
}

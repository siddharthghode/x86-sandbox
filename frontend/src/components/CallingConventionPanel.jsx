// Calling convention reference — pure static data, no API needed.
// Ported directly from the original HTML's conv panel.

function CCTable({ headers, rows }) {
  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h} className="text-left px-2 py-1 text-[11px] font-medium text-gray-400 border-b border-gray-200">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-gray-100 last:border-0">
            {row.map((cell, j) => (
              <td key={j} className={`px-2 py-1 font-mono text-[11.5px] ${j === 2 ? (cell.startsWith("YES") ? "text-green" : cell.startsWith("NO") ? "text-red" : "text-gray-500") : "text-gray-700"}`}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-medium text-gray-500 mb-2 border-b border-gray-200 pb-1">{title}</h3>
      {children}
    </div>
  );
}

export default function CallingConventionPanel() {
  return (
    <div className="flex-1 grid grid-cols-2 gap-px bg-gray-200 overflow-hidden">
      <div className="bg-white overflow-y-auto p-4">
        <Section title="System V AMD64 (Linux/macOS — most common)">
          <CCTable
            headers={["Role", "Registers", "Preserved?"]}
            rows={[
              ["Integer args 1–6", "rdi rsi rdx rcx r8 r9", "NO (caller-saved)"],
              ["Float args 1–8", "xmm0–xmm7", "NO"],
              ["Return value", "rax (rdx for 128-bit)", "NO"],
              ["Callee-saved", "rbx rbp r12–r15", "YES"],
              ["Stack ptr", "rsp", "YES (16-byte align)"],
              ["Varargs count", "rax = # of xmm args", "—"],
              ["Red zone", "128 bytes below rsp", "leaf fn safe"],
            ]}
          />
        </Section>

        <Section title="Windows x64 (MSVC / __fastcall)">
          <CCTable
            headers={["Role", "Registers", "Preserved?"]}
            rows={[
              ["Integer args 1–4", "rcx rdx r8 r9", "NO"],
              ["Float args 1–4", "xmm0–xmm3", "NO"],
              ["Return value", "rax / xmm0", "NO"],
              ["Callee-saved", "rbx rbp rdi rsi r12–r15 xmm6–xmm15", "YES"],
              ["Shadow space", "32 bytes on stack (always)", "caller allocates"],
              ["Stack align", "16 bytes at call", "—"],
            ]}
          />
        </Section>
      </div>

      <div className="bg-white overflow-y-auto p-4">
        <Section title="Linux x86 32-bit (cdecl)">
          <CCTable
            headers={["Role", "Where", "Preserved?"]}
            rows={[
              ["All args", "stack (right→left)", "—"],
              ["Return value", "eax (edx:eax for 64-bit)", "NO"],
              ["Callee-saved", "ebx esi edi ebp", "YES"],
              ["Cleanup", "caller pops args", "—"],
            ]}
          />
        </Section>

        <Section title="Syscall — Linux x86-64">
          <CCTable
            headers={["Arg", "Register"]}
            rows={[
              ["syscall number", "rax"],
              ["arg1", "rdi"], ["arg2", "rsi"], ["arg3", "rdx"],
              ["arg4", "r10"], ["arg5", "r8"], ["arg6", "r9"],
              ["return", "rax"], ["clobbered", "rcx, r11"],
            ]}
          />
        </Section>

        <Section title="Common syscall numbers (x86-64 Linux)">
          <CCTable
            headers={["#", "Name", "Args (rdi, rsi, rdx)"]}
            rows={[
              ["0", "read", "fd, buf, count"],
              ["1", "write", "fd, buf, count"],
              ["2", "open", "path, flags, mode"],
              ["3", "close", "fd"],
              ["9", "mmap", "addr, len, prot, flags, fd, off"],
              ["59", "execve", "path, argv, envp"],
              ["60", "exit", "status"],
              ["231", "exit_group", "status"],
            ]}
          />
        </Section>
      </div>
    </div>
  );
}

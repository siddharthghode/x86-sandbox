// NASM example programs — ported directly from the original HTML
export const EXAMPLES = {
  hello: `; Linux x86-64 Hello World
section .text
  global _start
_start:
  mov rax, 1        ; sys_write
  mov rdi, 1        ; stdout
  mov rsi, msg      ; buffer ptr
  mov rdx, 13       ; length
  syscall
  mov rax, 60       ; sys_exit
  xor rdi, rdi      ; exit code 0
  syscall
section .data
  msg db 'Hello World!', 10`,

  fact: `; Recursive factorial — n! in rdi, result in rax
section .text
  global factorial
factorial:
  cmp rdi, 1
  jle .base
  push rbx
  mov rbx, rdi
  dec rdi
  call factorial
  imul rax, rbx
  pop rbx
  ret
.base:
  mov rax, 1
  ret`,

  fib: `; Iterative Fibonacci — fib(n) in rdi, result in rax
section .text
  global fib
fib:
  test rdi, rdi
  jz .zero
  cmp rdi, 1
  je .one
  xor rax, rax
  mov rcx, 1
.loop:
  add rax, rcx
  xchg rax, rcx
  dec rdi
  cmp rdi, 1
  jg .loop
  mov rax, rcx
  ret
.zero:
  xor rax, rax
  ret
.one:
  mov rax, 1
  ret`,

  str: `; strlen: rdi = string ptr, returns rax = length
section .text
  global strlen_asm
strlen_asm:
  xor rax, rax
.scan:
  cmp byte [rdi+rax], 0
  je .done
  inc rax
  jmp .scan
.done:
  ret`,

  shell: `; x86-64 execve('/bin/sh') shellcode
section .text
  global _start
_start:
  xor rdx, rdx
  xor rsi, rsi
  lea rdi, [rip+sh]
  push 59
  pop rax
  syscall
sh: db '/bin/sh', 0`,

  simd: `; SSE: add 4 floats packed in xmm0 and xmm1
section .text
  global vec_add
vec_add:
  movaps xmm0, [rdi]
  addps  xmm0, [rsi]
  ret`,
};

// x86-64 instruction reference — ported from the original HTML's ISET array
export const ISET = [
  { m: "MOV", enc: "88/89/8A/8B/B0–BF/C6/C7", cat: "data", desc: "Copy src to dst. No flags affected.", ex: "mov rax, 0x1337", clk: "1", flags: "—", detail: "Rex.W prefix (0x48) for 64-bit ops. MOVZX/MOVSX zero/sign-extend." },
  { m: "MOVZX", enc: "0F B6/B7", cat: "data", desc: "Move with zero-extension.", ex: "movzx rax, byte [rdi]", clk: "1", flags: "—", detail: "movzx eax, byte [ptr] zero-extends byte→dword." },
  { m: "MOVSX", enc: "0F BE/BF", cat: "data", desc: "Move with sign-extension.", ex: "movsx rax, byte [rdi]", clk: "1", flags: "—", detail: "Used for signed byte/word loads." },
  { m: "LEA", enc: "8D", cat: "data", desc: "Load Effective Address. Computes address — no memory access.", ex: "lea rdi, [rip+msg]", clk: "1", flags: "—", detail: "Can do arithmetic: lea rax,[rax+rbx*4+8]." },
  { m: "PUSH", enc: "50–57 / FF /6 / 6A / 68", cat: "stack", desc: "Push value onto stack. RSP -= 8 then [RSP] = src.", ex: "push rbx", clk: "1", flags: "—", detail: "6A = push imm8 (sign-extended). 68 = push imm32." },
  { m: "POP", enc: "58–5F / 8F /0", cat: "stack", desc: "Pop value from stack. dst = [RSP]; RSP += 8.", ex: "pop rbx", clk: "1", flags: "—", detail: "Can pop to memory: pop [addr]." },
  { m: "CALL", enc: "E8 / FF /2", cat: "control", desc: "Call procedure. Pushes RIP, transfers control.", ex: "call printf", clk: "3", flags: "—", detail: "E8 = near relative. FF /2 = indirect (PLT/GOT)." },
  { m: "RET", enc: "C3 / C2 imm16", cat: "control", desc: "Return from procedure. Pop RIP from stack.", ex: "ret", clk: "1–3", flags: "—", detail: "C2 imm16 pops N bytes after popping RIP (stdcall)." },
  { m: "JMP", enc: "EB / E9 / FF /4", cat: "control", desc: "Unconditional jump. Short (±127), near (±2GB), indirect.", ex: "jmp .loop", clk: "1", flags: "—", detail: "EB = short 8-bit. E9 = near 32-bit. FF /4 = indirect." },
  { m: "Jcc", enc: "70–7F / 0F 80–8F", cat: "control", desc: "Conditional jumps based on flags (ZF,CF,SF,OF,PF).", ex: "jz .done / jnz .loop / jl .neg", clk: "1", flags: "various", detail: "JZ/JE, JNZ/JNE, JL/JNGE, JG/JNLE, JLE, JGE. Unsigned: JB, JA." },
  { m: "ADD", enc: "00–03 / 80–83 /0 / 05", cat: "arith", desc: "dst = dst + src. Sets CF,OF,SF,ZF,PF,AF.", ex: "add rax, rbx", clk: "1", flags: "C O S Z P A", detail: "CF = unsigned overflow. OF = signed overflow." },
  { m: "SUB", enc: "28–2B / 80–83 /5 / 2D", cat: "arith", desc: "dst = dst − src. Sets CF (borrow), OF, SF, ZF.", ex: "sub rsp, 0x20", clk: "1", flags: "C O S Z P A", detail: "CF = borrow. Used internally by CMP." },
  { m: "IMUL", enc: "F7 /5 / 0F AF / 69 / 6B", cat: "arith", desc: "Signed multiply. 1-op, 2-op, 3-op forms.", ex: "imul rax, rcx", clk: "3", flags: "C O", detail: "2-op: dst *= src. 3-op: dst = src * imm." },
  { m: "IDIV", enc: "F7 /7", cat: "arith", desc: "Signed divide RDX:RAX ÷ src. Quotient→RAX, Rem→RDX.", ex: "idiv rcx", clk: "15–40", flags: "undefined", detail: "Sign-extend RAX via CQO before dividing. Very slow." },
  { m: "INC/DEC", enc: "FF /0,/1", cat: "arith", desc: "Increment or decrement by 1. Does NOT touch CF.", ex: "inc rax / dec rcx", clk: "1", flags: "O S Z P A", detail: "Preserves CF across loop counting." },
  { m: "NEG", enc: "F6 /3 / F7 /3", cat: "arith", desc: "Two's complement negation. dst = 0 − dst.", ex: "neg rax", clk: "1", flags: "C O S Z P A", detail: "CF=0 if src was 0, else CF=1." },
  { m: "AND", enc: "20–23 / 80–83 /4 / 24", cat: "logic", desc: "Bitwise AND. Clears CF and OF.", ex: "and rax, 0xF", clk: "1", flags: "C=0 O=0 S Z P", detail: "Masking: and eax,0x7f. Alignment: and rsp,-16." },
  { m: "OR", enc: "08–0B / 80–83 /1 / 0C", cat: "logic", desc: "Bitwise OR. Clears CF and OF.", ex: "or rax, 0x80000000", clk: "1", flags: "C=0 O=0 S Z P", detail: "Set bits." },
  { m: "XOR", enc: "30–33 / 80–83 /6 / 34", cat: "logic", desc: "Bitwise XOR. XOR reg,reg → fast zero.", ex: "xor eax, eax", clk: "1", flags: "C=0 O=0 S Z P", detail: "xor eax,eax is 2 bytes vs mov eax,0 (5 bytes)." },
  { m: "NOT", enc: "F6 /2 / F7 /2", cat: "logic", desc: "Bitwise NOT. No flags changed.", ex: "not rax", clk: "1", flags: "—", detail: "Flip all bits. NEG = NOT + 1." },
  { m: "SHL/SAL", enc: "D0–D3 /4 / C0–C1 /4", cat: "logic", desc: "Shift left. Multiply by 2^n.", ex: "shl rax, 3", clk: "1", flags: "C O S Z P", detail: "Last shifted-out bit → CF." },
  { m: "SHR", enc: "D0–D3 /5 / C0–C1 /5", cat: "logic", desc: "Logical shift right. Unsigned /2^n.", ex: "shr rax, 2", clk: "1", flags: "C O S Z P", detail: "Upper bits filled with 0." },
  { m: "SAR", enc: "D0–D3 /7 / C0–C1 /7", cat: "logic", desc: "Arithmetic shift right. Preserves sign bit.", ex: "sar rax, 1", clk: "1", flags: "C O S Z P", detail: "MSB copied into vacated positions." },
  { m: "CMP", enc: "38–3B / 80–83 /7 / 3C", cat: "arith", desc: "Compare: computes dst−src, discards result, sets flags.", ex: "cmp rax, 0", clk: "1", flags: "C O S Z P A", detail: "CMP a,b then: JZ (a==b), JL (a<b signed), JB (a<b unsigned)." },
  { m: "TEST", enc: "84–85 / F6–F7 /0", cat: "logic", desc: "AND but discard result. Faster null/flag check.", ex: "test rax, rax", clk: "1", flags: "C=0 O=0 S Z P", detail: "test rax,rax → ZF=1 iff rax==0." },
  { m: "SYSCALL", enc: "0F 05", cat: "system", desc: "Fast 64-bit Linux syscall.", ex: "syscall", clk: "100+", flags: "C Z O", detail: "RAX=number, RDI,RSI,RDX,R10,R8,R9 = args. Clobbers RCX,R11." },
  { m: "INT", enc: "CC / CD imm8", cat: "system", desc: "Software interrupt. INT3 = breakpoint (0xCC).", ex: "int3 / int 0x80", clk: "100+", flags: "—", detail: "0xCC is single-byte INT3 used by debuggers." },
  { m: "NOP", enc: "90 / 0F 1F", cat: "data", desc: "No operation. Used for alignment/patching.", ex: "nop", clk: "1", flags: "—", detail: "Multi-byte NOP: 0F 1F /0 (up to 9 bytes)." },
  { m: "MOVAPS", enc: "0F 28/29", cat: "sse", desc: "Move aligned packed single-precision (128-bit XMM).", ex: "movaps xmm0, [rdi]", clk: "1", flags: "—", detail: "Requires 16-byte alignment or #GP." },
  { m: "ADDPS", enc: "0F 58", cat: "sse", desc: "Add packed single-precision floats (4 × SP float / XMM).", ex: "addps xmm0, xmm1", clk: "4", flags: "—", detail: "SIMD 4-wide float add." },
  { m: "PXOR", enc: "66 0F EF", cat: "sse", desc: "Packed XOR for 128-bit XMM. Fastest way to zero XMM reg.", ex: "pxor xmm0, xmm0", clk: "1", flags: "—", detail: "Zero idiom: pxor xmm0,xmm0." },
];

export const CAT_BADGE = {
  data: "badge-blue", arith: "badge-amber", logic: "badge-purple",
  control: "badge-red", stack: "badge-gray", string: "badge-amber",
  sse: "badge-teal", system: "badge-green",
};

// Demo ELF data — ported from the original HTML's DEMO_ELF_DATA
export const DEMO_ELF = {
  header: {
    magic: "7f 45 4c 46", class: "ELF64 (2)", data: "Little Endian (ELFDATA2LSB)",
    os_abi: "UNIX System V (0x00)", type: "ET_EXEC (executable)",
    machine: "EM_X86_64 (0x3e)", entry: "0x0000000000401000",
    phoff: "64", shoff: "14208", ehsize: "64",
    phentsize: "56", phnum: "3", shentsize: "64", shnum: "6", shstrndx: "5",
  },
  segments: [
    { name: "PT_PHDR", offset: "0x40", vaddr: "0x400040", filesz: "0xa8", memsz: "0xa8", flags: "R" },
    { name: "PT_LOAD .text", offset: "0x0", vaddr: "0x400000", filesz: "0x1b4", memsz: "0x1b4", flags: "R+X" },
    { name: "PT_LOAD .data", offset: "0x1b4", vaddr: "0x600000", filesz: "0x0d", memsz: "0x10", flags: "R+W" },
  ],
  sections: [
    { name: ".text", type: "SHT_PROGBITS", addr: "0x401000", size: "0xb4", flags: "AX", align: "16" },
    { name: ".rodata", type: "SHT_PROGBITS", addr: "0x402000", size: "0x0d", flags: "A", align: "4" },
    { name: ".data", type: "SHT_PROGBITS", addr: "0x601000", size: "0x10", flags: "WA", align: "8" },
    { name: ".bss", type: "SHT_NOBITS", addr: "0x601010", size: "0x08", flags: "WA", align: "8" },
    { name: ".symtab", type: "SHT_SYMTAB", addr: "0x0", size: "0xb0", flags: "", align: "8" },
    { name: ".shstrtab", type: "SHT_STRTAB", addr: "0x0", size: "0x2c", flags: "", align: "1" },
  ],
  symbols: [
    { n: "_start", v: "0x401000", sz: 0, t: "FUNC", b: "GLOBAL", sec: ".text" },
    { n: "msg", v: "0x402000", sz: 13, t: "OBJECT", b: "LOCAL", sec: ".rodata" },
  ],
};

// Demo binary bytes — ported from the original HTML's loadDemoBin()
export const DEMO_BINARY = new Uint8Array([
  0x7F, 0x45, 0x4C, 0x46, 0x02, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x02, 0x00, 0x3E, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x10, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x37, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x40, 0x00, 0x38, 0x00, 0x03, 0x00, 0x40, 0x00, 0x06, 0x00, 0x05, 0x00,
  0x48, 0xC7, 0xC0, 0x01, 0x00, 0x00, 0x00, 0x48, 0xC7, 0xC7, 0x01, 0x00, 0x00, 0x00, 0x48, 0x8D,
  0x35, 0x12, 0x00, 0x00, 0x00, 0x48, 0xC7, 0xC2, 0x0D, 0x00, 0x00, 0x00, 0x0F, 0x05, 0x48, 0xC7,
  0xC0, 0x3C, 0x00, 0x00, 0x00, 0x48, 0x31, 0xFF, 0x0F, 0x05, 0x48, 0x65, 0x6C, 0x6C, 0x6F, 0x20,
  0x57, 0x6F, 0x72, 0x6C, 0x64, 0x21, 0x0A, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
]);

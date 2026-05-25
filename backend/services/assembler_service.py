"""
assembler_service.py
Runs NASM on submitted source code and returns encoded bytes + disassembly lines.
Falls back to the JS-side encoding table if NASM is not installed.
"""
import subprocess, tempfile, os, struct

# ── encoding table (ported from the original HTML's ENC / MOV64_PFX etc.) ──
ENC = {
    "nop": [0x90], "ret": [0xC3], "syscall": [0x0F, 0x05], "hlt": [0xF4],
    "push rbx": [0x53], "push rax": [0x50], "push rcx": [0x51], "push rdx": [0x52],
    "push rsi": [0x56], "push rdi": [0x57], "push rbp": [0x55], "push rsp": [0x54],
    "push r12": [0x41, 0x54], "push r13": [0x41, 0x55],
    "push r14": [0x41, 0x56], "push r15": [0x41, 0x57],
    "pop rbx": [0x5B], "pop rax": [0x58], "pop rcx": [0x59], "pop rdx": [0x5A],
    "pop rsi": [0x5E], "pop rdi": [0x5F], "pop rbp": [0x5D],
    "pop r12": [0x41, 0x5C], "pop r13": [0x41, 0x5D],
    "pop r14": [0x41, 0x5E], "pop r15": [0x41, 0x5F],
    "xor rax, rax": [0x48, 0x31, 0xC0], "xor rbx, rbx": [0x48, 0x31, 0xDB],
    "xor rcx, rcx": [0x48, 0x31, 0xC9], "xor rdx, rdx": [0x48, 0x31, 0xD2],
    "xor rdi, rdi": [0x48, 0x31, 0xFF], "xor rsi, rsi": [0x48, 0x31, 0xF6],
    "xor r8, r8": [0x4D, 0x31, 0xC0], "xor r9, r9": [0x4D, 0x31, 0xC9],
    "add rax, rbx": [0x48, 0x01, 0xD8], "add rax, rcx": [0x48, 0x01, 0xC8],
    "add rax, rdx": [0x48, 0x01, 0xD0], "add rdi, rsi": [0x48, 0x01, 0xF7],
    "sub rax, rbx": [0x48, 0x29, 0xD8], "sub rax, rcx": [0x48, 0x29, 0xC8],
    "sub rsp, 0x20": [0x48, 0x83, 0xEC, 0x20],
    "sub rsp, 0x10": [0x48, 0x83, 0xEC, 0x10],
    "sub rsp, 0x8": [0x48, 0x83, 0xEC, 0x08],
    "imul rax, rbx": [0x48, 0x0F, 0xAF, 0xC3],
    "imul rax, rcx": [0x48, 0x0F, 0xAF, 0xC1],
    "inc rax": [0x48, 0xFF, 0xC0], "inc rcx": [0x48, 0xFF, 0xC1],
    "inc rdi": [0x48, 0xFF, 0xC7],
    "dec rax": [0x48, 0xFF, 0xC8], "dec rcx": [0x48, 0xFF, 0xC9],
    "dec rdi": [0x48, 0xFF, 0xCF],
    "neg rax": [0x48, 0xF7, 0xD8], "not rax": [0x48, 0xF7, 0xD0],
    "and rax, rbx": [0x48, 0x21, 0xD8], "or rax, rbx": [0x48, 0x09, 0xD8],
    "shl rax, 1": [0x48, 0xD1, 0xE0], "shr rax, 1": [0x48, 0xD1, 0xE8],
    "sar rax, 1": [0x48, 0xD1, 0xF8],
    "xchg rax, rcx": [0x48, 0x91], "xchg rax, rbx": [0x48, 0x93],
    "cmp rdi, 1": [0x48, 0x83, 0xFF, 0x01],
    "cmp rax, 0": [0x48, 0x83, 0xF8, 0x00],
    "cmp rdi, 0": [0x48, 0x83, 0xFF, 0x00],
    "test rdi, rdi": [0x48, 0x85, 0xFF], "test rax, rax": [0x48, 0x85, 0xC0],
    "test rcx, rcx": [0x48, 0x85, 0xC9],
    "jz .done": [0x74, 0x00], "je .done": [0x74, 0x00],
    "jnz .loop": [0x75, 0xFE], "jne .loop": [0x75, 0xFE],
    "jmp .loop": [0xEB, 0xFE], "jmp .scan": [0xEB, 0xFE],
    "jle .base": [0x7E, 0x00], "jl .neg": [0x7C, 0x00],
    "jg .larger": [0x7F, 0x00], "jge .ok": [0x7D, 0x00],
    "jz .zero": [0x74, 0x00], "je .one": [0x74, 0x02],
    "jg .loop": [0x7F, 0xF6],
    "call factorial": [0xE8, 0x00, 0x00, 0x00, 0x00],
    "call fib": [0xE8, 0x00, 0x00, 0x00, 0x00],
    "call printf": [0xE8, 0x00, 0x00, 0x00, 0x00],
    "movaps xmm0, [rdi]": [0x0F, 0x28, 0x07],
    "addps  xmm0, [rsi]": [0x0F, 0x58, 0x06],
    "addps xmm0, [rsi]": [0x0F, 0x58, 0x06],
    "push 59": [0x6A, 0x3B],
}

MOV64_PFX = {
    "mov rax,": [0x48, 0xB8], "mov rbx,": [0x48, 0xBB],
    "mov rcx,": [0x48, 0xB9], "mov rdx,": [0x48, 0xBA],
    "mov rdi,": [0x48, 0xBF], "mov rsi,": [0x48, 0xBE],
    "mov r8,": [0x49, 0xB8], "mov r9,": [0x49, 0xB9],
    "mov r10,": [0x49, 0xBA], "mov r11,": [0x49, 0xBB],
}
SHIFT_PFX = {
    "shl rax,": [0x48, 0xC1, 0xE0], "shr rax,": [0x48, 0xC1, 0xE8],
    "sar rax,": [0x48, 0xC1, 0xF8],
}
LOGIC_IMM = {
    "and rax,": [0x48, 0x83, 0xE0], "or rax,": [0x48, 0x83, 0xC8],
    "xor rax,": [0x48, 0x83, 0xF0],
}
ARITH_IMM = {
    "add rax,": [0x48, 0x83, 0xC0], "sub rax,": [0x48, 0x83, 0xE8],
    "add rcx,": [0x48, 0x83, 0xC1], "sub rcx,": [0x48, 0x83, 0xE9],
    "add rdi,": [0x48, 0x83, 0xC7], "add rdx,": [0x48, 0x83, 0xC2],
    "cmp rax,": [0x48, 0x83, 0xF8], "cmp rdi,": [0x48, 0x83, 0xFF],
    "cmp rcx,": [0x48, 0x83, 0xF9],
}


def _parse_imm(s: str):
    s = s.strip()
    try:
        return int(s, 16) if s.startswith("0x") or s.startswith("0X") else int(s, 10)
    except ValueError:
        return None


def _encode_fallback(norm: str):
    """Encode a single normalised instruction using the lookup tables."""
    if norm in ENC:
        return ENC[norm]
    for k, pfx in MOV64_PFX.items():
        if norm.startswith(k):
            v = _parse_imm(norm[len(k):].strip().replace(",", ""))
            if v is not None:
                return pfx + list(struct.pack("<q", v & 0xFFFFFFFFFFFFFFFF))
    for tables in (SHIFT_PFX, LOGIC_IMM, ARITH_IMM):
        for k, pfx in tables.items():
            if norm.startswith(k):
                v = _parse_imm(norm[len(k):].strip())
                if v is not None:
                    return pfx + [v & 0xFF]
    return None


def _try_nasm(source: str):
    """Try to assemble with real NASM. Returns (bytes, error_str)."""
    try:
        with tempfile.TemporaryDirectory() as d:
            src_path = os.path.join(d, "in.asm")
            obj_path = os.path.join(d, "out.o")
            with open(src_path, "w") as f:
                f.write(source)
            result = subprocess.run(
                ["nasm", "-f", "bin", src_path, "-o", obj_path],
                capture_output=True, text=True, timeout=5
            )
            if result.returncode != 0:
                return None, result.stderr.strip()
            with open(obj_path, "rb") as f:
                return f.read(), None
    except FileNotFoundError:
        return None, "nasm_not_found"
    except Exception as e:
        return None, str(e)


def assemble(source: str) -> dict:
    """
    Main entry point. Returns:
      { lines: [{addr, hex, mnem, operands, type}], total_bytes, error }
    """
    raw_bytes, nasm_err = _try_nasm(source)

    # If NASM succeeded, return raw bytes with basic line info
    if raw_bytes is not None:
        hex_str = " ".join(f"{b:02X}" for b in raw_bytes)
        return {
            "lines": [{"addr": "0x00401000", "hex": hex_str,
                        "mnem": "(nasm)", "operands": "", "type": "body"}],
            "total_bytes": len(raw_bytes),
            "raw_hex": hex_str,
            "error": None,
            "backend": "nasm",
        }

    # Fallback: line-by-line encoding table (same logic as original HTML)
    lines = []
    addr = 0x401000
    total = 0
    errors = 0

    for raw in source.splitlines():
        line = raw.strip()
        if not line:
            lines.append({"type": "blank"})
            continue
        if line.startswith(";"):
            lines.append({"type": "comment", "text": line})
            continue
        if line.startswith("section"):
            lines.append({"type": "section", "text": line})
            continue
        if line.endswith(":") and " " not in line.rstrip(":"):
            lines.append({"type": "label", "text": line})
            continue
        if any(line.startswith(d) for d in ("global", "extern", "db", "dw", "dd", "dq", "%")):
            # handle db inline data
            if " db " in line:
                parts = line.split(" db ", 1)
                data_bytes = []
                for p in parts[1].split(","):
                    p = p.strip()
                    if p.startswith("'") and p.endswith("'"):
                        data_bytes.extend(ord(c) for c in p[1:-1])
                    else:
                        try:
                            data_bytes.append(int(p, 0) & 0xFF)
                        except ValueError:
                            pass
                if data_bytes:
                    lines.append({
                        "type": "data",
                        "addr": f"0x{addr:08x}",
                        "hex": " ".join(f"{b:02X}" for b in data_bytes),
                        "text": line,
                    })
                    addr += len(data_bytes)
                    total += len(data_bytes)
                    continue
            lines.append({"type": "directive", "text": line})
            continue

        norm = " ".join(line.lower().split()).replace(", ", ", ")
        encoded = _encode_fallback(norm)
        if encoded:
            mnem = norm.split()[0]
            operands = norm[len(mnem):].strip()
            lines.append({
                "type": "instr",
                "addr": f"0x{addr:08x}",
                "hex": " ".join(f"{b:02X}" for b in encoded),
                "mnem": mnem,
                "operands": operands,
            })
            addr += len(encoded)
            total += len(encoded)
        else:
            lines.append({"type": "error", "text": line})
            errors += 1

    return {
        "lines": lines,
        "total_bytes": total,
        "error": f"{errors} unencoded line(s)" if errors else None,
        "backend": "fallback",
    }

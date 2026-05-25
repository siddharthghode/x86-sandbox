"""
binary_service.py
Computes entropy, byte frequency, and opcode hints for a binary blob.
Ported from the original HTML's renderHex() stats section.
"""
import math
from collections import Counter

OPCODE_HINTS = {
    0x48: "REX.W prefix (64-bit op)", 0x55: "push rbp", 0x53: "push rbx",
    0x90: "NOP", 0xC3: "RET", 0xCC: "INT3 (breakpoint)",
    0x0F: "2-byte opcode escape", 0xE8: "CALL rel32",
    0xEB: "JMP short", 0xE9: "JMP near rel32",
    0xFF: "indirect JMP/CALL or INC/DEC",
    0x74: "JZ short", 0x75: "JNZ short",
    0x50: "PUSH rax", 0x58: "POP rax",
    0x6A: "PUSH imm8", 0x68: "PUSH imm32",
    0x8B: "MOV r,r/m", 0x89: "MOV r/m,r",
    0xB8: "MOV EAX,imm32", 0x31: "XOR r/m,r",
    0x29: "SUB r/m,r", 0x01: "ADD r/m,r",
    0x83: "ADD/SUB/AND/OR/XOR r/m,imm8",
    0x7E: "JLE short", 0x7F: "JG short",
    0x7C: "JL short", 0x7D: "JGE short",
    0xF3: "REP prefix / SSE prefix",
    0x66: "Operand-size override / SSE prefix",
    0x41: "REX.B prefix (r8–r15)",
}


def analyze(data: bytes) -> dict:
    freq = Counter(data)
    total = len(data)

    # Shannon entropy
    entropy = 0.0
    for count in freq.values():
        p = count / total
        entropy -= p * math.log2(p)

    most_common_byte, most_common_count = freq.most_common(1)[0]
    printable_count = sum(1 for b in data if 32 <= b < 127)

    # Build hex rows (16 bytes per row, max 2048 bytes shown)
    rows = []
    display_bytes = data[:2048]
    for i in range(0, len(display_bytes), 16):
        chunk = display_bytes[i: i + 16]
        rows.append({
            "offset": f"0x{i:08x}",
            "hex": [f"{b:02X}" for b in chunk],
            "ascii": [chr(b) if 32 <= b < 127 else "." for b in chunk],
        })

    return {
        "rows": rows,
        "stats": {
            "size": total,
            "entropy": round(entropy, 4),
            "most_common_byte": f"0x{most_common_byte:02X}",
            "most_common_count": most_common_count,
            "printable_pct": round(100 * printable_count / total, 1) if total else 0,
            "null_count": freq.get(0, 0),
            "truncated": len(data) > 2048,
        },
        "opcode_hints": OPCODE_HINTS,
    }


def byte_info(data: bytes, offset: int) -> dict:
    if offset >= len(data):
        return {"error": "offset out of range"}
    val = data[offset]
    u16 = (data[offset] | (data[offset + 1] << 8)) if offset + 1 < len(data) else val
    u32 = int.from_bytes(data[offset: offset + 4], "little") if offset + 3 < len(data) else val
    return {
        "offset": f"0x{offset:08x}",
        "hex": f"0x{val:02X}",
        "dec_unsigned": val,
        "dec_signed": val - 256 if val > 127 else val,
        "ascii": chr(val) if 32 <= val < 127 else "(non-printable)",
        "opcode_hint": OPCODE_HINTS.get(val, "(no specific hint)"),
        "uint16_le": f"0x{u16:04X} ({u16})",
        "uint32_le": f"0x{u32:08X} ({u32})",
    }

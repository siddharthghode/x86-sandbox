"""
elf_service.py
Parses an ELF binary (bytes) and returns structured JSON.
Ported directly from the original HTML's parseRealELF() function.
"""
import struct


def _read_str(data: bytes, offset: int) -> str:
    end = data.index(b"\x00", offset)
    return data[offset:end].decode("utf-8", errors="replace")


PT_NAMES = {0: "PT_NULL", 1: "PT_LOAD", 2: "PT_DYNAMIC",
            3: "PT_INTERP", 4: "PT_NOTE", 6: "PT_PHDR", 7: "PT_TLS"}
SH_TYPES = {0: "SHT_NULL", 1: "SHT_PROGBITS", 2: "SHT_SYMTAB",
            3: "SHT_STRTAB", 4: "SHT_RELA", 6: "SHT_DYNAMIC",
            7: "SHT_NOTE", 8: "SHT_NOBITS", 9: "SHT_REL", 11: "SHT_DYNSYM"}
TYPE_MAP = {0: "ET_NONE", 1: "ET_REL", 2: "ET_EXEC", 3: "ET_DYN", 4: "ET_CORE"}
MACH_MAP = {3: "EM_386", 62: "EM_X86_64", 40: "EM_ARM",
            183: "EM_AARCH64", 8: "EM_MIPS"}


def parse_elf(data: bytes) -> dict:
    if data[:4] != b"\x7fELF":
        return {"error": "Not a valid ELF file (magic mismatch)"}

    le = data[5] == 1
    end = "<" if le else ">"

    def r16(o): return struct.unpack_from(end + "H", data, o)[0]
    def r32(o): return struct.unpack_from(end + "I", data, o)[0]
    def r64(o): return struct.unpack_from(end + "Q", data, o)[0]
    def hex64(o): return f"0x{r64(o):016x}"

    cls = {1: "ELF32", 2: "ELF64"}.get(data[4], str(data[4]))
    header = {
        "magic": " ".join(f"{b:02x}" for b in data[:4]),
        "class": cls,
        "data": "Little Endian" if le else "Big Endian",
        "os_abi": f"0x{data[7]:02x}",
        "type": TYPE_MAP.get(r16(16), f"0x{r16(16):04x}"),
        "machine": MACH_MAP.get(r16(18), f"0x{r16(18):04x}"),
        "entry": hex64(24),
        "phoff": r64(32),
        "shoff": r64(40),
        "ehsize": r16(52),
        "phentsize": r16(54),
        "phnum": r16(56),
        "shentsize": r16(58),
        "shnum": r16(60),
        "shstrndx": r16(62),
    }

    # Program headers
    phoff, phnum, phes = r32(32), r16(56), r16(54)
    segments = []
    for i in range(min(phnum, 16)):
        o = phoff + i * phes
        if o + phes > len(data):
            break
        pt = r32(o)
        fl = r32(o + 4)
        flags = ("R" if fl & 4 else "") + ("X" if fl & 1 else "") + ("W" if fl & 2 else "")
        segments.append({
            "name": PT_NAMES.get(pt, f"PT_0x{pt:x}"),
            "vaddr": hex64(o + 16),
            "filesz": hex64(o + 32),
            "memsz": hex64(o + 40),
            "flags": flags or "—",
            "offset": hex64(o + 8),
        })

    # Section headers
    shoff2, shnum, shes = r32(40), r16(60), r16(58)
    shstrndx = r16(62)
    shstrtab = b""
    if shstrndx < shnum:
        so = shoff2 + shstrndx * shes
        if so + shes <= len(data):
            off2, sz = r32(so + 16), r32(so + 20)
            shstrtab = data[off2: off2 + sz]

    def get_name(idx):
        if not shstrtab or idx >= len(shstrtab):
            return "?"
        end_idx = shstrtab.index(b"\x00", idx) if b"\x00" in shstrtab[idx:] else len(shstrtab)
        return shstrtab[idx:end_idx].decode("utf-8", errors="replace")

    sections = []
    for i in range(min(shnum, 32)):
        o = shoff2 + i * shes
        if o + shes > len(data):
            break
        sh_type = r32(o + 4)
        sh_flags = r32(o + 8)
        flags = ("A" if sh_flags & 2 else "") + ("X" if sh_flags & 4 else "") + ("W" if sh_flags & 1 else "")
        sections.append({
            "name": get_name(r32(o)) or "(no name)",
            "type": SH_TYPES.get(sh_type, f"0x{sh_type:x}"),
            "addr": hex64(o + 16),
            "size": f"0x{r32(o + 20):x}",
            "flags": flags or "—",
            "align": r32(o + 32),
        })

    return {"header": header, "segments": segments, "sections": sections, "symbols": []}

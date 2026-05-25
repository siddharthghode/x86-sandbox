import { useState } from "react";
import Navbar from "./components/Navbar";
import Tabs from "./components/Tabs";
import NasmPanel from "./components/NasmPanel";
import ElfPanel from "./components/ElfPanel";
import OpcodePanel from "./components/OpcodePanel";
import HexDumpPanel from "./components/HexDumpPanel";
import CFGPanel from "./components/CFGPanel";
import CallingConventionPanel from "./components/CallingConventionPanel";

const TABS = [
  { id: "nasm", label: "NASM" },
  { id: "elf", label: "ELF" },
  { id: "opcodes", label: "Opcodes" },
  { id: "hexdump", label: "Hex Dump" },
  { id: "cfg", label: "CFG" },
  { id: "conv", label: "Calling Conv" },
];

const PANELS = {
  nasm: NasmPanel,
  elf: ElfPanel,
  opcodes: OpcodePanel,
  hexdump: HexDumpPanel,
  cfg: CFGPanel,
  conv: CallingConventionPanel,
};

export default function App() {
  const [activeTab, setActiveTab] = useState("nasm");
  const Panel = PANELS[activeTab];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Panel />
      </div>
    </div>
  );
}

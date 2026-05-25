import { useEffect, useRef, useState } from "react";
import { fetchCFG } from "../services/api";

const CFG_EXAMPLES = ["fact", "fib", "loop", "switch", "shell"];

const TYPE_STYLE = {
  entry: { fill: "#E6F1FB", stroke: "#185FA5", tc: "#0C447C" },
  exit:  { fill: "#EAF3DE", stroke: "#3B6D11", tc: "#27500A" },
  body:  { fill: "#FAEEDA", stroke: "#854F0B", tc: "#633806" },
  loop:  { fill: "#EEEDFE", stroke: "#534AB7", tc: "#3C3489" },
  data:  { fill: "#E1F5EE", stroke: "#0F6E56", tc: "#085041" },
};

// Canvas drawing — ported directly from the original HTML's drawCFG()
function drawCFG(canvas, cfg) {
  const W = canvas.offsetWidth || 680;
  canvas.width = W;
  canvas.height = 480;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, W, 480);

  const BW = 140, BH = 70, PAD = 12;
  const scaleX = (x) => (x / 460) * (W - 60) + 30;

  // edges
  cfg.edges.forEach((e) => {
    const src = cfg.nodes.find((n) => n.id === e.from);
    const dst = cfg.nodes.find((n) => n.id === e.to);
    if (!src || !dst) return;
    const sx = scaleX(src.x) + BW / 2, sy = src.y + BH;
    const dx = scaleX(dst.x) + BW / 2, dy = dst.y;
    ctx.beginPath();
    if (e.back) {
      ctx.strokeStyle = "#534AB7"; ctx.setLineDash([4, 3]);
      const cx = Math.max(sx, dx) + 60;
      ctx.moveTo(sx, sy); ctx.bezierCurveTo(cx, sy, cx, dy, dx, dy);
    } else if (e.style === "dashed") {
      ctx.strokeStyle = "#0F6E56"; ctx.setLineDash([4, 3]);
      ctx.moveTo(sx, sy); ctx.lineTo(dx, dy);
    } else {
      ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.setLineDash([]);
      ctx.moveTo(sx, sy); ctx.lineTo(dx, dy);
    }
    ctx.lineWidth = 1.5; ctx.stroke(); ctx.setLineDash([]);
    const angle = Math.atan2(dy - sy, dx - sx);
    ctx.beginPath(); ctx.fillStyle = e.back ? "#534AB7" : "rgba(0,0,0,.5)";
    ctx.moveTo(dx, dy);
    ctx.lineTo(dx - 9 * Math.cos(angle - 0.4), dy - 9 * Math.sin(angle - 0.4));
    ctx.lineTo(dx - 9 * Math.cos(angle + 0.4), dy - 9 * Math.sin(angle + 0.4));
    ctx.closePath(); ctx.fill();
    if (e.label) {
      ctx.font = "10px monospace"; ctx.fillStyle = "rgba(0,0,0,.55)";
      ctx.fillText(e.label, (sx + dx) / 2 + 4, (sy + dy) / 2 - 3);
    }
  });

  // nodes
  cfg.nodes.forEach((n) => {
    const s = TYPE_STYLE[n.type] || TYPE_STYLE.body;
    const nx = scaleX(n.x), ny = n.y, r = 6;
    ctx.beginPath();
    ctx.moveTo(nx + r, ny); ctx.lineTo(nx + BW - r, ny); ctx.arcTo(nx + BW, ny, nx + BW, ny + r, r);
    ctx.lineTo(nx + BW, ny + BH - r); ctx.arcTo(nx + BW, ny + BH, nx + BW - r, ny + BH, r);
    ctx.lineTo(nx + r, ny + BH); ctx.arcTo(nx, ny + BH, nx, ny + BH - r, r);
    ctx.lineTo(nx, ny + r); ctx.arcTo(nx, ny, nx + r, ny, r); ctx.closePath();
    ctx.fillStyle = s.fill; ctx.fill();
    ctx.strokeStyle = s.stroke; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = s.tc; ctx.font = "bold 12px monospace";
    ctx.fillText(n.label, nx + PAD, ny + 20);
    ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.font = "10px monospace";
    n.sub.split("\n").forEach((l, i) => ctx.fillText(l, nx + PAD, ny + 34 + i * 12));
  });

  ctx.fillStyle = "#555"; ctx.font = "12px sans-serif";
  ctx.fillText("CFG: " + cfg.title, 12, 14);
}

export default function CFGPanel() {
  const [selected, setSelected] = useState("fact");
  const [cfg, setCfg] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchCFG(selected).then(({ data }) => { if (data && !data.error) setCfg(data); });
  }, [selected]);

  useEffect(() => {
    if (cfg && canvasRef.current) drawCFG(canvasRef.current, cfg);
  }, [cfg]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="pane-header">
        Control Flow Graph
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="text-xs px-2 py-1 border border-gray-300 rounded bg-white"
        >
          {CFG_EXAMPLES.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>
      <canvas ref={canvasRef} className="w-full bg-white block" height={480} />
    </div>
  );
}

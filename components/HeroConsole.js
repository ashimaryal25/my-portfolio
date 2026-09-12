"use client";
import { useState } from "react";
import { 
  Cpu, 
  Bot,
  Play,
  CheckCircle2
} from "lucide-react";
import styles from "./HeroConsole.module.css";

const INITIAL_PRINTERS = [
  { id: "P1", name: "Ender 3 V3 (01)", ip: "192.168.1.101", state: "PRINTING", file: "gondola_bracket.gcode", progress: 74, nozzle: "215°C", bed: "60°C" },
  { id: "P2", name: "Ender 3 V3 (02)", ip: "192.168.1.102", state: "IDLE", file: "—", progress: 0, nozzle: "28°C", bed: "26°C" },
  { id: "P3", name: "Ender 3 V3 (03)", ip: "192.168.1.103", state: "NEEDS_CLEARING", file: "benchy_v2.gcode", progress: 100, nozzle: "32°C", bed: "29°C" },
  { id: "P4", name: "Ender 3 V3 (04)", ip: "192.168.1.104", state: "PRINTING", file: "pen_carriage_clamp.gcode", progress: 42, nozzle: "210°C", bed: "60°C" },
  { id: "P5", name: "Ender 3 V3 (05)", ip: "192.168.1.105", state: "IDLE", file: "—", progress: 0, nozzle: "26°C", bed: "25°C" },
];

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function winner(board) {
  return WIN_LINES.find(([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c])?.map((cell) => cell) ?? [];
}

function minimax(board, turn) {
  const line = winner(board);
  if (line.length) return board[line[0]] === "O" ? 10 : -10;
  const open = board.flatMap((cell, index) => (cell ? [] : [index]));
  if (!open.length) return 0;

  const scores = open.map((index) => {
    const next = [...board];
    next[index] = turn;
    return minimax(next, turn === "O" ? "X" : "O");
  });
  return turn === "O" ? Math.max(...scores) : Math.min(...scores);
}

function bestMove(board) {
  return board.flatMap((cell, index) => (cell ? [] : [index]))
    .map((index) => {
      const next = [...board];
      next[index] = "O";
      return { index, score: minimax(next, "X") };
    })
    .sort((a, b) => b.score - a.score)[0]?.index;
}

const PLOTTER = { width: 1220, height: 971, boardX: 430, boardY: 390, cell: 120, parkX: 610, parkY: 971 };

function plotterPoint(cell) {
  if (cell === null) return { x: PLOTTER.parkX, y: PLOTTER.parkY };
  return {
    x: PLOTTER.boardX + (cell % 3) * PLOTTER.cell + PLOTTER.cell / 2,
    y: PLOTTER.boardY + Math.floor(cell / 3) * PLOTTER.cell + PLOTTER.cell / 2 - 80,
  };
}

function interpolate(from, to, progress) {
  return { x: from.x + (to.x - from.x) * progress, y: from.y + (to.y - from.y) * progress };
}

export default function HeroConsole() {
  const [activeTab, setActiveTab] = useState("farm");
  
  // Farm State
  const [printers, setPrinters] = useState(INITIAL_PRINTERS);
  const [farmLog, setFarmLog] = useState("Sweep completed in 184ms across 5 nodes.");

  // Plotter Tic-Tac-Toe State
  const [gameBoard, setGameBoard] = useState(Array(9).fill(""));
  const [plotterState, setPlotterState] = useState("Your turn. Tap or drag an X inside an empty square.");
  const [plotterCell, setPlotterCell] = useState(null);
  const [drawingOCell, setDrawingOCell] = useState(null);
  const [drawingXCell, setDrawingXCell] = useState(null);
  const [drawingXStage, setDrawingXStage] = useState(0);
  const [plotterPosition, setPlotterPosition] = useState(plotterPoint(null));
  const [humanPenPosition, setHumanPenPosition] = useState({ x: 110, y: 820 });
  const [isGameAnimating, setIsGameAnimating] = useState(false);
  const [holdingHumanPen, setHoldingHumanPen] = useState(false);
  const [humanPath, setHumanPath] = useState([]);
  const [humanInkCell, setHumanInkCell] = useState(null);
  const [oProgress, setOProgress] = useState(0);

  // Handlers
  const handleClearBed = (id) => {
    setPrinters((prev) =>
      prev.map((p) => (p.id === id ? { ...p, state: "IDLE", progress: 0, file: "—" } : p))
    );
    setFarmLog(`Bed cleared for printer ${id}. Ready for next auto-dispatch.`);
  };

  const handleDispatchJob = () => {
    const idlePrinter = printers.find((p) => p.state === "IDLE");
    if (!idlePrinter) {
      setFarmLog("No free printer available. Job queued in Global Auto-Print.");
      return;
    }
    setPrinters((prev) =>
      prev.map((p) =>
        p.id === idlePrinter.id
          ? { ...p, state: "PRINTING", file: "wall_plotter_pulley.gcode", progress: 4, nozzle: "210°C", bed: "60°C" }
          : p
      )
    );
    setFarmLog(`Verified start sent to ${idlePrinter.name} (${idlePrinter.ip}). Active file confirmed.`);
  };

  const resetPlotterGame = () => {
    setGameBoard(Array(9).fill(""));
    setPlotterCell(null);
    setDrawingOCell(null);
    setDrawingXCell(null);
    setDrawingXStage(0);
    setPlotterPosition(plotterPoint(null));
    setHumanPenPosition({ x: 110, y: 820 });
    setIsGameAnimating(false);
    setHumanInkCell(null);
    setPlotterState("Your turn. Tap or drag an X inside an empty square.");
  };

  const handlePlotterMove = (cell, drawnByHuman = false) => {
    if (gameBoard[cell] || plotterCell !== null || isGameAnimating || winner(gameBoard).length) return;
    setIsGameAnimating(true);
    const afterHuman = [...gameBoard];
    afterHuman[cell] = "X";
    setGameBoard(afterHuman);
    const x = PLOTTER.boardX + (cell % 3) * PLOTTER.cell;
    const y = PLOTTER.boardY + Math.floor(cell / 3) * PLOTTER.cell;
    const home = { x: 110, y: 820 };
    const firstStart = { x: x + 32, y: y + 32 };
    const firstEnd = { x: x + 88, y: y + 88 };
    const secondStart = { x: x + 88, y: y + 32 };
    const secondEnd = { x: x + 32, y: y + 88 };

    const animate = (from, to, duration, update, done) => {
      const started = performance.now();
      const frame = (now) => {
        const progress = Math.min(1, (now - started) / duration);
        update(interpolate(from, to, progress));
        if (progress < 1) requestAnimationFrame(frame);
        else done?.();
      };
      requestAnimationFrame(frame);
    };

    const runRobot = () => {
      if (winner(afterHuman).length || afterHuman.every(Boolean)) {
        setPlotterState(winner(afterHuman).length ? "You won! Reset to play again." : "Draw! Reset to play again.");
        setIsGameAnimating(false);
        return;
      }
      const reply = bestMove(afterHuman);
      const target = plotterPoint(reply);
      const startPoint = { x: target.x, y: target.y - 34 };
      setPlotterCell(reply);
      setPlotterState(`Gondola moving to row ${Math.floor(reply / 3) + 1}, col ${(reply % 3) + 1}.`);
      animate(plotterPoint(null), startPoint, 750, setPlotterPosition, () => {
        setDrawingOCell(reply);
        setPlotterState("Pen down. Drawing O.");
        const started = performance.now();
        const traceO = (now) => {
          const progress = Math.min(1, (now - started) / 1000);
          setOProgress(progress);
          const angle = progress * Math.PI * 2 - Math.PI / 2;
          setPlotterPosition({
            x: target.x + Math.cos(angle) * 34,
            y: (target.y + 80) + Math.sin(angle) * 34 - 80,
          });
          if (progress < 1) {
            requestAnimationFrame(traceO);
          } else {
            setOProgress(0);
            const afterRobot = [...afterHuman];
            afterRobot[reply] = "O";
            setGameBoard(afterRobot);
            setDrawingOCell(null);
            setPlotterState("Returning gondola to park.");
            animate(startPoint, plotterPoint(null), 650, setPlotterPosition, () => {
              setPlotterCell(null);
              const winningLine = winner(afterRobot);
              if (winningLine.length) {
                setPlotterState("Plotter wins! Reset to play again.");
              } else if (afterRobot.every(Boolean)) {
                setPlotterState("Game drawn! Reset to play again.");
              } else {
                setPlotterState("Your turn. Tap or drag your next X.");
              }
              setIsGameAnimating(false);
            });
          }
        };
        requestAnimationFrame(traceO);
      });
    };

    if (drawnByHuman) {
      runRobot();
      return;
    }

    setDrawingXCell(cell);
    setDrawingXStage(1);
    setPlotterState("Red marker moving to square.");
    animate(home, firstStart, 380, setHumanPenPosition, () => {
      setPlotterState("Drawing first stroke of X.");
      animate(firstStart, firstEnd, 260, setHumanPenPosition, () => {
        setDrawingXStage(2);
        animate(firstEnd, secondStart, 180, setHumanPenPosition, () => {
          setPlotterState("Drawing second stroke of X.");
          animate(secondStart, secondEnd, 260, setHumanPenPosition, () => {
            setDrawingXCell(null);
            setDrawingXStage(0);
            animate(secondEnd, home, 320, setHumanPenPosition, () => {
              runRobot();
            });
          });
        });
      });
    });
  };

  const svgPoint = (event) => {
    const svg = event.currentTarget.ownerSVGElement || event.currentTarget;
    const box = svg.getBoundingClientRect();
    if (!box.width || !box.height) return { x: 0, y: 0 };
    return {
      x: -40 + ((event.clientX - box.left) / box.width) * 1300,
      y: -55 + ((event.clientY - box.top) / box.height) * 1085,
    };
  };

  const handlePenDown = (event) => {
    if (isGameAnimating || winner(gameBoard).length) return;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch (_) {}
    const point = svgPoint(event);
    const col = Math.floor((point.x - PLOTTER.boardX) / PLOTTER.cell);
    const row = Math.floor((point.y - PLOTTER.boardY) / PLOTTER.cell);
    const cell = row * 3 + col;
    if (row < 0 || row > 2 || col < 0 || col > 2 || gameBoard[cell]) return;
    setHoldingHumanPen(true);
    setHumanPenPosition(point);
    setHumanPath([point]);
    setHumanInkCell(cell);
    setPlotterState("Drawing X in square...");
  };

  const handlePenMove = (event) => {
    if (!holdingHumanPen) return;
    const point = svgPoint(event);
    setHumanPenPosition(point);
    const col = Math.floor((point.x - PLOTTER.boardX) / PLOTTER.cell);
    const row = Math.floor((point.y - PLOTTER.boardY) / PLOTTER.cell);
    const cell = row * 3 + col;
    if (humanInkCell === cell) {
      setHumanPath((path) => [...path, point]);
    }
  };

  const handlePenUp = (event) => {
    if (!holdingHumanPen) return;
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch (_) {}
    setHoldingHumanPen(false);
    const targetCell = humanInkCell;
    const pathLen = humanPath.length;
    setHumanPath([]);
    setHumanPenPosition({ x: 110, y: 820 });
    setHumanInkCell(null);

    if (targetCell !== null) {
      if (pathLen > 5) {
        handlePlotterMove(targetCell, true);
      } else {
        handlePlotterMove(targetCell, false);
      }
    }
  };

  return (
    <div className={styles.consoleWrapper}>
      <div className={styles.titlebar}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tabBtn} ${activeTab === "farm" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("farm")}
          >
            <Cpu size={13} />
            <span>Farm Engine (5 Nodes)</span>
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "plotter" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("plotter")}
          >
            <Bot size={13} />
            <span>Plotter Tic-Tac-Toe</span>
          </button>
        </div>
      </div>

      <div className={styles.screen}>
        {/* TAB 1: 3D PRINTER FARM TELEMETRY CARDS */}
        {activeTab === "farm" && (
          <div className={styles.farmView}>
            <div className={styles.farmHeader}>
              <div className={styles.farmStats}>
                <span>Local subnet: <strong>192.168.1.0/24</strong></span>
                <span>Port: <strong>9999</strong> (Creality WebSocket)</span>
              </div>
              <button type="button" onClick={handleDispatchJob} className={styles.dispatchBtn}>
                <Play size={12} /> Auto-Dispatch Next
              </button>
            </div>

            <div className={styles.printerGrid}>
              {printers.map((p) => (
                <div key={p.id} className={styles.printerCard}>
                  <div className={styles.printerRow}>
                    <span className={styles.printerName}>{p.name}</span>
                    <span className={`${styles.badge} ${styles[`badge_${p.state.toLowerCase()}`]}`}>
                      {p.state.replace("_", " ")}
                    </span>
                  </div>
                  <div className={styles.printerFile}>
                    Job: <code>{p.file}</code>
                  </div>
                  <div className={styles.progressContainer}>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${p.progress}%` }} />
                    </div>
                    <span className={styles.progressText}>{p.progress}%</span>
                  </div>
                  <div className={styles.printerFooter}>
                    <span>{p.nozzle} · {p.bed}</span>
                    {p.state === "NEEDS_CLEARING" ? (
                      <button
                        type="button"
                        onClick={() => handleClearBed(p.id)}
                        className={styles.clearBedBtn}
                      >
                        <CheckCircle2 size={10} /> Clear Bed
                      </button>
                    ) : (
                      <code>{p.ip}</code>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.consoleLog}>
              <span className={styles.logPrompt}>$ telemetry:</span> {farmLog}
            </div>
          </div>
        )}

        {/* TAB 2: TIC-TAC-TOE WALL PLOTTER SIMULATOR */}
        {activeTab === "plotter" && (
          <div className={styles.plotterView}>
            <div className={styles.plotterIntro}>
              <span>Tap or draw an <strong>X</strong> on the virtual wall canvas. The plotter tracks your move and answers with <strong>O</strong>.</span>
              <button type="button" onClick={resetPlotterGame} className={styles.resetGameBtn}>Reset board</button>
            </div>
            <div className={styles.plotterWorkspace}>
              <div className={styles.plotterStage}>
                <svg className={styles.plotterSvg} viewBox="-40 -55 1300 1085" role="img" aria-label="Virtual wall plotter tic-tac-toe game" onPointerDown={handlePenDown} onPointerMove={handlePenMove} onPointerUp={handlePenUp}>
                  <rect x="-40" y="-55" width="1300" height="1085" fill="#d8d5ce" />
                  <rect x="-30" y="-32" width="1280" height="26" fill="#60676b" stroke="#303538" strokeWidth="8" />
                  <rect x="-24" y="-18" width="66" height="48" rx="4" fill="#3865ad" stroke="#173a70" strokeWidth="7" />
                  <rect x="1178" y="-18" width="66" height="48" rx="4" fill="#3865ad" stroke="#173a70" strokeWidth="7" />
                  <rect x={PLOTTER.boardX - 22} y={PLOTTER.boardY - 22} width={PLOTTER.cell * 3 + 44} height={PLOTTER.cell * 3 + 44} fill="#f8f6f0" stroke="#b3afa6" strokeWidth="8" />
                  {[1, 2].map((line) => <line key={`v-${line}`} x1={PLOTTER.boardX + line * PLOTTER.cell} y1={PLOTTER.boardY} x2={PLOTTER.boardX + line * PLOTTER.cell} y2={PLOTTER.boardY + PLOTTER.cell * 3} stroke="#222" strokeWidth="8" />)}
                  {[1, 2].map((line) => <line key={`h-${line}`} x1={PLOTTER.boardX} y1={PLOTTER.boardY + line * PLOTTER.cell} x2={PLOTTER.boardX + PLOTTER.cell * 3} y2={PLOTTER.boardY + line * PLOTTER.cell} stroke="#222" strokeWidth="8" />)}
                  {gameBoard.map((mark, cell) => {
                    const x = PLOTTER.boardX + (cell % 3) * PLOTTER.cell;
                    const y = PLOTTER.boardY + Math.floor(cell / 3) * PLOTTER.cell;
                    return (
                      <g 
                        key={cell} 
                        className={!mark && !isGameAnimating && !winner(gameBoard).length ? styles.svgCell : ""}
                        onClick={() => {
                          if (!mark && !isGameAnimating && !winner(gameBoard).length && !holdingHumanPen) {
                            handlePlotterMove(cell, false);
                          }
                        }}
                      >
                        <rect x={x} y={y} width={PLOTTER.cell} height={PLOTTER.cell} fill="transparent" />
                        {mark === "X" && drawingXCell !== cell && <path d={`M ${x + 32} ${y + 32} L ${x + 88} ${y + 88} M ${x + 88} ${y + 32} L ${x + 32} ${y + 88}`} stroke="#a73737" strokeWidth="10" strokeLinecap="round" />}
                        {drawingXCell === cell && <><path className={styles.drawingX} d={`M ${x + 32} ${y + 32} L ${x + 88} ${y + 88}`} stroke="#a73737" strokeWidth="10" strokeLinecap="round" />{drawingXStage === 2 && <path className={styles.drawingX} d={`M ${x + 88} ${y + 32} L ${x + 32} ${y + 88}`} stroke="#a73737" strokeWidth="10" strokeLinecap="round" />}</>}
                        {mark === "O" && <circle cx={x + PLOTTER.cell / 2} cy={y + PLOTTER.cell / 2} r="34" fill="none" stroke="#2563a8" strokeWidth="10" />}
                        {drawingOCell === cell && <circle cx={x + PLOTTER.cell / 2} cy={y + PLOTTER.cell / 2} r="34" fill="none" stroke="#2563a8" strokeWidth="10" strokeLinecap="round" strokeDasharray={213.6} strokeDashoffset={213.6 * (1 - oProgress)} transform={`rotate(-90 ${x + PLOTTER.cell / 2} ${y + PLOTTER.cell / 2})`} />}
                      </g>
                    );
                  })}
                  {humanPath.length > 1 && <polyline points={humanPath.map((point) => `${point.x},${point.y}`).join(" ")} fill="none" stroke="#a73737" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />}
                  <line x1="10" y1="14" x2={plotterPosition.x} y2={plotterPosition.y} stroke="#232323" strokeWidth="7" />
                  <line x1="1210" y1="14" x2={plotterPosition.x} y2={plotterPosition.y} stroke="#232323" strokeWidth="7" />
                  <g className={styles.gondolaSvg} transform={`translate(${plotterPosition.x} ${plotterPosition.y})`}>
                    <rect x="-43" y="-30" width="86" height="56" rx="5" fill="#e5a82b" stroke="#9c6811" strokeWidth="8" />
                    <rect x="-11" y="22" width="22" height="58" fill="#285290" />
                    <circle cx="-20" cy="-2" r="8" fill="#2b2b2b" /><circle cx="20" cy="-2" r="8" fill="#2b2b2b" />
                  </g>
                  <g className={styles.humanPenTool} transform={`translate(${humanPenPosition.x} ${humanPenPosition.y}) rotate(-35)`}>
                    <rect x="-8" y="-56" width="16" height="56" rx="2" fill="#b92c35" stroke="#6f151b" strokeWidth="4" />
                    <path d="M -8 0 L 0 17 L 8 0" fill="#292929" />
                  </g>
                </svg>
              </div>
              <div className={styles.plotterDetails}>
                <div><span>Game</span><strong>Minimax, O</strong></div>
                <div><span>Position</span><strong>{plotterCell === null ? "parked" : `cell ${plotterCell + 1}`}</strong></div>
                <div><span>Pen</span><strong>{drawingOCell === null ? "up" : "down"}</strong></div>
                <div><span>Command batch</span><code>{plotterCell === null ? "waiting" : "p0 → move → p1 → circle"}</code></div>
              </div>
            </div>
            <div className={styles.consoleLog}><span className={styles.logPrompt}>$ plotter:</span> {plotterState}</div>
          </div>
        )}
      </div>
    </div>
  );
}

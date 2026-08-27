"use client";
import { useState } from "react";
import { 
  Cpu, 
  Activity, 
  CheckCircle2, 
  RotateCcw, 
  Play, 
  Zap, 
  Loader2, 
  Bot 
} from "lucide-react";
import styles from "./HeroConsole.module.css";

const INITIAL_PRINTERS = [
  { id: "P1", name: "Ender 3 V3 (01)", ip: "192.168.1.101", state: "PRINTING", file: "gondola_bracket.gcode", progress: 74, nozzle: "215°C", bed: "60°C" },
  { id: "P2", name: "Ender 3 V3 (02)", ip: "192.168.1.102", state: "IDLE", file: "—", progress: 0, nozzle: "28°C", bed: "26°C" },
  { id: "P3", name: "Ender 3 V3 (03)", ip: "192.168.1.103", state: "NEEDS_CLEARING", file: "benchy_v2.gcode", progress: 100, nozzle: "32°C", bed: "29°C" },
  { id: "P4", name: "Ender 3 V3 (04)", ip: "192.168.1.104", state: "PRINTING", file: "pen_carriage_clamp.gcode", progress: 42, nozzle: "210°C", bed: "60°C" },
  { id: "P5", name: "Ender 3 V3 (05)", ip: "192.168.1.105", state: "IDLE", file: "—", progress: 0, nozzle: "26°C", bed: "25°C" },
];

const PRESET_SENTENCES = [
  { 
    id: 1,
    text: "I like building quick prototypes and helping people understand how they work.", 
    traits: ["Builder", "Technical", "Communicator"], 
    confidence: "94.2%" 
  },
  { 
    id: 2,
    text: "I care about privacy, self-hosting everything, and keeping telemetry strictly zero.", 
    traits: ["Security", "Pragmatist", "Architect"], 
    confidence: "91.8%" 
  },
  { 
    id: 3,
    text: "I spend late nights soldering microcontrollers and tuning stepper motor jerk limits.", 
    traits: ["Hardware", "Maker", "Specialist"], 
    confidence: "96.5%" 
  },
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

  // Classifier State - Starts unscored
  const [mlInput, setMlInput] = useState(PRESET_SENTENCES[0].text);
  const [mlResult, setMlResult] = useState(null);
  const [isScoring, setIsScoring] = useState(false);

  // Plotter Tic-Tac-Toe State
  const [gameBoard, setGameBoard] = useState(Array(9).fill(""));
  const [plotterState, setPlotterState] = useState("Your turn. Press and drag inside an empty square to draw X.");
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

  const handleSelectPreset = (preset) => {
    setMlInput(preset.text);
    setMlResult(null);
  };

  const handleScore = () => {
    if (!mlInput.trim() || isScoring) return;
    setIsScoring(true);

    setTimeout(() => {
      const match = PRESET_SENTENCES.find((s) => s.text.trim() === mlInput.trim());
      if (match) {
        setMlResult(match);
      } else {
        setMlResult({
          text: mlInput,
          traits: ["Builder", "Problem Solver", "Experimental"],
          confidence: "88.4%",
        });
      }
      setIsScoring(false);
    }, 280);
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
    setPlotterState("Your turn. Press and drag inside an empty square to draw X.");
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
        setPlotterState(winner(afterHuman).length ? "You won. Reset to play again." : "Draw. Reset to play again.");
        setIsGameAnimating(false);
        return;
      }
      const reply = bestMove(afterHuman);
      const target = plotterPoint(reply);
      const startPoint = { x: target.x, y: target.y - 34 };
      setPlotterCell(reply);
      setPlotterState(`Gondola moving to row ${Math.floor(reply / 3) + 1}, column ${(reply % 3) + 1}.`);
      animate(plotterPoint(null), startPoint, 750, setPlotterPosition, () => {
        setDrawingOCell(reply);
        setPlotterState("Pen down. Drawing O.");
        const started = performance.now();
        const traceO = (now) => {
          const progress = Math.min(1, (now - started) / 950);
          const angle = -Math.PI / 2 + progress * Math.PI * 2;
          setOProgress(progress);
          setPlotterPosition({ x: target.x + 34 * Math.cos(angle), y: target.y + 34 * Math.sin(angle) });
          if (progress < 1) requestAnimationFrame(traceO);
          else {
            const afterRobot = [...afterHuman];
            afterRobot[reply] = "O";
            setGameBoard(afterRobot);
            setDrawingOCell(null);
            setOProgress(0);
            setPlotterState("O drawn. Returning to park.");
            animate(startPoint, plotterPoint(null), 650, setPlotterPosition, () => {
              setPlotterCell(null);
              setIsGameAnimating(false);
              setPlotterState(winner(afterRobot).length ? "Robot wins. Reset to play again." : afterRobot.every(Boolean) ? "Draw. Reset to play again." : "O drawn. Your turn.");
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

    setPlotterState("Pick up the red marker and draw X.");
    animate(home, firstStart, 420, setHumanPenPosition, () => {
      setDrawingXCell(cell);
      setDrawingXStage(1);
      setPlotterState("Human marker drawing the first X stroke.");
      animate(firstStart, firstEnd, 280, setHumanPenPosition, () => {
        animate(firstEnd, secondStart, 160, setHumanPenPosition, () => {
          setDrawingXStage(2);
          setPlotterState("Human marker drawing the second X stroke.");
          animate(secondStart, secondEnd, 280, setHumanPenPosition, () => {
            setDrawingXCell(null);
            setDrawingXStage(0);
            animate(secondEnd, home, 380, setHumanPenPosition, runRobot);
          });
        });
      });
    });
  };

  const svgPoint = (event) => {
    const box = event.currentTarget.getBoundingClientRect();
    return {
      x: -40 + ((event.clientX - box.left) / box.width) * 1300,
      y: -55 + ((event.clientY - box.top) / box.height) * 1085,
    };
  };

  const handlePenDown = (event) => {
    if (isGameAnimating || winner(gameBoard).length) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = svgPoint(event);
    const col = Math.floor((point.x - PLOTTER.boardX) / PLOTTER.cell);
    const row = Math.floor((point.y - PLOTTER.boardY) / PLOTTER.cell);
    const cell = row * 3 + col;
    if (row < 0 || row > 2 || col < 0 || col > 2 || gameBoard[cell]) return;
    setHoldingHumanPen(true);
    setHumanPenPosition(point);
    setHumanPath([point]);
    setHumanInkCell(cell);
    setPlotterState("Red marker down. Draw an X.");
  };

  const handlePenMove = (event) => {
    const point = svgPoint(event);
    setHumanPenPosition(point);
    if (!holdingHumanPen) return;
    const col = Math.floor((point.x - PLOTTER.boardX) / PLOTTER.cell);
    const row = Math.floor((point.y - PLOTTER.boardY) / PLOTTER.cell);
    const cell = row * 3 + col;
    if (humanInkCell === cell) {
      setHumanPath((path) => [...path, point]);
    }
  };

  const handlePenUp = (event) => {
    if (!holdingHumanPen) return;
    const point = svgPoint(event);
    setHoldingHumanPen(false);
    if (humanInkCell !== null && humanPath.length > 6) {
      setHumanPath([]);
      setHumanPenPosition({ x: 110, y: 820 });
      setHumanInkCell(null);
      handlePlotterMove(humanInkCell, true);
    } else {
      setHumanPenPosition({ x: 110, y: 820 });
      setHumanPath([]);
      setHumanInkCell(null);
      setPlotterState("Draw an X inside an empty square.");
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
          <button
            className={`${styles.tabBtn} ${activeTab === "classifier" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("classifier")}
          >
            <Activity size={13} />
            <span>Offline ML Scorer</span>
          </button>
        </div>

      </div>

      <div className={styles.screen}>
        {/* TAB 1: 3D PRINTER FARM TELEMETRY */}
        {activeTab === "farm" && (
          <div className={styles.farmView}>
            <div className={styles.farmHeader}>
              <div className={styles.farmStats}>
                <span>Sequential Poll: <strong>200ms</strong></span>
                <span>Active: <strong>{printers.filter((p) => p.state === "PRINTING").length}/5</strong></span>
                <span>Queued: <strong>1 G-Code</strong></span>
              </div>
              <button onClick={handleDispatchJob} className={styles.dispatchBtn}>
                <Play size={12} /> Dispatch Job
              </button>
            </div>

            <div className={styles.printerGrid}>
              {printers.map((p) => (
                <div key={p.id} className={`${styles.printerCard} ${styles[p.state.toLowerCase()]}`}>
                  <div className={styles.printerRow}>
                    <span className={styles.printerName}>{p.name}</span>
                    <span className={`${styles.badge} ${styles[`badge_${p.state.toLowerCase()}`]}`}>
                      {p.state}
                    </span>
                  </div>

                  <div className={styles.printerFile}>
                    <span>File:</span> <code>{p.file}</code>
                  </div>

                  {p.state === "PRINTING" && (
                    <div className={styles.progressContainer}>
                      <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className={styles.progressText}>{p.progress}%</span>
                    </div>
                  )}

                  <div className={styles.printerFooter}>
                    <span className={styles.temp}>E: {p.nozzle} | B: {p.bed}</span>
                    {p.state === "NEEDS_CLEARING" && (
                      <button onClick={() => handleClearBed(p.id)} className={styles.clearBedBtn}>
                        <CheckCircle2 size={11} /> Mark Bed Cleared
                      </button>
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

        {/* TAB 2: TIC-TAC-TOE PLOTTER */}
        {activeTab === "plotter" && (
          <div className={styles.plotterView}>
            <div className={styles.plotterIntro}>
              <span><strong>You are X.</strong> Press and drag in a square to draw. Minimax sends O to the plotter.</span>
              <button onClick={resetPlotterGame} className={styles.resetGameBtn}><RotateCcw size={12} /> Reset</button>
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
                      <g key={cell} className={!mark && !isGameAnimating && !winner(gameBoard).length ? styles.svgCell : ""}>
                        <rect x={x} y={y} width={PLOTTER.cell} height={PLOTTER.cell} fill="transparent" />
                        {mark === "X" && drawingXCell !== cell && <path d={`M ${x + 32} ${y + 32} L ${x + 88} ${y + 88} M ${x + 88} ${y + 32} L ${x + 32} ${y + 88}`} stroke="#a73737" strokeWidth="10" strokeLinecap="round" />}
                        {drawingXCell === cell && <><path className={styles.drawingX} d={`M ${x + 32} ${y + 32} L ${x + 88} ${y + 88}`} stroke="#a73737" strokeWidth="10" strokeLinecap="round" />{drawingXStage === 2 && <path className={styles.drawingX} d={`M ${x + 88} ${y + 32} L ${x + 32} ${y + 88}`} stroke="#a73737" strokeWidth="10" strokeLinecap="round" />}</>}
                        {mark === "O" && <circle cx={x + PLOTTER.cell / 2} cy={y + PLOTTER.cell / 2} r="34" fill="none" stroke="#2563a8" strokeWidth="10" />}
                        {drawingOCell === cell && <circle cx={x + PLOTTER.cell / 2} cy={y + PLOTTER.cell / 2} r="34" fill="none" stroke="#2563a8" strokeWidth="10" strokeLinecap="round" strokeDasharray="213.6" strokeDashoffset={213.6 * (1 - oProgress)} transform={`rotate(-90 ${x + PLOTTER.cell / 2} ${y + PLOTTER.cell / 2})`} />}
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

        {/* TAB 3: OFFLINE ML TRAIT SCORER */}
        {activeTab === "classifier" && (
          <div className={styles.mlView}>
            <div className={styles.mlHeader}>
              <span className={styles.mlInfo}>
                Model: <strong>TF-IDF n-grams + LinearSVC</strong> (25 Labels, Offline)
              </span>
            </div>

            <div className={styles.mlInputGroup}>
              <form onSubmit={(e) => { e.preventDefault(); handleScore(); }} className={styles.mlInputWrapper}>
                <input
                  type="text"
                  value={mlInput}
                  onChange={(e) => { setMlInput(e.target.value); setMlResult(null); }}
                  placeholder="Enter a self-description sentence..."
                  className={styles.mlInput}
                />
                <button type="submit" disabled={isScoring || !mlInput.trim()} className={styles.predictBtn}>
                  {isScoring ? (
                    <>
                      <Loader2 size={13} className={styles.spin} /> Scoring...
                    </>
                  ) : (
                    <>
                      <Zap size={13} /> Score Top-3
                    </>
                  )}
                </button>
              </form>

              <div className={styles.presets}>
                <span className={styles.presetLabel}>Load sample:</span>
                {PRESET_SENTENCES.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`${styles.presetBtn} ${mlInput === preset.text ? styles.activePreset : ""}`}
                  >
                    Sample {preset.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Area */}
            {isScoring ? (
              <div className={styles.mlPendingBox}>
                <Loader2 size={16} className={styles.spin} />
                <span>Computing TF-IDF n-grams & LinearSVC decision margins...</span>
              </div>
            ) : mlResult ? (
              <div className={styles.mlOutputBox}>
                <div className={styles.outputTop}>
                  <span className={styles.outputTitle}>Top-3 Predicted Card Traits:</span>
                  <span className={styles.confidenceBadge}>Confidence: {mlResult.confidence}</span>
                </div>
                <div className={styles.traitsList}>
                  {mlResult.traits.map((trait, idx) => (
                    <div key={trait} className={styles.traitCard}>
                      <span className={styles.traitRank}>#{idx + 1}</span>
                      <span className={styles.traitName}>{trait}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.mlEmptyPrompt}>
                <span>Click <strong>&quot;Score Top-3&quot;</strong> or press Enter to evaluate the sentence against the 25-trait model.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

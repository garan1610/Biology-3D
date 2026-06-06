import {
  Activity,
  ArrowRight,
  BookOpen,
  Box,
  Brain,
  Camera,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Copy,
  Dna,
  FlaskConical,
  Focus,
  Gauge,
  Github,
  EyeOff,
  Grid3X3,
  Heart,
  Info,
  Leaf,
  Languages,
  MessageCircle,
  Pause,
  Play,
  Library,
  Plus,
  Rewind,
  RotateCcw,
  ScanSearch,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Star,
  Target,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { CellScene, type CellSceneHandle } from "./components/CellScene";
import { cells, getCellById, type CellItem, type ViewMode } from "./data/cells";
import { getLessonById, lessonPresets, type LessonPreset } from "./data/lessons";
import {
  biochemicalProcesses,
  getProcessesForCell,
  localized,
  type BiochemicalProcess,
  type BiochemicalProcessStep,
} from "./data/processes";
import {
  attributeLabel,
  attributeValue,
  buildTutorPrompts,
  cellName,
  cellType,
  formatMasteryProgress,
  microscopeLabel,
  occurrenceBody,
  occurrenceTitle,
  organelleFact,
  organelleName,
  organelleNote,
  organelleSubtitle,
  uiCopy,
  type AppCopy,
  type Language,
} from "./i18n";

type ModeOption = {
  id: ViewMode;
  label: string;
  Icon: LucideIcon;
};

const modeOptions: ModeOption[] = [
  { id: "mesh", label: "Mesh", Icon: Box },
  { id: "focus", label: "Focus", Icon: CircleDot },
];

const processIcons: Record<string, LucideIcon> = {
  photosynthesis: Leaf,
  "protein-biosynthesis": Dna,
  "cell-respiration": Activity,
  "membrane-transport": Workflow,
  "cell-cycle": RotateCcw,
};

const githubRepositoryUrl = "https://github.com/cclank/cell-architecture-studio";
const initialSearchParams = new URLSearchParams(window.location.search);
const initialLesson = getLessonById(initialSearchParams.get("lesson"));

function getInitialCell() {
  if (initialLesson) {
    return getCellById(initialLesson.cellId);
  }

  const requestedCellId = initialSearchParams.get("cell");
  return cells.find((cell) => cell.id === requestedCellId) ?? getCellById("animal");
}

function getInitialLanguage(): Language {
  const requestedLanguage = initialSearchParams.get("lang");
  return requestedLanguage === "zh" || requestedLanguage === "cn" ? "zh" : "en";
}

function getInitialOrganelle(cell: CellItem, lesson: LessonPreset | null) {
  const requestedOrganelleId = lesson?.organelleId ?? initialSearchParams.get("organelle") ?? initialSearchParams.get("focus");
  return requestedOrganelleId && cell.organelles.some((organelle) => organelle.id === requestedOrganelleId)
    ? requestedOrganelleId
    : cell.defaultOrganelle;
}

function getInitialProcessId(cell: CellItem, lesson: LessonPreset | null) {
  const availableProcesses = getProcessesForCell(cell);
  const requestedProcessId = lesson?.processId ?? initialSearchParams.get("process");
  return availableProcesses.find((process) => process.id === requestedProcessId)?.id ?? availableProcesses[0]?.id ?? "";
}

function getInitialProcessStepId(processId: string, lesson: LessonPreset | null) {
  const process = biochemicalProcesses.find((item) => item.id === processId);
  const requestedStepId = lesson?.stepId ?? initialSearchParams.get("step");
  return process?.steps.find((step) => step.id === requestedStepId)?.id ?? process?.steps[0]?.id ?? "";
}

function getProgressForProcessStep(processId: string, stepId: string) {
  const process = biochemicalProcesses.find((item) => item.id === processId);
  const stepIndex = process?.steps.findIndex((step) => step.id === stepId) ?? -1;
  if (!process || stepIndex < 0) {
    return 0;
  }
  return clampProcessProgress((stepIndex + 0.05) / process.steps.length);
}

function getInitialViewMode(lesson: LessonPreset | null): ViewMode {
  const requestedViewMode = lesson?.viewMode ?? initialSearchParams.get("view");
  return requestedViewMode === "focus" ? "focus" : "mesh";
}

const initialCell = getInitialCell();
const initialLanguage = getInitialLanguage();
const initialOrganelle = getInitialOrganelle(initialCell, initialLesson);
const initialProcessId = getInitialProcessId(initialCell, initialLesson);
const initialProcessStepId = getInitialProcessStepId(initialProcessId, initialLesson);
const initialProcessProgress = initialLesson?.progress ?? getProgressForProcessStep(initialProcessId, initialProcessStepId);
const initialViewMode = getInitialViewMode(initialLesson);

type ExportAction = "screenshot" | "glb";
type LabelDensity = "full" | "compact";
type RenderQuality = "balanced" | "high";
type MicroscopeChannelId = "brightfield" | "fluorescence" | "contrast";
type ProcessSimulationSpeed = 0.5 | 1 | 2;

type LibraryProcessTarget = {
  processId: string;
  cellId: string;
  organelleId?: string;
  stepId?: string;
};

function clampProcessProgress(value: number) {
  return Math.max(0, Math.min(1, value));
}

function fileSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function Header({
  cell,
  language,
  copy,
  onLanguageChange,
}: {
  cell: CellItem;
  language: Language;
  copy: AppCopy;
  onLanguageChange: (language: Language) => void;
}) {
  return (
    <header className="topbar">
      <div className="brand-block">
        <div className="brand-orb" aria-hidden="true">
          <Sparkles size={26} />
        </div>
        <div>
          <h1>{language === "zh" ? "细胞建筑工作室" : "Cell Architecture Studio"}</h1>
          <p>{copy.tagline}</p>
        </div>
      </div>

      <nav className="top-nav" aria-label={copy.navLabel}>
        <a href="#gallery">
          <Grid3X3 size={24} />
          <span>{copy.gallery}</span>
        </a>
        <a href="#library">
          <Library size={24} />
          <span>{copy.library}</span>
        </a>
        <a href="#notebooks">
          <BookOpen size={24} />
          <span>{copy.notebooks}</span>
        </a>
        <a href="#settings">
          <Settings size={24} />
          <span>{copy.settings}</span>
        </a>
        <a href="/biology-teaching-demo/">
          <FlaskConical size={24} />
          <span>{copy.demo}</span>
        </a>
        <a href={githubRepositoryUrl} target="_blank" rel="noreferrer">
          <Github size={24} />
          <span>{copy.github}</span>
        </a>
        <div className="language-switch" role="group" aria-label={copy.language}>
          <Languages size={19} />
          <button
            type="button"
            className={language === "zh" ? "is-active" : ""}
            onClick={() => onLanguageChange("zh")}
          >
            中
          </button>
          <button
            type="button"
            className={language === "en" ? "is-active" : ""}
            onClick={() => onLanguageChange("en")}
          >
            EN
          </button>
        </div>
        <button className="avatar-button" type="button" aria-label={copy.userMenu}>
          <span className="avatar-core" style={{ background: cell.accentSoft }}>
            <span style={{ background: cell.accent }} />
          </span>
          <ChevronDown size={20} />
        </button>
      </nav>
    </header>
  );
}

type SidebarProps = {
  selectedCell: CellItem;
  activeOrganelle: string;
  favorites: Set<string>;
  language: Language;
  copy: AppCopy;
  onSelectCell: (id: string, preferredOrganelle?: string) => void;
  onSelectOrganelle: (id: string) => void;
  onToggleFavorite: (id: string) => void;
};

function MiniCell({ cell }: { cell: CellItem }) {
  if (cell.renderImage?.url) {
    return (
      <span className="mini-cell has-preview" style={{ "--thumb": cell.accent } as CSSProperties}>
        <img src={cell.renderImage.url} alt="" aria-hidden="true" />
      </span>
    );
  }

  if (cell.modelAsset?.previewUrl) {
    return (
      <span className="mini-cell has-preview" style={{ "--thumb": cell.accent } as CSSProperties}>
        <img src={cell.modelAsset.previewUrl} alt="" aria-hidden="true" />
      </span>
    );
  }

  return (
    <span className={`mini-cell mini-cell-${cell.modelKind}`} style={{ "--thumb": cell.accent } as CSSProperties}>
      <span />
      <i />
      <b />
    </span>
  );
}

function Sidebar({
  selectedCell,
  activeOrganelle,
  favorites,
  language,
  copy,
  onSelectCell,
  onSelectOrganelle,
  onToggleFavorite,
}: SidebarProps) {
  return (
    <aside className="left-rail">
      <section className="panel cell-type-panel" id="gallery">
        <div className="panel-heading">
          <span>
            <Leaf size={18} />
            {copy.cellTypes}
          </span>
          <ChevronDown size={18} />
        </div>

        <div className="cell-list">
          {cells.map((cell) => {
            const selected = selectedCell.id === cell.id;
            return (
              <button
                className={`cell-row ${selected ? "is-active" : ""}`}
                type="button"
                key={cell.id}
                onClick={() => onSelectCell(cell.id)}
              >
                <MiniCell cell={cell} />
                <span className="cell-row-copy">
                  <strong>{cellName(cell, language)}</strong>
                  <span>{cellType(cell, language)}</span>
                </span>
                <span
                  className={`favorite-dot ${favorites.has(cell.id) ? "is-on" : ""}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleFavorite(cell.id);
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${copy.favorite} ${cellName(cell, language)}`}
                >
                  <Star size={18} fill="currentColor" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel organelle-panel">
        <div className="panel-heading">
          <span>
            <Sparkles size={16} />
            {copy.organelles}
          </span>
          <ChevronDown size={18} />
        </div>

        <div className="organelle-list">
          {selectedCell.organelles.map((organelle) => (
            <button
              className={`organelle-row ${activeOrganelle === organelle.id ? "is-active" : ""}`}
              type="button"
              key={organelle.id}
              onClick={() => onSelectOrganelle(organelle.id)}
            >
              <span className="color-dot" style={{ background: organelle.color }} />
              <span>{organelleName(selectedCell, organelle, language)}</span>
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}

type WorkbenchSwitcherProps = {
  selectedCell: CellItem;
  activeOrganelle: string;
  favorites: Set<string>;
  activeProcess: BiochemicalProcess | null;
  processSimulationProgress: number;
  language: Language;
  copy: AppCopy;
  onSelectCell: (id: string, preferredOrganelle?: string) => void;
  onSelectOrganelle: (id: string) => void;
  onToggleFavorite: (id: string) => void;
};

function WorkbenchSwitcher({
  selectedCell,
  activeOrganelle,
  favorites,
  activeProcess,
  processSimulationProgress,
  language,
  copy,
  onSelectCell,
  onSelectOrganelle,
  onToggleFavorite,
}: WorkbenchSwitcherProps) {
  const activeOrganelleItem =
    selectedCell.organelles.find((organelle) => organelle.id === activeOrganelle) ?? selectedCell.organelles[0];
  const progressPercent = Math.round(processSimulationProgress * 100);

  return (
    <section className="workbench-switcher" aria-label={copy.workbenchTitle}>
      <div className="workbench-intro">
        <span>
          <Sparkles size={17} />
          {copy.workbenchTitle}
        </span>
        <h2>{cellName(selectedCell, language)}</h2>
        <p>{copy.workbenchSubtitle}</p>
      </div>

      <div className="teaching-loop" aria-label={copy.teachingLoop}>
        {[
          { label: copy.loopModel, value: cellName(selectedCell, language), Icon: Box },
          {
            label: copy.loopFocus,
            value: activeOrganelleItem ? organelleName(selectedCell, activeOrganelleItem, language) : selectedCell.defaultOrganelle,
            Icon: Focus,
          },
          {
            label: copy.loopProcess,
            value: activeProcess ? localized(activeProcess.title, language) : copy.processLibrary,
            Icon: Workflow,
          },
          { label: copy.loopTutor, value: `${progressPercent}%`, Icon: Brain },
        ].map(({ label, value, Icon }) => (
          <div className="loop-step" key={label}>
            <Icon size={17} />
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="model-strip" aria-label={copy.modelSwitch}>
        {cells.map((cell) => {
          const selected = selectedCell.id === cell.id;
          return (
            <button
              className={`model-token ${selected ? "is-active" : ""}`}
              type="button"
              key={cell.id}
              onClick={() => onSelectCell(cell.id)}
            >
              <MiniCell cell={cell} />
              <span>
                <strong>{cellName(cell, language)}</strong>
                <em>{cellType(cell, language)}</em>
              </span>
              <i
                className={favorites.has(cell.id) ? "is-on" : ""}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleFavorite(cell.id);
                }}
                role="button"
                tabIndex={0}
                aria-label={`${copy.favorite} ${cellName(cell, language)}`}
              >
                <Star size={15} fill="currentColor" />
              </i>
            </button>
          );
        })}
      </div>

      <div className="organelle-strip" aria-label={copy.structureFocus}>
        {selectedCell.organelles.map((organelle) => (
          <button
            className={activeOrganelle === organelle.id ? "is-active" : ""}
            type="button"
            key={organelle.id}
            onClick={() => onSelectOrganelle(organelle.id)}
          >
            <span style={{ background: organelle.color }} />
            {organelleName(selectedCell, organelle, language)}
          </button>
        ))}
      </div>
    </section>
  );
}

type StageProps = {
  cell: CellItem;
  activeOrganelle: string;
  activeProcess: BiochemicalProcess | null;
  activeProcessStepId: string;
  viewMode: ViewMode;
  crossSection: boolean;
  autoRotate: boolean;
  renderQuality: RenderQuality;
  processSimulationProgress: number;
  processSimulationRunning: boolean;
  resetKey: number;
  language: Language;
  copy: AppCopy;
  onModeChange: (mode: ViewMode) => void;
  onCrossSectionChange: (value: boolean) => void;
  onAutoRotateChange: (value: boolean) => void;
  onReset: () => void;
  onToast: (message: string) => void;
};

function Stage({
  cell,
  activeOrganelle,
  activeProcess,
  activeProcessStepId,
  viewMode,
  crossSection,
  autoRotate,
  renderQuality,
  processSimulationProgress,
  processSimulationRunning,
  resetKey,
  language,
  copy,
  onModeChange,
  onCrossSectionChange,
  onAutoRotateChange,
  onReset,
  onToast,
}: StageProps) {
  const sceneRef = useRef<CellSceneHandle>(null);
  const [exporting, setExporting] = useState<ExportAction | null>(null);
  const organelle = cell.organelles.find((item) => item.id === activeOrganelle) ?? cell.organelles[0];
  const isolateActive = viewMode === "focus";
  const activeProcessStep = activeProcess?.steps.find((step) => step.id === activeProcessStepId) ?? activeProcess?.steps[0];
  const fileBase = fileSlug(cell.name) || "cell-model";

  async function handleScreenshotExport() {
    if (!sceneRef.current || exporting) {
      return;
    }

    setExporting("screenshot");
    try {
      const blob = await sceneRef.current.captureScreenshot();
      downloadBlob(blob, `${fileBase}-studio-view.png`);
      onToast(copy.screenshotDownloaded);
    } catch (error) {
      console.error(error);
      onToast(copy.screenshotFailed);
    } finally {
      setExporting(null);
    }
  }

  async function handleGlbExport() {
    if (!sceneRef.current || exporting) {
      return;
    }

    setExporting("glb");
    try {
      const blob = await sceneRef.current.exportGLB();
      downloadBlob(blob, `${fileBase}-model.glb`);
      onToast(copy.glbDownloaded);
    } catch (error) {
      console.error(error);
      onToast(error instanceof Error ? error.message : copy.glbFailed);
    } finally {
      setExporting(null);
    }
  }

  return (
    <main className="stage-column">
      <section className="stage-panel">
        <div className="stage-title">
          <div>
            <h2>{cellName(cell, language)}</h2>
            <p>{cellType(cell, language)}</p>
          </div>

          <div className="view-card">
            <span>{copy.viewMode}</span>
            <div className="mode-switcher">
              {modeOptions.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={viewMode === id ? "is-active" : ""}
                  onClick={() => onModeChange(id)}
                  title={copy.modeLabels[id] ?? label}
                >
                  <Icon size={22} />
                </button>
              ))}
            </div>
            <label className="toggle-line">
              <span>{copy.crossSection}</span>
              <input
                type="checkbox"
                checked={crossSection}
                onChange={(event) => onCrossSectionChange(event.target.checked)}
              />
              <i />
            </label>
          </div>
        </div>

        <div
          className={`canvas-wrap ${isolateActive ? "is-isolating" : ""}`}
          style={{ "--focus-color": organelle.color } as CSSProperties}
        >
          <CellScene
            ref={sceneRef}
            cell={cell}
            activeOrganelle={activeOrganelle}
            viewMode={viewMode}
            crossSection={crossSection}
            autoRotate={autoRotate}
            renderQuality={renderQuality}
            processSimulationProgress={processSimulationProgress}
            processSimulationRunning={processSimulationRunning}
            activeProcessId={activeProcess?.id ?? ""}
            activeProcessStepId={activeProcessStep?.id ?? ""}
            onAutoRotateChange={onAutoRotateChange}
            resetKey={resetKey}
          />
          {isolateActive && (
            <>
              <span className="isolate-reticle" aria-hidden="true">
                <span />
                <i />
              </span>
              <aside className="isolate-lens" aria-live="polite">
                <div className="lens-visual">
                  <span />
                </div>
                <div className="lens-copy">
                  <span>
                    <ScanSearch size={16} />
                    {copy.isolateLens}
                  </span>
                  <strong>{organelleName(cell, organelle, language)}</strong>
                  <p>{organelleSubtitle(cell, organelle, language)}</p>
                  {activeProcess && (
                    <small>
                      <FlaskConical size={14} />
                      {localized(activeProcess.title, language)}
                    </small>
                  )}
                  {activeProcessStep && (
                    <small>
                      <Box size={14} />
                      3D {localized(activeProcessStep.title, language)}
                    </small>
                  )}
                </div>
              </aside>
            </>
          )}
        </div>

        <div className="stage-toolbar">
          <button
            type="button"
            className={cell.id !== "plant" && autoRotate ? "is-active" : ""}
            onClick={() => {
              if (cell.id === "plant") {
                onAutoRotateChange(false);
                onReset();
                return;
              }
              onAutoRotateChange(!autoRotate);
            }}
            title={copy.rotate}
          >
            <RotateCcw size={20} />
            <span>{copy.rotate}</span>
          </button>
          <button
            type="button"
            className={viewMode === "focus" ? "is-active" : ""}
            onClick={() => {
              onAutoRotateChange(false);
              onModeChange("focus");
              onToast(
                `${copy.isolateLens}: ${organelleName(cell, organelle, language)}`,
              );
            }}
            title={copy.isolate}
          >
            <Focus size={20} />
            <span>{copy.isolate}</span>
          </button>
          <button
            type="button"
            className={viewMode === "focus" ? "is-active" : ""}
            onClick={() => {
              onAutoRotateChange(false);
              onModeChange("focus");
            }}
            title={copy.hideOthers}
          >
            <EyeOff size={20} />
            <span>{copy.hideOthers}</span>
          </button>
          <button type="button" onClick={onReset} title={copy.resetView}>
            <RotateCcw size={20} />
            <span>{copy.resetView}</span>
          </button>
        </div>

        <div className="export-toolbar">
          <button type="button" disabled={exporting !== null} onClick={handleScreenshotExport} title={copy.screenshot}>
            <Camera size={20} />
            <span>{exporting === "screenshot" ? copy.preparing : copy.screenshot}</span>
          </button>
          <button type="button" disabled={exporting !== null} onClick={handleGlbExport} title={copy.glbExport}>
            <Box size={20} />
            <span>{exporting === "glb" ? copy.preparing : copy.glbExport}</span>
          </button>
        </div>
      </section>
    </main>
  );
}

function getStepOrganelleId(cell: CellItem, step: BiochemicalProcessStep) {
  return step.organelleIds.find((organelleId) => cell.organelles.some((organelle) => organelle.id === organelleId));
}

function buildProcessTutorPrompt({
  process,
  step,
  language,
}: {
  process: BiochemicalProcess;
  step: BiochemicalProcessStep;
  language: Language;
}) {
  const processTitle = localized(process.title, language);
  const stepTitle = localized(step.title, language);

  if (language === "zh") {
    return `讲解${processTitle}里的“${stepTitle}”这一步，并指出 3D 模型里相关的结构。`;
  }

  return `Explain the "${stepTitle}" step in ${processTitle}, then point me to the related structure in the 3D model.`;
}

function formatProcessReadoutValue(value: number) {
  if (value >= 20) {
    return String(Math.round(value));
  }
  if (value >= 10) {
    return value.toFixed(1).replace(/\.0$/, "");
  }
  return value.toFixed(1);
}

type ProcessExplorerProps = {
  cell: CellItem;
  activeOrganelle: string;
  processes: BiochemicalProcess[];
  activeProcess: BiochemicalProcess | null;
  activeProcessStepId: string;
  processSimulationProgress: number;
  processSimulationRunning: boolean;
  processSimulationSpeed: ProcessSimulationSpeed;
  language: Language;
  copy: AppCopy;
  onProcessChange: (id: string) => void;
  onProcessStepChange: (id: string) => void;
  onSelectOrganelle: (id: string) => void;
  onProcessSimulationProgressChange: (value: number) => void;
  onProcessSimulationRunningChange: (value: boolean) => void;
  onProcessSimulationSpeedChange: (value: ProcessSimulationSpeed) => void;
  onTutorPrompt: (prompt: string) => void;
};

function ProcessExplorer({
  cell,
  activeOrganelle,
  processes,
  activeProcess,
  activeProcessStepId,
  processSimulationProgress,
  processSimulationRunning,
  processSimulationSpeed,
  language,
  copy,
  onProcessChange,
  onProcessStepChange,
  onSelectOrganelle,
  onProcessSimulationProgressChange,
  onProcessSimulationRunningChange,
  onProcessSimulationSpeedChange,
  onTutorPrompt,
}: ProcessExplorerProps) {
  if (!activeProcess) {
    return null;
  }

  const ActiveIcon = processIcons[activeProcess.id] ?? FlaskConical;
  const activeLinkedOrganelle = cell.organelles.find((organelle) =>
    activeProcess.organelleIds.includes(organelle.id),
  );
  const activeStepIndex = Math.max(0, activeProcess.steps.findIndex((step) => step.id === activeProcessStepId));
  const simulationPercent = Math.round(processSimulationProgress * 100);
  const readoutProgress = Math.max(0, Math.min(1, processSimulationProgress));

  return (
    <section className="panel process-panel" style={{ "--process": activeProcess.color } as CSSProperties}>
      <div className="panel-heading">
        <span>
          <Workflow size={17} />
          {copy.biochemicalProcesses}
        </span>
      </div>

      <div className="process-tabs" role="tablist" aria-label={copy.processLibrary}>
        {processes.map((process) => {
          const Icon = processIcons[process.id] ?? FlaskConical;
          return (
            <button
              key={process.id}
              type="button"
              className={process.id === activeProcess.id ? "is-active" : ""}
              style={{ "--process": process.color } as CSSProperties}
              onClick={() => onProcessChange(process.id)}
            >
              <Icon size={17} />
              <span>{localized(process.title, language)}</span>
            </button>
          );
        })}
      </div>

      <div className="process-hero">
        <span className="process-icon">
          <ActiveIcon size={22} />
        </span>
        <div>
          <h3>{localized(activeProcess.title, language)}</h3>
          <p>{localized(activeProcess.summary, language)}</p>
        </div>
      </div>

      <div
        className={`process-simulator ${processSimulationRunning ? "is-running" : ""}`}
        data-testid="process-simulator"
        data-progress={simulationPercent}
        data-speed={processSimulationSpeed}
      >
        <div className="simulation-head">
          <span>
            <Activity size={16} />
            {copy.processSimulation}
          </span>
          <strong>{simulationPercent}%</strong>
        </div>
        <div className="simulation-controls">
          <button
            type="button"
            data-testid="process-simulation-toggle"
            onClick={() => onProcessSimulationRunningChange(!processSimulationRunning)}
          >
            {processSimulationRunning ? <Pause size={16} /> : <Play size={16} />}
            {processSimulationRunning ? copy.pauseSimulation : copy.playSimulation}
          </button>
          <button
            type="button"
            data-testid="process-simulation-reset"
            onClick={() => {
              onProcessSimulationRunningChange(false);
              onProcessSimulationProgressChange(0);
            }}
          >
            <Rewind size={16} />
            {copy.resetSimulation}
          </button>
          <div className="simulation-speed" aria-label={copy.simulationSpeed}>
            {([0.5, 1, 2] as ProcessSimulationSpeed[]).map((speed) => (
              <button
                type="button"
                key={speed}
                className={processSimulationSpeed === speed ? "is-active" : ""}
                data-testid={`process-simulation-speed-${String(speed).replace(".", "-")}`}
                onClick={() => onProcessSimulationSpeedChange(speed)}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
        <label className="simulation-scrub" htmlFor="process-simulation-progress">
          <span>{copy.simulationProgress}</span>
          <input
            id="process-simulation-progress"
            data-testid="process-simulation-progress"
            type="range"
            min="0"
            max="100"
            step="1"
            value={simulationPercent}
            onChange={(event) => {
              onProcessSimulationRunningChange(false);
              onProcessSimulationProgressChange(Number(event.currentTarget.value) / 100);
            }}
          />
        </label>
        <div className="simulation-track" aria-hidden="true">
          <b style={{ width: `${simulationPercent}%` }} />
          {activeProcess.steps.map((step, index) => (
            <i
              key={step.id}
              className={index <= activeStepIndex ? "is-lit" : ""}
              style={{ left: `${activeProcess.steps.length === 1 ? 100 : (index / (activeProcess.steps.length - 1)) * 100}%` }}
            />
          ))}
        </div>
      </div>

      <div className="process-lab" data-testid="process-lab-readouts">
        <div className="process-lab-head">
          <span>
            <FlaskConical size={16} />
            {copy.reactionReadouts}
          </span>
          <strong>{localized(activeProcess.simulation.compartment, language)}</strong>
        </div>
        <div className="process-lab-flow">
          <div>
            <span>{copy.simulationInputs}</span>
            <p>{activeProcess.simulation.inputs.map((input) => localized(input, language)).join(" + ")}</p>
          </div>
          <ArrowRight size={17} />
          <div>
            <span>{copy.simulationOutputs}</span>
            <p>{activeProcess.simulation.outputs.map((output) => localized(output, language)).join(" + ")}</p>
          </div>
        </div>
        <div className="process-lab-currency">
          <span>{copy.simulationCurrency}</span>
          <strong>{localized(activeProcess.simulation.currency, language)}</strong>
        </div>
        <div className="process-readout-grid">
          {activeProcess.simulation.readouts.map((readout) => {
            const value = readout.start + (readout.end - readout.start) * readoutProgress;
            const maxValue = Math.max(readout.start, readout.end, 1);
            const readoutPercent = Math.max(0, Math.min(100, (value / maxValue) * 100));
            return (
              <div className="process-readout" key={readout.id}>
                <span>{localized(readout.label, language)}</span>
                <strong>
                  {formatProcessReadoutValue(value)} <small>{localized(readout.unit, language)}</small>
                </strong>
                <i>
                  <b style={{ width: `${readoutPercent}%` }} />
                </i>
              </div>
            );
          })}
        </div>
      </div>

      <ol className="process-timeline">
        {activeProcess.steps.map((step, index) => {
          const stepOrganelleId = getStepOrganelleId(cell, step);
          const linkedToActive = step.organelleIds.includes(activeOrganelle);
          const activeStep = step.id === activeProcessStepId;
          return (
            <li key={step.id} className={`${linkedToActive ? "is-current" : ""} ${activeStep ? "is-active-step" : ""}`}>
              <button
                type="button"
                onClick={() => {
                  onProcessStepChange(step.id);
                  if (stepOrganelleId) {
                    onSelectOrganelle(stepOrganelleId);
                  }
                  onProcessSimulationProgressChange((index + 0.05) / activeProcess.steps.length);
                  onProcessSimulationRunningChange(false);
                  onTutorPrompt(buildProcessTutorPrompt({ process: activeProcess, step, language }));
                }}
              >
                <span className="step-index">{index + 1}</span>
                <span className="step-copy">
                  <strong>{localized(step.title, language)}</strong>
                  <em>{localized(step.body, language)}</em>
                </span>
                <small>{localized(step.signal, language)}</small>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="process-footer">
        <span>
          <CheckCircle2 size={16} />
          {copy.linkedStructure}
        </span>
        <strong>
          {activeLinkedOrganelle
            ? organelleName(cell, activeLinkedOrganelle, language)
            : localized(activeProcess.context, language)}
        </strong>
      </div>
    </section>
  );
}

type RightPanelProps = {
  cell: CellItem;
  activeOrganelle: string;
  favorites: Set<string>;
  activeLesson: LessonPreset | null;
  mastery: number;
  viewedCellCount: number;
  viewedOrganelleCount: number;
  totalOrganelleCount: number;
  tutorPrompt: string;
  processes: BiochemicalProcess[];
  activeProcess: BiochemicalProcess | null;
  activeProcessStepId: string;
  processSimulationProgress: number;
  processSimulationRunning: boolean;
  processSimulationSpeed: ProcessSimulationSpeed;
  language: Language;
  copy: AppCopy;
  onToggleFavorite: (id: string) => void;
  onSelectOrganelle: (id: string) => void;
  onProcessChange: (id: string) => void;
  onProcessStepChange: (id: string) => void;
  onProcessSimulationProgressChange: (value: number) => void;
  onProcessSimulationRunningChange: (value: boolean) => void;
  onProcessSimulationSpeedChange: (value: ProcessSimulationSpeed) => void;
  onApplyLesson: (id: string) => void;
  onCopyShareLink: () => void;
  onTutorPrompt: (prompt: string) => void;
};

type TutorMessage = {
  id: number;
  question: string;
  answer: string;
  source: "api" | "local";
  fallbackReason?: string;
};

type TutorRequestPayload = {
  question: string;
  language: Language;
  cell: {
    id: string;
    name: string;
    type: string;
    occurrence: string;
  };
  organelle: {
    id: string;
    name: string;
    subtitle: string;
    note: string;
    fact: string;
    attributes: Array<{ label: string; value: string }>;
  };
  comparedCell: {
    id: string;
    name: string;
    type: string;
  };
  process: null | {
    id: string;
    title: string;
    summary: string;
    step: null | {
      id: string;
      title: string;
      body: string;
      signal: string;
    };
  };
};

function buildTutorAnswer({
  cell,
  organelle,
  comparedCell,
  activeProcess,
  activeProcessStepId,
  question,
  language,
}: {
  cell: CellItem;
  organelle: CellItem["organelles"][number];
  comparedCell: CellItem;
  activeProcess: BiochemicalProcess | null;
  activeProcessStepId: string;
  question: string;
  language: Language;
}) {
  const activeStep = activeProcess?.steps.find((step) => step.id === activeProcessStepId) ?? activeProcess?.steps[0];
  const organelleLabel = organelleName(cell, organelle, language);
  const cellLabel = cellName(cell, language);
  const comparedLabel = cellName(comparedCell, language);
  const processLabel = activeProcess ? localized(activeProcess.title, language) : "";
  const stepLabel = activeStep ? localized(activeStep.title, language) : "";
  const stepBody = activeStep ? localized(activeStep.body, language) : "";
  const organelleRole = organelleNote(cell, organelle, language);
  const organelleExtra = organelleFact(cell, organelle, language);

  if (language === "zh") {
    return [
      `你的问题：${question}`,
      `${organelleLabel} 是当前 ${cellLabel} 的观察重点。${organelleRole}`,
      activeProcess && activeStep
        ? `当前过程是${processLabel}，3D 步骤是“${stepLabel}”：${stepBody}`
        : `当前先把 ${organelleLabel} 的结构位置和功能联系起来。`,
      `对比 ${comparedLabel} 时，先看是否存在同名结构，再比较形状、位置和功能。`,
      `小测：如果隐藏其他结构，只看 ${organelleLabel}，你能指出它和 ${stepLabel || "当前功能"} 的关系吗？`,
      `补充：${organelleExtra}`,
    ].join("\n");
  }

  return [
    `Question: ${question}`,
    `${organelleLabel} is the current focus in ${cellLabel}. ${organelleRole}`,
    activeProcess && activeStep
      ? `The active process is ${processLabel}, and the 3D step is "${stepLabel}": ${stepBody}`
      : `First connect the structure, position, and role of ${organelleLabel}.`,
    `When comparing with ${comparedLabel}, look for the matching structure first, then compare shape, position, and role.`,
    `Quick check: if you isolate ${organelleLabel}, can you explain how it connects to ${stepLabel || "the current function"}?`,
    `Extra clue: ${organelleExtra}`,
  ].join("\n");
}

function buildTutorPayload({
  cell,
  organelle,
  comparedCell,
  activeProcess,
  activeProcessStepId,
  question,
  language,
}: {
  cell: CellItem;
  organelle: CellItem["organelles"][number];
  comparedCell: CellItem;
  activeProcess: BiochemicalProcess | null;
  activeProcessStepId: string;
  question: string;
  language: Language;
}): TutorRequestPayload {
  const activeStep = activeProcess?.steps.find((step) => step.id === activeProcessStepId) ?? activeProcess?.steps[0];

  return {
    question,
    language,
    cell: {
      id: cell.id,
      name: cellName(cell, language),
      type: cellType(cell, language),
      occurrence: `${occurrenceTitle(cell, language)}: ${occurrenceBody(cell, language)}`,
    },
    organelle: {
      id: organelle.id,
      name: organelleName(cell, organelle, language),
      subtitle: organelleSubtitle(cell, organelle, language),
      note: organelleNote(cell, organelle, language),
      fact: organelleFact(cell, organelle, language),
      attributes: organelle.attributes.map((_, index) => ({
        label: attributeLabel(cell, organelle, index, language),
        value: attributeValue(cell, organelle, index, language),
      })),
    },
    comparedCell: {
      id: comparedCell.id,
      name: cellName(comparedCell, language),
      type: cellType(comparedCell, language),
    },
    process: activeProcess
      ? {
          id: activeProcess.id,
          title: localized(activeProcess.title, language),
          summary: localized(activeProcess.summary, language),
          step: activeStep
            ? {
                id: activeStep.id,
                title: localized(activeStep.title, language),
                body: localized(activeStep.body, language),
                signal: localized(activeStep.signal, language),
              }
            : null,
        }
      : null,
  };
}

async function requestTutorAnswer(payload: TutorRequestPayload, localAnswer: string) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch("/api/tutor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Tutor API returned ${response.status}`);
    }

    const data = (await response.json()) as { answer?: unknown; source?: unknown };
    if (typeof data.answer !== "string" || !data.answer.trim()) {
      throw new Error("Tutor API returned an empty answer");
    }

    return {
      answer: data.answer.trim(),
      source: data.source === "local" ? "local" : "api",
    } as const;
  } catch (error) {
    return {
      answer: localAnswer,
      source: "local",
      fallbackReason: error instanceof Error ? error.message : "Tutor API unavailable",
    } as const;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function RightPanel({
  cell,
  activeOrganelle,
  favorites,
  activeLesson,
  mastery,
  viewedCellCount,
  viewedOrganelleCount,
  totalOrganelleCount,
  tutorPrompt,
  processes,
  activeProcess,
  activeProcessStepId,
  processSimulationProgress,
  processSimulationRunning,
  processSimulationSpeed,
  language,
  copy,
  onToggleFavorite,
  onSelectOrganelle,
  onProcessChange,
  onProcessStepChange,
  onProcessSimulationProgressChange,
  onProcessSimulationRunningChange,
  onProcessSimulationSpeedChange,
  onApplyLesson,
  onCopyShareLink,
  onTutorPrompt,
}: RightPanelProps) {
  const organelle = cell.organelles.find((item) => item.id === activeOrganelle) ?? cell.organelles[0];
  const tutorPrompts = buildTutorPrompts(cell, organelle, language);
  const comparedCell = getCellById(cell.comparison);
  const [tutorQuestion, setTutorQuestion] = useState(tutorPrompt);
  const [tutorMessages, setTutorMessages] = useState<TutorMessage[]>([]);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorNotice, setTutorNotice] = useState("");

  useEffect(() => {
    setTutorQuestion(tutorPrompt);
  }, [tutorPrompt]);

  async function askTutor(question = tutorQuestion) {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || tutorLoading) {
      return;
    }

    const answerContext = {
      cell,
      organelle,
      comparedCell,
      activeProcess,
      activeProcessStepId,
      question: trimmedQuestion,
      language,
    };
    const localAnswer = buildTutorAnswer(answerContext);
    const payload = buildTutorPayload(answerContext);

    setTutorLoading(true);
    setTutorNotice("");

    const result = await requestTutorAnswer(payload, localAnswer);

    setTutorMessages((current) => [
      {
        id: Date.now(),
        question: trimmedQuestion,
        answer: result.answer,
        source: result.source,
        fallbackReason: result.fallbackReason,
      },
      ...current.slice(0, 3),
    ]);
    setTutorNotice(result.source === "api" ? "" : copy.tutorFallbackNotice);
    setTutorLoading(false);
  }

  return (
    <aside className="right-rail">
      <section className="panel details-panel">
        <div className="panel-heading detail-heading">
          <span>{copy.organelleDetails}</span>
          <button type="button" onClick={() => onToggleFavorite(cell.id)} aria-label={copy.toggleFavorite}>
            <Heart size={22} fill={favorites.has(cell.id) ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="detail-hero">
          <span className="organelle-orb" style={{ background: organelle.color }} />
          <div>
            <h3>{organelleName(cell, organelle, language)}</h3>
            <p>{organelleSubtitle(cell, organelle, language)}</p>
          </div>
        </div>

        <dl className="attribute-list">
          {organelle.attributes.map((item, index) => (
            <div key={item.label}>
              <dt>{attributeLabel(cell, organelle, index, language)}</dt>
              <dd>{attributeValue(cell, organelle, index, language)}</dd>
            </div>
          ))}
          <div>
            <dt>{copy.label}</dt>
            <dd>
              <span className="mini-toggle is-on" />
              <span className="detail-dot" style={{ background: organelle.color }} />
            </dd>
          </div>
        </dl>
      </section>

      <section className="panel notes-panel">
        <div className="panel-heading">
          <span>{copy.biologicalNotes}</span>
        </div>
        <p>{organelleNote(cell, organelle, language)}</p>
        <div className="fun-fact">
          <span>{copy.funFact} {organelleFact(cell, organelle, language)}</span>
          <Sparkles size={18} />
        </div>
      </section>

      <section className="panel learning-panel" id="notebooks">
        <div className="panel-heading">
          <span>
            <Brain size={17} />
            {copy.aiTutor}
          </span>
        </div>

        <div className="mastery-meter" style={{ "--progress": `${mastery}%` } as CSSProperties}>
          <div>
            <Gauge size={18} />
            <span>{copy.mastery}</span>
            <strong>{mastery}%</strong>
          </div>
          <i>
            <b />
          </i>
          <small>
            {formatMasteryProgress(viewedCellCount, cells.length, viewedOrganelleCount, totalOrganelleCount, language)}
          </small>
        </div>

        <div className="lesson-preset" data-testid="lesson-preset">
          <span>
            <BookOpen size={17} />
            {copy.lessonPreset}
          </span>
          <select
            value={activeLesson?.id ?? ""}
            aria-label={copy.lessonSelect}
            data-testid="lesson-preset-select"
            onChange={(event) => onApplyLesson(event.currentTarget.value)}
          >
            <option value="">{copy.lessonSelectPlaceholder}</option>
            {lessonPresets.map((lesson) => (
              <option value={lesson.id} key={lesson.id}>
                {localized(lesson.title, language)}
              </option>
            ))}
          </select>
          <strong>{activeLesson ? localized(activeLesson.title, language) : copy.lessonPresetEmpty}</strong>
          <p>{activeLesson ? localized(activeLesson.summary, language) : copy.lessonPresetHint}</p>
          {activeLesson && (
            <>
              <ol>
                {activeLesson.checkpoints.map((checkpoint) => (
                  <li key={checkpoint.en}>{localized(checkpoint, language)}</li>
                ))}
              </ol>
              <small>
                {copy.lessonSelfCheck}: {localized(activeLesson.selfCheck, language)}
              </small>
            </>
          )}
          <button type="button" data-testid="copy-lesson-link" onClick={onCopyShareLink}>
            <Copy size={16} />
            {copy.lessonShare}
          </button>
        </div>

        <div className="lesson-focus">
          <span>
            <Target size={17} />
            {copy.currentLessonFocus}
          </span>
          <p>
            {language === "zh" ? (
              <>
                定位 <strong>{organelleName(cell, organelle, language)}</strong>，说明它的作用，再和{" "}
                {cellName(comparedCell, language)} 中的对应结构做对比。
              </>
            ) : (
              <>
                Locate <strong>{organelleName(cell, organelle, language)}</strong>, explain its role, then compare it
                with the matching structure in {cellName(comparedCell, language)}.
              </>
            )}
          </p>
        </div>

        <div className="tutor-prompt">
          <span>
            <MessageCircle size={17} />
            {copy.promptStaged}
          </span>
          <p>{tutorPrompt}</p>
        </div>

        <div className="tutor-chat">
          <label htmlFor="tutor-question">{copy.tutorQuestion}</label>
          <textarea
            id="tutor-question"
            data-testid="tutor-question-input"
            value={tutorQuestion}
            placeholder={copy.tutorPlaceholder}
            onChange={(event) => setTutorQuestion(event.currentTarget.value)}
          />
          <button
            type="button"
            data-testid="ask-tutor"
            disabled={tutorLoading}
            onClick={() => {
              void askTutor();
              onTutorPrompt(tutorQuestion);
            }}
          >
            <Brain size={17} />
            {tutorLoading ? copy.askingTutor : copy.askTutor}
          </button>
        </div>

        <div className="tutor-response" data-testid="tutor-response" aria-live="polite">
          <span>
            <CheckCircle2 size={16} />
            {tutorMessages[0] ? copy.tutorResponse : copy.localTutorMode}
          </span>
          {tutorNotice && <small>{tutorNotice}</small>}
          {tutorMessages[0] ? (
            <>
              <em>{tutorMessages[0].source === "api" ? copy.apiTutorMode : copy.localTutorFallback}</em>
              <strong>{tutorMessages[0].question}</strong>
              <p>{tutorMessages[0].answer}</p>
            </>
          ) : (
            <p>{language === "zh" ? "选择一个提示或输入问题，导师会结合当前 3D 上下文回答。" : "Choose a prompt or type a question. The tutor will answer using the current 3D context."}</p>
          )}
        </div>

        {tutorMessages.length > 1 && (
          <div className="tutor-history">
            <span>{copy.tutorHistory}</span>
            {tutorMessages.slice(1).map((message) => (
              <button type="button" key={message.id} onClick={() => setTutorQuestion(message.question)}>
                {message.question}
              </button>
            ))}
          </div>
        )}

        <div className="prompt-list">
          {tutorPrompts.map((prompt) => (
            <button
              type="button"
              key={prompt}
              onClick={() => {
                setTutorQuestion(prompt);
                onTutorPrompt(prompt);
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </section>

      <section className="panel occurrence-panel">
        <div className="panel-heading">
          <span>{copy.whereItOccurs}</span>
        </div>
        <div className={`occurrence-art occurrence-${cell.occurrence.motif}`}>
          <span />
          <i />
          <b />
        </div>
        <h4>{occurrenceTitle(cell, language)}</h4>
        <p>{occurrenceBody(cell, language)}</p>
      </section>
    </aside>
  );
}

type WorkspaceToolsProps = {
  selectedCell: CellItem;
  activeOrganelle: string;
  favorites: Set<string>;
  language: Language;
  copy: AppCopy;
  viewMode: ViewMode;
  crossSection: boolean;
  autoRotate: boolean;
  labelDensity: LabelDensity;
  renderQuality: RenderQuality;
  onSelectCell: (id: string, preferredOrganelle?: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenProcess: (target: LibraryProcessTarget) => void;
  onLanguageChange: (language: Language) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onCrossSectionChange: (value: boolean) => void;
  onAutoRotateChange: (value: boolean) => void;
  onLabelDensityChange: (value: LabelDensity) => void;
  onRenderQualityChange: (value: RenderQuality) => void;
};

function getSearchTextForCell(cell: CellItem, language: Language) {
  const processText = getProcessesForCell(cell)
    .map((process) => `${process.title.en} ${process.title.zh} ${localized(process.title, language)}`)
    .join(" ");
  const organelleText = cell.organelles
    .map((organelle) =>
      [
        organelle.name,
        organelle.subtitle,
        organelle.note,
        organelle.fact,
        organelleName(cell, organelle, language),
        organelleSubtitle(cell, organelle, language),
        organelleNote(cell, organelle, language),
        organelleFact(cell, organelle, language),
      ].join(" "),
    )
    .join(" ");

  return [
    cell.name,
    cell.type,
    cell.occurrence.title,
    cell.occurrence.body,
    cellName(cell, language),
    cellType(cell, language),
    occurrenceTitle(cell, language),
    occurrenceBody(cell, language),
    organelleText,
    processText,
  ]
    .join(" ")
    .toLowerCase();
}

function getSearchTextForProcess(process: BiochemicalProcess, language: Language) {
  const availableCellText = cells
    .filter((cell) => process.cellIds.includes(cell.id))
    .map((cell) => `${cell.name} ${cell.type} ${cellName(cell, language)} ${cellType(cell, language)}`)
    .join(" ");

  return [
    process.title.en,
    process.title.zh,
    process.summary.en,
    process.summary.zh,
    process.context.en,
    process.context.zh,
    localized(process.title, language),
    localized(process.summary, language),
    localized(process.context, language),
    process.steps
      .map((step) =>
        [
          step.title.en,
          step.title.zh,
          step.body.en,
          step.body.zh,
          step.signal.en,
          step.signal.zh,
          localized(step.title, language),
          localized(step.body, language),
          localized(step.signal, language),
        ].join(" "),
      )
      .join(" "),
    availableCellText,
  ]
    .join(" ")
    .toLowerCase();
}

function getProcessTarget(process: BiochemicalProcess, selectedCell: CellItem) {
  const targetCell = process.cellIds.includes(selectedCell.id)
    ? selectedCell
    : cells.find((cell) => process.cellIds.includes(cell.id)) ?? selectedCell;
  const step = process.steps[0];
  const organelleId =
    step?.organelleIds.find((id) => targetCell.organelles.some((organelle) => organelle.id === id)) ??
    process.organelleIds.find((id) => targetCell.organelles.some((organelle) => organelle.id === id)) ??
    targetCell.defaultOrganelle;

  return {
    cellId: targetCell.id,
    organelleId,
    processId: process.id,
    stepId: step?.id,
  };
}

function getModelAssetMode(cell: CellItem, copy: AppCopy) {
  if (cell.modelAsset?.materialMode === "native") {
    return copy.modelNativeAsset;
  }
  if (cell.modelAsset) {
    return copy.modelStudyAsset;
  }
  return copy.modelProceduralAsset;
}

function getModelFidelityScore(cell: CellItem) {
  if (cell.modelAsset?.materialMode === "native") {
    return 94;
  }
  if (cell.modelAsset?.sourceLabel.toLowerCase().includes("nih")) {
    return 84;
  }
  if (cell.modelAsset) {
    return 78;
  }
  return 58;
}

function getModelNextUpgrade(cell: CellItem, language: Language) {
  if (!cell.modelAsset) {
    return language === "zh"
      ? "寻找可授权 GLB/PBR 资产，同时保留当前程序化模型作为教学兜底。"
      : "Source a licensed GLB/PBR asset while keeping the current procedural model as the teaching fallback.";
  }

  if (cell.modelAsset.materialMode === "native") {
    return language === "zh"
      ? "拆分关键细胞器为可选子网格，并加入更细的 PBR 与过程粒子预设。"
      : "Split key organelles into selectable submeshes, then add finer PBR and process particle presets.";
  }

  return language === "zh"
    ? "补材质保真和结构分层，让来源模型能承载更多细胞器级交互。"
    : "Improve material fidelity and structural layers so the source mesh can support more organelle-level interaction.";
}

function WorkspaceTools({
  selectedCell,
  activeOrganelle,
  favorites,
  language,
  copy,
  viewMode,
  crossSection,
  autoRotate,
  labelDensity,
  renderQuality,
  onSelectCell,
  onToggleFavorite,
  onOpenProcess,
  onLanguageChange,
  onViewModeChange,
  onCrossSectionChange,
  onAutoRotateChange,
  onLabelDensityChange,
  onRenderQualityChange,
}: WorkspaceToolsProps) {
  const [query, setQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const currentProcessIds = new Set(getProcessesForCell(selectedCell).map((process) => process.id));

  const cellResults = cells.filter((cell) => {
    if (favoritesOnly && !favorites.has(cell.id)) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }
    return getSearchTextForCell(cell, language).includes(normalizedQuery);
  });

  const processResults = biochemicalProcesses.filter((process) => {
    if (favoritesOnly && !process.cellIds.some((cellId) => favorites.has(cellId))) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }
    return getSearchTextForProcess(process, language).includes(normalizedQuery);
  });

  const activeOrganelleItem = selectedCell.organelles.find((organelle) => organelle.id === activeOrganelle);

  return (
    <section className="workspace-tools" aria-label={copy.workspaceTools}>
      <section className="panel library-panel" id="library" data-testid="library-panel">
        <div className="panel-heading">
          <span>
            <Library size={17} />
            {copy.libraryTitle}
          </span>
          <small>
            {cellResults.length + processResults.length} {copy.libraryMatches}
          </small>
        </div>

        <div className="library-search">
          <label htmlFor="library-search">
            <Search size={16} />
            {copy.librarySearch}
          </label>
          <input
            id="library-search"
            data-testid="library-search"
            value={query}
            placeholder={copy.librarySearchPlaceholder}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
          <button
            type="button"
            className={favoritesOnly ? "is-active" : ""}
            data-testid="library-favorites-toggle"
            onClick={() => setFavoritesOnly((value) => !value)}
          >
            <Star size={16} fill={favoritesOnly ? "currentColor" : "none"} />
            {copy.libraryShowFavorites}
          </button>
        </div>

        <div className="library-columns">
          <div className="library-section">
            <h3>{copy.libraryCells}</h3>
            <div className="library-card-list">
              {cellResults.map((cell) => {
                const selected = selectedCell.id === cell.id;
                const processCount = getProcessesForCell(cell).length;
                return (
                  <article className={`library-card ${selected ? "is-current" : ""}`} key={cell.id}>
                    <MiniCell cell={cell} />
                    <div className="library-card-copy">
                      <span>{selected ? copy.currentCell : cellType(cell, language)}</span>
                      <strong>{cellName(cell, language)}</strong>
                      <p>
                        {cell.organelles.length} {copy.organelleCount} · {processCount} {copy.processCount}
                      </p>
                    </div>
                    <div className="library-actions">
                      <button
                        type="button"
                        className={favorites.has(cell.id) ? "is-active" : ""}
                        aria-label={`${copy.favorite} ${cellName(cell, language)}`}
                        onClick={() => onToggleFavorite(cell.id)}
                      >
                        <Star size={16} fill="currentColor" />
                      </button>
                      <button
                        type="button"
                        data-testid={`library-cell-open-${cell.id}`}
                        onClick={() => onSelectCell(cell.id)}
                      >
                        {copy.libraryOpenCell}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="library-section">
            <h3>{copy.libraryProcesses}</h3>
            <div className="library-card-list">
              {processResults.map((process) => {
                const target = getProcessTarget(process, selectedCell);
                const Icon = processIcons[process.id] ?? FlaskConical;
                const processAvailableNow = currentProcessIds.has(process.id);
                const availableCells = cells.filter((cell) => process.cellIds.includes(cell.id));
                return (
                  <article
                    className={`library-card process-library-card ${processAvailableNow ? "is-current" : ""}`}
                    style={{ "--process": process.color } as CSSProperties}
                    key={process.id}
                  >
                    <span className="library-process-icon">
                      <Icon size={20} />
                    </span>
                    <div className="library-card-copy">
                      <span>{processAvailableNow ? copy.currentCell : copy.availableFor}</span>
                      <strong>{localized(process.title, language)}</strong>
                      <p>{localized(process.summary, language)}</p>
                      <em>{availableCells.map((cell) => cellName(cell, language)).join(" · ")}</em>
                    </div>
                    <div className="library-actions">
                      <button
                        type="button"
                        data-testid={`library-process-open-${process.id}`}
                        onClick={() => onOpenProcess(target)}
                      >
                        {copy.libraryOpenProcess}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>

        {!cellResults.length && !processResults.length && (
          <div className="empty-library-state">
            <Search size={18} />
            {copy.libraryNoResults}
          </div>
        )}
      </section>

      <section className="panel settings-panel" id="settings" data-testid="settings-panel">
        <div className="panel-heading">
          <span>
            <SlidersHorizontal size={17} />
            {copy.settingsTitle}
          </span>
          <small>{copy.settingsLive}</small>
        </div>

        <div className="settings-grid">
          <div className="setting-control">
            <span>
              <Languages size={16} />
              {copy.language}
            </span>
            <div className="segmented-control">
              <button
                type="button"
                className={language === "zh" ? "is-active" : ""}
                data-testid="settings-language-zh"
                onClick={() => onLanguageChange("zh")}
              >
                中
              </button>
              <button
                type="button"
                className={language === "en" ? "is-active" : ""}
                data-testid="settings-language-en"
                onClick={() => onLanguageChange("en")}
              >
                EN
              </button>
            </div>
          </div>

          <div className="setting-control">
            <span>
              <Focus size={16} />
              {copy.settingsView}
            </span>
            <div className="segmented-control">
              <button
                type="button"
                className={viewMode === "mesh" ? "is-active" : ""}
                data-testid="settings-view-mesh"
                onClick={() => onViewModeChange("mesh")}
              >
                {copy.modeLabels.mesh}
              </button>
              <button
                type="button"
                className={viewMode === "focus" ? "is-active" : ""}
                data-testid="settings-view-focus"
                onClick={() => onViewModeChange("focus")}
              >
                {copy.modeLabels.focus}
              </button>
            </div>
          </div>

          <label className="settings-toggle">
            <span>
              <RotateCcw size={16} />
              {copy.settingsMotion}
            </span>
            <input
              type="checkbox"
              checked={autoRotate}
              data-testid="settings-auto-rotate"
              onChange={(event) => onAutoRotateChange(event.currentTarget.checked)}
            />
            <i />
          </label>

          <label className="settings-toggle">
            <span>
              <ScanSearch size={16} />
              {copy.crossSection}
            </span>
            <input
              type="checkbox"
              checked={crossSection}
              data-testid="settings-cross-section"
              onChange={(event) => onCrossSectionChange(event.currentTarget.checked)}
            />
            <i />
          </label>

          <div className="setting-control">
            <span>
              <Target size={16} />
              {copy.settingsLabels}
            </span>
            <div className="segmented-control">
              <button
                type="button"
                className={labelDensity === "full" ? "is-active" : ""}
                data-testid="settings-label-full"
                onClick={() => onLabelDensityChange("full")}
              >
                {copy.labelsFull}
              </button>
              <button
                type="button"
                className={labelDensity === "compact" ? "is-active" : ""}
                data-testid="settings-label-compact"
                onClick={() => onLabelDensityChange("compact")}
              >
                {copy.labelsCompact}
              </button>
            </div>
          </div>

          <div className="setting-control">
            <span>
              <Gauge size={16} />
              {copy.settingsQuality}
            </span>
            <div className="segmented-control">
              <button
                type="button"
                className={renderQuality === "balanced" ? "is-active" : ""}
                data-testid="settings-quality-balanced"
                onClick={() => onRenderQualityChange("balanced")}
              >
                {copy.qualityBalanced}
              </button>
              <button
                type="button"
                className={renderQuality === "high" ? "is-active" : ""}
                data-testid="settings-quality-high"
                onClick={() => onRenderQualityChange("high")}
              >
                {copy.qualityHigh}
              </button>
            </div>
          </div>
        </div>

        <div className="settings-context">
          <span>
            <CheckCircle2 size={16} />
            {copy.settingsContext}
          </span>
          <strong>{cellName(selectedCell, language)}</strong>
          <em>
            {activeOrganelleItem ? organelleName(selectedCell, activeOrganelleItem, language) : selectedCell.defaultOrganelle}
          </em>
        </div>
      </section>

      <section className="panel model-atlas-panel" id="model-atlas" data-testid="model-atlas-panel">
        <div className="panel-heading">
          <span>
            <Box size={17} />
            {copy.modelAtlas}
          </span>
          <small>{copy.modelAtlasLive}</small>
        </div>

        <div className="model-atlas-current">
          <MiniCell cell={selectedCell} />
          <div>
            <span>{copy.modelAtlasCurrent}</span>
            <strong>{cellName(selectedCell, language)}</strong>
            <em>{getModelAssetMode(selectedCell, copy)}</em>
          </div>
          <b style={{ "--progress": `${getModelFidelityScore(selectedCell)}%` } as CSSProperties}>
            <i />
            {getModelFidelityScore(selectedCell)}%
          </b>
        </div>

        <div className="model-atlas-grid">
          {cells.map((cell) => {
            const processCount = getProcessesForCell(cell).length;
            const fidelityScore = getModelFidelityScore(cell);
            const current = cell.id === selectedCell.id;
            return (
              <article className={`model-asset-card ${current ? "is-current" : ""}`} key={cell.id} data-testid={`model-asset-card-${cell.id}`}>
                <div className="model-asset-head">
                  <MiniCell cell={cell} />
                  <div>
                    <span>{getModelAssetMode(cell, copy)}</span>
                    <strong>{cellName(cell, language)}</strong>
                    <em>{cell.modelAsset?.sourceLabel ?? copy.modelProceduralAsset}</em>
                  </div>
                </div>
                <dl>
                  <div>
                    <dt>{copy.modelAssetSource}</dt>
                    <dd>{cell.modelAsset?.sourceUrl.startsWith("http") ? cell.modelAsset.sourceUrl.replace(/^https?:\/\//, "") : cell.modelAsset?.sourceLabel ?? "Three.js"}</dd>
                  </div>
                  <div>
                    <dt>{copy.modelAssetFidelity}</dt>
                    <dd>
                      <span className="model-score" style={{ "--progress": `${fidelityScore}%` } as CSSProperties}>
                        <i />
                      </span>
                      {fidelityScore}%
                    </dd>
                  </div>
                  <div>
                    <dt>{copy.modelAssetCoverage}</dt>
                    <dd>
                      {cell.organelles.length} {copy.organelleCount} · {processCount} {copy.modelSemanticLayers}
                    </dd>
                  </div>
                  <div>
                    <dt>{copy.modelAssetNext}</dt>
                    <dd>{getModelNextUpgrade(cell, language)}</dd>
                  </div>
                </dl>
                <button type="button" onClick={() => onSelectCell(cell.id, cell.defaultOrganelle)}>
                  {copy.modelOpen}
                  <ArrowRight size={16} />
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
}

type BottomPanelsProps = {
  cell: CellItem;
  activeOrganelle: string;
  language: Language;
  copy: AppCopy;
  onCompare: () => void;
  onSelectOrganelle: (id: string) => void;
  onToast: (message: string) => void;
};

type UploadedMicroscopeReference = {
  name: string;
  url: string;
  size: number;
  dataUrl?: string;
  objectUrl?: boolean;
};

type MicroscopeAnnotationSet = {
  id: number;
  cellId: string;
  organelleId: string;
  sourceLabel: string;
  microscopeLabel: string;
  uploaded: boolean;
  uploadedReference?: {
    name: string;
    size: number;
    dataUrl: string;
  };
  channel: MicroscopeChannelId;
  zoom: number;
  markersVisible: boolean;
  stain: string;
  magnification: string;
};

const microscopeAnnotationStorageKey = "cell-architecture-studio:microscope-annotations:v1";

function isMicroscopeChannel(value: unknown): value is MicroscopeChannelId {
  return value === "brightfield" || value === "fluorescence" || value === "contrast";
}

function readStoredMicroscopeAnnotations() {
  try {
    const raw = window.localStorage.getItem(microscopeAnnotationStorageKey);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((annotation): annotation is MicroscopeAnnotationSet => {
      return (
        annotation &&
        typeof annotation.id === "number" &&
        typeof annotation.cellId === "string" &&
        typeof annotation.organelleId === "string" &&
        typeof annotation.sourceLabel === "string" &&
        typeof annotation.microscopeLabel === "string" &&
        typeof annotation.uploaded === "boolean" &&
        isMicroscopeChannel(annotation.channel) &&
        typeof annotation.zoom === "number" &&
        typeof annotation.markersVisible === "boolean" &&
        typeof annotation.stain === "string" &&
        typeof annotation.magnification === "string"
      );
    });
  } catch {
    return [];
  }
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Microscope upload did not produce image data."));
    });
    reader.addEventListener("error", () => reject(reader.error ?? new Error("Microscope upload failed.")));
    reader.readAsDataURL(file);
  });
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${Math.round(size / 102.4) / 10} KB`;
  }
  return `${Math.round(size / 104857.6) / 10} MB`;
}

function buildMicroscopeAnalysis({
  cell,
  organelle,
  selectedLabel,
  uploadedReference,
  language,
}: {
  cell: CellItem;
  organelle: CellItem["organelles"][number];
  selectedLabel: string;
  uploadedReference: UploadedMicroscopeReference | null;
  language: Language;
}) {
  const cellLabel = cellName(cell, language);
  const organelleLabel = organelleName(cell, organelle, language);
  const sourceLabel = uploadedReference?.name ?? selectedLabel;

  if (language === "zh") {
    return {
      source: sourceLabel,
      summary: `当前样本按${cellLabel}处理，重点识别${organelleLabel}。`,
      signal: uploadedReference
        ? `已加载 ${formatFileSize(uploadedReference.size)} 的参考图，并和当前 3D 结构上下文对齐。`
        : `${selectedLabel} 已用于当前观察上下文。`,
      recommendation: `下一步可以切换细胞器或进入 Isolate，检查${organelleLabel}在 3D 和显微图中的对应位置。`,
      confidence: uploadedReference ? 87 : 78,
    };
  }

  return {
    source: sourceLabel,
    summary: `Treating the specimen as ${cellLabel}, with ${organelleLabel} as the focus marker.`,
    signal: uploadedReference
      ? `Loaded a ${formatFileSize(uploadedReference.size)} reference image and aligned it with the current 3D context.`
      : `${selectedLabel} is selected for the current observation context.`,
    recommendation: `Switch organelles or enter Isolate to compare ${organelleLabel} between the microscope view and the 3D model.`,
    confidence: uploadedReference ? 87 : 78,
  };
}

function getMicroscopeChannelLabel(channel: MicroscopeChannelId, language: Language) {
  const labels: Record<MicroscopeChannelId, { en: string; zh: string }> = {
    brightfield: {
      en: "Brightfield",
      zh: "明场",
    },
    fluorescence: {
      en: "Marker",
      zh: "标记",
    },
    contrast: {
      en: "Contrast",
      zh: "对比",
    },
  };

  return labels[channel][language];
}

function getMicroscopeMetadata({
  selectedLabel,
  uploadedReference,
  language,
}: {
  selectedLabel: string;
  uploadedReference: UploadedMicroscopeReference | null;
  language: Language;
}) {
  if (uploadedReference) {
    return language === "zh"
      ? {
          stain: "用户参考图",
          magnification: "自适应缩放",
          channel: "上传图 + 当前标记",
        }
      : {
          stain: "User reference",
          magnification: "Adaptive zoom",
          channel: "Upload + focus marker",
        };
  }

  const normalizedLabel = selectedLabel.toLowerCase();
  if (normalizedLabel.includes("electron")) {
    return language === "zh"
      ? { stain: "电镜灰度", magnification: "18,000x", channel: "超微结构对比" }
      : { stain: "Electron grayscale", magnification: "18,000x", channel: "Ultrastructure contrast" };
  }
  if (normalizedLabel.includes("stain")) {
    return language === "zh"
      ? { stain: "染色切片", magnification: "600x", channel: "结构 + 染色信号" }
      : { stain: "Stained section", magnification: "600x", channel: "Structure + stain signal" };
  }

  return language === "zh"
    ? { stain: "明场观察", magnification: "400x", channel: "透射光" }
    : { stain: "Brightfield", magnification: "400x", channel: "Transmitted light" };
}

function BottomPanels({ cell, activeOrganelle, language, copy, onCompare, onSelectOrganelle, onToast }: BottomPanelsProps) {
  const comparedCell = getCellById(cell.comparison);
  const currentOrganelle = cell.organelles.find((item) => item.id === activeOrganelle) ?? cell.organelles[0];
  const comparedOrganelle =
    comparedCell.organelles.find((item) => item.id === currentOrganelle.id) ??
    comparedCell.organelles.find((item) => item.id === comparedCell.defaultOrganelle) ??
    comparedCell.organelles[0];
  const sharedOrganelleCount = cell.organelles.filter((organelle) =>
    comparedCell.organelles.some((item) => item.id === organelle.id),
  ).length;
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedMicroscopeLabel, setSelectedMicroscopeLabel] = useState(cell.microscope[0]?.label ?? "");
  const [uploadedReference, setUploadedReference] = useState<UploadedMicroscopeReference | null>(null);
  const [microscopeZoom, setMicroscopeZoom] = useState(1.35);
  const [microscopeChannel, setMicroscopeChannel] = useState<MicroscopeChannelId>("brightfield");
  const [showMicroscopeMarkers, setShowMicroscopeMarkers] = useState(true);
  const [microscopeAnnotationSets, setMicroscopeAnnotationSets] = useState<MicroscopeAnnotationSet[]>(() =>
    readStoredMicroscopeAnnotations(),
  );
  const selectedMicroscope =
    cell.microscope.find((image) => image.label === selectedMicroscopeLabel) ?? cell.microscope[0] ?? null;
  const microscopeMetadata = getMicroscopeMetadata({
    selectedLabel: microscopeLabel(cell, selectedMicroscopeLabel || cell.microscope[0]?.label || "", language),
    uploadedReference,
    language,
  });
  const microscopeAnalysis = buildMicroscopeAnalysis({
    cell,
    organelle: currentOrganelle,
    selectedLabel: microscopeLabel(cell, selectedMicroscopeLabel || cell.microscope[0]?.label || "", language),
    uploadedReference,
    language,
  });

  useEffect(() => {
    setSelectedMicroscopeLabel(cell.microscope[0]?.label ?? "");
    setMicroscopeZoom(1.35);
    setMicroscopeChannel("brightfield");
    setShowMicroscopeMarkers(true);
  }, [cell.id, cell.microscope]);

  useEffect(
    () => () => {
      if (uploadedReference?.objectUrl && uploadedReference.url) {
        URL.revokeObjectURL(uploadedReference.url);
      }
    },
    [uploadedReference],
  );

  useEffect(() => {
    window.localStorage.setItem(microscopeAnnotationStorageKey, JSON.stringify(microscopeAnnotationSets.slice(0, 24)));
  }, [microscopeAnnotationSets]);

  function handleMicroscopeUpload(file: File | undefined) {
    if (!file) {
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const nextReference = {
      name: file.name,
      url: objectUrl,
      size: file.size,
      objectUrl: true,
    };

    setUploadedReference(nextReference);
    void fileToDataUrl(file)
      .then((dataUrl) => {
        setUploadedReference((current) =>
          current?.url === objectUrl
            ? {
                name: file.name,
                url: dataUrl,
                size: file.size,
                dataUrl,
              }
            : current,
        );
      })
      .catch(() => {
        setUploadedReference((current) => current);
      });
    setMicroscopeZoom(1.8);
    setMicroscopeChannel("contrast");
    setShowMicroscopeMarkers(true);
    onToast(copy.imageMatched);
  }

  function saveMicroscopeAnnotation() {
    const nextAnnotation: MicroscopeAnnotationSet = {
      id: Date.now(),
      cellId: cell.id,
      organelleId: currentOrganelle.id,
      sourceLabel: uploadedReference?.name ?? microscopeLabel(cell, selectedMicroscopeLabel, language),
      microscopeLabel: selectedMicroscopeLabel,
      uploaded: Boolean(uploadedReference),
      uploadedReference: uploadedReference?.dataUrl
        ? {
            name: uploadedReference.name,
            size: uploadedReference.size,
            dataUrl: uploadedReference.dataUrl,
          }
        : undefined,
      channel: microscopeChannel,
      zoom: microscopeZoom,
      markersVisible: showMicroscopeMarkers,
      stain: microscopeMetadata.stain,
      magnification: microscopeMetadata.magnification,
    };

    setMicroscopeAnnotationSets((current) => [
      nextAnnotation,
      ...current
        .filter((annotation) => !(annotation.cellId === cell.id && annotation.organelleId === currentOrganelle.id))
        .slice(0, 23),
    ]);
    onToast(copy.microscopeAnnotationSaved);
  }

  function restoreMicroscopeAnnotation(annotation: MicroscopeAnnotationSet) {
    if (cell.organelles.some((organelle) => organelle.id === annotation.organelleId)) {
      onSelectOrganelle(annotation.organelleId);
    }
    if (annotation.uploaded && annotation.uploadedReference) {
      setUploadedReference({
        name: annotation.uploadedReference.name,
        size: annotation.uploadedReference.size,
        url: annotation.uploadedReference.dataUrl,
        dataUrl: annotation.uploadedReference.dataUrl,
      });
    } else {
      setUploadedReference(null);
      setSelectedMicroscopeLabel(annotation.microscopeLabel);
    }
    setMicroscopeChannel(annotation.channel);
    setMicroscopeZoom(annotation.zoom);
    setShowMicroscopeMarkers(annotation.markersVisible);
    onToast(copy.microscopeAnnotationRestored);
  }

  const visibleMicroscopeAnnotations = microscopeAnnotationSets.filter((annotation) => annotation.cellId === cell.id);

  return (
    <section className="bottom-grid">
      <div className="panel microscope-panel">
        <div className="panel-heading">
          <span>
            {copy.microscopeView}
            <Info size={16} />
          </span>
        </div>
        <div className="micro-card-row">
          {cell.microscope.map((image) => (
            <button
              type="button"
              key={image.label}
              className={`micro-card pattern-${image.pattern} ${
                selectedMicroscopeLabel === image.label && !uploadedReference ? "is-active" : ""
              }`}
              style={{ "--micro": image.tone } as CSSProperties}
              onClick={() => {
                setSelectedMicroscopeLabel(image.label);
                setUploadedReference(null);
                setMicroscopeZoom(1.35);
                setMicroscopeChannel(image.label.toLowerCase().includes("electron") ? "contrast" : "brightfield");
                setShowMicroscopeMarkers(true);
                onToast(`${microscopeLabel(cell, image.label, language)} ${copy.selected}`);
              }}
            >
              <span className="micro-preview">
                <i />
                <b />
              </span>
              <strong>{microscopeLabel(cell, image.label, language)}</strong>
              <small>{copy.scanPreview}</small>
            </button>
          ))}
          <button
            type="button"
            className={`micro-card add-card ${uploadedReference ? "is-active" : ""}`}
            onClick={() => uploadInputRef.current?.click()}
          >
            <Plus size={28} />
            <strong>{copy.addImage}</strong>
            <small>{uploadedReference ? copy.uploadedReference : copy.microscopeUpload}</small>
          </button>
        </div>
        <input
          ref={uploadInputRef}
          className="visually-hidden"
          data-testid="microscope-upload-input"
          type="file"
          accept="image/*"
          onChange={(event) => {
            handleMicroscopeUpload(event.currentTarget.files?.[0]);
            event.currentTarget.value = "";
          }}
        />
        <div
          className={`microscope-stage channel-${microscopeChannel} ${uploadedReference ? "has-upload" : ""}`}
          data-testid="microscope-stage"
          style={
            {
              "--micro": selectedMicroscope?.tone ?? cell.accent,
              "--focus-color": currentOrganelle.color,
              "--zoom": microscopeZoom,
            } as CSSProperties
          }
        >
          <div className="microscope-stage-head">
            <span>
              <ScanSearch size={16} />
              {copy.microscopeStage}
            </span>
            <strong>{microscopeMetadata.magnification}</strong>
          </div>
          <div className="microscope-viewport">
            <div className="microscope-specimen">
              {uploadedReference ? (
                <img src={uploadedReference.url} alt={uploadedReference.name} />
              ) : (
                <span className={`micro-preview pattern-${selectedMicroscope?.pattern ?? ""}`}>
                  <i />
                  <b />
                </span>
              )}
            </div>
            <span className="scope-grid" aria-hidden="true" />
            {showMicroscopeMarkers && (
              <>
                <button
                  type="button"
                  className="scope-marker marker-primary"
                  data-testid="microscope-marker-primary"
                  title={organelleName(cell, currentOrganelle, language)}
                >
                  <span />
                  <strong>{organelleName(cell, currentOrganelle, language)}</strong>
                </button>
                <button
                  type="button"
                  className="scope-marker marker-secondary"
                  title={cellName(cell, language)}
                >
                  <span />
                  <strong>{copy.cellBoundary}</strong>
                </button>
              </>
            )}
          </div>
          <div className="microscope-controls">
            <label className="zoom-control" htmlFor="microscope-zoom">
              <span>{copy.microscopeZoom}</span>
              <input
                id="microscope-zoom"
                data-testid="microscope-zoom"
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={microscopeZoom}
                onChange={(event) => setMicroscopeZoom(Number(event.currentTarget.value))}
              />
              <strong>{Math.round(microscopeZoom * 100)}%</strong>
            </label>
            <div className="microscope-channel-row" aria-label={copy.microscopeChannels}>
              {(["brightfield", "fluorescence", "contrast"] as MicroscopeChannelId[]).map((channel) => (
                <button
                  type="button"
                  key={channel}
                  className={microscopeChannel === channel ? "is-active" : ""}
                  data-testid={`microscope-channel-${channel}`}
                  onClick={() => setMicroscopeChannel(channel)}
                >
                  {getMicroscopeChannelLabel(channel, language)}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={`marker-toggle ${showMicroscopeMarkers ? "is-active" : ""}`}
              data-testid="microscope-markers-toggle"
              onClick={() => setShowMicroscopeMarkers((value) => !value)}
            >
              <Target size={16} />
              {copy.microscopeMarkers}
            </button>
          </div>
          <div className="microscope-metadata">
            <span>{copy.microscopeStain}: {microscopeMetadata.stain}</span>
            <span>{copy.microscopeChannels}: {microscopeMetadata.channel}</span>
          </div>
        </div>
        <div className="microscope-annotations" data-testid="microscope-annotation-sets">
          <div className="annotation-head">
            <span>
              <BookOpen size={16} />
              {copy.microscopeAnnotations}
            </span>
            <button type="button" data-testid="microscope-annotation-save" onClick={saveMicroscopeAnnotation}>
              <Plus size={16} />
              {copy.saveMicroscopeAnnotation}
            </button>
          </div>
          {visibleMicroscopeAnnotations.length ? (
            <div className="annotation-list">
              {visibleMicroscopeAnnotations.map((annotation) => {
                const annotationOrganelle =
                  cell.organelles.find((organelle) => organelle.id === annotation.organelleId) ?? currentOrganelle;
                return (
                  <button
                    type="button"
                    key={annotation.id}
                    data-testid={`microscope-annotation-restore-${annotation.id}`}
                    onClick={() => restoreMicroscopeAnnotation(annotation)}
                  >
                    <span style={{ background: annotationOrganelle.color }} />
                    <strong>{organelleName(cell, annotationOrganelle, language)}</strong>
                    <em>
                      {copy.microscopeAnnotationSource}: {annotation.sourceLabel}
                    </em>
                    <small>
                      {getMicroscopeChannelLabel(annotation.channel, language)} · {Math.round(annotation.zoom * 100)}% ·{" "}
                      {annotation.markersVisible ? copy.microscopeMarkers : copy.hideOthers}
                    </small>
                  </button>
                );
              })}
            </div>
          ) : (
            <p>{copy.noMicroscopeAnnotations}</p>
          )}
        </div>
        <div className="microscope-analysis" aria-live="polite">
          <div
            className="analysis-preview"
            style={{ "--micro": selectedMicroscope?.tone ?? cell.accent } as CSSProperties}
          >
            {uploadedReference ? (
              <img src={uploadedReference.url} alt={uploadedReference.name} />
            ) : (
              <span className={`micro-preview pattern-${selectedMicroscope?.pattern ?? ""}`}>
                <i />
                <b />
              </span>
            )}
          </div>
          <div className="analysis-copy">
            <span>
              <ScanSearch size={16} />
              {copy.microscopeAnalysis}
            </span>
            <strong>{microscopeAnalysis.source}</strong>
            <p>{microscopeAnalysis.summary}</p>
            <p>{microscopeAnalysis.signal}</p>
            <small>
              {copy.confidence}: {microscopeAnalysis.confidence}%
            </small>
            <em>{microscopeAnalysis.recommendation}</em>
          </div>
        </div>
      </div>

      <div className="panel compare-panel">
        <div className="panel-heading">
          <span>
            {copy.compareCells}
            <Info size={16} />
          </span>
        </div>
        <div className="compare-strip">
          <div className="compare-specimen is-current">
            <MiniCell cell={cell} />
            <div>
              <span>{copy.youAreHere}</span>
              <strong>{cellName(cell, language)}</strong>
              <em>{organelleName(cell, currentOrganelle, language)}</em>
            </div>
          </div>
          <div className="compare-divider">
            <b>VS</b>
            <small>
              {sharedOrganelleCount} {copy.sharedMarkers}
            </small>
          </div>
          <div className="compare-specimen">
            <MiniCell cell={comparedCell} />
            <div>
              <span>{cellType(comparedCell, language)}</span>
              <strong>{cellName(comparedCell, language)}</strong>
              <em>{organelleName(comparedCell, comparedOrganelle, language)}</em>
            </div>
          </div>
        </div>
        <div className="compare-focus-row">
          <span>
            <Target size={16} />
            {copy.focusMatch}
          </span>
          <strong>
            {organelleName(cell, currentOrganelle, language)} /{" "}
            {organelleName(comparedCell, comparedOrganelle, language)}
          </strong>
        </div>
        <button type="button" className="comparison-button" onClick={onCompare}>
          {copy.openComparison}
          <ArrowRight size={20} />
        </button>
      </div>
    </section>
  );
}

type ComparisonModalProps = {
  cell: CellItem;
  activeOrganelle: string;
  open: boolean;
  language: Language;
  copy: AppCopy;
  onClose: () => void;
};

function ComparisonModal({ cell, activeOrganelle, open, language, copy, onClose }: ComparisonModalProps) {
  const comparedCell = getCellById(cell.comparison);
  if (!open) {
    return null;
  }

  const currentOrganelle = cell.organelles.find((item) => item.id === activeOrganelle) ?? cell.organelles[0];
  const comparedOrganelle =
    comparedCell.organelles.find((item) => item.id === currentOrganelle.id) ??
    comparedCell.organelles.find((item) => item.id === comparedCell.defaultOrganelle) ??
    comparedCell.organelles[0];
  const sharedOrganelleCount = cell.organelles.filter((organelle) =>
    comparedCell.organelles.some((item) => item.id === organelle.id),
  ).length;

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label={copy.comparisonDialog}>
      <div className="comparison-modal">
        <button className="modal-close" type="button" onClick={onClose}>
          {copy.close}
        </button>
        <div className="comparison-modal-head">
          <span>
            <FlaskConical size={17} />
            {copy.focusMatch}
          </span>
          <h3>{copy.comparisonView}</h3>
          <p>
            {cellName(cell, language)} {copy.comparedWith} {cellName(comparedCell, language)}
          </p>
        </div>
        <div className="comparison-summary">
          <div>
            <strong>{sharedOrganelleCount}</strong>
            <span>{copy.sharedMarkers}</span>
          </div>
          <div>
            <strong>{organelleName(cell, currentOrganelle, language)}</strong>
            <span>{copy.defaultFocus}</span>
          </div>
        </div>
        <div className="comparison-columns">
          {[cell, comparedCell].map((item) => {
            const organelle = item.id === cell.id ? currentOrganelle : comparedOrganelle;
            return (
              <section key={item.id}>
                <div className="comparison-specimen-head">
                  <MiniCell cell={item} />
                  <div>
                    <h4>{cellName(item, language)}</h4>
                    <p>{cellType(item, language)}</p>
                  </div>
                </div>
                <dl>
                  <div>
                    <dt>{copy.defaultFocus}</dt>
                    <dd>{organelleName(item, organelle, language)}</dd>
                  </div>
                  <div>
                    <dt>{copy.mainNote}</dt>
                    <dd>{organelleSubtitle(item, organelle, language)}</dd>
                  </div>
                  <div>
                    <dt>{copy.occursIn}</dt>
                    <dd>{occurrenceTitle(item, language)}</dd>
                  </div>
                </dl>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Toast({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }
  return <div className="toast">{message}</div>;
}

export default function App() {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [selectedCellId, setSelectedCellId] = useState(initialCell.id);
  const [activeOrganelle, setActiveOrganelle] = useState(initialOrganelle);
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [crossSection, setCrossSection] = useState(false);
  const [autoRotate, setAutoRotate] = useState(initialCell.id !== "plant" && initialViewMode !== "focus");
  const [labelDensity, setLabelDensity] = useState<LabelDensity>("full");
  const [renderQuality, setRenderQuality] = useState<RenderQuality>("balanced");
  const [resetKey, setResetKey] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set([initialCell.id]));
  const [viewedCells, setViewedCells] = useState<Set<string>>(() => new Set([initialCell.id]));
  const [viewedOrganelleKeys, setViewedOrganelleKeys] = useState<Set<string>>(
    () => new Set([`${initialCell.id}:${initialOrganelle}`]),
  );
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [activeLessonId, setActiveLessonId] = useState(initialLesson?.id ?? "");
  const [tutorPrompt, setTutorPrompt] = useState(() =>
    buildTutorPrompts(
      initialCell,
      initialCell.organelles.find((organelle) => organelle.id === initialOrganelle) ?? initialCell.organelles[0],
      initialLanguage,
    )[2],
  );
  const [activeProcessId, setActiveProcessId] = useState(initialProcessId);
  const [activeProcessStepId, setActiveProcessStepId] = useState(initialProcessStepId);
  const [processSimulationProgress, setProcessSimulationProgress] = useState(initialProcessProgress);
  const [processSimulationRunning, setProcessSimulationRunning] = useState(false);
  const [processSimulationSpeed, setProcessSimulationSpeed] = useState<ProcessSimulationSpeed>(1);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const processAnimationFrameRef = useRef<number | null>(null);
  const processAnimationLastTimeRef = useRef<number | null>(null);
  const pendingOrganelleRef = useRef<string | null>(null);
  const pendingAutoRotateRef = useRef<boolean | null>(null);
  const previousSelectedCellIdRef = useRef(initialCell.id);
  const previousProcessScopeRef = useRef(`${initialCell.id}:${initialProcessId}`);

  const copy = uiCopy[language];
  const selectedCell = useMemo(() => getCellById(selectedCellId), [selectedCellId]);
  const selectedOrganelle = useMemo(
    () => selectedCell.organelles.find((item) => item.id === activeOrganelle) ?? selectedCell.organelles[0],
    [activeOrganelle, selectedCell],
  );
  const availableProcesses = useMemo(() => getProcessesForCell(selectedCell), [selectedCell]);
  const activeProcess = useMemo(
    () => availableProcesses.find((process) => process.id === activeProcessId) ?? availableProcesses[0] ?? null,
    [activeProcessId, availableProcesses],
  );
  const activeLesson = useMemo(() => getLessonById(activeLessonId), [activeLessonId]);
  const totalOrganelleCount = useMemo(
    () => cells.reduce((total, cell) => total + cell.organelles.length, 0),
    [],
  );
  const mastery = useMemo(() => {
    const cellCoverage = viewedCells.size / cells.length;
    const organelleCoverage = viewedOrganelleKeys.size / totalOrganelleCount;
    return Math.round((cellCoverage * 0.42 + organelleCoverage * 0.58) * 100);
  }, [totalOrganelleCount, viewedCells, viewedOrganelleKeys]);

  useEffect(() => {
    if (previousSelectedCellIdRef.current === selectedCell.id) {
      return;
    }

    previousSelectedCellIdRef.current = selectedCell.id;
    const pendingOrganelle = pendingOrganelleRef.current;
    const nextOrganelle =
      pendingOrganelle && selectedCell.organelles.some((organelle) => organelle.id === pendingOrganelle)
        ? pendingOrganelle
        : selectedCell.defaultOrganelle;
    pendingOrganelleRef.current = null;
    setActiveOrganelle(nextOrganelle);
    setComparisonOpen(false);
    setAutoRotate(pendingAutoRotateRef.current ?? selectedCell.id !== "plant");
    pendingAutoRotateRef.current = null;
  }, [selectedCell]);

  useEffect(() => {
    setTutorPrompt(buildTutorPrompts(selectedCell, selectedOrganelle, language)[2]);
  }, [language, selectedCell, selectedOrganelle]);

  useEffect(() => {
    if (!availableProcesses.length) {
      setActiveProcessId("");
      setActiveProcessStepId("");
      return;
    }

    if (!availableProcesses.some((process) => process.id === activeProcessId)) {
      setActiveProcessId(availableProcesses[0].id);
      setActiveProcessStepId(availableProcesses[0].steps[0]?.id ?? "");
    }
  }, [activeProcessId, availableProcesses]);

  useEffect(() => {
    if (!activeProcess) {
      setActiveProcessStepId("");
      return;
    }

    if (!activeProcess.steps.some((step) => step.id === activeProcessStepId)) {
      setActiveProcessStepId(activeProcess.steps[0]?.id ?? "");
    }
  }, [activeProcess, activeProcessStepId]);

  useEffect(() => {
    const processScope = `${selectedCell.id}:${activeProcessId}`;
    if (previousProcessScopeRef.current === processScope) {
      return;
    }

    previousProcessScopeRef.current = processScope;
    setProcessSimulationRunning(false);
    setProcessSimulationProgress(0);
    processAnimationLastTimeRef.current = null;
  }, [selectedCell.id, activeProcessId]);

  useEffect(() => {
    if (!activeProcess?.steps.length) {
      return;
    }

    const clampedProgress = clampProcessProgress(processSimulationProgress);
    const stepIndex = Math.min(activeProcess.steps.length - 1, Math.floor(clampedProgress * activeProcess.steps.length));
    const step = activeProcess.steps[stepIndex] ?? activeProcess.steps[0];
    setActiveProcessStepId((currentStepId) => (currentStepId === step.id ? currentStepId : step.id));

    const stepOrganelleId = getStepOrganelleId(selectedCell, step);
    if (stepOrganelleId) {
      setActiveOrganelle((currentOrganelleId) =>
        currentOrganelleId === stepOrganelleId ? currentOrganelleId : stepOrganelleId,
      );
    }
  }, [activeProcess, processSimulationProgress, selectedCell]);

  useEffect(() => {
    if (!processSimulationRunning) {
      processAnimationLastTimeRef.current = null;
      return undefined;
    }

    const cycleMs = 14000;
    const tick = (time: number) => {
      const previousTime = processAnimationLastTimeRef.current ?? time;
      processAnimationLastTimeRef.current = time;
      const delta = Math.max(0, time - previousTime);

      setProcessSimulationProgress((currentProgress) => {
        const nextProgress = currentProgress + (delta / cycleMs) * processSimulationSpeed;
        return nextProgress > 1 ? nextProgress % 1 : nextProgress;
      });

      processAnimationFrameRef.current = window.requestAnimationFrame(tick);
    };

    processAnimationFrameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (processAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(processAnimationFrameRef.current);
        processAnimationFrameRef.current = null;
      }
      processAnimationLastTimeRef.current = null;
    };
  }, [processSimulationRunning, processSimulationSpeed]);

  useEffect(() => {
    setViewedCells((current) => {
      const next = new Set(current);
      next.add(selectedCell.id);
      return next;
    });
    setViewedOrganelleKeys((current) => {
      const next = new Set(current);
      next.add(`${selectedCell.id}:${activeOrganelle}`);
      return next;
    });
  }, [activeOrganelle, selectedCell.id]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeLessonId) {
      params.set("lesson", activeLessonId);
    }
    params.set("cell", selectedCell.id);
    params.set("organelle", activeOrganelle);
    if (activeProcess) {
      params.set("process", activeProcess.id);
    }
    if (activeProcessStepId) {
      params.set("step", activeProcessStepId);
    }
    if (viewMode === "focus" || activeLessonId) {
      params.set("view", viewMode);
    }
    if (language === "zh") {
      params.set("lang", "zh");
    }

    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextUrl !== currentUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [activeLessonId, activeOrganelle, activeProcess, activeProcessStepId, language, selectedCell.id, viewMode]);

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }

  function toggleFavorite(id: string) {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectCell(id: string, preferredOrganelle?: string) {
    setActiveLessonId("");
    const nextCell = getCellById(id);
    const validPreferredOrganelle =
      preferredOrganelle && nextCell.organelles.some((organelle) => organelle.id === preferredOrganelle)
        ? preferredOrganelle
        : undefined;

    if (validPreferredOrganelle) {
      pendingOrganelleRef.current = validPreferredOrganelle;
    }

    if (id === selectedCell.id) {
      if (validPreferredOrganelle) {
        setActiveOrganelle(validPreferredOrganelle);
        pendingOrganelleRef.current = null;
      }
      return;
    }

    setSelectedCellId(id);
  }

  function selectOrganelle(id: string) {
    setActiveLessonId("");
    setActiveOrganelle(id);
  }

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
  }

  function changeProcess(id: string) {
    setActiveLessonId("");
    const process = availableProcesses.find((item) => item.id === id);
    setActiveProcessId(id);
    setActiveProcessStepId(process?.steps[0]?.id ?? "");
    setProcessSimulationRunning(false);
    setProcessSimulationProgress(0);
  }

  function changeProcessSimulationProgress(value: number) {
    setProcessSimulationProgress(clampProcessProgress(value));
  }

  function openLibraryProcess(target: LibraryProcessTarget) {
    setActiveLessonId("");
    pendingAutoRotateRef.current = target.cellId === selectedCell.id ? null : false;
    selectCell(target.cellId, target.organelleId);
    setActiveProcessId(target.processId);
    setActiveProcessStepId(target.stepId ?? "");
    setProcessSimulationRunning(false);
    setProcessSimulationProgress(0);
    setViewMode("focus");
    setAutoRotate(false);
    showToast(copy.libraryProcessOpened);
  }

  function applyLesson(id: string) {
    if (!id) {
      setActiveLessonId("");
      return;
    }

    const lesson = getLessonById(id);
    if (!lesson) {
      return;
    }

    const lessonCell = getCellById(lesson.cellId);
    const lessonOrganelle = lessonCell.organelles.some((organelle) => organelle.id === lesson.organelleId)
      ? lesson.organelleId
      : lessonCell.defaultOrganelle;

    pendingOrganelleRef.current = lessonOrganelle;
    pendingAutoRotateRef.current = false;
    previousProcessScopeRef.current = `${lessonCell.id}:${lesson.processId}`;
    setActiveLessonId(lesson.id);
    if (selectedCell.id === lessonCell.id) {
      setActiveOrganelle(lessonOrganelle);
      pendingOrganelleRef.current = null;
    } else {
      setSelectedCellId(lessonCell.id);
    }
    setActiveProcessId(lesson.processId);
    setActiveProcessStepId(lesson.stepId);
    setProcessSimulationRunning(false);
    setProcessSimulationProgress(lesson.progress);
    setViewMode(lesson.viewMode);
    setAutoRotate(false);
    showToast(copy.lessonOpened);
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast(copy.lessonLinkCopied);
    } catch {
      showToast(window.location.href);
    }
  }

  const shellStyle = {
    "--accent": selectedCell.accent,
    "--accent-soft": selectedCell.accentSoft,
    "--cell-color": selectedCell.color,
  } as CSSProperties;

  return (
    <div
      className="app-shell"
      data-language={language}
      data-label-density={labelDensity}
      data-render-quality={renderQuality}
      style={shellStyle}
    >
      <Header cell={selectedCell} language={language} copy={copy} onLanguageChange={changeLanguage} />

      <WorkbenchSwitcher
        selectedCell={selectedCell}
        activeOrganelle={activeOrganelle}
        favorites={favorites}
        activeProcess={activeProcess}
        processSimulationProgress={processSimulationProgress}
        language={language}
        copy={copy}
        onSelectCell={selectCell}
        onSelectOrganelle={selectOrganelle}
        onToggleFavorite={toggleFavorite}
      />

      <div className="workbench-layout">
        <div className="workbench-stage-stack">
          <Stage
            cell={selectedCell}
            activeOrganelle={activeOrganelle}
            activeProcess={activeProcess}
            activeProcessStepId={activeProcessStepId}
            viewMode={viewMode}
            crossSection={crossSection}
            autoRotate={autoRotate}
            renderQuality={renderQuality}
            processSimulationProgress={processSimulationProgress}
            processSimulationRunning={processSimulationRunning}
            resetKey={resetKey}
            language={language}
            copy={copy}
            onModeChange={setViewMode}
            onCrossSectionChange={setCrossSection}
            onAutoRotateChange={setAutoRotate}
            onReset={() => {
              setResetKey((key) => key + 1);
              showToast(copy.viewReset);
            }}
            onToast={showToast}
          />

          <ProcessExplorer
            cell={selectedCell}
            activeOrganelle={activeOrganelle}
            processes={availableProcesses}
            activeProcess={activeProcess}
            activeProcessStepId={activeProcessStepId}
            processSimulationProgress={processSimulationProgress}
            processSimulationRunning={processSimulationRunning}
            processSimulationSpeed={processSimulationSpeed}
            language={language}
            copy={copy}
            onProcessChange={changeProcess}
            onProcessStepChange={setActiveProcessStepId}
            onSelectOrganelle={selectOrganelle}
            onProcessSimulationProgressChange={changeProcessSimulationProgress}
            onProcessSimulationRunningChange={setProcessSimulationRunning}
            onProcessSimulationSpeedChange={setProcessSimulationSpeed}
            onTutorPrompt={(prompt) => {
              setTutorPrompt(prompt);
              showToast(copy.aiTutorPromptStaged);
            }}
          />
        </div>

        <RightPanel
          cell={selectedCell}
          activeOrganelle={activeOrganelle}
          favorites={favorites}
          activeLesson={activeLesson}
          mastery={mastery}
          viewedCellCount={viewedCells.size}
          viewedOrganelleCount={viewedOrganelleKeys.size}
          totalOrganelleCount={totalOrganelleCount}
          tutorPrompt={tutorPrompt}
          processes={availableProcesses}
          activeProcess={activeProcess}
          activeProcessStepId={activeProcessStepId}
          processSimulationProgress={processSimulationProgress}
          processSimulationRunning={processSimulationRunning}
          processSimulationSpeed={processSimulationSpeed}
          language={language}
          copy={copy}
          onToggleFavorite={toggleFavorite}
          onSelectOrganelle={selectOrganelle}
          onProcessChange={changeProcess}
          onProcessStepChange={setActiveProcessStepId}
          onProcessSimulationProgressChange={changeProcessSimulationProgress}
          onProcessSimulationRunningChange={setProcessSimulationRunning}
          onProcessSimulationSpeedChange={setProcessSimulationSpeed}
          onApplyLesson={applyLesson}
          onCopyShareLink={() => {
            void copyShareLink();
          }}
          onTutorPrompt={(prompt) => {
            setTutorPrompt(prompt);
            showToast(copy.aiTutorPromptStaged);
          }}
        />
      </div>

      <BottomPanels
        cell={selectedCell}
        activeOrganelle={activeOrganelle}
        language={language}
        copy={copy}
        onCompare={() => setComparisonOpen(true)}
        onSelectOrganelle={selectOrganelle}
        onToast={showToast}
      />

      <WorkspaceTools
        selectedCell={selectedCell}
        activeOrganelle={activeOrganelle}
        favorites={favorites}
        language={language}
        copy={copy}
        viewMode={viewMode}
        crossSection={crossSection}
        autoRotate={autoRotate}
        labelDensity={labelDensity}
        renderQuality={renderQuality}
        onSelectCell={selectCell}
        onToggleFavorite={toggleFavorite}
        onOpenProcess={openLibraryProcess}
        onLanguageChange={changeLanguage}
        onViewModeChange={setViewMode}
        onCrossSectionChange={setCrossSection}
        onAutoRotateChange={setAutoRotate}
        onLabelDensityChange={setLabelDensity}
        onRenderQualityChange={setRenderQuality}
      />

      <ComparisonModal
        cell={selectedCell}
        activeOrganelle={activeOrganelle}
        open={comparisonOpen}
        language={language}
        copy={copy}
        onClose={() => setComparisonOpen(false)}
      />
      <Toast message={toast} />
    </div>
  );
}

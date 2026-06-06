import type { ViewMode } from "./cells";
import type { LocalizedText } from "./processes";

export type LessonPreset = {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  cellId: string;
  organelleId: string;
  processId: string;
  stepId: string;
  progress: number;
  viewMode: ViewMode;
  demoIds: string[];
  checkpoints: LocalizedText[];
  selfCheck: LocalizedText;
};

export const lessonPresets: LessonPreset[] = [
  {
    id: "photosynthesis-chloroplast",
    title: {
      en: "Chloroplast Photosynthesis Walkthrough",
      zh: "叶绿体光合作用导学",
    },
    summary: {
      en: "Start with the chloroplast, run the light-capture sequence, then connect membrane structure to sugar building.",
      zh: "从叶绿体开始，观察捕获光能的步骤，再把膜结构和糖分子构建联系起来。",
    },
    cellId: "plant",
    organelleId: "chloroplast",
    processId: "photosynthesis",
    stepId: "light-capture",
    progress: 0.08,
    viewMode: "focus",
    demoIds: ["chloroplast-photosynthesis"],
    checkpoints: [
      {
        en: "Find the chloroplast in the 3D plant cell.",
        zh: "在 3D 植物细胞中找到叶绿体。",
      },
      {
        en: "Scrub the process timeline until electron flow becomes active.",
        zh: "拖动过程时间轴，直到电子传递步骤被激活。",
      },
      {
        en: "Explain why thylakoid membranes matter for energy conversion.",
        zh: "说明类囊体膜为什么对能量转换关键。",
      },
    ],
    selfCheck: {
      en: "Which structure captures light first, and what energy carriers does it help produce?",
      zh: "最先捕获光能的是哪个结构？它帮助产生哪些能量载体？",
    },
  },
  {
    id: "plant-transport-vacuole",
    title: {
      en: "Plant Transport and Vacuole Pressure",
      zh: "植物运输与液泡压力",
    },
    summary: {
      en: "Use membrane transport to connect plant tissue movement, vacuole pressure, and selective exchange.",
      zh: "用膜运输串联植物组织运输、液泡压力和选择性交换。",
    },
    cellId: "plant",
    organelleId: "vacuole",
    processId: "membrane-transport",
    stepId: "vesicle-traffic",
    progress: 0.82,
    viewMode: "focus",
    demoIds: ["plant-vascular-bundle-transport"],
    checkpoints: [
      {
        en: "Open the vacuole focus view.",
        zh: "打开液泡聚焦视图。",
      },
      {
        en: "Compare storage, pressure support, and exchange across membranes.",
        zh: "比较储存、膨压支持和跨膜交换。",
      },
      {
        en: "Use the transport readouts to describe cargo movement.",
        zh: "用运输读数描述货物移动。",
      },
    ],
    selfCheck: {
      en: "How does vacuole pressure help a plant cell keep its shape?",
      zh: "液泡压力如何帮助植物细胞保持形态？",
    },
  },
  {
    id: "neuron-synapse-transport",
    title: {
      en: "Neuron Synapse Signal Transfer",
      zh: "神经突触信号传递",
    },
    summary: {
      en: "Focus the axon, then use membrane transport to explain signal handoff at a synapse.",
      zh: "先聚焦轴突，再用膜运输解释突触处的信号交接。",
    },
    cellId: "neuron",
    organelleId: "axon",
    processId: "membrane-transport",
    stepId: "channels-pumps",
    progress: 0.48,
    viewMode: "focus",
    demoIds: ["neuron-synapse-transmission"],
    checkpoints: [
      {
        en: "Locate the axon and compare it with dendrites.",
        zh: "定位轴突，并和树突做对比。",
      },
      {
        en: "Turn on the channels-and-pumps step.",
        zh: "切到通道与泵这一步。",
      },
      {
        en: "Explain why membrane selectivity matters for signaling.",
        zh: "说明膜选择性为什么会影响信号传递。",
      },
    ],
    selfCheck: {
      en: "What has to cross or change at the membrane before another cell receives the signal?",
      zh: "另一个细胞接收信号前，膜上需要发生什么跨越或变化？",
    },
  },
  {
    id: "immune-vesicle-defense",
    title: {
      en: "Immune Vesicle Defense",
      zh: "免疫囊泡防御",
    },
    summary: {
      en: "Use lysosomes and vesicle traffic to explain how immune cells package and break down threats.",
      zh: "用溶酶体和囊泡运输解释免疫细胞如何包装并分解威胁。",
    },
    cellId: "whiteBlood",
    organelleId: "lysosome",
    processId: "membrane-transport",
    stepId: "vesicle-traffic",
    progress: 0.82,
    viewMode: "focus",
    demoIds: ["antibody-antigen-binding"],
    checkpoints: [
      {
        en: "Focus the lysosome and granule system.",
        zh: "聚焦溶酶体和颗粒系统。",
      },
      {
        en: "Use vesicle traffic to explain packaging and cleanup.",
        zh: "用囊泡运输解释包装和清理。",
      },
      {
        en: "Compare defense storage with ordinary membrane transport.",
        zh: "比较防御储存和普通膜运输。",
      },
    ],
    selfCheck: {
      en: "Why does an immune cell need many vesicle-like compartments?",
      zh: "免疫细胞为什么需要许多囊泡样空间？",
    },
  },
  {
    id: "epithelial-exchange",
    title: {
      en: "Epithelial Exchange Surface",
      zh: "上皮交换表面",
    },
    summary: {
      en: "Focus microvilli and junctions to connect surface area, barrier control, and transport.",
      zh: "聚焦微绒毛和紧密连接，把表面积、屏障控制和物质运输联系起来。",
    },
    cellId: "epithelial",
    organelleId: "microvilli",
    processId: "membrane-transport",
    stepId: "channels-pumps",
    progress: 0.48,
    viewMode: "focus",
    demoIds: ["alveoli-gas-exchange", "nephron-glomerulus-filtration"],
    checkpoints: [
      {
        en: "Locate the absorption surface.",
        zh: "定位吸收表面。",
      },
      {
        en: "Compare open exchange with sealed junctions.",
        zh: "比较开放交换和紧密连接形成的封闭边界。",
      },
      {
        en: "Explain how surface area changes transport capacity.",
        zh: "说明表面积如何改变运输能力。",
      },
    ],
    selfCheck: {
      en: "What does a folded or brushed surface change about exchange?",
      zh: "折叠或刷状表面对交换有什么影响？",
    },
  },
  {
    id: "cell-cycle-replication",
    title: {
      en: "DNA Replication and Cell Cycle",
      zh: "DNA 复制与细胞周期",
    },
    summary: {
      en: "Start at the nucleus, activate DNA replication, then connect copied chromosomes to later division.",
      zh: "从细胞核开始，激活 DNA 复制，再把复制后的染色体和后续分裂联系起来。",
    },
    cellId: "animal",
    organelleId: "nucleus",
    processId: "cell-cycle",
    stepId: "dna-replication",
    progress: 0.48,
    viewMode: "focus",
    demoIds: ["dna-replication-fork", "meiosis-crossing-over"],
    checkpoints: [
      {
        en: "Focus the nucleus.",
        zh: "聚焦细胞核。",
      },
      {
        en: "Move the process timeline to DNA replication.",
        zh: "把过程时间轴移动到 DNA 复制。",
      },
      {
        en: "Explain why copied chromosomes need a checkpoint.",
        zh: "解释复制后的染色体为什么需要检查点。",
      },
    ],
    selfCheck: {
      en: "What has to be copied before a cell can divide reliably?",
      zh: "细胞要可靠分裂前，必须先复制什么？",
    },
  },
  {
    id: "root-tip-mitosis",
    title: {
      en: "Root Tip Mitosis",
      zh: "根尖有丝分裂",
    },
    summary: {
      en: "Use the plant nucleus and mitosis step to connect growth zones with chromosome movement.",
      zh: "用植物细胞核和有丝分裂步骤，把生长区和染色体移动联系起来。",
    },
    cellId: "plant",
    organelleId: "nucleus",
    processId: "cell-cycle",
    stepId: "mitosis",
    progress: 0.82,
    viewMode: "focus",
    demoIds: ["root-tip-mitosis"],
    checkpoints: [
      {
        en: "Open the plant nucleus focus.",
        zh: "打开植物细胞核聚焦。",
      },
      {
        en: "Activate the mitosis step.",
        zh: "激活有丝分裂步骤。",
      },
      {
        en: "Connect chromosome separation to root growth.",
        zh: "把染色体分离和根尖生长联系起来。",
      },
    ],
    selfCheck: {
      en: "Why do growth zones show many cells in different cycle stages?",
      zh: "为什么生长区会看到许多处于不同周期阶段的细胞？",
    },
  },
  {
    id: "bacteria-structure",
    title: {
      en: "Bacterial Cell Wall and Boundary",
      zh: "细菌细胞壁与边界",
    },
    summary: {
      en: "Focus the bacterial wall, then use selective barriers to compare prokaryotic boundaries with eukaryotic cells.",
      zh: "聚焦细菌细胞壁，再用选择性边界比较原核细胞和真核细胞的边界。",
    },
    cellId: "bacteria",
    organelleId: "cellWall",
    processId: "membrane-transport",
    stepId: "selective-barrier",
    progress: 0.08,
    viewMode: "focus",
    demoIds: ["bacterial-cell-structure"],
    checkpoints: [
      {
        en: "Locate the bacterial cell wall.",
        zh: "定位细菌细胞壁。",
      },
      {
        en: "Compare the wall with the membrane boundary.",
        zh: "比较细胞壁和膜边界。",
      },
      {
        en: "Explain how boundary structure changes protection and exchange.",
        zh: "说明边界结构如何改变保护和交换。",
      },
    ],
    selfCheck: {
      en: "What does the cell wall add that a membrane alone cannot provide?",
      zh: "细胞壁提供了哪些单靠膜无法提供的能力？",
    },
  },
  {
    id: "crispr-nucleoid-editing",
    title: {
      en: "Bacterial Nucleoid and Gene Editing",
      zh: "细菌拟核与基因编辑",
    },
    summary: {
      en: "Use the nucleoid and transcription step as a bridge from DNA access to gene editing concepts.",
      zh: "用拟核和转录步骤，把 DNA 可接近性和基因编辑概念连接起来。",
    },
    cellId: "bacteria",
    organelleId: "nucleoid",
    processId: "protein-biosynthesis",
    stepId: "transcription",
    progress: 0.08,
    viewMode: "focus",
    demoIds: ["crispr-cas9-gene-editing"],
    checkpoints: [
      {
        en: "Focus the nucleoid.",
        zh: "聚焦拟核。",
      },
      {
        en: "Start from transcription before discussing edited genes.",
        zh: "先从转录开始，再讨论被编辑的基因。",
      },
      {
        en: "Separate DNA storage, reading, and editing as three ideas.",
        zh: "把 DNA 储存、读取和编辑分成三个概念。",
      },
    ],
    selfCheck: {
      en: "Why is bacterial DNA easier to relate to direct editing than a membrane-bound nucleus?",
      zh: "为什么细菌 DNA 更容易和直接编辑联系起来？",
    },
  },
  {
    id: "protein-translation-ribosome",
    title: {
      en: "Protein Translation and Enzyme Shape",
      zh: "蛋白翻译与酶形状",
    },
    summary: {
      en: "Use the ribosome and translation step to connect amino-acid chains with functional protein shape.",
      zh: "用核糖体和翻译步骤，把氨基酸链和功能性蛋白形状联系起来。",
    },
    cellId: "animal",
    organelleId: "ribosome",
    processId: "protein-biosynthesis",
    stepId: "translation",
    progress: 0.48,
    viewMode: "focus",
    demoIds: ["enzyme-catalysis-active-site"],
    checkpoints: [
      {
        en: "Focus the ribosome.",
        zh: "聚焦核糖体。",
      },
      {
        en: "Use translation to explain chain assembly.",
        zh: "用翻译步骤解释肽链组装。",
      },
      {
        en: "Connect chain sequence to folded enzyme shape.",
        zh: "把序列和折叠后的酶形状联系起来。",
      },
    ],
    selfCheck: {
      en: "How can a change in protein sequence affect an active site?",
      zh: "蛋白序列变化如何影响活性位点？",
    },
  },
  {
    id: "muscle-energy",
    title: {
      en: "Muscle Fiber Energy Supply",
      zh: "肌纤维能量供应",
    },
    summary: {
      en: "Focus muscle mitochondria and run cell respiration to connect ATP supply with contraction.",
      zh: "聚焦肌肉线粒体并播放细胞呼吸，把 ATP 供应和收缩联系起来。",
    },
    cellId: "muscle",
    organelleId: "mitochondria",
    processId: "cell-respiration",
    stepId: "oxidative-phosphorylation",
    progress: 0.82,
    viewMode: "focus",
    demoIds: [],
    checkpoints: [
      {
        en: "Find mitochondria between myofibrils.",
        zh: "在肌原纤维之间找到线粒体。",
      },
      {
        en: "Activate ATP production.",
        zh: "激活 ATP 产生步骤。",
      },
      {
        en: "Explain why repeated contraction needs dense energy supply.",
        zh: "解释重复收缩为什么需要密集能量供应。",
      },
    ],
    selfCheck: {
      en: "Why would endurance training change mitochondrial density?",
      zh: "为什么耐力训练会改变线粒体密度？",
    },
  },
];

export function getLessonById(id: string | null | undefined) {
  return lessonPresets.find((lesson) => lesson.id === id) ?? null;
}

export function getLessonForDemo(demoId: string) {
  return lessonPresets.find((lesson) => lesson.demoIds.includes(demoId)) ?? null;
}

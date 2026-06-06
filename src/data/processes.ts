import type { CellItem } from "./cells";

export type LocalizedText = {
  en: string;
  zh: string;
};

export type BiochemicalProcessStep = {
  id: string;
  title: LocalizedText;
  body: LocalizedText;
  signal: LocalizedText;
  organelleIds: string[];
};

export type BiochemicalProcessReadout = {
  id: string;
  label: LocalizedText;
  unit: LocalizedText;
  start: number;
  end: number;
};

export type BiochemicalProcessSimulation = {
  compartment: LocalizedText;
  inputs: LocalizedText[];
  outputs: LocalizedText[];
  currency: LocalizedText;
  readouts: BiochemicalProcessReadout[];
};

export type BiochemicalProcess = {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  context: LocalizedText;
  color: string;
  cellIds: string[];
  organelleIds: string[];
  simulation: BiochemicalProcessSimulation;
  steps: BiochemicalProcessStep[];
};

export function localized(text: LocalizedText, language: "en" | "zh") {
  return text[language];
}

export const biochemicalProcesses: BiochemicalProcess[] = [
  {
    id: "photosynthesis",
    title: {
      en: "Photosynthesis",
      zh: "光合作用",
    },
    summary: {
      en: "Chloroplast membranes capture light and store that energy in sugars.",
      zh: "叶绿体膜系统捕获光能，并把能量储存在糖分子中。",
    },
    context: {
      en: "Best explored in plant cells and chloroplast-focused lessons.",
      zh: "最适合在植物细胞和叶绿体观察中学习。",
    },
    color: "#5fa842",
    cellIds: ["plant"],
    organelleIds: ["chloroplast"],
    simulation: {
      compartment: {
        en: "Thylakoid membrane and stroma",
        zh: "类囊体膜与基质",
      },
      inputs: [
        { en: "Light", zh: "光" },
        { en: "Water", zh: "水" },
        { en: "Carbon dioxide", zh: "二氧化碳" },
      ],
      outputs: [
        { en: "Sugar precursors", zh: "糖前体" },
        { en: "Oxygen", zh: "氧气" },
      ],
      currency: {
        en: "ATP / NADPH",
        zh: "ATP / NADPH",
      },
      readouts: [
        {
          id: "photon-capture",
          label: { en: "Photon capture", zh: "光子捕获" },
          unit: { en: "%", zh: "%" },
          start: 18,
          end: 96,
        },
        {
          id: "proton-gradient",
          label: { en: "H+ gradient", zh: "H+ 梯度" },
          unit: { en: "a.u.", zh: "相对值" },
          start: 8,
          end: 78,
        },
        {
          id: "sugar-assembly",
          label: { en: "Sugar assembly", zh: "糖构建" },
          unit: { en: "%", zh: "%" },
          start: 0,
          end: 64,
        },
      ],
    },
    steps: [
      {
        id: "light-capture",
        title: {
          en: "Light capture",
          zh: "捕获光能",
        },
        body: {
          en: "Chlorophyll absorbs photons in the thylakoid membranes.",
          zh: "叶绿素在类囊体膜上吸收光子。",
        },
        signal: {
          en: "Photon energy",
          zh: "光子能量",
        },
        organelleIds: ["chloroplast"],
      },
      {
        id: "electron-flow",
        title: {
          en: "Electron flow",
          zh: "电子传递",
        },
        body: {
          en: "Excited electrons move through membrane proteins and build a proton gradient.",
          zh: "被激发的电子穿过膜蛋白，建立质子梯度。",
        },
        signal: {
          en: "H+ gradient",
          zh: "H+ 梯度",
        },
        organelleIds: ["chloroplast", "membrane"],
      },
      {
        id: "carbon-fixation",
        title: {
          en: "Carbon fixation",
          zh: "固定碳",
        },
        body: {
          en: "The Calvin cycle turns carbon dioxide into sugar building blocks.",
          zh: "卡尔文循环把二氧化碳转化为糖的构件。",
        },
        signal: {
          en: "Sugar precursors",
          zh: "糖前体",
        },
        organelleIds: ["chloroplast"],
      },
    ],
  },
  {
    id: "protein-biosynthesis",
    title: {
      en: "Protein Biosynthesis",
      zh: "蛋白质合成",
    },
    summary: {
      en: "Genetic instructions are copied, translated, folded, and routed to where the cell needs them.",
      zh: "遗传指令被复制、翻译、折叠，再被送到细胞需要的位置。",
    },
    context: {
      en: "Useful when comparing nucleus, ribosomes, ER, and Golgi behavior.",
      zh: "适合串联细胞核、核糖体、内质网和高尔基体。",
    },
    color: "#7a49b0",
    cellIds: ["plant", "animal", "whiteBlood", "neuron", "epithelial", "muscle", "bacteria"],
    organelleIds: ["nucleus", "ribosome", "soma", "golgi", "granules", "nucleoid"],
    simulation: {
      compartment: {
        en: "Nucleus, ribosome, ER, and Golgi route",
        zh: "细胞核、核糖体、内质网与高尔基路线",
      },
      inputs: [
        { en: "DNA template", zh: "DNA 模板" },
        { en: "RNA nucleotides", zh: "RNA 核苷酸" },
        { en: "Amino acids", zh: "氨基酸" },
      ],
      outputs: [
        { en: "Folded protein", zh: "折叠蛋白" },
        { en: "Sorted cargo", zh: "分拣货物" },
      ],
      currency: {
        en: "GTP / ATP",
        zh: "GTP / ATP",
      },
      readouts: [
        {
          id: "transcript",
          label: { en: "Transcript copied", zh: "转录完成" },
          unit: { en: "%", zh: "%" },
          start: 5,
          end: 92,
        },
        {
          id: "ribosome-load",
          label: { en: "Ribosome load", zh: "核糖体负载" },
          unit: { en: "%", zh: "%" },
          start: 0,
          end: 74,
        },
        {
          id: "folded-output",
          label: { en: "Folded output", zh: "折叠产物" },
          unit: { en: "chains", zh: "条链" },
          start: 0,
          end: 11,
        },
      ],
    },
    steps: [
      {
        id: "transcription",
        title: {
          en: "Transcription",
          zh: "转录",
        },
        body: {
          en: "DNA instructions are copied into messenger RNA.",
          zh: "DNA 指令被复制成信使 RNA。",
        },
        signal: {
          en: "mRNA",
          zh: "mRNA",
        },
        organelleIds: ["nucleus", "soma", "nucleoid"],
      },
      {
        id: "translation",
        title: {
          en: "Translation",
          zh: "翻译",
        },
        body: {
          en: "Ribosomes read mRNA and link amino acids into a chain.",
          zh: "核糖体读取 mRNA，把氨基酸连接成链。",
        },
        signal: {
          en: "Amino acid chain",
          zh: "氨基酸链",
        },
        organelleIds: ["ribosome", "soma", "nucleoid"],
      },
      {
        id: "sorting",
        title: {
          en: "Folding and sorting",
          zh: "折叠与分拣",
        },
        body: {
          en: "The ER and Golgi modify many proteins before delivery.",
          zh: "内质网和高尔基体会修饰并分拣许多蛋白质。",
        },
        signal: {
          en: "Ready protein",
          zh: "可用蛋白",
        },
        organelleIds: ["golgi", "granules"],
      },
    ],
  },
  {
    id: "cell-respiration",
    title: {
      en: "Cell Respiration",
      zh: "细胞呼吸",
    },
    summary: {
      en: "Fuel molecules are broken down so mitochondria can produce ATP.",
      zh: "燃料分子被分解，线粒体据此产生 ATP。",
    },
    context: {
      en: "Strongest in mitochondria-rich cells such as muscle and animal cells.",
      zh: "在线粒体丰富的动物细胞和肌肉细胞里最直观。",
    },
    color: "#cf7042",
    cellIds: ["plant", "animal", "muscle"],
    organelleIds: ["mitochondrion", "mitochondria"],
    simulation: {
      compartment: {
        en: "Cytoplasm and mitochondrial inner membrane",
        zh: "细胞质与线粒体内膜",
      },
      inputs: [
        { en: "Glucose", zh: "葡萄糖" },
        { en: "Oxygen", zh: "氧气" },
        { en: "ADP + phosphate", zh: "ADP + 磷酸" },
      ],
      outputs: [
        { en: "ATP", zh: "ATP" },
        { en: "Carbon dioxide", zh: "二氧化碳" },
        { en: "Water", zh: "水" },
      ],
      currency: {
        en: "NADH / FADH2",
        zh: "NADH / FADH2",
      },
      readouts: [
        {
          id: "pyruvate",
          label: { en: "Pyruvate feed", zh: "丙酮酸输入" },
          unit: { en: "%", zh: "%" },
          start: 14,
          end: 82,
        },
        {
          id: "electron-carriers",
          label: { en: "Electron carriers", zh: "电子载体" },
          unit: { en: "%", zh: "%" },
          start: 8,
          end: 88,
        },
        {
          id: "atp-yield",
          label: { en: "ATP yield", zh: "ATP 产量" },
          unit: { en: "ATP", zh: "ATP" },
          start: 2,
          end: 32,
        },
      ],
    },
    steps: [
      {
        id: "glycolysis",
        title: {
          en: "Glycolysis",
          zh: "糖酵解",
        },
        body: {
          en: "Glucose is split into smaller molecules in the cytoplasm.",
          zh: "葡萄糖在细胞质中被拆成较小分子。",
        },
        signal: {
          en: "Pyruvate",
          zh: "丙酮酸",
        },
        organelleIds: ["membrane", "sarcolemma"],
      },
      {
        id: "krebs-cycle",
        title: {
          en: "Krebs cycle",
          zh: "三羧酸循环",
        },
        body: {
          en: "Mitochondria harvest high-energy electrons from fuel fragments.",
          zh: "线粒体从燃料片段中提取高能电子。",
        },
        signal: {
          en: "Electron carriers",
          zh: "电子载体",
        },
        organelleIds: ["mitochondrion", "mitochondria"],
      },
      {
        id: "oxidative-phosphorylation",
        title: {
          en: "ATP production",
          zh: "生成 ATP",
        },
        body: {
          en: "The inner membrane uses electron flow to power ATP synthase.",
          zh: "内膜利用电子传递驱动 ATP 合酶。",
        },
        signal: {
          en: "ATP",
          zh: "ATP",
        },
        organelleIds: ["mitochondrion", "mitochondria"],
      },
    ],
  },
  {
    id: "membrane-transport",
    title: {
      en: "Membrane Transport",
      zh: "膜运输",
    },
    summary: {
      en: "Channels, pumps, vesicles, and barriers control what crosses cell boundaries.",
      zh: "通道、泵、囊泡和屏障共同控制物质如何穿过细胞边界。",
    },
    context: {
      en: "Connects membrane structure to signaling, defense, absorption, and cell pressure.",
      zh: "把膜结构和信号、防御、吸收、细胞压力联系起来。",
    },
    color: "#4f9f83",
    cellIds: ["plant", "animal", "whiteBlood", "neuron", "epithelial", "bacteria", "muscle"],
    organelleIds: ["membrane", "cellWall", "sarcolemma", "microvilli", "junctions", "vacuole"],
    simulation: {
      compartment: {
        en: "Membrane boundary and vesicle route",
        zh: "膜边界与囊泡路线",
      },
      inputs: [
        { en: "Ion gradient", zh: "离子梯度" },
        { en: "Cargo molecules", zh: "货物分子" },
        { en: "Membrane proteins", zh: "膜蛋白" },
      ],
      outputs: [
        { en: "Selective uptake", zh: "选择性摄取" },
        { en: "Secreted cargo", zh: "分泌货物" },
      ],
      currency: {
        en: "ATP / electrochemical gradient",
        zh: "ATP / 电化学梯度",
      },
      readouts: [
        {
          id: "permeability",
          label: { en: "Permeability gate", zh: "通透门控" },
          unit: { en: "%", zh: "%" },
          start: 22,
          end: 68,
        },
        {
          id: "gradient",
          label: { en: "Gradient strength", zh: "梯度强度" },
          unit: { en: "mV", zh: "mV" },
          start: 18,
          end: 74,
        },
        {
          id: "cargo",
          label: { en: "Cargo packets", zh: "货物包裹" },
          unit: { en: "vesicles", zh: "囊泡" },
          start: 0,
          end: 9,
        },
      ],
    },
    steps: [
      {
        id: "selective-barrier",
        title: {
          en: "Selective barrier",
          zh: "选择性屏障",
        },
        body: {
          en: "Lipid membranes and walls set the boundary conditions.",
          zh: "脂质膜和细胞壁决定边界条件。",
        },
        signal: {
          en: "Boundary",
          zh: "边界",
        },
        organelleIds: ["membrane", "cellWall", "sarcolemma", "junctions"],
      },
      {
        id: "channels-pumps",
        title: {
          en: "Channels and pumps",
          zh: "通道与泵",
        },
        body: {
          en: "Proteins move ions and nutrients with or against gradients.",
          zh: "蛋白质顺着或逆着梯度移动离子和营养物质。",
        },
        signal: {
          en: "Gradient control",
          zh: "梯度控制",
        },
        organelleIds: ["membrane", "sarcolemma", "microvilli"],
      },
      {
        id: "vesicle-traffic",
        title: {
          en: "Vesicle traffic",
          zh: "囊泡交通",
        },
        body: {
          en: "Vesicles package cargo for uptake, defense, storage, or secretion.",
          zh: "囊泡把货物打包，用于摄取、防御、储存或分泌。",
        },
        signal: {
          en: "Cargo movement",
          zh: "货物移动",
        },
        organelleIds: ["vacuole", "lysosome", "granules", "golgi"],
      },
    ],
  },
  {
    id: "cell-cycle",
    title: {
      en: "Cell Cycle",
      zh: "细胞周期",
    },
    summary: {
      en: "Cells grow, copy DNA, check for errors, and divide when conditions are right.",
      zh: "细胞会生长、复制 DNA、检查错误，并在条件合适时分裂。",
    },
    context: {
      en: "A foundation for growth, repair, immune expansion, and tissue renewal.",
      zh: "它支撑生长、修复、免疫扩增和组织更新。",
    },
    color: "#8260b7",
    cellIds: ["plant", "animal", "whiteBlood", "epithelial"],
    organelleIds: ["nucleus", "nucleoid"],
    simulation: {
      compartment: {
        en: "Nucleus, chromosome set, and spindle field",
        zh: "细胞核、染色体组与纺锤体区域",
      },
      inputs: [
        { en: "Growth signals", zh: "生长信号" },
        { en: "DNA template", zh: "DNA 模板" },
        { en: "Spindle proteins", zh: "纺锤体蛋白" },
      ],
      outputs: [
        { en: "Copied chromosomes", zh: "复制后的染色体" },
        { en: "Daughter-cell paths", zh: "子细胞路径" },
      ],
      currency: {
        en: "Cyclins / checkpoints",
        zh: "周期蛋白 / 检查点",
      },
      readouts: [
        {
          id: "dna-copied",
          label: { en: "DNA copied", zh: "DNA 复制" },
          unit: { en: "%", zh: "%" },
          start: 4,
          end: 100,
        },
        {
          id: "checkpoint",
          label: { en: "Checkpoint confidence", zh: "检查点把握" },
          unit: { en: "%", zh: "%" },
          start: 42,
          end: 92,
        },
        {
          id: "spindle",
          label: { en: "Spindle assembly", zh: "纺锤体组装" },
          unit: { en: "%", zh: "%" },
          start: 0,
          end: 86,
        },
      ],
    },
    steps: [
      {
        id: "interphase",
        title: {
          en: "Interphase",
          zh: "间期",
        },
        body: {
          en: "The cell grows, performs work, and prepares DNA replication.",
          zh: "细胞生长、执行功能，并准备复制 DNA。",
        },
        signal: {
          en: "Growth",
          zh: "生长",
        },
        organelleIds: ["nucleus"],
      },
      {
        id: "dna-replication",
        title: {
          en: "DNA replication",
          zh: "DNA 复制",
        },
        body: {
          en: "Chromosomes are copied before division begins.",
          zh: "细胞分裂前，染色体会先被复制。",
        },
        signal: {
          en: "Copied genome",
          zh: "复制后的基因组",
        },
        organelleIds: ["nucleus", "nucleoid"],
      },
      {
        id: "mitosis",
        title: {
          en: "Mitosis",
          zh: "有丝分裂",
        },
        body: {
          en: "Chromosomes separate so daughter cells inherit the same instructions.",
          zh: "染色体分离，让子细胞继承相同的遗传指令。",
        },
        signal: {
          en: "Two cell paths",
          zh: "两条细胞路径",
        },
        organelleIds: ["nucleus"],
      },
    ],
  },
];

export function getProcessesForCell(cell: CellItem) {
  const organelleIds = new Set(cell.organelles.map((organelle) => organelle.id));
  return biochemicalProcesses.filter(
    (process) =>
      process.cellIds.includes(cell.id) ||
      process.organelleIds.some((organelleId) => organelleIds.has(organelleId)),
  );
}

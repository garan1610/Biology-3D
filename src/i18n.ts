import { getCellById, type CellItem } from "./data/cells";

export type Language = "en" | "zh";

type OrganelleCopy = {
  name: string;
  subtitle: string;
  attributes: Array<{ label: string; value: string }>;
  note: string;
  fact: string;
};

type CellCopy = {
  name: string;
  type: string;
  occurrence: {
    title: string;
    body: string;
  };
  microscope: Record<string, string>;
  organelles: Record<string, OrganelleCopy>;
};

export const uiCopy = {
  en: {
    tagline: "Explore life at the microscopic level",
    navLabel: "Primary",
    gallery: "Gallery",
    library: "Library",
    notebooks: "Notebooks",
    settings: "Settings",
    demo: "Demo",
    github: "GitHub",
    userMenu: "User menu",
    language: "Language",
    cellTypes: "Cell Types",
    organelles: "Organelles",
    favorite: "Favorite",
    viewMode: "View Mode",
    modeLabels: {
      mesh: "Mesh",
      focus: "Focus",
    },
    crossSection: "Cross Section",
    rotate: "Rotate",
    isolate: "Isolate",
    isolateLens: "Isolate Lens",
    hideOthers: "Hide Others",
    resetView: "Reset View",
    screenshot: "Screenshot",
    glbExport: "GLB Export",
    preparing: "Preparing",
    screenshotDownloaded: "Screenshot downloaded.",
    screenshotFailed: "Screenshot export failed.",
    glbDownloaded: "GLB model downloaded.",
    glbFailed: "GLB export failed.",
    viewReset: "View reset.",
    organelleDetails: "Organelle Details",
    toggleFavorite: "Toggle favorite",
    label: "Label",
    biologicalNotes: "Biological Notes",
    funFact: "Fun Fact:",
    aiTutor: "AI Tutor",
    mastery: "Mastery",
    currentLessonFocus: "Current lesson focus",
    promptStaged: "Prompt staged for AI tutor",
    aiTutorPromptStaged: "AI tutor prompt staged.",
    askTutor: "Ask Tutor",
    askingTutor: "Asking",
    tutorQuestion: "Tutor question",
    tutorPlaceholder: "Ask about the current structure or process",
    tutorResponse: "Tutor response",
    tutorHistory: "Tutor history",
    localTutorMode: "Local concept tutor",
    apiTutorMode: "AI API tutor",
    localTutorFallback: "Local fallback",
    tutorFallbackNotice: "Using the local tutor until the API is available.",
    lessonPreset: "Lesson preset",
    lessonPresetEmpty: "Choose a guided lesson",
    lessonPresetHint: "Pick a preset to open the matching 3D cell, structure, process step, and shareable URL.",
    lessonSelect: "Lesson preset",
    lessonSelectPlaceholder: "Select a lesson",
    lessonSelfCheck: "Self-check",
    lessonShare: "Copy lesson link",
    lessonOpened: "Lesson preset opened.",
    lessonLinkCopied: "Lesson link copied.",
    workspaceTools: "Workspace tools",
    workbenchTitle: "3D Teaching Workbench",
    workbenchSubtitle: "Choose a specimen, focus a structure, play a biological process, then ask the tutor from the same 3D context.",
    modelSwitch: "Model switch",
    structureFocus: "Structure focus",
    teachingLoop: "Teaching loop",
    loopModel: "Model",
    loopFocus: "Focus",
    loopProcess: "Process",
    loopTutor: "Tutor",
    processDock: "Process player",
    libraryTitle: "Library",
    libraryMatches: "matches",
    librarySearch: "Search library",
    librarySearchPlaceholder: "Search cells, organelles, or processes",
    libraryShowFavorites: "Favorites",
    libraryCells: "Cells",
    libraryProcesses: "Processes",
    libraryOpenCell: "Open",
    libraryOpenProcess: "Study",
    libraryNoResults: "No matching cells or processes.",
    libraryProcessOpened: "Process opened in isolate view.",
    currentCell: "Current cell",
    organelleCount: "organelles",
    processCount: "processes",
    availableFor: "Available for",
    settingsTitle: "Settings",
    settingsLive: "Live controls",
    settingsView: "View",
    settingsMotion: "Motion",
    settingsLabels: "Labels",
    settingsQuality: "Render quality",
    settingsContext: "Current context",
    labelsFull: "Full",
    labelsCompact: "Compact",
    qualityBalanced: "Balanced",
    qualityHigh: "High",
    modelAtlas: "Model Atlas",
    modelAtlasLive: "Asset coverage",
    modelAtlasCurrent: "Current specimen",
    modelAssetSource: "Source",
    modelAssetFidelity: "Fidelity",
    modelAssetCoverage: "Learning coverage",
    modelAssetNext: "Next 3D upgrade",
    modelNativeAsset: "Native GLB / PBR",
    modelStudyAsset: "GLB study mesh",
    modelProceduralAsset: "Procedural model",
    modelSemanticLayers: "process layers",
    modelOpen: "Open model",
    biochemicalProcesses: "Biochemical Processes",
    processLibrary: "Process library",
    processSimulation: "Process Simulation",
    playSimulation: "Play",
    pauseSimulation: "Pause",
    resetSimulation: "Reset",
    simulationProgress: "Progress",
    simulationSpeed: "Speed",
    reactionReadouts: "Reaction Readouts",
    simulationCompartment: "Compartment",
    simulationInputs: "Inputs",
    simulationOutputs: "Outputs",
    simulationCurrency: "Energy carrier",
    linkedStructure: "Linked structure",
    whereItOccurs: "Where It Occurs",
    microscopeView: "Microscope View",
    scanPreview: "Specimen scan",
    microscopeUpload: "Reference slot",
    addImage: "Add Image",
    imageUploadPlanned: "Image ready for microscope analysis.",
    microscopeAnalysis: "Microscope Analysis",
    uploadedReference: "Uploaded reference",
    imageMatched: "Specimen analyzed.",
    confidence: "Confidence",
    microscopeStage: "Microscope Stage",
    microscopeZoom: "Zoom",
    microscopeChannels: "Channels",
    microscopeMarkers: "Markers",
    microscopeStain: "Stain",
    microscopeAnnotations: "Annotation Sets",
    saveMicroscopeAnnotation: "Save Annotation",
    restoreMicroscopeAnnotation: "Restore",
    noMicroscopeAnnotations: "No saved annotation sets for this specimen.",
    microscopeAnnotationSaved: "Microscope annotation set saved.",
    microscopeAnnotationRestored: "Microscope annotation set restored.",
    microscopeAnnotationSource: "Source",
    cellBoundary: "Cell boundary",
    selected: "selected.",
    compareCells: "Compare Cells",
    youAreHere: "You are here",
    openComparison: "Open Comparison View",
    sharedMarkers: "shared markers",
    focusMatch: "Focus match",
    comparisonDialog: "Cell comparison",
    close: "Close",
    comparisonView: "Comparison View",
    comparedWith: "compared with",
    defaultFocus: "Default focus",
    mainNote: "Main note",
    occursIn: "Occurs in",
  },
  zh: {
    tagline: "用 3D 观察细胞结构",
    navLabel: "主导航",
    gallery: "图库",
    library: "资料库",
    notebooks: "笔记",
    settings: "设置",
    demo: "Demo",
    github: "GitHub",
    userMenu: "用户菜单",
    language: "语言",
    cellTypes: "细胞类型",
    organelles: "细胞器",
    favorite: "收藏",
    viewMode: "视图模式",
    modeLabels: {
      mesh: "结构",
      focus: "聚焦",
    },
    crossSection: "剖面",
    rotate: "旋转",
    isolate: "隔离",
    isolateLens: "隔离镜",
    hideOthers: "隐藏其他",
    resetView: "重置视角",
    screenshot: "截图",
    glbExport: "导出 GLB",
    preparing: "准备中",
    screenshotDownloaded: "截图已下载。",
    screenshotFailed: "截图导出失败。",
    glbDownloaded: "GLB 模型已下载。",
    glbFailed: "GLB 导出失败。",
    viewReset: "视角已重置。",
    organelleDetails: "细胞器详情",
    toggleFavorite: "切换收藏",
    label: "标记",
    biologicalNotes: "生物学说明",
    funFact: "小知识：",
    aiTutor: "AI 导师",
    mastery: "掌握度",
    currentLessonFocus: "当前学习重点",
    promptStaged: "已准备的 AI 导师提示",
    aiTutorPromptStaged: "AI 导师提示已准备。",
    askTutor: "询问导师",
    askingTutor: "思考中",
    tutorQuestion: "导师问题",
    tutorPlaceholder: "询问当前结构或过程",
    tutorResponse: "导师回答",
    tutorHistory: "导师记录",
    localTutorMode: "本地概念导师",
    apiTutorMode: "AI API 导师",
    localTutorFallback: "本地兜底",
    tutorFallbackNotice: "当前使用本地导师，API 可用后会自动切换。",
    lessonPreset: "课程预设",
    lessonPresetEmpty: "选择一节导学课",
    lessonPresetHint: "选择预设后，会打开对应 3D 细胞、结构、过程步骤和可分享链接。",
    lessonSelect: "课程预设",
    lessonSelectPlaceholder: "选择课程",
    lessonSelfCheck: "自测",
    lessonShare: "复制课程链接",
    lessonOpened: "课程预设已打开。",
    lessonLinkCopied: "课程链接已复制。",
    workspaceTools: "工作区工具",
    workbenchTitle: "3D 教学工作台",
    workbenchSubtitle: "选择模型，聚焦结构，播放生命过程，再让 AI 导师围绕同一个 3D 上下文讲解。",
    modelSwitch: "模型切换",
    structureFocus: "结构聚焦",
    teachingLoop: "教学闭环",
    loopModel: "模型",
    loopFocus: "聚焦",
    loopProcess: "过程",
    loopTutor: "导师",
    processDock: "过程播放器",
    libraryTitle: "资料库",
    libraryMatches: "条匹配",
    librarySearch: "搜索资料库",
    librarySearchPlaceholder: "搜索细胞、细胞器或过程",
    libraryShowFavorites: "收藏",
    libraryCells: "细胞",
    libraryProcesses: "过程",
    libraryOpenCell: "打开",
    libraryOpenProcess: "学习",
    libraryNoResults: "没有匹配的细胞或过程。",
    libraryProcessOpened: "过程已在隔离视图中打开。",
    currentCell: "当前细胞",
    organelleCount: "个细胞器",
    processCount: "个过程",
    availableFor: "适用于",
    settingsTitle: "设置",
    settingsLive: "实时控制",
    settingsView: "视图",
    settingsMotion: "动效",
    settingsLabels: "标签",
    settingsQuality: "渲染质量",
    settingsContext: "当前上下文",
    labelsFull: "完整",
    labelsCompact: "紧凑",
    qualityBalanced: "均衡",
    qualityHigh: "高质量",
    modelAtlas: "模型图谱",
    modelAtlasLive: "资产覆盖",
    modelAtlasCurrent: "当前样本",
    modelAssetSource: "来源",
    modelAssetFidelity: "精细度",
    modelAssetCoverage: "学习覆盖",
    modelAssetNext: "下一步 3D 补强",
    modelNativeAsset: "Native GLB / PBR",
    modelStudyAsset: "GLB 学习模型",
    modelProceduralAsset: "程序化模型",
    modelSemanticLayers: "个过程层",
    modelOpen: "打开模型",
    biochemicalProcesses: "生化过程",
    processLibrary: "过程资料库",
    processSimulation: "过程模拟",
    playSimulation: "播放",
    pauseSimulation: "暂停",
    resetSimulation: "重置",
    simulationProgress: "进度",
    simulationSpeed: "速度",
    reactionReadouts: "反应读数",
    simulationCompartment: "空间位置",
    simulationInputs: "输入",
    simulationOutputs: "输出",
    simulationCurrency: "能量载体",
    linkedStructure: "关联结构",
    whereItOccurs: "出现位置",
    microscopeView: "显微镜视图",
    scanPreview: "样本扫描",
    microscopeUpload: "参考槽位",
    addImage: "添加图片",
    imageUploadPlanned: "图片已进入显微镜分析。",
    microscopeAnalysis: "显微镜分析",
    uploadedReference: "已上传参考图",
    imageMatched: "样本已分析。",
    confidence: "置信度",
    microscopeStage: "显微镜工作台",
    microscopeZoom: "缩放",
    microscopeChannels: "通道",
    microscopeMarkers: "标注",
    microscopeStain: "染色",
    microscopeAnnotations: "标注集",
    saveMicroscopeAnnotation: "保存标注",
    restoreMicroscopeAnnotation: "恢复",
    noMicroscopeAnnotations: "当前样本还没有保存的标注集。",
    microscopeAnnotationSaved: "显微镜标注集已保存。",
    microscopeAnnotationRestored: "显微镜标注集已恢复。",
    microscopeAnnotationSource: "来源",
    cellBoundary: "细胞边界",
    selected: "已选择。",
    compareCells: "细胞对比",
    youAreHere: "当前细胞",
    openComparison: "打开对比视图",
    sharedMarkers: "个共享标记",
    focusMatch: "聚焦匹配",
    comparisonDialog: "细胞对比",
    close: "关闭",
    comparisonView: "对比视图",
    comparedWith: "对比",
    defaultFocus: "默认观察点",
    mainNote: "核心说明",
    occursIn: "出现于",
  },
} as const;

export type AppCopy = (typeof uiCopy)[Language];

const zhCells: Record<string, CellCopy> = {
  plant: {
    name: "植物细胞",
    type: "真核细胞",
    occurrence: {
      title: "叶、茎、根",
      body: "植物细胞组成负责储能、输水和把阳光转化为糖分的组织。",
    },
    microscope: {
      "Light Microscope": "光学显微镜",
      "Stained Selection": "染色切片",
      "Electron Microscope": "电子显微镜",
    },
    organelles: {
      nucleus: {
        name: "细胞核",
        subtitle: "控制中心",
        attributes: [
          { label: "大小", value: "直径 5 到 10 微米" },
          { label: "位置", value: "通常位于中央" },
          { label: "光镜可见", value: "可见" },
        ],
        note: "细胞核外有双层核膜包裹，核膜上的孔道负责调控分子进出。",
        fact: "细胞核是最早被发现的细胞结构之一。",
      },
      chloroplast: {
        name: "叶绿体",
        subtitle: "光能采集器",
        attributes: [
          { label: "作用", value: "光合作用" },
          { label: "色素", value: "叶绿素" },
          { label: "光镜可见", value: "常可见" },
        ],
        note: "叶绿体把光能转化为化学能，也让许多植物组织呈现绿色。",
        fact: "单个叶片细胞中可能含有几十个叶绿体。",
      },
      vacuole: {
        name: "液泡",
        subtitle: "压力储存室",
        attributes: [
          { label: "体积", value: "大型中央空间" },
          { label: "内容物", value: "水和溶质" },
          { label: "功能", value: "维持膨压" },
        ],
        note: "中央液泡储存水、离子和小分子，同时帮助植物细胞保持挺立。",
        fact: "成熟植物细胞中，液泡可能占据大部分体积。",
      },
      cellWall: {
        name: "细胞壁",
        subtitle: "刚性外框",
        attributes: [
          { label: "材料", value: "富含纤维素" },
          { label: "位置", value: "最外层边界" },
          { label: "功能", value: "保护" },
        ],
        note: "细胞壁赋予植物细胞规则形态，并保护内侧的细胞膜。",
        fact: "细胞壁帮助植物在没有骨骼的情况下直立。",
      },
    },
  },
  whiteBlood: {
    name: "白细胞",
    type: "免疫细胞",
    occurrence: {
      title: "血液、淋巴、组织",
      body: "白细胞在血液和组织间移动，识别威胁并协调免疫防御。",
    },
    microscope: {
      "Light Microscope": "光学显微镜",
      "Stained Selection": "染色切片",
      "Electron Microscope": "电子显微镜",
    },
    organelles: {
      lysosome: {
        name: "溶酶体",
        subtitle: "清理囊泡",
        attributes: [
          { label: "大小", value: "约 1 微米" },
          { label: "内容物", value: "消化酶" },
          { label: "作用", value: "分解" },
        ],
        note: "溶酶体帮助免疫细胞消化吞入物，并回收老化的细胞组分。",
        fact: "白细胞高度依赖囊泡来完成防御。",
      },
      nucleus: {
        name: "分叶细胞核",
        subtitle: "灵活的基因库",
        attributes: [
          { label: "形状", value: "常呈分叶状" },
          { label: "位置", value: "中央" },
          { label: "光镜可见", value: "染色后可见" },
        ],
        note: "许多白细胞的细胞核不是圆形，这有助于它们穿过狭窄组织间隙。",
        fact: "细胞核形态是识别免疫细胞类型的重要线索。",
      },
      granules: {
        name: "颗粒",
        subtitle: "化学包裹",
        attributes: [
          { label: "内容物", value: "蛋白质和酶" },
          { label: "用途", value: "防御" },
          { label: "可见性", value: "取决于染色" },
        ],
        note: "颗粒储存能杀伤入侵者或调节炎症的化学物质。",
        fact: "有些免疫细胞的命名来自其颗粒染色表现。",
      },
    },
  },
  neuron: {
    name: "神经元",
    type: "神经细胞",
    occurrence: {
      title: "脑、脊髓、神经",
      body: "神经元通过长距离突起传递电信号，把身体不同区域连接起来。",
    },
    microscope: {
      "Light Microscope": "光学显微镜",
      "Stained Selection": "染色切片",
      "Electron Microscope": "电子显微镜",
    },
    organelles: {
      axon: {
        name: "轴突",
        subtitle: "信号高速路",
        attributes: [
          { label: "长度", value: "微米级到超过 1 米" },
          { label: "绝缘层", value: "髓鞘" },
          { label: "光镜可见", value: "染色后可见" },
        ],
        note: "轴突把神经冲动从细胞体传向远端目标。",
        fact: "神经冲动的速度可超过每秒 100 米。",
      },
      soma: {
        name: "胞体",
        subtitle: "细胞主体",
        attributes: [
          { label: "包含", value: "细胞核" },
          { label: "作用", value: "代谢枢纽" },
          { label: "形状", value: "圆形或椭圆" },
        ],
        note: "胞体容纳细胞核和多数细胞器，支撑整个神经元的生存。",
        fact: "多数神经元蛋白在胞体或其附近合成。",
      },
      dendrites: {
        name: "树突",
        subtitle: "接收分支",
        attributes: [
          { label: "形状", value: "分支状" },
          { label: "作用", value: "接收输入" },
          { label: "表面", value: "常有棘突" },
        ],
        note: "树突接收来自其他神经元的信号，并把信息传回胞体。",
        fact: "单个神经元可以接收数千个突触输入。",
      },
    },
  },
  epithelial: {
    name: "上皮细胞",
    type: "人体组织细胞",
    occurrence: {
      title: "皮肤、肠道、气道",
      body: "上皮细胞形成覆盖层和屏障，保护组织并调控吸收与分泌。",
    },
    microscope: {
      "Light Microscope": "光学显微镜",
      "Stained Selection": "染色切片",
      "Electron Microscope": "电子显微镜",
    },
    organelles: {
      microvilli: {
        name: "微绒毛",
        subtitle: "吸收刷状边",
        attributes: [
          { label: "长度", value: "0.5 到 1 微米" },
          { label: "位置", value: "顶端表面" },
          { label: "作用", value: "增加表面积" },
        ],
        note: "微绒毛显著增加细胞表面积，使吸收和分泌更高效。",
        fact: "肠道微绒毛会形成密集的刷状缘。",
      },
      junctions: {
        name: "紧密连接",
        subtitle: "密封带",
        attributes: [
          { label: "位置", value: "细胞之间" },
          { label: "作用", value: "屏障" },
          { label: "可见性", value: "更适合电镜观察" },
        ],
        note: "紧密连接封闭相邻细胞之间的缝隙，控制物质跨越组织表面。",
        fact: "上皮屏障对器官边界至关重要。",
      },
      nucleus: {
        name: "细胞核",
        subtitle: "指令存储库",
        attributes: [
          { label: "位置", value: "基底到中央" },
          { label: "形状", value: "椭圆" },
          { label: "光镜可见", value: "可见" },
        ],
        note: "细胞核保存 DNA，并调控细胞维持屏障和分泌功能所需的基因表达。",
        fact: "细胞核形态能帮助病理医生解读组织样本。",
      },
    },
  },
  bacteria: {
    name: "细菌细胞",
    type: "原核细胞",
    occurrence: {
      title: "土壤、水、肠道、皮肤",
      body: "细菌存在于环境和人体多个部位，很多种类参与消化和生态循环。",
    },
    microscope: {
      "Light Microscope": "光学显微镜",
      "Stained Selection": "染色切片",
      "Electron Microscope": "电子显微镜",
    },
    organelles: {
      nucleoid: {
        name: "拟核",
        subtitle: "裸露基因组",
        attributes: [
          { label: "大小", value: "约 1 微米区域" },
          { label: "膜结构", value: "无膜包裹" },
          { label: "光镜可见", value: "不可见，需电镜" },
        ],
        note: "拟核是细菌 DNA 聚集的区域，没有细胞核那样的膜包裹。",
        fact: "人体内细菌细胞的数量比许多人想象得更多。",
      },
      cellWall: {
        name: "细胞壁",
        subtitle: "保护外壳",
        attributes: [
          { label: "材料", value: "肽聚糖" },
          { label: "作用", value: "维持形状与防御" },
          { label: "位置", value: "细胞膜外侧" },
        ],
        note: "细胞壁帮助细菌抵抗压力，并形成特征性的外形。",
        fact: "革兰氏染色能显示不同细菌细胞壁结构的差异。",
      },
      flagellum: {
        name: "鞭毛",
        subtitle: "游泳尾巴",
        attributes: [
          { label: "作用", value: "运动" },
          { label: "形状", value: "螺旋丝状" },
          { label: "光镜可见", value: "需特殊染色" },
        ],
        note: "鞭毛像旋转推进器一样帮助细菌在液体环境中移动。",
        fact: "细菌鞭毛由离子梯度提供动力。",
      },
    },
  },
  animal: {
    name: "动物细胞",
    type: "真核细胞",
    occurrence: {
      title: "动物组织",
      body: "动物细胞构成肌肉、器官、神经和结缔组织，是多细胞动物身体的基础。",
    },
    microscope: {
      "Light Microscope": "光学显微镜",
      "Stained Selection": "染色切片",
      "Electron Microscope": "电子显微镜",
    },
    organelles: {
      mitochondrion: {
        name: "线粒体",
        subtitle: "能量转换器",
        attributes: [
          { label: "长度", value: "1 到 10 微米" },
          { label: "膜结构", value: "双层膜" },
          { label: "作用", value: "产生 ATP" },
        ],
        note: "线粒体通过折叠的内膜把燃料分子转化为细胞可用能量。",
        fact: "线粒体拥有自己的小型 DNA 基因组。",
      },
      nucleus: {
        name: "细胞核",
        subtitle: "指挥室",
        attributes: [
          { label: "形状", value: "圆形" },
          { label: "膜结构", value: "双层膜" },
          { label: "光镜可见", value: "可见" },
        ],
        note: "细胞核储存染色体，并调节哪些基因处于活跃状态。",
        fact: "并非所有动物细胞都保留细胞核。成熟红细胞会失去细胞核。",
      },
      ribosome: {
        name: "核糖体",
        subtitle: "蛋白质建造器",
        attributes: [
          { label: "大小", value: "约 20 到 30 纳米" },
          { label: "作用", value: "翻译" },
          { label: "位置", value: "细胞质和粗面内质网" },
        ],
        note: "核糖体读取信使 RNA，把氨基酸连接成蛋白质链，这些蛋白随后会折叠或进入内质网。",
        fact: "一个活跃细胞中可能含有数百万个核糖体。",
      },
      membrane: {
        name: "细胞膜",
        subtitle: "选择性边界",
        attributes: [
          { label: "结构", value: "磷脂双分子层" },
          { label: "作用", value: "选择性运输" },
          { label: "蛋白", value: "通道和泵" },
        ],
        note: "细胞膜把细胞和外部环境隔开，转运蛋白和囊泡会移动被选择的货物。",
        fact: "细胞膜具有流动性，许多膜蛋白会在脂质双层中移动。",
      },
      golgi: {
        name: "高尔基体",
        subtitle: "包装堆栈",
        attributes: [
          { label: "形状", value: "扁平囊堆叠" },
          { label: "作用", value: "修饰与分拣" },
          { label: "位置", value: "靠近细胞核" },
        ],
        note: "高尔基体修饰、分拣并运输蛋白质和脂质到目标位置。",
        fact: "分泌活跃的细胞通常拥有明显的高尔基体。",
      },
    },
  },
  muscle: {
    name: "肌肉细胞",
    type: "肌纤维",
    occurrence: {
      title: "骨骼肌",
      body: "肌纤维包含重复排列的收缩束，这些结构缩短时会产生力量。",
    },
    microscope: {
      "Light Microscope": "光学显微镜",
      "Stained Selection": "染色切片",
      "Electron Microscope": "电子显微镜",
    },
    organelles: {
      myofibril: {
        name: "肌原纤维",
        subtitle: "收缩丝束",
        attributes: [
          { label: "直径", value: "约 1 微米" },
          { label: "排列", value: "横纹束状" },
          { label: "光镜可见", value: "可见，有条带" },
        ],
        note: "每条肌纤维中有成百上千条肌原纤维沿全长排列，并紧密堆叠。",
        fact: "单条肌纤维最长可达 30 厘米。",
      },
      sarcolemma: {
        name: "肌膜",
        subtitle: "可兴奋膜",
        attributes: [
          { label: "位置", value: "外表面" },
          { label: "作用", value: "传播信号" },
          { label: "类型", value: "细胞膜" },
        ],
        note: "肌膜传导触发收缩的电信号，并把信号扩散到整条肌纤维。",
        fact: "膜信号可通过 T 小管深入肌纤维内部。",
      },
      mitochondria: {
        name: "线粒体",
        subtitle: "耐力供能",
        attributes: [
          { label: "作用", value: "能量供应" },
          { label: "位置", value: "纤维之间" },
          { label: "密度", value: "随活动水平变化" },
        ],
        note: "肌肉细胞需要大量线粒体，因为收缩会消耗大量 ATP。",
        fact: "耐力训练可以提高线粒体密度。",
      },
    },
  },
};

function zhCell(cell: CellItem) {
  return zhCells[cell.id];
}

function zhOrganelle(cell: CellItem, organelleId: string) {
  return zhCell(cell)?.organelles[organelleId];
}

export function cellName(cell: CellItem, language: Language) {
  return language === "zh" ? zhCell(cell)?.name ?? cell.name : cell.name;
}

export function cellType(cell: CellItem, language: Language) {
  return language === "zh" ? zhCell(cell)?.type ?? cell.type : cell.type;
}

export function occurrenceTitle(cell: CellItem, language: Language) {
  return language === "zh" ? zhCell(cell)?.occurrence.title ?? cell.occurrence.title : cell.occurrence.title;
}

export function occurrenceBody(cell: CellItem, language: Language) {
  return language === "zh" ? zhCell(cell)?.occurrence.body ?? cell.occurrence.body : cell.occurrence.body;
}

export function microscopeLabel(cell: CellItem, label: string, language: Language) {
  return language === "zh" ? zhCell(cell)?.microscope[label] ?? label : label;
}

export function organelleName(
  cell: CellItem,
  organelle: CellItem["organelles"][number],
  language: Language,
) {
  return language === "zh" ? zhOrganelle(cell, organelle.id)?.name ?? organelle.name : organelle.name;
}

export function organelleSubtitle(
  cell: CellItem,
  organelle: CellItem["organelles"][number],
  language: Language,
) {
  return language === "zh" ? zhOrganelle(cell, organelle.id)?.subtitle ?? organelle.subtitle : organelle.subtitle;
}

export function organelleNote(
  cell: CellItem,
  organelle: CellItem["organelles"][number],
  language: Language,
) {
  return language === "zh" ? zhOrganelle(cell, organelle.id)?.note ?? organelle.note : organelle.note;
}

export function organelleFact(
  cell: CellItem,
  organelle: CellItem["organelles"][number],
  language: Language,
) {
  return language === "zh" ? zhOrganelle(cell, organelle.id)?.fact ?? organelle.fact : organelle.fact;
}

export function attributeLabel(
  cell: CellItem,
  organelle: CellItem["organelles"][number],
  index: number,
  language: Language,
) {
  return language === "zh"
    ? zhOrganelle(cell, organelle.id)?.attributes[index]?.label ?? organelle.attributes[index]?.label ?? ""
    : organelle.attributes[index]?.label ?? "";
}

export function attributeValue(
  cell: CellItem,
  organelle: CellItem["organelles"][number],
  index: number,
  language: Language,
) {
  return language === "zh"
    ? zhOrganelle(cell, organelle.id)?.attributes[index]?.value ?? organelle.attributes[index]?.value ?? ""
    : organelle.attributes[index]?.value ?? "";
}

export function buildTutorPrompts(
  cell: CellItem,
  organelle: CellItem["organelles"][number],
  language: Language,
) {
  const comparedCell = getCellById(cell.comparison);
  const currentCellName = cellName(cell, language);
  const comparedCellName = cellName(comparedCell, language);
  const currentOrganelleName = organelleName(cell, organelle, language);

  if (language === "zh") {
    return [
      `说明${currentOrganelleName}如何帮助${currentCellName}维持生命活动。`,
      `考考我：${currentCellName}和${comparedCellName}在视觉结构上有什么差异？`,
      `带我在 3D 模型里找到${currentOrganelleName}。`,
    ];
  }

  return [
    `Explain how ${currentOrganelleName} helps a ${currentCellName} stay alive.`,
    `Quiz me on the visual differences between ${currentCellName} and ${comparedCellName}.`,
    `Guide me through finding ${currentOrganelleName} inside the 3D model.`,
  ];
}

export function formatMasteryProgress(
  viewedCellCount: number,
  cellCount: number,
  viewedOrganelleCount: number,
  totalOrganelleCount: number,
  language: Language,
) {
  if (language === "zh") {
    return `已探索 ${viewedCellCount}/${cellCount} 类细胞 · 已查看 ${viewedOrganelleCount}/${totalOrganelleCount} 个细胞器`;
  }

  return `${viewedCellCount}/${cellCount} cells explored · ${viewedOrganelleCount}/${totalOrganelleCount} organelles inspected`;
}

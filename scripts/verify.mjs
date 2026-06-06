import { mkdir, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { PNG } from "pngjs";
import tutorHandler from "../api/tutor.js";

const url = process.env.APP_URL ?? "http://127.0.0.1:5173/";
const chromePath =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const outDir = new URL("../verification/", import.meta.url);
const microscopeAnnotationStorageKey = "cell-architecture-studio:microscope-annotations:v1";

function outPath(fileName) {
  return fileURLToPath(new URL(fileName, outDir));
}

function assert(value, message) {
  if (!value) {
    throw new Error(message);
  }
}

async function setRangeValue(locator, value) {
  await locator.evaluate((input, nextValue) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, String(nextValue));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

function createMicroscopeFixture() {
  const png = new PNG({ width: 32, height: 32 });
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const index = (png.width * y + x) * 4;
      const pulse = Math.sin((x + y) / 4) * 32;
      png.data[index] = 180 + pulse;
      png.data[index + 1] = 110 + x * 2;
      png.data[index + 2] = 190 + y;
      png.data[index + 3] = 255;
    }
  }
  return PNG.sync.write(png);
}

async function verifyTutorApiHandler() {
  const previousApiKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  let responseBody = "";
  const response = {
    statusCode: 200,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(value = "") {
      responseBody = value;
    },
  };

  await tutorHandler(
    {
      method: "POST",
      body: {
        question: "What does the mitochondrion do?",
        language: "en",
      },
    },
    response,
  );

  if (previousApiKey !== undefined) {
    process.env.OPENAI_API_KEY = previousApiKey;
  } else {
    delete process.env.OPENAI_API_KEY;
  }

  const payload = JSON.parse(responseBody);
  assert(response.statusCode === 503, "tutor API should require a server-side API key");
  assert(payload.code === "missing_api_key", "tutor API missing-key response code changed");

  return {
    status: response.statusCode,
    code: payload.code,
  };
}

async function readVisualMetrics(page, selector) {
  const box = await page.locator(selector).boundingBox();
  const buffer = await page.locator(selector).screenshot();
  const png = PNG.sync.read(buffer);
  const left = Math.floor(png.width * 0.18);
  const right = Math.floor(png.width * 0.82);
  const top = Math.floor(png.height * 0.16);
  const bottom = Math.floor(png.height * 0.86);

  let nonPaper = 0;
  let sum = 0;
  let sumSquares = 0;
  let alphaPixels = 0;
  let count = 0;

  for (let y = top; y < bottom; y += 1) {
    for (let x = left; x < right; x += 1) {
      const index = (png.width * y + x) * 4;
      const r = png.data[index];
      const g = png.data[index + 1];
      const b = png.data[index + 2];
      const a = png.data[index + 3];
      const brightness = (r + g + b) / 3;
      if (a > 0) {
        alphaPixels += 1;
      }
      if (Math.abs(r - 251) + Math.abs(g - 247) + Math.abs(b - 238) > 26) {
        nonPaper += 1;
      }
      sum += brightness;
      sumSquares += brightness * brightness;
      count += 1;
    }
  }

  const mean = sum / count;
  const variance = sumSquares / count - mean * mean;

  return {
    width: box?.width ?? png.width,
    height: box?.height ?? png.height,
    alphaRatio: alphaPixels / count,
    nonPaperRatio: nonPaper / count,
    variance,
  };
}

async function verifyViewport(browser, name, viewport) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector("canvas", { timeout: 15000 });
  await page.waitForTimeout(1600);

  const title = await page.locator(".stage-title h2").innerText();
  const cellCount = await page.locator(".model-token").count();
  const tutorText = await page.locator(".learning-panel").innerText();
  const processText = await page.locator(".process-panel").innerText();
  const libraryText = await page.locator("#library").innerText();
  const settingsText = await page.locator("#settings").innerText();
  const modelAtlasText = await page.getByTestId("model-atlas-panel").innerText();
  const modeTitles = await page.locator(".mode-switcher button").evaluateAll((buttons) =>
    buttons.map((button) => button.getAttribute("title")),
  );
  const activeMode = await page.locator(".mode-switcher button.is-active").getAttribute("title");
  const visualBox = await page.locator("canvas").boundingBox();
  await page.screenshot({ path: outPath(`${name}.png`), fullPage: true });
  await page.locator("canvas").screenshot({ path: outPath(`${name}-visual.png`) });
  const metrics = await readVisualMetrics(page, "canvas");

  assert(title.includes("Animal Cell"), `${name}: initial title mismatch`);
  assert(cellCount === 7, `${name}: expected 7 cells, received ${cellCount}`);
  assert(tutorText.toLowerCase().includes("ai tutor"), `${name}: AI tutor panel is missing`);
  assert(tutorText.toLowerCase().includes("mastery"), `${name}: mastery tracker is missing`);
  assert(processText.toLowerCase().includes("biochemical processes"), `${name}: process panel is missing`);
  assert(processText.toLowerCase().includes("protein biosynthesis"), `${name}: protein process is missing`);
  assert(processText.toLowerCase().includes("process simulation"), `${name}: process simulator is missing`);
  assert(libraryText.toLowerCase().includes("library"), `${name}: library panel is missing`);
  assert(libraryText.toLowerCase().includes("processes"), `${name}: library process catalogue is missing`);
  assert(settingsText.toLowerCase().includes("settings"), `${name}: settings panel is missing`);
  assert(settingsText.toLowerCase().includes("render quality"), `${name}: render quality settings are missing`);
  assert(modelAtlasText.toLowerCase().includes("model atlas"), `${name}: model atlas panel is missing`);
  assert(modelAtlasText.toLowerCase().includes("glb study mesh"), `${name}: model atlas did not show GLB asset status`);
  assert(modelAtlasText.toLowerCase().includes("procedural model"), `${name}: model atlas did not show procedural model status`);
  assert(activeMode === "Mesh", `${name}: default mode should be Mesh`);
  assert(modeTitles.length === 2 && modeTitles.includes("Mesh") && modeTitles.includes("Focus"), `${name}: unexpected mode buttons`);
  assert(visualBox && visualBox.width > 260 && visualBox.height > 220, `${name}: visual is too small`);
  assert(metrics, `${name}: missing visual metrics`);
  assert(metrics.nonPaperRatio > 0.05, `${name}: visual appears blank`);
  assert(metrics.variance > 120, `${name}: visual has too little pixel variation`);
  await page.close();

  return { name, title, cellCount, activeMode, modeTitles, visualBox, metrics };
}

async function verifyInteractions(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate((storageKey) => window.localStorage.removeItem(storageKey), microscopeAnnotationStorageKey);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector("canvas", { timeout: 15000 });
  await page.waitForTimeout(600);

  const microscopeFixturePath = outPath("microscope-upload-fixture.png");
  await page.locator('[data-testid="microscope-upload-input"]').setInputFiles(microscopeFixturePath);
  await page.waitForTimeout(350);
  const microscopeAnalysisText = await page.locator(".microscope-analysis").innerText();
  assert(microscopeAnalysisText.toLowerCase().includes("microscope analysis"), "microscope analysis did not render");
  assert(microscopeAnalysisText.includes("microscope-upload-fixture.png"), "uploaded microscope file name is missing");
  assert(microscopeAnalysisText.toLowerCase().includes("confidence"), "microscope confidence result is missing");
  const microscopeStageText = await page.getByTestId("microscope-stage").innerText();
  assert(microscopeStageText.toLowerCase().includes("microscope stage"), "microscope stage did not render");
  assert(microscopeStageText.toLowerCase().includes("user reference"), "microscope stage did not show upload metadata");
  assert(await page.getByTestId("microscope-marker-primary").count() === 1, "microscope focus marker is missing");
  await setRangeValue(page.getByTestId("microscope-zoom"), 2.25);
  await page.waitForTimeout(120);
  const microscopeZoomValue = await page.getByTestId("microscope-zoom").evaluate((input) => input.value);
  assert(microscopeZoomValue === "2.25", "microscope zoom control did not update");
  await page.getByTestId("microscope-channel-fluorescence").click();
  await page.waitForTimeout(150);
  const microscopeStageClass = await page.getByTestId("microscope-stage").getAttribute("class");
  assert(microscopeStageClass?.includes("channel-fluorescence"), "microscope channel did not update stage class");
  await page.getByTestId("microscope-markers-toggle").click();
  await page.waitForTimeout(150);
  assert(await page.getByTestId("microscope-marker-primary").count() === 0, "microscope markers did not hide");
  await page.getByTestId("microscope-markers-toggle").click();
  await page.waitForTimeout(150);
  assert(await page.getByTestId("microscope-marker-primary").count() === 1, "microscope markers did not return");
  await page.waitForFunction(() => {
    const image = document.querySelector('[data-testid="microscope-stage"] img');
    return image instanceof HTMLImageElement && image.src.startsWith("data:image");
  });
  await page.getByTestId("microscope-annotation-save").click();
  await page.waitForTimeout(150);
  const savedAnnotationText = await page.getByTestId("microscope-annotation-sets").innerText();
  assert(savedAnnotationText.toLowerCase().includes("annotation sets"), "microscope annotation sets did not render");
  assert(savedAnnotationText.includes("microscope-upload-fixture.png"), "microscope annotation did not save the source");
  const storedMicroscopeAnnotation = await page.evaluate((storageKey) => {
    const annotations = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");
    return annotations[0];
  }, microscopeAnnotationStorageKey);
  assert(storedMicroscopeAnnotation?.uploadedReference?.dataUrl?.startsWith("data:image"), "microscope annotation did not persist uploaded image data");
  await setRangeValue(page.getByTestId("microscope-zoom"), 1.15);
  await page.getByTestId("microscope-channel-contrast").click();
  await page.getByTestId("microscope-markers-toggle").click();
  await page.waitForTimeout(150);
  await page.locator('[data-testid^="microscope-annotation-restore-"]').first().click();
  await page.waitForTimeout(180);
  const restoredMicroscopeZoomValue = await page.getByTestId("microscope-zoom").evaluate((input) => input.value);
  const restoredMicroscopeStageClass = await page.getByTestId("microscope-stage").getAttribute("class");
  assert(restoredMicroscopeZoomValue === "2.25", "microscope annotation restore did not recover zoom");
  assert(restoredMicroscopeStageClass?.includes("channel-fluorescence"), "microscope annotation restore did not recover channel");
  assert(await page.getByTestId("microscope-marker-primary").count() === 1, "microscope annotation restore did not recover markers");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector("canvas", { timeout: 15000 });
  await page.waitForTimeout(650);
  const persistedAnnotationText = await page.getByTestId("microscope-annotation-sets").innerText();
  assert(persistedAnnotationText.includes("microscope-upload-fixture.png"), "microscope annotation did not persist after reload");
  await page.locator('[data-testid^="microscope-annotation-restore-"]').first().click();
  await page.waitForTimeout(180);
  const persistedMicroscopeZoomValue = await page.getByTestId("microscope-zoom").evaluate((input) => input.value);
  const persistedMicroscopeStageClass = await page.getByTestId("microscope-stage").getAttribute("class");
  const persistedMicroscopeAnalysisText = await page.locator(".microscope-analysis").innerText();
  assert(persistedMicroscopeZoomValue === "2.25", "persisted microscope annotation did not recover zoom");
  assert(persistedMicroscopeStageClass?.includes("channel-fluorescence"), "persisted microscope annotation did not recover channel");
  assert(persistedMicroscopeAnalysisText.includes("microscope-upload-fixture.png"), "persisted microscope annotation did not recover uploaded source");

  await page.locator(".model-token").filter({ hasText: "Plant Cell" }).click();
  await page.waitForSelector("canvas", { timeout: 15000 });
  await page.waitForTimeout(7000);
  const plantModelMetrics = await readVisualMetrics(page, "canvas");
  assert(plantModelMetrics.nonPaperRatio > 0.05, "plant GLB appears blank");
  assert(plantModelMetrics.variance > 120, "plant GLB has too little pixel variation");
  await page.locator(".process-tabs button").filter({ hasText: "Photosynthesis" }).click();
  const simulatorText = await page.getByTestId("process-simulator").innerText();
  assert(simulatorText.toLowerCase().includes("process simulation"), "process simulator did not render");
  const photosynthesisLabStart = await page.getByTestId("process-lab-readouts").innerText();
  assert(photosynthesisLabStart.toLowerCase().includes("reaction readouts"), "process reaction readouts did not render");
  assert(photosynthesisLabStart.includes("Light + Water + Carbon dioxide"), "photosynthesis inputs did not render");
  assert(photosynthesisLabStart.includes("ATP / NADPH"), "photosynthesis energy carrier did not render");
  await setRangeValue(page.getByTestId("process-simulation-progress"), 50);
  await page.waitForTimeout(250);
  const scrubbedProgress = await page.getByTestId("process-simulator").getAttribute("data-progress");
  const scrubbedStepText = await page.locator(".process-timeline li.is-active-step").innerText();
  const photosynthesisLabMid = await page.getByTestId("process-lab-readouts").innerText();
  assert(scrubbedProgress === "50", "process simulator scrubber did not update progress");
  assert(scrubbedStepText.includes("Electron flow"), "process simulator did not activate the matching step");
  assert(photosynthesisLabMid.includes("57 %"), "photosynthesis photon readout did not update with progress");
  assert(photosynthesisLabMid.includes("43 a.u."), "photosynthesis gradient readout did not update with progress");
  await page.getByTestId("process-simulation-speed-2").click();
  const simulatorSpeed = await page.getByTestId("process-simulator").getAttribute("data-speed");
  assert(simulatorSpeed === "2", "process simulator speed did not update");
  await page.getByTestId("process-simulation-toggle").click();
  await page.waitForTimeout(700);
  const runningProgress = Number(await page.getByTestId("process-simulator").getAttribute("data-progress"));
  assert(runningProgress > 50, "process simulator play control did not advance progress");
  await page.getByTestId("process-simulation-reset").click();
  await page.waitForTimeout(180);
  const resetProgress = await page.getByTestId("process-simulator").getAttribute("data-progress");
  assert(resetProgress === "0", "process simulator reset did not return to the first step");
  await setRangeValue(page.getByTestId("process-simulation-progress"), 50);
  await page.waitForTimeout(250);
  await page.locator(".organelle-strip button").filter({ hasText: "Chloroplast" }).click();
  await page.getByRole("button", { name: /Isolate/ }).click();
  await page.waitForTimeout(350);
  const isolateLensText = await page.locator(".isolate-lens").innerText();
  const plantProcessText = await page.locator(".process-panel").innerText();
  const processStepCount = await page.locator(".process-timeline li").count();
  assert(isolateLensText.includes("Chloroplast"), "isolate lens did not highlight the selected organelle");
  assert(isolateLensText.toLowerCase().includes("photosynthesis"), "isolate lens did not show the linked process");
  assert(isolateLensText.toLowerCase().includes("3d electron flow"), "isolate lens did not show the active 3D process step");
  assert(plantProcessText.includes("Photosynthesis"), "photosynthesis process did not activate");
  assert(processStepCount >= 3, "process timeline is missing steps");

  await page.locator(".model-token").filter({ hasText: "Animal Cell" }).click();
  await page.waitForSelector("canvas", { timeout: 15000 });
  await page.waitForTimeout(1800);
  const animalModelMetrics = await readVisualMetrics(page, "canvas");
  assert(animalModelMetrics.nonPaperRatio > 0.05, "animal GLB appears blank");
  assert(animalModelMetrics.variance > 120, "animal GLB has too little pixel variation");
  await page.locator(".process-tabs button").filter({ hasText: "Cell Respiration" }).click();
  await page.locator(".process-timeline button").filter({ hasText: "ATP production" }).click();
  const respirationLabText = await page.getByTestId("process-lab-readouts").innerText();
  assert(respirationLabText.includes("NADH / FADH2"), "respiration energy carrier did not render");
  assert(respirationLabText.toLowerCase().includes("atp yield"), "respiration ATP readout did not render");
  await page.locator(".organelle-strip button").filter({ hasText: "Mitochondrion" }).click();
  await page.getByRole("button", { name: /Isolate/ }).click();
  await page.waitForTimeout(350);
  const respirationLensText = await page.locator(".isolate-lens").innerText();
  assert(respirationLensText.includes("Mitochondrion"), "isolate lens did not highlight mitochondrion");
  assert(respirationLensText.toLowerCase().includes("cell respiration"), "isolate lens did not show cell respiration");
  assert(
    respirationLensText.toLowerCase().includes("3d atp production"),
    "isolate lens did not show the active ATP production 3D step",
  );

  await page.locator(".process-tabs button").filter({ hasText: "Protein Biosynthesis" }).click();
  await page.locator(".process-timeline button").filter({ hasText: "Translation" }).click();
  await page.locator(".organelle-strip button").filter({ hasText: "Ribosome" }).click();
  await page.getByRole("button", { name: /Isolate/ }).click();
  await page.waitForTimeout(350);
  const proteinLensText = await page.locator(".isolate-lens").innerText();
  const proteinProcessText = await page.locator(".process-panel").innerText();
  assert(proteinLensText.includes("Ribosome"), "isolate lens did not highlight ribosome");
  assert(proteinLensText.toLowerCase().includes("protein biosynthesis"), "isolate lens did not show protein biosynthesis");
  assert(proteinLensText.toLowerCase().includes("3d translation"), "isolate lens did not show the active translation 3D step");
  assert(proteinProcessText.includes("Ribosomes read mRNA"), "translation step copy did not render");

  await page.locator(".process-tabs button").filter({ hasText: "Membrane Transport" }).click();
  await page.locator(".process-timeline button").filter({ hasText: "Channels and pumps" }).click();
  await page.locator(".organelle-strip button").filter({ hasText: "Cell Membrane" }).click();
  await page.getByRole("button", { name: /Isolate/ }).click();
  await page.waitForTimeout(350);
  const transportLensText = await page.locator(".isolate-lens").innerText();
  const transportProcessText = await page.locator(".process-panel").innerText();
  assert(transportLensText.includes("Cell Membrane"), "isolate lens did not highlight cell membrane");
  assert(transportLensText.toLowerCase().includes("membrane transport"), "isolate lens did not show membrane transport");
  assert(
    transportLensText.toLowerCase().includes("3d channels and pumps"),
    "isolate lens did not show the active channels and pumps 3D step",
  );
  assert(transportProcessText.includes("Proteins move ions"), "channels and pumps step copy did not render");

  await page.locator(".process-tabs button").filter({ hasText: "Cell Cycle" }).click();
  await page.locator(".process-timeline button").filter({ hasText: "Mitosis" }).click();
  await page.locator(".organelle-strip button").filter({ hasText: "Nucleus" }).click();
  await page.getByRole("button", { name: /Isolate/ }).click();
  await page.waitForTimeout(350);
  const cycleLensText = await page.locator(".isolate-lens").innerText();
  const cycleProcessText = await page.locator(".process-panel").innerText();
  assert(cycleLensText.includes("Nucleus"), "isolate lens did not highlight nucleus");
  assert(cycleLensText.toLowerCase().includes("cell cycle"), "isolate lens did not show cell cycle");
  assert(cycleLensText.toLowerCase().includes("3d mitosis"), "isolate lens did not show the active mitosis 3D step");
  assert(cycleProcessText.includes("Chromosomes separate"), "mitosis step copy did not render");

  await page.locator(".model-token").filter({ hasText: "White Blood Cell" }).click();
  await page.waitForSelector("canvas", { timeout: 15000 });
  await page.waitForTimeout(7000);
  const whiteBloodModelMetrics = await readVisualMetrics(page, "canvas");
  assert(whiteBloodModelMetrics.nonPaperRatio > 0.05, "white blood GLB appears blank");
  assert(whiteBloodModelMetrics.variance > 120, "white blood GLB has too little pixel variation");

  await page.locator(".model-token").filter({ hasText: "Muscle Cell" }).click();
  await page.waitForSelector("canvas", { timeout: 15000 });
  await page.waitForTimeout(9000);
  const muscleModelMetrics = await readVisualMetrics(page, "canvas");
  assert(muscleModelMetrics.nonPaperRatio > 0.05, "muscle GLB appears blank");
  assert(muscleModelMetrics.variance > 120, "muscle GLB has too little pixel variation");

  await page.locator(".model-token").filter({ hasText: "Bacteria Cell" }).click();
  await page.waitForSelector("canvas", { timeout: 15000 });
  await page.waitForTimeout(800);

  const title = await page.locator(".stage-title h2").innerText();
  assert(title.includes("Bacteria Cell"), "cell switch did not update title");
  const bacteriaMeshMetrics = await readVisualMetrics(page, "canvas");
  assert(bacteriaMeshMetrics.nonPaperRatio > 0.05, "bacteria mesh appears blank");
  assert(bacteriaMeshMetrics.variance > 120, "bacteria mesh has too little pixel variation");

  await page.locator(".organelle-strip button").filter({ hasText: "Flagellum" }).click();
  await page.waitForTimeout(250);
  const detailTitle = await page.locator(".detail-hero h3").innerText();
  assert(detailTitle.includes("Flagellum"), "organelle switch did not update details");

  await page.locator(".prompt-list button").first().click();
  await page.waitForTimeout(250);
  const tutorPrompt = await page.locator(".tutor-prompt p").innerText();
  assert(tutorPrompt.includes("Flagellum"), "AI tutor prompt did not update");
  await page.getByTestId("ask-tutor").click();
  await page.waitForTimeout(850);
  const tutorResponseText = await page.getByTestId("tutor-response").innerText();
  assert(tutorResponseText.includes("Flagellum"), "AI tutor response did not reference the active organelle");
  assert(tutorResponseText.includes("Bacteria Cell"), "AI tutor response did not reference the active cell");
  assert(tutorResponseText.includes("Local fallback"), "AI tutor did not show local fallback when API is unavailable");

  await page.route("**/api/tutor", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        answer: "API tutor confirms Flagellum in Bacteria Cell and connects it to movement.",
        source: "api",
      }),
    });
  });
  await page.getByTestId("tutor-question-input").fill("Use the API tutor for flagellum movement.");
  await page.getByTestId("ask-tutor").click();
  await page.waitForTimeout(450);
  const apiTutorResponseText = await page.getByTestId("tutor-response").innerText();
  assert(apiTutorResponseText.includes("AI API tutor"), "AI tutor did not show API response mode");
  assert(apiTutorResponseText.includes("API tutor confirms Flagellum"), "AI tutor did not render mocked API answer");

  await page.getByRole("button", { name: /Open Comparison View/ }).click();
  await page.waitForTimeout(250);
  const modalTitle = await page.locator(".comparison-modal h3").innerText();
  assert(modalTitle.includes("Comparison View"), "comparison modal did not open");
  await page.getByRole("button", { name: "Close" }).click();
  await page.waitForTimeout(250);

  const [screenshotDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Screenshot/ }).click(),
  ]);
  const screenshotPath = await screenshotDownload.path();
  assert(screenshotDownload.suggestedFilename().endsWith(".png"), "screenshot export should download a PNG");
  assert(screenshotPath, "screenshot download did not produce a file path");
  const screenshotFile = await stat(screenshotPath);
  assert(screenshotFile.size > 10_000, "screenshot download is unexpectedly small");

  const [glbDownload] = await Promise.all([
    page.waitForEvent("download", { timeout: 120000 }),
    page.getByRole("button", { name: /GLB Export/ }).click(),
  ]);
  const glbPath = await glbDownload.path();
  assert(glbDownload.suggestedFilename().endsWith(".glb"), "GLB export should download a .glb file");
  assert(glbPath, "GLB download did not produce a file path");
  const glbFile = await stat(glbPath);
  assert(glbFile.size > 10_000, "GLB download is unexpectedly small");

  await page.getByTestId("library-search").fill("photosynthesis");
  await page.waitForTimeout(250);
  const librarySearchText = await page.locator("#library").innerText();
  assert(librarySearchText.includes("Photosynthesis"), "library search did not surface photosynthesis");
  await page.getByTestId("library-process-open-photosynthesis").click();
  await page.waitForTimeout(1200);
  const libraryOpenedTitle = await page.locator(".stage-title h2").innerText();
  const libraryProcessText = await page.locator(".process-panel").innerText();
  const libraryDetailTitle = await page.locator(".detail-hero h3").innerText();
  assert(libraryOpenedTitle.includes("Plant Cell"), "library process open did not switch to a compatible cell");
  assert(libraryProcessText.includes("Photosynthesis"), "library process open did not activate photosynthesis");
  assert(libraryDetailTitle.includes("Chloroplast"), "library process open did not focus the linked organelle");

  await page.getByTestId("settings-label-compact").click();
  await page.waitForTimeout(150);
  const compactLabelDensity = await page.locator(".app-shell").getAttribute("data-label-density");
  assert(compactLabelDensity === "compact", "settings label density did not update app state");
  await page.getByTestId("settings-quality-high").click();
  await page.waitForTimeout(150);
  const highRenderQuality = await page.locator(".app-shell").getAttribute("data-render-quality");
  assert(highRenderQuality === "high", "settings render quality did not update app state");
  await page.getByTestId("settings-view-mesh").click();
  await page.waitForTimeout(150);
  const settingsActiveMode = await page.locator(".mode-switcher button.is-active").getAttribute("title");
  assert(settingsActiveMode === "Mesh", "settings view mode did not update the stage");
  await page.getByTestId("settings-language-zh").click();
  await page.waitForTimeout(250);
  const zhLanguageState = await page.locator(".app-shell").getAttribute("data-language");
  const zhHeading = await page.locator(".brand-block h1").innerText();
  const zhLibrarySearchText = await page.locator("#library").innerText();
  const zhModelAtlasText = await page.getByTestId("model-atlas-panel").innerText();
  const zhProcessLabText = await page.getByTestId("process-lab-readouts").innerText();
  const zhMicroscopeAnnotationText = await page.getByTestId("microscope-annotation-sets").innerText();
  assert(zhLanguageState === "zh", "settings language control did not update app state");
  assert(zhHeading.includes("细胞建筑工作室"), "settings language control did not localize the header");
  assert(zhLibrarySearchText.includes("光合作用"), "library search did not stay bilingual after language switch");
  assert(zhProcessLabText.includes("反应读数"), "process readouts did not localize");
  assert(zhProcessLabText.includes("能量载体"), "process readout energy label did not localize");
  assert(zhMicroscopeAnnotationText.includes("标注集"), "microscope annotation sets did not localize");
  assert(zhModelAtlasText.includes("模型图谱"), "model atlas did not localize");
  assert(zhModelAtlasText.includes("程序化模型"), "model atlas did not disclose the procedural asset");
  assert(zhModelAtlasText.includes("Native GLB / PBR"), "model atlas did not disclose native GLB assets");
  await page.getByTestId("model-asset-card-epithelial").getByRole("button").click();
  await page.waitForTimeout(700);
  const modelAtlasOpenedTitle = await page.locator(".stage-title h2").innerText();
  assert(modelAtlasOpenedTitle.includes("上皮细胞"), "model atlas open action did not switch to the selected model");

  await page.waitForTimeout(2800);
  await page.screenshot({ path: outPath("interaction.png"), fullPage: true });
  await page.locator("canvas").screenshot({ path: outPath("interaction-canvas.png") });
  await page.close();

  return {
    title,
    detailTitle,
    tutorPrompt,
    tutorResponseText,
    apiTutorResponseText,
    modalTitle,
    microscopeAnalysisText,
    microscopeStageText,
    microscopeZoomValue,
    microscopeStageClass,
    savedAnnotationText,
    restoredMicroscopeZoomValue,
    restoredMicroscopeStageClass,
    persistedAnnotationText,
    persistedMicroscopeZoomValue,
    persistedMicroscopeStageClass,
    plantModelMetrics,
    animalModelMetrics,
    whiteBloodModelMetrics,
    muscleModelMetrics,
    bacteriaMeshMetrics,
    isolateLensText,
    respirationLensText,
    proteinLensText,
    transportLensText,
    cycleLensText,
    plantProcessText,
    proteinProcessText,
    transportProcessText,
    cycleProcessText,
    processStepCount,
    librarySearchText,
    libraryOpenedTitle,
    libraryDetailTitle,
    settings: {
      labelDensity: compactLabelDensity,
      renderQuality: highRenderQuality,
      activeMode: settingsActiveMode,
      language: zhLanguageState,
      bilingualLibrary: zhLibrarySearchText.includes("光合作用"),
      localizedModelAtlas: zhModelAtlasText.includes("模型图谱"),
      localizedProcessReadouts: zhProcessLabText.includes("反应读数"),
      localizedMicroscopeAnnotations: zhMicroscopeAnnotationText.includes("标注集"),
    },
    modelAtlasOpenedTitle,
    screenshotExport: {
      fileName: screenshotDownload.suggestedFilename(),
      size: screenshotFile.size,
    },
    glbExport: {
      fileName: glbDownload.suggestedFilename(),
      size: glbFile.size,
    },
  };
}

async function verifyLessonDeepLinks(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const lessonUrl = new URL(url);
  lessonUrl.searchParams.set("lesson", "photosynthesis-chloroplast");
  lessonUrl.searchParams.set("lang", "zh");
  await page.goto(lessonUrl.href, { waitUntil: "networkidle" });
  await page.waitForSelector("canvas", { timeout: 15000 });
  await page.waitForTimeout(1200);

  const lessonPanelText = await page.getByTestId("lesson-preset").innerText();
  const stageTitle = await page.locator(".stage-title h2").innerText();
  const detailTitle = await page.locator(".detail-hero h3").innerText();
  const processText = await page.locator(".process-panel").innerText();
  const activeMode = await page.locator(".mode-switcher button.is-active").getAttribute("title");
  const currentUrl = page.url();

  assert(stageTitle.includes("植物细胞"), "lesson deep link did not open the plant cell");
  assert(detailTitle.includes("叶绿体"), "lesson deep link did not focus chloroplast");
  assert(processText.includes("光合作用"), "lesson deep link did not activate photosynthesis");
  assert(lessonPanelText.includes("叶绿体光合作用导学"), "lesson panel did not show the active preset");
  assert(lessonPanelText.includes("自测"), "lesson panel did not render the self-check prompt");
  assert(activeMode === "Focus" || activeMode === "聚焦", "lesson deep link did not open focus mode");
  assert(currentUrl.includes("lesson=photosynthesis-chloroplast"), "lesson URL did not preserve lesson id");
  assert(currentUrl.includes("cell=plant"), "lesson URL did not expose the selected cell");
  assert(currentUrl.includes("organelle=chloroplast"), "lesson URL did not expose the selected organelle");
  assert(currentUrl.includes("process=photosynthesis"), "lesson URL did not expose the selected process");

  await page.getByTestId("lesson-preset-select").selectOption("neuron-synapse-transport");
  await page.waitForTimeout(1200);
  const changedLessonUrl = page.url();
  const changedStageTitle = await page.locator(".stage-title h2").innerText();
  const changedDetailTitle = await page.locator(".detail-hero h3").innerText();
  const changedProcessText = await page.locator(".process-panel").innerText();
  const changedLessonText = await page.getByTestId("lesson-preset").innerText();
  assert(changedLessonUrl.includes("lesson=neuron-synapse-transport"), "lesson picker did not update the share URL");
  assert(changedStageTitle.includes("Neuron") || changedStageTitle.includes("神经元"), "lesson picker did not switch to neuron");
  assert(changedDetailTitle.includes("Axon") || changedDetailTitle.includes("轴突"), "lesson picker did not focus axon");
  assert(
    changedProcessText.includes("Membrane Transport") || changedProcessText.includes("膜运输"),
    "lesson picker did not activate membrane transport",
  );
  assert(
    changedLessonText.includes("Neuron Synapse Signal Transfer") || changedLessonText.includes("神经突触信号传递"),
    "lesson picker did not render the selected lesson",
  );

  const demoPage = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  const demoUrl = new URL("/biology-teaching-demo/", url);
  await demoPage.goto(demoUrl.href, { waitUntil: "networkidle" });
  const photosynthesisLessonLinks = await demoPage
    .locator('.links a[href*="lesson=photosynthesis-chloroplast"]')
    .count();
  const neuronLessonLinks = await demoPage.locator('.links a[href*="lesson=neuron-synapse-transport"]').count();
  const demoStudyText = await demoPage.locator(".links").first().innerText();
  assert(photosynthesisLessonLinks >= 1, "demo page did not link chloroplast image to the 3D lesson");
  assert(neuronLessonLinks >= 1, "demo page did not link neuron image to the 3D lesson");
  assert(demoStudyText.includes("Study in 3D"), "demo page did not render the 3D study action");

  await demoPage.close();
  await page.close();

  return {
    lessonUrl: currentUrl,
    changedLessonUrl,
    stageTitle,
    detailTitle,
    changedStageTitle,
    changedDetailTitle,
    demoLinks: {
      photosynthesis: photosynthesisLessonLinks,
      neuron: neuronLessonLinks,
    },
  };
}

await mkdir(outDir, { recursive: true });
await writeFile(outPath("microscope-upload-fixture.png"), createMicroscopeFixture());

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const tutorApi = await verifyTutorApiHandler();
  const desktop = await verifyViewport(browser, "desktop", { width: 1440, height: 1000 });
  const compact = await verifyViewport(browser, "compact", { width: 1280, height: 720 });
  const mobile = await verifyViewport(browser, "mobile", { width: 390, height: 900 });
  const interactions = await verifyInteractions(browser);
  const lessons = await verifyLessonDeepLinks(browser);

  console.log(
    JSON.stringify(
      {
        ok: true,
        url,
        tutorApi,
        screenshots: [
          "verification/desktop.png",
          "verification/desktop-visual.png",
          "verification/compact.png",
          "verification/compact-visual.png",
          "verification/mobile.png",
          "verification/mobile-visual.png",
          "verification/interaction.png",
          "verification/interaction-canvas.png",
        ],
        desktop,
        compact,
        mobile,
        interactions,
        lessons,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}

const DEFAULT_MODEL = "gpt-4.1-mini";
const MAX_QUESTION_LENGTH = 1200;

const jsonHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
};

function sendJson(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: jsonHeaders,
  });
}

function compactText(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizePayload(body) {
  const question = compactText(body.question).slice(0, MAX_QUESTION_LENGTH);
  const language = body.language === "zh" ? "zh" : "en";
  const cell = body.cell && typeof body.cell === "object" ? body.cell : {};
  const organelle = body.organelle && typeof body.organelle === "object" ? body.organelle : {};
  const comparedCell = body.comparedCell && typeof body.comparedCell === "object" ? body.comparedCell : {};
  const process = body.process && typeof body.process === "object" ? body.process : null;

  return {
    question,
    language,
    cell: {
      name: compactText(cell.name, "Current cell"),
      type: compactText(cell.type),
      occurrence: compactText(cell.occurrence),
    },
    organelle: {
      name: compactText(organelle.name, "Current structure"),
      subtitle: compactText(organelle.subtitle),
      note: compactText(organelle.note),
      fact: compactText(organelle.fact),
      attributes: Array.isArray(organelle.attributes)
        ? organelle.attributes.slice(0, 6).map((item) => ({
            label: compactText(item?.label),
            value: compactText(item?.value),
          }))
        : [],
    },
    comparedCell: {
      name: compactText(comparedCell.name),
      type: compactText(comparedCell.type),
    },
    process: process
      ? {
          title: compactText(process.title),
          summary: compactText(process.summary),
          step:
            process.step && typeof process.step === "object"
              ? {
                  title: compactText(process.step.title),
                  body: compactText(process.step.body),
                  signal: compactText(process.step.signal),
                }
              : null,
        }
      : null,
  };
}

function buildTutorInput(payload) {
  const languageInstruction =
    payload.language === "zh" ? "Answer in concise Simplified Chinese." : "Answer in concise English.";

  return [
    "You are an accurate biology tutor inside an interactive 3D cell learning app.",
    languageInstruction,
    "Use only the provided app context unless you explicitly label a broader biology fact as background knowledge.",
    "Keep the answer practical for a learner looking at the current 3D model.",
    "Include one quick self-check question at the end.",
    "",
    `Student question: ${payload.question}`,
    "",
    "Current app context:",
    JSON.stringify(
      {
        cell: payload.cell,
        organelle: payload.organelle,
        comparedCell: payload.comparedCell,
        process: payload.process,
      },
      null,
      2,
    ),
  ].join("\n");
}

function extractResponseText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const fragments = [];
  for (const item of Array.isArray(data.output) ? data.output : []) {
    for (const content of Array.isArray(item.content) ? item.content : []) {
      if (typeof content.text === "string") {
        fragments.push(content.text);
      }
    }
  }

  return fragments.join("\n").trim();
}

export async function onRequest(context) {
  const { env, request } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  if (request.method !== "POST") {
    return sendJson(405, { error: "Method not allowed" });
  }

  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    return sendJson(503, { error: "Tutor API is not configured", code: "missing_api_key" });
  }

  let payload;
  try {
    payload = normalizePayload(await request.json());
  } catch {
    return sendJson(400, { error: "Invalid JSON body" });
  }

  if (!payload.question) {
    return sendJson(400, { error: "Question is required" });
  }

  const model = env.OPENAI_MODEL || DEFAULT_MODEL;
  const baseUrl = (env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");

  try {
    const upstream = await fetch(`${baseUrl}/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: buildTutorInput(payload),
        max_output_tokens: 650,
        store: false,
      }),
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      return sendJson(502, {
        error: "Tutor API upstream request failed",
        status: upstream.status,
        code: data?.error?.code || data?.error?.type || "upstream_error",
      });
    }

    const answer = extractResponseText(data);
    if (!answer) {
      return sendJson(502, { error: "Tutor API returned an empty answer", code: "empty_answer" });
    }

    return sendJson(200, { answer, source: "api", model });
  } catch {
    return sendJson(502, { error: "Tutor API request failed", code: "request_failed" });
  }
}

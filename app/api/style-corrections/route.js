import { get, put } from "@vercel/blob";

const BLOB_PATHNAME = "style/corrections.json";
const MAX_STORED_CORRECTIONS = 20;
const EMPTY_CORRECTIONS = {
  instagram: [],
  facebook: [],
  actuwp: [],
  agenda: [],
};

function sanitizeCorrectionEntry(entry) {
  if (!entry || typeof entry !== "object") return null;

  const original = String(entry.original || "").trim();
  const corrected = String(entry.corrected || "").trim();

  if (!original || !corrected) return null;

  return { original, corrected };
}

function sanitizeCorrections(payload) {
  const source = payload && typeof payload === "object" ? payload : {};

  return Object.fromEntries(
    Object.keys(EMPTY_CORRECTIONS).map((channelId) => {
      const entries = Array.isArray(source[channelId]) ? source[channelId] : [];
      return [
        channelId,
        entries
          .map(sanitizeCorrectionEntry)
          .filter(Boolean)
          .slice(-MAX_STORED_CORRECTIONS),
      ];
    })
  );
}

async function readCorrections() {
  try {
    const blob = await get(BLOB_PATHNAME, { access: "private" });
    const raw = await blob.text();
    return sanitizeCorrections(JSON.parse(raw));
  } catch (error) {
    if (error?.name === "BlobNotFoundError") {
      return EMPTY_CORRECTIONS;
    }

    throw error;
  }
}

async function writeCorrections(corrections) {
  await put(BLOB_PATHNAME, JSON.stringify(corrections, null, 2), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function GET() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json(
      {
        error:
          "BLOB_READ_WRITE_TOKEN manquant. Configure un store Vercel Blob privé pour persister les corrections.",
      },
      { status: 500 }
    );
  }

  try {
    const corrections = await readCorrections();
    return Response.json(corrections);
  } catch (error) {
    return Response.json(
      {
        error: "Impossible de lire les corrections.",
        details: error?.message || "unknown_error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json(
      {
        error:
          "BLOB_READ_WRITE_TOKEN manquant. Configure un store Vercel Blob privé pour persister les corrections.",
      },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const channelId = String(body?.channelId || "");

    if (!(channelId in EMPTY_CORRECTIONS)) {
      return Response.json({ error: "Canal invalide." }, { status: 400 });
    }

    const entry = sanitizeCorrectionEntry(body);
    if (!entry) {
      return Response.json({ error: "Correction invalide." }, { status: 400 });
    }

    const current = await readCorrections();
    const nextCorrections = {
      ...current,
      [channelId]: [
        ...(current[channelId] || []).filter(
          (item) =>
            item.original !== entry.original || item.corrected !== entry.corrected
        ),
        entry,
      ].slice(-MAX_STORED_CORRECTIONS),
    };

    await writeCorrections(nextCorrections);
    return Response.json(nextCorrections);
  } catch (error) {
    return Response.json(
      {
        error: "Impossible d'enregistrer la correction.",
        details: error?.message || "unknown_error",
      },
      { status: 500 }
    );
  }
}

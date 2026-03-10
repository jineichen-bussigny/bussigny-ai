"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Copy,
  Link as LinkIcon,
  Mail,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Settings2,
  Send,
  Pencil,
  Check,
  X,
} from "lucide-react";
import ImageUploader from "./components/ImageUploader";
import {
  buildPrompt,
  makeDemoResult,
  buildChannelBlocks,
  getSelectedChannelIds,
} from "./lib/content";

const CHANNELS = [
  { id: "instagram", label: "Instagram", handle: "@mybussigny", icon: "📱", color: "#E1306C", bg: "#fff0f5" },
  { id: "facebook", label: "Facebook", handle: "Ville de Bussigny", icon: "📘", color: "#1877F2", bg: "#f0f4ff" },
  { id: "actuwp", label: "ActuApp / WhatsApp", handle: "Bussigny", icon: "📲", color: "#25D366", bg: "#f0fff4" },
  { id: "agenda", label: "Agenda communal", handle: "bussigny.ch", icon: "🗓️", color: "#7C3AED", bg: "#f5f3ff" },
];

const ALL_CANAUX = ["Instagram", "Facebook", "WhatsApp", "Totem"];
const EMAIL_TO = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "communication@bussigny.ch";
const API_ENDPOINT = "/api/analyze-event/openai";
const CORRECTIONS_API_ENDPOINT = "/api/style-corrections";
const MAX_NOTES_LENGTH = 500;
const MAX_STYLE_EXAMPLES = 3;
const EMPTY_CORRECTIONS = {
  instagram: [],
  facebook: [],
  actuwp: [],
  agenda: [],
};

function classNames(...arr) {
  return arr.filter(Boolean).join(" ");
}

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
      return [channelId, entries.map(sanitizeCorrectionEntry).filter(Boolean)];
    })
  );
}

function buildPromptCorrections(corrections) {
  return Object.fromEntries(
    Object.entries(corrections).map(([channelId, entries]) => [
      channelId,
      Array.isArray(entries) ? entries.slice(-MAX_STYLE_EXAMPLES) : [],
    ])
  );
}

async function copyToClipboard(text) {
  const value = String(text || "");

  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return true;
  }

  const ta = document.createElement("textarea");
  ta.value = value;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.top = "0";
  ta.style.left = "0";
  ta.style.width = "1px";
  ta.style.height = "1px";
  ta.style.padding = "0";
  ta.style.border = "none";
  ta.style.outline = "none";
  ta.style.boxShadow = "none";
  ta.style.background = "transparent";
  ta.style.opacity = "0";

  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  ta.setSelectionRange(0, ta.value.length);

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } finally {
    document.body.removeChild(ta);
  }

  if (!copied) throw new Error("copy_failed");
  return true;
}

function CopyButton({ getText }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await copyToClipboard(getText?.() || "");
      setFailed(false);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
      setFailed(true);
      window.setTimeout(() => setFailed(false), 2200);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copié" : failed ? "Échec de la copie" : "Copier le texte"}
      className={classNames(
        "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition",
        copied
          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
          : failed
            ? "border-rose-300 bg-rose-50 text-rose-700"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      )}
      title={failed ? "Copie bloquée par le navigateur" : "Copier le texte"}
    >
      {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copié" : failed ? "Échec" : "Copier"}
    </button>
  );
}

function SendOutlookButton({ to, subject, body }) {
  const handleSend = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const safeTo = encodeURIComponent(to || "");
    const safeSubject = encodeURIComponent(subject || "");
    const safeBody = encodeURIComponent(`${body || ""}\r\n `);

    const outlookWebUrl = `https://outlook.office.com/mail/deeplink/compose?to=${safeTo}&subject=${safeSubject}&body=${safeBody}`;
    const mailtoUrl = `mailto:${to || ""}?subject=${safeSubject}&body=${safeBody}`;

    const popup = window.open(outlookWebUrl, "_blank", "noopener,noreferrer");
    if (!popup) window.location.href = mailtoUrl;
  };

  return (
    <button
      type="button"
      onClick={handleSend}
      className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-medium text-sky-700 transition hover:bg-sky-100"
      title="Ouvrir un nouveau message dans Outlook"
    >
      <Send className="h-4 w-4" />
      Envoyer avec Outlook
    </button>
  );
}

function linkify(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = String(text || "").split(urlRegex);
  return parts.map((part, i) =>
    urlRegex.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-sky-700 underline underline-offset-2"
      >
        {part}
      </a>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

function ChannelCard({ channel, content, exampleCount, onSave }) {
  const showLinks = channel.id === "facebook" || channel.id === "actuwp";
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(content);

  useEffect(() => {
    if (!isEditing) setDraft(content);
  }, [content, isEditing]);

  const handleSave = () => {
    const nextValue = draft.trim();
    if (!nextValue) return;
    onSave(nextValue);
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border p-5 shadow-sm"
      style={{ background: channel.bg, borderColor: `${channel.color}33` }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl" aria-hidden="true">{channel.icon}</div>
          <div>
            <div className="text-sm font-bold" style={{ color: channel.color }}>
              {channel.label}
            </div>
            <div className="text-xs text-slate-500">{channel.handle}</div>
            <div className="mt-1 text-[11px] text-slate-500">
              {exampleCount} exemple{exampleCount > 1 ? "s" : ""} de style mémorisé{exampleCount > 1 ? "s" : ""}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
              >
                <Check className="h-4 w-4" />
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraft(content);
                  setIsEditing(false);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
                Annuler
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" />
                Modifier
              </button>
              <CopyButton getText={() => content} />
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={channel.id === "agenda" ? 10 : 7}
          className="min-h-[160px] w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-800 outline-none transition focus:border-slate-400"
        />
      ) : (
        <div className="min-h-[88px] rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-800 whitespace-pre-wrap">
          {showLinks ? linkify(content) : content}
        </div>
      )}
    </motion.div>
  );
}

function ResultBlock({ title, icon, children, tone = "blue", copyText, actions }) {
  const tones = {
    blue: "border-sky-200 bg-sky-50",
    amber: "border-amber-200 bg-amber-50",
    violet: "border-violet-200 bg-violet-50",
    slate: "border-slate-200 bg-slate-50",
  };

  return (
    <div className={classNames("rounded-3xl border p-5 shadow-sm", tones[tone])}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <span aria-hidden="true">{icon}</span>
          <span>{title}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {copyText ? <CopyButton getText={() => copyText} /> : null}
        </div>
      </div>
      <div className="rounded-2xl border border-white/70 bg-white p-4 text-sm leading-6 text-slate-800 whitespace-pre-wrap">
        {children}
      </div>
    </div>
  );
}

async function readFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) =>
      resolve({
        url: URL.createObjectURL(file),
        base64: e.target.result.split(",")[1],
        mime: file.type || "image/jpeg",
        name: file.name,
      });
    reader.readAsDataURL(file);
  });
}

async function analyzeWithEndpoint({ images, formLink, notes, correctionsByChannel }) {
  const prompt = buildPrompt({
    formLink,
    notes,
    correctionsByChannel: buildPromptCorrections(correctionsByChannel),
  });

  const payload = {
    prompt,
    images: images.map((img) => ({
      mime: img.mime,
      data: img.base64,
      name: img.name,
    })),
  };

  const res = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const errData = await res.json();
      detail = errData.error || errData.details || "";
    } catch {}
    throw new Error(detail || `Erreur HTTP ${res.status}`);
  }

  const data = await res.json();
  if (typeof data === "string") return JSON.parse(data);
  if (data?.content && typeof data.content === "string") return JSON.parse(data.content);
  return data;
}

async function fetchCorrections() {
  const res = await fetch(CORRECTIONS_API_ENDPOINT, { method: "GET" });

  if (!res.ok) {
    let detail = "";
    try {
      const errData = await res.json();
      detail = errData.error || errData.details || "";
    } catch {}
    throw new Error(detail || `Erreur HTTP ${res.status}`);
  }

  return sanitizeCorrections(await res.json());
}

async function saveCorrection(channelId, entry) {
  const res = await fetch(CORRECTIONS_API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      channelId,
      original: entry.original,
      corrected: entry.corrected,
    }),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const errData = await res.json();
      detail = errData.error || errData.details || "";
    } catch {}
    throw new Error(detail || `Erreur HTTP ${res.status}`);
  }

  return sanitizeCorrections(await res.json());
}

export default function App() {
  const [images, setImages] = useState([]);
  const [results, setResults] = useState(null);
  const [originalResults, setOriginalResults] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [eventName, setEventName] = useState("");
  const [agendaMeta, setAgendaMeta] = useState(null);
  const [noteEditoriale, setNoteEditoriale] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [folderLink, setFolderLink] = useState("");
  const [notes, setNotes] = useState("");
  const [formLink, setFormLink] = useState(
    process.env.NEXT_PUBLIC_FORM_URL || "https://forms.clickup.com/2532032/f/2d8p0-51755/07KY4CW36R4HBYOCLC"
  );
  const [canaux, setCanaux] = useState(["Instagram", "Facebook", "WhatsApp", "Totem"]);
  const [mode, setMode] = useState("demo");
  const [corrections, setCorrections] = useState(EMPTY_CORRECTIONS);
  const imagesRef = useRef(images);

  useEffect(() => {
    let active = true;

    fetchCorrections()
      .then((data) => {
        if (active) setCorrections(data);
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Impossible de charger les corrections persistées.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedChannelIds = useMemo(() => new Set(getSelectedChannelIds(canaux)), [canaux]);
  const visibleChannels = useMemo(
    () => CHANNELS.filter((channel) => selectedChannelIds.has(channel.id)),
    [selectedChannelIds]
  );

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => {
        if (image.url) URL.revokeObjectURL(image.url);
      });
    };
  }, []);

  const toggleCanal = (c) => {
    setCanaux((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const handleFilesAdded = useCallback(
    async (validFiles, validationError) => {
      if (!validFiles.length) {
        if (validationError) setError(validationError);
        return;
      }

      const remainingSlots = Math.max(0, 5 - images.length);
      const acceptedFiles = validFiles.slice(0, remainingSlots);
      const skippedCount = validFiles.length - acceptedFiles.length;
      const loaded = await Promise.all(acceptedFiles.map(readFile));

      setResults(null);
      setOriginalResults(null);
      setAnalysis(null);
      setAgendaMeta(null);
      setNoteEditoriale(null);
      setEventName("");
      setImages((prev) => [...prev, ...loaded]);

      const messages = [];
      if (validationError) messages.push(validationError);
      if (!remainingSlots) {
        messages.push("Maximum 5 visuels atteint.");
      } else if (skippedCount > 0) {
        messages.push(
          `${skippedCount} visuel${skippedCount > 1 ? "s ont été ignorés" : " a été ignoré"} : maximum 5 visuels.`
        );
      }

      setError(messages.length ? messages.join("\n") : null);
    },
    [images]
  );

  const removeImage = (i) =>
    setImages((prev) => {
      const image = prev[i];
      if (image?.url) URL.revokeObjectURL(image.url);
      return prev.filter((_, idx) => idx !== i);
    });

  const handleSaveChannelText = useCallback(
    (channelId, correctedText) => {
      setResults((prev) => ({ ...prev, [channelId]: correctedText }));

      const originalText = originalResults?.[channelId] || "";
      if (!originalText || originalText.trim() === correctedText.trim()) return;

      saveCorrection(channelId, {
        original: originalText,
        corrected: correctedText,
      })
        .then((nextCorrections) => {
          setCorrections(nextCorrections);
        })
        .catch((err) => {
          setError(err.message || "Impossible d'enregistrer la correction.");
        });
    },
    [originalResults]
  );

  const handleAnalyze = async () => {
    if (!images.length) return;
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const parsed =
        mode === "demo"
          ? makeDemoResult({ notes, formLink, canaux })
          : await analyzeWithEndpoint({ images, formLink, notes, correctionsByChannel: corrections });

      const nextResults = {
        instagram: parsed.instagram || "",
        facebook: parsed.facebook || "",
        actuwp: parsed.actuwp || "",
        agenda: parsed.agenda || "",
      };

      setEventName(parsed.eventName || "");
      setAnalysis(parsed.analyse || parsed.analysis || "");
      setResults(nextResults);
      setOriginalResults(nextResults);
      setAgendaMeta(parsed.agendaMeta || null);
      setNoteEditoriale(parsed.noteEditoriale || parsed.recommandations || parsed.recommendations || "");
    } catch (e) {
      setError(
        mode === "demo"
          ? "Erreur lors de l'analyse en mode démo."
          : e.message || "Impossible d'appeler l'API OpenAI."
      );
    } finally {
      setLoading(false);
    }
  };

  const emailSubject = `${eventName || "Événement"} - Diffusion multicanaux`;

  const buildEmailBody = useCallback(() => {
    if (!results) return "";
    const blocks = buildChannelBlocks({ results, canaux, folderLink });
    return `Bonjour Célia,

Voici les textes prêts à publier pour « ${eventName || "cet événement"} » :

${blocks}
---
Canaux : ${canaux.join(", ")}

Pourras-tu me communiquer le planning de publication prévu pour ces canaux ?

Merci et bonne journée,
Julien`;
  }, [results, canaux, eventName, folderLink]);

  const buildEmail = useCallback(() => {
    if (!results) return "";
    const blocks = buildChannelBlocks({ results, canaux, folderLink });
    return `À : ${EMAIL_TO}
Objet : ${emailSubject}
Canaux : ${canaux.join(", ")}

Bonjour Célia,

Voici les textes prêts à publier pour « ${eventName || "cet événement"} » :

${blocks}
---

Pourras-tu me communiquer le planning de publication prévu pour ces canaux ?

Merci et bonne journée,
Julien`;
  }, [results, canaux, emailSubject, eventName, folderLink]);

  const stats = useMemo(
    () => [
      { label: "Visuels", value: String(images.length) },
      { label: "Canaux", value: String(canaux.length) },
      { label: "Mode", value: mode === "demo" ? "Démo" : "API" },
      { label: "IA", value: "ChatGPT" },
    ],
    [images.length, canaux.length, mode]
  );

  const totalStoredExamples = useMemo(
    () => Object.values(corrections).reduce((sum, entries) => sum + entries.length, 0),
    [corrections]
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[28px] bg-slate-900 p-6 text-white shadow-xl md:p-8"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Bussigny · Générateur multicanal
            </div>
            <h1 className="max-w-xl text-3xl font-bold tracking-tight md:text-4xl">
              Transforme des affiches en textes prêts à diffuser.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
              Dépose un ou plusieurs visuels d&apos;événement, choisis les canaux cibles et génère automatiquement les textes adaptés à chaque plateforme.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              {stats.map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                  <div className="text-2xl font-bold">{item.value}</div>
                  <div className="text-xs uppercase tracking-wide text-slate-300">{item.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8"
          >
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Settings2 className="h-4 w-4" aria-hidden="true" />
              Configuration
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-600">Mode d&apos;analyse</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "demo", label: "Démo locale" },
                    { id: "api", label: "Endpoint API" },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setMode(opt.id)}
                      aria-pressed={mode === opt.id}
                      className={classNames(
                        "rounded-2xl border px-4 py-3 text-sm font-medium transition",
                        mode === opt.id
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
                En mode démo, l&apos;application génère un résultat réaliste sans appeler de modèle externe. En mode API, ChatGPT analyse les visuels et produit les textes via l&apos;endpoint sécurisé.
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-700">
                {totalStoredExamples
                  ? `${totalStoredExamples} correction${totalStoredExamples > 1 ? "s" : ""} persistée${totalStoredExamples > 1 ? "s" : ""}. Les ${MAX_STYLE_EXAMPLES} plus récentes par canal sont injectées dans le prompt API.`
                  : "Aucune correction persistée pour le moment. Modifie un texte généré puis enregistre-le pour enrichir le prochain prompt API."}
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 text-sm font-semibold text-slate-800">📢 Canaux de diffusion</div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Sélection des canaux">
                {ALL_CANAUX.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => toggleCanal(c)}
                    aria-pressed={canaux.includes(c)}
                    className={classNames(
                      "rounded-full border px-4 py-2 text-sm transition",
                      canaux.includes(c)
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    {canaux.includes(c) ? "✓ " : ""}
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="grid gap-4">
                <div>
                  <label htmlFor="formLink" className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-600">
                    <LinkIcon className="h-4 w-4" aria-hidden="true" />
                    Lien formulaire
                  </label>
                  <input
                    id="formLink"
                    type="url"
                    value={formLink}
                    onChange={(e) => setFormLink(e.target.value)}
                    placeholder="https://forms.clickup.com/..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </div>

                <div>
                  <label htmlFor="folderLink" className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-600">
                    <ImageIcon className="h-4 w-4" aria-hidden="true" />
                    Lien dossier visuels
                  </label>
                  <input
                    id="folderLink"
                    type="url"
                    value={folderLink}
                    onChange={(e) => setFolderLink(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="mb-2 flex items-center justify-between text-xs font-medium text-slate-600">
                    <span>📝 Notes contextuelles</span>
                    <span className={classNames("tabular-nums", notes.length > MAX_NOTES_LENGTH * 0.9 ? "text-amber-600" : "text-slate-400")}>
                      {notes.length}/{MAX_NOTES_LENGTH}
                    </span>
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={MAX_NOTES_LENGTH}
                    rows={4}
                    placeholder="Ex : Organisé par la commission intégration - mettre en avant le caractère familial et l'inscription au formulaire"
                    className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none transition focus:border-slate-400"
                  />
                </div>
              </div>
            </div>

            <ImageUploader
              images={images}
              onFilesAdded={handleFilesAdded}
              onRemoveImage={removeImage}
              onAnalyze={handleAnalyze}
              loading={loading}
            />
          </div>

          <div className="space-y-6">
            {error ? (
              <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 shadow-sm" role="alert">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                  Erreur
                </div>
                <div className="mt-2 leading-6 whitespace-pre-wrap">{error}</div>
              </div>
            ) : null}

            {analysis ? (
              <ResultBlock title="Extraction de l'affiche" icon="🔍" tone="amber">
                {analysis}
              </ResultBlock>
            ) : (
              <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <Sparkles className="h-6 w-6 text-slate-500" aria-hidden="true" />
                </div>
                <div className="text-base font-semibold text-slate-800">Les résultats apparaîtront ici</div>
                <div className="mt-2 text-sm leading-6 text-slate-500">
                  Charge un ou plusieurs visuels, puis lance l&apos;analyse pour générer les textes par canal.
                </div>
              </div>
            )}

            {results
              ? visibleChannels.map((channel) => (
                  <ChannelCard
                    key={channel.id}
                    channel={channel}
                    content={results[channel.id]}
                    exampleCount={corrections[channel.id]?.length || 0}
                    onSave={(value) => handleSaveChannelText(channel.id, value)}
                  />
                ))
              : null}

            {results && canaux.includes("Totem") ? (
              <ResultBlock title="Totem" icon="🖥️" tone="slate">
                Pas de texte - diffusion du visuel au format affiche uniquement.
              </ResultBlock>
            ) : null}

            {results ? (
              <ResultBlock
                title="Brouillon email - Célia"
                icon={<Mail className="h-4 w-4" aria-hidden="true" />}
                tone="blue"
                copyText={buildEmail()}
                actions={
                  <SendOutlookButton
                    to={EMAIL_TO}
                    subject={emailSubject}
                    body={buildEmailBody()}
                  />
                }
              >
                {linkify(buildEmail())}
              </ResultBlock>
            ) : null}

            {agendaMeta && selectedChannelIds.has("agenda") ? (
              <ResultBlock title="Métadonnées agenda CMS" icon="🗂️" tone="slate">
                {`Catégorie : ${agendaMeta.categorie}\nQuand : ${agendaMeta.quand}\nOù : ${agendaMeta.ou}`}
              </ResultBlock>
            ) : null}

            {noteEditoriale ? (
              <ResultBlock title="Note éditoriale" icon="💡" tone="violet">
                {noteEditoriale}
              </ResultBlock>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

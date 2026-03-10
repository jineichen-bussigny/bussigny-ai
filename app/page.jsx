"use client";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, Sparkles, Copy, Trash2, Link as LinkIcon, Mail, Image as ImageIcon, CheckCircle2, AlertCircle, Settings2, Send } from "lucide-react";

const CHANNELS = [
  { id: "instagram", label: "Instagram", handle: "@mybussigny", icon: "📱", color: "#E1306C", bg: "#fff0f5" },
  { id: "facebook", label: "Facebook", handle: "Ville de Bussigny", icon: "📘", color: "#1877F2", bg: "#f0f4ff" },
  { id: "actuwp", label: "ActuApp / WhatsApp", handle: "Bussigny", icon: "📲", color: "#25D366", bg: "#f0fff4" },
];

const ALL_CANAUX = ["Instagram", "Facebook", "WhatsApp", "Totem"];
const EMAIL_TO = "communication@bussigny.ch";
const AI_PROVIDERS = [
  { id: "openai", label: "ChatGPT / OpenAI" },
  { id: "anthropic", label: "Claude / Anthropic" },
];

function classNames(...arr) {
  return arr.filter(Boolean).join(" ");
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

  if (!copied) {
    throw new Error("copy_failed");
  }

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

    if (!popup) {
      window.location.href = mailtoUrl;
    }
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

function ChannelCard({ channel, content }) {
  const showLinks = channel.id === "facebook" || channel.id === "actuwp";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border p-5 shadow-sm"
      style={{ background: channel.bg, borderColor: `${channel.color}33` }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{channel.icon}</div>
          <div>
            <div className="text-sm font-bold" style={{ color: channel.color }}>
              {channel.label}
            </div>
            <div className="text-xs text-slate-500">{channel.handle}</div>
          </div>
        </div>
        <CopyButton getText={() => content} />
      </div>

      <div className="min-h-[88px] rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-800 whitespace-pre-wrap">
        {showLinks ? linkify(content) : content}
      </div>
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
          <span>{icon}</span>
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

function buildPrompt({ formLink, notes }) {
  return `Tu es community manager de la Commune de Bussigny (canton de Vaud, Suisse).
Analyse ces visuels d'événement communal (plusieurs versions du même événement) et réponds UNIQUEMENT en JSON valide, sans balises markdown.

Format exact attendu :
{
  "eventName": "Nom court de l'événement",
  "analyse": "Résumé court de l'événement en 2-3 phrases",
  "instagram": "Texte Instagram complet avec emojis et hashtags",
  "facebook": "Texte Facebook complet avec le lien formulaire : ${formLink || "[LIEN FORMULAIRE]"}",
  "actuwp": "TITRE: [max 60 car.]\\nMESSAGE: [max 160 car., inclure le lien : ${formLink || "[LIEN FORMULAIRE]"}]",
  "recommandations": "3 recommandations courtes : meilleur moment de publication par canal + 1 idée contenu complémentaire"
}

Règles par canal :
- Instagram : accroche forte ligne 1, max 5 lignes avant \"voir plus\", 1-2 emojis, call-to-action \"Lien en bio\", 5 hashtags (#Bussigny #VaudAgenda + thématiques)
- Facebook : 100-250 caractères, ton informatif et proche, toutes infos clés, max 1 emoji, inclure le lien formulaire en fin de texte
- ActuApp/WhatsApp : titre max 60 car., message max 160 car., ton officiel et direct, inclure le lien formulaire
- Langue : français
${notes ? `\nInformations contextuelles à intégrer impérativement dans les textes :\n${notes}` : ""}`;
}

function makeDemoResult({ notes, formLink, canaux }) {
  const date = new Date().toLocaleDateString("fr-CH", { day: "2-digit", month: "long" });
  const hasTotem = canaux.includes("Totem");
  return {
    eventName: "Événement communal",
    analyse:
      "Le visuel annonce un événement communal destiné aux habitantes et habitants de Bussigny. Le ton est convivial et accessible, avec un objectif d'information et de mobilisation.",
    instagram:
      `🎉 Un moment à partager à Bussigny\n\nRendez-vous bientôt pour un événement convivial ouvert à toutes et tous. Découvrez le programme, participez et venez profiter d'un beau moment en commun.\n\nLien en bio.\n\n#Bussigny #VaudAgenda #VieLocale #Événement #Commune`,
    facebook:
      `La Commune de Bussigny vous donne rendez-vous pour un événement ouvert à toutes et tous ${date}. Retrouvez les informations pratiques et inscrivez-vous ici : ${formLink || "[LIEN FORMULAIRE]"}`,
    actuwp:
      `TITRE: Événement communal à Bussigny\nMESSAGE: Retrouvez prochainement un moment convivial pour toutes et tous. Infos et inscription : ${formLink || "[LIEN FORMULAIRE]"}`,
    recommandations:
      `• Instagram : publier entre 11h30 et 13h ou vers 18h\n• Facebook : publier en début de semaine entre 8h et 9h\n• WhatsApp / ActuApp : envoyer 3 à 5 jours avant l'événement\n• Idée complémentaire : prévoir une story coulisses ou une photo du montage${hasTotem ? "\n• Totem : garder uniquement le visuel principal, sans surcharge textuelle" : ""}${notes ? `\n• Notes intégrées : ${notes}` : ""}`,
  };
}

async function analyzeWithEndpoint({ images, formLink, notes, endpoint, provider }) {
  const prompt = buildPrompt({ formLink, notes });

  const payload = {
    provider,
    prompt,
    images: images.map((img) => ({
      mime: img.mime,
      data: img.base64,
      name: img.name,
    })),
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const data = await res.json();

  if (typeof data === "string") {
    return JSON.parse(data);
  }

  if (data?.content && typeof data.content === "string") {
    return JSON.parse(data.content);
  }

  return data;
}

export default function App() {
  const [images, setImages] = useState([]);
  const [results, setResults] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [eventName, setEventName] = useState("");
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [folderLink, setFolderLink] = useState("");
  const [notes, setNotes] = useState("");
  const [formLink, setFormLink] = useState("https://forms.clickup.com/2532032/f/2d8p0-51755/07KY4CW36R4HBYOCLC");
  const [canaux, setCanaux] = useState(["Instagram", "Facebook", "WhatsApp", "Totem"]);
  const [mode, setMode] = useState("demo");
  const [provider, setProvider] = useState("openai");
  const [apiEndpoint, setApiEndpoint] = useState("/api/analyze-event/openai");
  const fileInputRef = useRef(null);

  const toggleCanal = (c) => {
    setCanaux((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const readFile = (file) =>
    new Promise((resolve) => {
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

  const handleFiles = useCallback(async (files) => {
    const valid = Array.from(files || []).filter((f) => f.type.startsWith("image/"));
    if (!valid.length) return;
    const loaded = await Promise.all(valid.map(readFile));
    setImages((prev) => [...prev, ...loaded].slice(0, 5));
    setResults(null);
    setAnalysis(null);
    setRecommendations(null);
    setError(null);
    setEventName("");
  }, []);

  const removeImage = (i) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleAnalyze = async () => {
    if (!images.length) return;
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const parsed =
        mode === "demo"
          ? makeDemoResult({ notes, formLink, canaux })
          : await analyzeWithEndpoint({
              images,
              formLink,
              notes,
              endpoint: apiEndpoint,
              provider,
            });

      setEventName(parsed.eventName || "");
      setAnalysis(parsed.analyse || parsed.analysis || "");
      setResults({
        instagram: parsed.instagram || "",
        facebook: parsed.facebook || "",
        actuwp: parsed.actuwp || "",
      });
      setRecommendations(parsed.recommandations || parsed.recommendations || "");
    } catch (e) {
      setError(
        mode === "demo"
          ? "Erreur lors de l'analyse en mode démo."
          : `Impossible d'appeler l'API ${provider === "openai" ? "OpenAI" : "Anthropic"}. Branche un endpoint serveur qui reçoit les images et renvoie le JSON attendu.`
      );
    } finally {
      setLoading(false);
    }
  };

  const emailSubject = `${eventName || "Événement"} — Diffusion multicanaux`;

  const buildEmail = useCallback(() => {
    if (!results) return "";
    const canauxStr = canaux.join(", ");
    const totemNote = canaux.includes("Totem")
      ? "\n---\n🖥️ TOTEM (affichage digital)\nPas de texte — diffusion du visuel au format affiche.\n"
      : "";

    return `À : ${EMAIL_TO}
Objet : ${emailSubject}
Canaux : ${canauxStr}

Bonjour Célia,

Voici les textes prêts à publier pour « ${eventName || "cet événement"} » :

---
📱 INSTAGRAM (@mybussigny)
${results.instagram}

---
📘 FACEBOOK (Ville de Bussigny)
${results.facebook}

---
📲 ACTUAPP / WHATSAPP
${results.actuwp}
${totemNote}${folderLink ? `\n---\n📁 Dossier des visuels : ${folderLink}\n` : ""}
---

Pourras-tu me communiquer le planning de publication prévu pour ces canaux ?

Merci et bonne journée,
Julien`;
  }, [results, canaux, eventName, folderLink, emailSubject]);

  const buildEmailBody = useCallback(() => {
    if (!results) return "";
    const canauxStr = canaux.join(", ");
    const totemNote = canaux.includes("Totem")
      ? "\n---\n🖥️ TOTEM (affichage digital)\nPas de texte — diffusion du visuel au format affiche.\n"
      : "";

    return `Bonjour Célia,

Voici les textes prêts à publier pour « ${eventName || "cet événement"} » :

---
📱 INSTAGRAM (@mybussigny)
${results.instagram}

---
📘 FACEBOOK (Ville de Bussigny)
${results.facebook}

---
📲 ACTUAPP / WHATSAPP
${results.actuwp}
${totemNote}${folderLink ? `\n---\n📁 Dossier des visuels : ${folderLink}\n` : ""}
---
Canaux : ${canauxStr}

Pourras-tu me communiquer le planning de publication prévu pour ces canaux ?

Merci et bonne journée,
Julien`;
  }, [results, canaux, eventName, folderLink]);

  const stats = useMemo(
    () => [
      { label: "Visuels", value: String(images.length) },
      { label: "Canaux", value: String(canaux.length) },
      { label: "Mode", value: mode === "demo" ? "Démo" : "API" },
      { label: "IA", value: provider === "openai" ? "ChatGPT" : "Claude" },
    ],
    [images.length, canaux.length, mode, provider]
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] bg-slate-900 p-6 text-white shadow-xl md:p-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Bussigny · Générateur multicanal
            </div>
            <h1 className="max-w-xl text-3xl font-bold tracking-tight md:text-4xl">
              Transforme des affiches en textes prêts à diffuser.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
              Cette version est prête pour une démo dans le canvas. En mode API, tu peux maintenant la brancher aussi bien à ChatGPT qu'à Claude via un endpoint backend.
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

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Settings2 className="h-4 w-4" />
              Configuration
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-600">Mode d'analyse</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "demo", label: "Démo locale" },
                    { id: "api", label: "Endpoint API" },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setMode(opt.id)}
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

              {mode === "api" ? (
                <>
                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-600">IA utilisée</label>
                  <div className="grid grid-cols-2 gap-2">
                    {AI_PROVIDERS.map((opt) => (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => {
                          setProvider(opt.id);
                          setApiEndpoint(opt.id === "openai" ? "/api/analyze-event/openai" : "/api/analyze-event/anthropic");
                        }}
                        className={classNames(
                          "rounded-2xl border px-4 py-3 text-sm font-medium transition",
                          provider === opt.id
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-600">Endpoint serveur</label>
                  <input
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    placeholder="/api/analyze-event"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none ring-0 transition focus:border-slate-400"
                  />
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    L'appel direct à l'API depuis le navigateur n'est pas recommandé. OpenAI comme Anthropic demandent de garder la clé côté serveur. Passe par un backend pour protéger la clé API et contourner les limites CORS.
                  </p>
                </div>
                </>
              ) : null}

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
                En mode démo, l'application génère un résultat réaliste sans appeler de modèle externe. En mode API, tu peux utiliser ChatGPT ou Claude pour analyser les visuels et produire les textes.
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 text-sm font-semibold text-slate-800">📢 Canaux de diffusion</div>
              <div className="flex flex-wrap gap-2">
                {ALL_CANAUX.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => toggleCanal(c)}
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
                  <label className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-600">
                    <LinkIcon className="h-4 w-4" />
                    Lien formulaire
                  </label>
                  <input
                    type="url"
                    value={formLink}
                    onChange={(e) => setFormLink(e.target.value)}
                    placeholder="https://forms.clickup.com/..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-600">
                    <ImageIcon className="h-4 w-4" />
                    Lien dossier visuels
                  </label>
                  <input
                    type="url"
                    value={folderLink}
                    onChange={(e) => setFolderLink(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-600">📝 Notes contextuelles</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder={'Ex : Organisé par la commission intégration — mettre en avant le caractère familial et l\'inscription au formulaire'}
                    className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none transition focus:border-slate-400"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={classNames(
                  "cursor-pointer rounded-[24px] border-2 border-dashed p-6 text-center transition",
                  dragOver ? "border-slate-800 bg-slate-50" : "border-slate-300 bg-slate-50/50"
                )}
              >
                {images.length ? (
                  <div>
                    <div className="mb-4 flex flex-wrap justify-center gap-3">
                      {images.map((img, i) => (
                        <div key={`${img.name}-${i}`} className="relative">
                          <img src={img.url} alt={img.name} className="h-24 w-24 rounded-2xl border border-slate-200 object-cover shadow-sm" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(i);
                            }}
                            className="absolute -right-2 -top-2 rounded-full bg-rose-500 p-1 text-white shadow"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <div className="mt-2 max-w-24 truncate text-[11px] text-slate-500">{img.name}</div>
                        </div>
                      ))}
                    </div>
                    <div className="text-sm font-medium text-slate-700">
                      {images.length} visuel{images.length > 1 ? "s" : ""} chargé{images.length > 1 ? "s" : ""}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Cliquer ou glisser-déposer pour en ajouter d'autres</div>
                  </div>
                ) : (
                  <div className="py-6">
                    <Upload className="mx-auto mb-3 h-10 w-10 text-slate-400" />
                    <div className="text-base font-semibold text-slate-800">Dépose tes affiches ou flyers ici</div>
                    <div className="mt-1 text-sm text-slate-500">JPG, PNG, WEBP — jusqu'à 5 visuels</div>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />

              {images.length ? (
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  <Sparkles className="h-4 w-4" />
                  {loading ? "Analyse en cours..." : `Analyser ${images.length} visuel${images.length > 1 ? "s" : ""}`}
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-6">
            {error ? (
              <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 shadow-sm">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="h-4 w-4" />
                  Erreur
                </div>
                <div className="mt-2 leading-6">{error}</div>
              </div>
            ) : null}

            {analysis ? (
              <ResultBlock title="Analyse de l'événement" icon="🔍" tone="amber">
                {analysis}
              </ResultBlock>
            ) : (
              <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <Sparkles className="h-6 w-6 text-slate-500" />
                </div>
                <div className="text-base font-semibold text-slate-800">Les résultats apparaîtront ici</div>
                <div className="mt-2 text-sm leading-6 text-slate-500">
                  Charge un ou plusieurs visuels, puis lance l'analyse pour générer les textes par canal.
                </div>
              </div>
            )}

            {results ? CHANNELS.map((ch) => <ChannelCard key={ch.id} channel={ch} content={results[ch.id]} />) : null}

            {results && canaux.includes("Totem") ? (
              <ResultBlock title="Totem" icon="🖥️" tone="slate">
                Pas de texte — diffusion du visuel au format affiche uniquement.
              </ResultBlock>
            ) : null}

            {results ? (
              <ResultBlock
                title="Brouillon email — Célia"
                icon={<Mail className="h-4 w-4" />}
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

            {recommendations ? (
              <ResultBlock title="Recommandations" icon="💡" tone="violet">
                {recommendations}
              </ResultBlock>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

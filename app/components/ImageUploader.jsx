"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, Trash2, Sparkles } from "lucide-react";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGES = 5;

function classNames(...arr) {
  return arr.filter(Boolean).join(" ");
}

export default function ImageUploader({ images, onFilesAdded, onRemoveImage, onAnalyze, loading }) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const processFiles = useCallback(
    (files) => {
      const errors = [];
      const valid = [];

      for (const file of Array.from(files || [])) {
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          errors.push(`"${file.name}" ignoré : format non supporté (JPG, PNG, WEBP uniquement)`);
          continue;
        }
        if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
          errors.push(`"${file.name}" ignoré : fichier trop lourd (max ${MAX_IMAGE_SIZE_MB} Mo)`);
          continue;
        }
        valid.push(file);
      }

      onFilesAdded(valid, errors.length ? errors.join("\n") : null);
    },
    [onFilesAdded]
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processFiles(e.dataTransfer.files);
  };

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label="Zone de dépôt d'images — cliquer ou glisser-déposer"
        onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
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
                  <img
                    src={img.url}
                    alt={img.name}
                    className="h-24 w-24 rounded-2xl border border-slate-200 object-cover shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveImage(i);
                    }}
                    aria-label={`Supprimer ${img.name}`}
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
            <div className="mt-1 text-xs text-slate-500">
              {images.length < MAX_IMAGES
                ? "Cliquer ou glisser-déposer pour en ajouter d'autres"
                : `Maximum ${MAX_IMAGES} visuels atteint`}
            </div>
          </div>
        ) : (
          <div className="py-6">
            <Upload className="mx-auto mb-3 h-10 w-10 text-slate-400" />
            <div className="text-base font-semibold text-slate-800">Dépose tes affiches ou flyers ici</div>
            <div className="mt-1 text-sm text-slate-500">
              JPG, PNG, WEBP — jusqu'à {MAX_IMAGES} visuels, max {MAX_IMAGE_SIZE_MB} Mo chacun
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ALLOWED_MIME_TYPES.join(",")}
        className="hidden"
        aria-hidden="true"
        onChange={(e) => processFiles(e.target.files)}
      />

      {images.length ? (
        <button
          type="button"
          onClick={onAnalyze}
          disabled={loading}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          <Sparkles className="h-4 w-4" />
          {loading
            ? "Analyse en cours..."
            : `Analyser ${images.length} visuel${images.length > 1 ? "s" : ""}`}
        </button>
      ) : null}
    </div>
  );
}

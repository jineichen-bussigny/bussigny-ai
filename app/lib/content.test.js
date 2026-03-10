import { describe, it, expect } from "vitest";
import { buildChannelBlocks, buildPrompt, makeDemoResult } from "./content.js";

const SAMPLE_RESULTS = {
  instagram: "Texte Instagram de test",
  facebook: "Texte Facebook de test",
  actuwp: "Texte WhatsApp de test",
  agenda: "Texte agenda de test",
};

// ---------------------------------------------------------------------------
// buildChannelBlocks
// ---------------------------------------------------------------------------

describe("buildChannelBlocks", () => {
  it("contient tous les en-têtes de canaux", () => {
    const out = buildChannelBlocks({ results: SAMPLE_RESULTS, canaux: [], folderLink: "" });
    expect(out).toContain("INSTAGRAM");
    expect(out).toContain("FACEBOOK");
    expect(out).toContain("ACTUAPP");
    expect(out).toContain("AGENDA COMMUNAL");
  });

  it("intègre le contenu de chaque canal", () => {
    const out = buildChannelBlocks({ results: SAMPLE_RESULTS, canaux: [], folderLink: "" });
    expect(out).toContain(SAMPLE_RESULTS.instagram);
    expect(out).toContain(SAMPLE_RESULTS.facebook);
    expect(out).toContain(SAMPLE_RESULTS.actuwp);
    expect(out).toContain(SAMPLE_RESULTS.agenda);
  });

  it("ajoute la note Totem si le canal est activé", () => {
    const out = buildChannelBlocks({ results: SAMPLE_RESULTS, canaux: ["Totem"], folderLink: "" });
    expect(out).toContain("TOTEM");
    expect(out).toContain("diffusion du visuel");
  });

  it("n'ajoute pas de note Totem si le canal est désactivé", () => {
    const out = buildChannelBlocks({ results: SAMPLE_RESULTS, canaux: [], folderLink: "" });
    expect(out).not.toContain("TOTEM");
  });

  it("ajoute le lien dossier si fourni", () => {
    const out = buildChannelBlocks({
      results: SAMPLE_RESULTS,
      canaux: [],
      folderLink: "https://drive.google.com/test",
    });
    expect(out).toContain("https://drive.google.com/test");
    expect(out).toContain("Dossier des visuels");
  });

  it("n'ajoute pas de section dossier si le lien est vide", () => {
    const out = buildChannelBlocks({ results: SAMPLE_RESULTS, canaux: [], folderLink: "" });
    expect(out).not.toContain("Dossier des visuels");
  });
});

// ---------------------------------------------------------------------------
// buildPrompt
// ---------------------------------------------------------------------------

describe("buildPrompt", () => {
  it("mentionne Bussigny dans le prompt", () => {
    const prompt = buildPrompt({ formLink: "", notes: "" });
    expect(prompt).toContain("Bussigny");
  });

  it("intègre le lien formulaire dans le prompt", () => {
    const prompt = buildPrompt({ formLink: "https://example.com/form", notes: "" });
    expect(prompt).toContain("https://example.com/form");
  });

  it("indique l'absence de lien si formLink est vide", () => {
    const prompt = buildPrompt({ formLink: "", notes: "" });
    expect(prompt).toContain("Aucun lien d'inscription");
  });

  it("intègre les notes contextuelles", () => {
    const prompt = buildPrompt({ formLink: "", notes: "Organisé par la commission sport" });
    expect(prompt).toContain("Organisé par la commission sport");
    expect(prompt).toContain("Informations contextuelles");
  });

  it("n'inclut pas la section notes si vide", () => {
    const prompt = buildPrompt({ formLink: "", notes: "" });
    expect(prompt).not.toContain("Informations contextuelles");
  });

  it("définit les 3 étapes du prompt", () => {
    const prompt = buildPrompt({ formLink: "", notes: "" });
    expect(prompt).toContain("ÉTAPE 1");
    expect(prompt).toContain("ÉTAPE 2");
    expect(prompt).toContain("ÉTAPE 3");
  });

  it("définit les 4 formats de sortie", () => {
    const prompt = buildPrompt({ formLink: "", notes: "" });
    expect(prompt).toContain("FORMAT 1");
    expect(prompt).toContain("FORMAT 2");
    expect(prompt).toContain("FORMAT 3");
    expect(prompt).toContain("FORMAT 4");
  });

  it("demande le champ agendaMeta dans le JSON", () => {
    const prompt = buildPrompt({ formLink: "", notes: "" });
    expect(prompt).toContain("agendaMeta");
    expect(prompt).toContain("noteEditoriale");
  });
});

// ---------------------------------------------------------------------------
// makeDemoResult
// ---------------------------------------------------------------------------

describe("makeDemoResult", () => {
  it("retourne tous les champs attendus", () => {
    const result = makeDemoResult({ notes: "", formLink: "", canaux: [] });
    expect(result).toHaveProperty("eventName");
    expect(result).toHaveProperty("analyse");
    expect(result).toHaveProperty("instagram");
    expect(result).toHaveProperty("facebook");
    expect(result).toHaveProperty("actuwp");
    expect(result).toHaveProperty("agenda");
    expect(result).toHaveProperty("agendaMeta");
    expect(result).toHaveProperty("noteEditoriale");
  });

  it("retourne des métadonnées agenda structurées", () => {
    const result = makeDemoResult({ notes: "", formLink: "", canaux: [] });
    expect(result.agendaMeta).toHaveProperty("categorie");
    expect(result.agendaMeta).toHaveProperty("quand");
    expect(result.agendaMeta).toHaveProperty("ou");
  });

  it("intègre le formLink dans facebook et actuwp", () => {
    const result = makeDemoResult({ notes: "", formLink: "https://forms.example.com", canaux: [] });
    expect(result.facebook).toContain("https://forms.example.com");
    expect(result.actuwp).toContain("https://forms.example.com");
  });

  it("utilise le placeholder si formLink est vide", () => {
    const result = makeDemoResult({ notes: "", formLink: "", canaux: [] });
    expect(result.facebook).toContain("[LIEN FORMULAIRE]");
  });

  it("mentionne Totem dans la note éditoriale si activé", () => {
    const result = makeDemoResult({ notes: "", formLink: "", canaux: ["Totem"] });
    expect(result.noteEditoriale).toContain("Totem");
  });

  it("ne mentionne pas Totem dans la note éditoriale si désactivé", () => {
    const result = makeDemoResult({ notes: "", formLink: "", canaux: [] });
    expect(result.noteEditoriale).not.toContain("Totem");
  });

  it("intègre les notes dans la note éditoriale", () => {
    const result = makeDemoResult({ notes: "Note importante", formLink: "", canaux: [] });
    expect(result.noteEditoriale).toContain("Note importante");
  });
});

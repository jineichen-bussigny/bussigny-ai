/**
 * Fonctions pures de génération de contenu.
 * Isolées ici pour être testables indépendamment de React.
 */

const CHANNEL_BLOCKS = [
  {
    id: "instagram",
    title: "📱 INSTAGRAM (@mybussigny)",
    getContent: (results) => results.instagram,
  },
  {
    id: "facebook",
    title: "📘 FACEBOOK (Ville de Bussigny)",
    getContent: (results) => results.facebook,
  },
  {
    id: "actuwp",
    title: "📲 ACTUAPP / WHATSAPP",
    getContent: (results) => results.actuwp,
  },
  {
    id: "agenda",
    title: "🗓️ AGENDA COMMUNAL (bussigny.ch)",
    getContent: (results) => results.agenda,
  },
];

const CANAL_TO_RESULT_KEY = {
  Instagram: "instagram",
  Facebook: "facebook",
  WhatsApp: "actuwp",
  Agenda: "agenda",
};

const CHANNEL_LABELS = {
  instagram: "Instagram",
  facebook: "Facebook",
  actuwp: "ActuApp / WhatsApp",
  agenda: "Agenda communal",
};

function buildCorrectionsSection(correctionsByChannel = {}) {
  const sections = Object.entries(correctionsByChannel)
    .map(([channelId, entries]) => {
      const safeEntries = Array.isArray(entries) ? entries.slice(-3) : [];
      if (!safeEntries.length) return "";

      const examples = safeEntries
        .map(
          (entry, index) =>
            `Exemple ${index + 1}\n- Proposition IA : ${entry.original}\n- Version corrigée : ${entry.corrected}`
        )
        .join("\n");

      return `### ${CHANNEL_LABELS[channelId] || channelId}\n${examples}`;
    })
    .filter(Boolean);

  if (!sections.length) return "";

  return `\n---\n\n## RÉFÉRENCES STYLISTIQUES ISSUES DE CORRECTIONS HUMAINES\n\nUtilise ces corrections récentes pour te rapprocher du ton attendu. Ne copie pas mot à mot si le contexte change, mais reproduis le niveau d'institutionnalité, le rythme et les formulations utiles.\n\n${sections.join("\n\n")}`;
}

export function buildPrompt({ formLink, notes, correctionsByChannel = {} }) {
  const formLinkInstruction = formLink
    ? `Le lien d'inscription / de contact à utiliser est : ${formLink}`
    : "Aucun lien d'inscription n'a été fourni - ne pas en inventer.";

  const correctionsSection = buildCorrectionsSection(correctionsByChannel);

  return `Tu es un expert en communication institutionnelle municipale et en rédaction multicanal pour les collectivités publiques suisses francophones.

Réponds UNIQUEMENT en JSON valide, sans balises markdown, en respectant exactement le format défini à l'étape 3.

---

## ÉTAPE 1 - ANALYSE DE L'AFFICHE

Analyse l'image fournie et extrais systématiquement les informations suivantes.
Si une information est absente ou illisible, indique "non mentionné".

**Informations factuelles :**
- Nom de l'événement
- Date(s) et heure(s)
- Lieu (nom + adresse si disponible)
- Option météo / plan B si mentionné
- Organisateur(s)
- Public cible (tous publics / seniors / enfants / habitants / etc.)
- Conditions de participation (inscription, tarif, restrictions)
- Contact / lien d'inscription
- Informations pratiques spécifiques (matériel, règles, avantages offerts)
- Ambiance visuelle et tonalité du graphisme (couleurs, style, registre)

---

## ÉTAPE 2 - RÉDACTION DES 4 FORMATS

En te basant UNIQUEMENT sur les informations extraites à l'étape 1, rédige les 4 formats ci-dessous.

Respecte impérativement les règles de chaque format.
N'invente aucune information absente de l'affiche.
Adapte systématiquement le temps des verbes et les expressions au décalage temporel réel entre la date de publication et la date de l'événement (ex. : ne pas écrire "à demain" si l'événement est dans 3 mois).

${formLinkInstruction}
${correctionsSection}

---

### FORMAT 1 - INSTAGRAM (@mybussigny)

**Règles :**
- 150 à 220 caractères maximum (hors hashtags)
- Commencer par une accroche émotionnelle ou sensorielle (pas par le nom de l'événement)
- Inclure date + lieu dans le corps du texte
- 1 appel à l'action clair ("lien en bio", "inscris-toi", etc.)
- 5 à 8 hashtags pertinents en fin de post (mélange local + thématique)
- 2 à 4 emojis, bien placés, jamais en début de ligne
- Écriture inclusive légère si public général (ex. habitant.e.s)
- Ton : chaleureux, dynamique, communautaire

---

### FORMAT 2 - FACEBOOK (Commune de Bussigny / Commission Intégration)

**Règles :**
- 80 à 150 mots
- Inclure : nom de l'événement, date complète, heure, lieu complet
- Mentionner les conditions clés (inscription, restrictions, avantages)
- Lien d'inscription ou de contact en fin de post, sur une ligne séparée
- Pas de formule de clôture temporelle anachronique ("à demain", "à ce soir", etc.)
- 1 à 2 emojis maximum, fonctionnels (📅 🎉 📍)
- Ton : informatif et convivial, voix institutionnelle mais accessible

---

### FORMAT 3 - WHATSAPP / ACTUAPP

**Règles :**
- Format : TITRE (court, avec date) + MESSAGE (3 à 5 lignes max)
- Le MESSAGE doit être autoportant (lisible sans le titre)
- Inclure : lieu, heure, condition principale, lien
- Aucun emoji
- Aucune mise en forme complexe (pas de tirets, pas de listes)
- Ton : neutre, direct, informatif

---

### FORMAT 4 - AGENDA bussigny.ch

**Règles :**
- Chapeau (en gras) : 1 à 2 phrases, accroche invitante
  -> Pour événements sociaux/festifs : commencer par une question rhétorique
  -> Pour événements culturels : phrase évocatrice du contenu
- Corps de texte : 1 à 3 paragraphes selon la richesse des infos
  -> Paragraphe 1 : description de l'événement et public visé
  -> Paragraphe 2 : informations pratiques (inscription, règles, matériel)
  -> Paragraphe 3 (si pertinent) : avantages, contact, lien
- Ne pas répéter dans le texte les métadonnées structurées (date, lieu, catégorie) - elles apparaissent dans les champs dédiés du CMS
- Écriture inclusive légère (habitant.e.s, exposant.e.s)
- Ton : institutionnel mais chaleureux, proxémique

**Métadonnées de l'agenda (champs CMS séparés) :**
- Catégorie : à déduire parmi - Séniors / Social / Enfance et jeunesse / Culture / Sport / Commune / Fêtes
- Quand : date + heure de début et fin
- Où : nom du lieu + adresse complète

---

## ÉTAPE 3 - NOTE ÉDITORIALE

Indique en 3 à 5 lignes :
- Les informations manquantes qui auraient amélioré les textes
- Les adaptations stylistiques effectuées selon le décalage temporel
- Toute ambiguïté détectée dans l'affiche

---

## FORMAT DE RÉPONSE JSON

Réponds avec ce JSON et uniquement ce JSON :
{
  "eventName": "Nom court de l'événement",
  "analyse": "Synthèse factuelle de l'étape 1 : toutes les informations extraites de l'affiche",
  "instagram": "Texte Instagram complet avec emojis et hashtags",
  "facebook": "Texte Facebook complet",
  "actuwp": "TITRE: [titre court avec date]\\nMESSAGE: [message autoportant sans emoji]",
  "agenda": "Texte complet du corps de l'agenda (chapeau en gras + paragraphes)",
  "agendaMeta": {
    "categorie": "Catégorie CMS",
    "quand": "Date, heure de début - heure de fin",
    "ou": "Nom du lieu, adresse complète"
  },
  "noteEditoriale": "Note éditoriale en 3 à 5 lignes"
}
${notes ? `\n---\n\nInformations contextuelles à intégrer impérativement dans les textes :\n${notes}` : ""}`;
}

export function makeDemoResult({ notes, formLink, canaux }) {
  const hasTotem = canaux.includes("Totem");

  return {
    eventName: "Tournoi de pétanque communal",
    analyse:
      "Nom : Tournoi de pétanque communal. Date : samedi 14 juin, 13h-18h. Lieu : Place du Verdeau, Bussigny. Organisateur : Service des sports de la Commune de Bussigny. Public : tous publics, équipes de 2 à 3 joueurs. Inscription : obligatoire via formulaire en ligne. Ambiance : graphisme coloré et estival, registre convivial et festif.",
    instagram:
      `La pétanque, ça vous tente ? 🎯 Formez votre équipe et rejoignez-nous le 14 juin sur la Place du Verdeau pour une après-midi de compétition conviviale. Inscrivez-vous, lien en bio. 🏆\n\n#Bussigny #Pétanque #VieLocale #VaudAgenda #Sport #Commune #Été`,
    facebook:
      `📅 Tournoi de pétanque communal - samedi 14 juin, 13h à 18h\n\nLa Commune de Bussigny organise son tournoi de pétanque annuel sur la Place du Verdeau. Ouvert à toutes et tous, en équipes de 2 à 3 joueurs. Inscription obligatoire.\n\n${formLink || "[LIEN FORMULAIRE]"}`,
    actuwp:
      `TITRE: Tournoi de pétanque - 14 juin à Bussigny\nMESSAGE: La Commune de Bussigny organise son tournoi annuel de pétanque le samedi 14 juin de 13h à 18h, Place du Verdeau. Ouvert à tous, équipes de 2 à 3 joueurs. Inscription obligatoire : ${formLink || "[LIEN FORMULAIRE]"}`,
    agenda:
      `**Envie de tenter votre chance sur le boulodrome ?**\n\nLa Commune de Bussigny ouvre les inscriptions pour son tournoi annuel de pétanque, ouvert aux habitant.e.s et à leurs proches. Que vous soyez débutant.e.s ou confirmé.e.s, venez profiter d'une après-midi conviviale dans une ambiance festive.\n\nLes équipes sont composées de 2 à 3 joueurs. L'inscription est obligatoire via le formulaire en ligne.${formLink ? `\n\nInscriptions et informations : ${formLink}` : ""}`,
    agendaMeta: {
      categorie: "Sport",
      quand: "Samedi 14 juin, 13h00 - 18h00",
      ou: "Place du Verdeau, 1030 Bussigny",
    },
    noteEditoriale: `Informations manquantes : le tarif d'inscription et la limite de places n'étaient pas indiqués sur l'affiche - des placeholders ont été utilisés.\nAdaptation temporelle : les textes sont rédigés au futur proche car la date simulée est dans plusieurs semaines.\nAmbiguïté : le graphisme suggère une organisation par la commission sports, mais seule la Commune est explicitement mentionnée.${hasTotem ? "\nTotem : canal activé, prévoir une version visuelle sans surcharge textuelle." : ""}${notes ? `\nNotes intégrées : ${notes}` : ""}`,
  };
}

export function getSelectedChannelIds(canaux) {
  return canaux.map((canal) => CANAL_TO_RESULT_KEY[canal]).filter(Boolean);
}

export function buildChannelBlocks({ results, canaux, folderLink }) {
  const selectedIds = new Set(getSelectedChannelIds(canaux));
  const sections = CHANNEL_BLOCKS.filter((block) => selectedIds.has(block.id)).map(
    (block) => `---\n${block.title}\n${block.getContent(results)}`
  );
  const totemNote = canaux.includes("Totem")
    ? "---\n🖥️ TOTEM (affichage digital)\nPas de texte - diffusion du visuel au format affiche."
    : "";
  const folderSection = folderLink ? `---\n📁 Dossier des visuels : ${folderLink}` : "";

  return [sections.join("\n\n"), totemNote, folderSection].filter(Boolean).join("\n\n");
}

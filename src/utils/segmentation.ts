import {
  DirectionPace,
  EmotionalDirection,
  MacroGroup,
  PitchContour,
  ReadingModeId,
  SegmentAnalysisInput,
  SegmentCommercialRole,
  SegmentContinuity,
  VoiceEnergy,
} from '../types.ts';

// Standard general mode styles with realistic Algerian commercial cadence
export const GENERAL_MODE_STYLES: Record<string, string> = {
  ugc: 'Natural Algerian UGC delivery. Warm, conversational and demonstrative, like a fashion seller speaking directly to a customer. Use a lively but unforced pace. Keep the articulation spontaneous rather than overly careful. Use a slightly brighter and higher conversational placement while preserving the current voice identity. Add small expressive rises when introducing visual details, followed by natural relaxation. Keep the CTA warm, smiling and confidently inviting. Do not sound theatrical, heavily promotional, slow, low, over-polished or mechanically segmented.',
  promo: 'Dynamic Algerian promotional delivery. Energetic, persuasive and clear on key offers, pricing and call to action. Keep a confident pace around 200 words per minute without shouting or rushing.',
  elegant: 'Refined Algerian boutique delivery. Poised, feminine, reassuring and smooth, around 175 words per minute, with graceful pacing and understated premium confidence.',
};

/**
 * Computes a fast deterministic fingerprint/hash for a given script text.
 */
export function computeScriptHash(text: string): string {
  if (!text) return 'empty';
  const clean = text.trim().replace(/\s+/g, ' ');
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    const char = clean.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Deterministically splits a script into natural phrases using Arabic & French punctuation.
 * Produces clean micro-segments suitable for semantic and emotional annotation.
 * Merges introductory fillers and cohesive clauses so that ~7 micro-segments are formed for ~70 words.
 */
export function segmentScript(text: string): SegmentAnalysisInput[] {
  if (!text || !text.trim()) return [];

  const sentenceRegex = /([^.!?؟\n]+[.!?؟\n]+|[^.!?؟\n]+$)/g;
  const rawSentences: string[] = [];
  let sMatch;
  while ((sMatch = sentenceRegex.exec(text)) !== null) {
    const s = sMatch[0].trim();
    if (s) rawSentences.push(s);
  }

  // Conversational connectors & intro fillers that must NEVER stand alone as independent micro-segments
  const introFillers = [
    'كيما راكم تشوفو',
    'كما راكم تشوفو',
    'كما ترون',
    'comme vous voyez',
    'salut mesdames',
    'bonjour les filles',
    'لبنات',
    'بنات',
    'شوفو معايا',
    'شوفو',
    'donc',
    'alors',
    'en plus',
    "d'ailleurs",
    'زيد على هذا',
    'حتى',
    'مرحبا بك',
  ];

  const clauses: string[] = [];

  for (const sentence of rawSentences) {
    const wordCount = sentence.split(/\s+/).filter(Boolean).length;
    // Sentences with up to ~14 words express a unified commercial idea; keep intact!
    if (wordCount <= 14) {
      clauses.push(sentence);
      continue;
    }

    // Split on comma only if both sides represent substantive independent thoughts
    const parts = sentence.split(/([،,])/);
    let current = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part === '،' || part === ',') {
        current += part;
      } else {
        if (!current) {
          current = part.trim();
        } else {
          const currentWords = current.split(/\s+/).filter(Boolean).length;
          const nextWords = part.trim().split(/\s+/).filter(Boolean).length;
          const trimmedLower = current.toLowerCase().replace(/[،,]/g, '').trim();
          const nextTrimmedLower = part.trim().toLowerCase();

          const isCurrentFiller =
            introFillers.some((f) => trimmedLower.endsWith(f) || trimmedLower === f) ||
            currentWords <= 3;
          const isNextContinuation =
            /^([وetouأوليباشpour\s]|car|afin|qui|que)/i.test(nextTrimmedLower) ||
            nextWords <= 3;

          // Merge if either is a filler, a grammatical continuation, or combined length is reasonable
          if (isCurrentFiller || isNextContinuation || (currentWords + nextWords <= 13)) {
            current = `${current} ${part.trim()}`.trim();
          } else {
            clauses.push(current);
            current = part.trim();
          }
        }
      }
    }
    if (current) clauses.push(current);
  }

  // Locate exact character offsets in original text
  const segments: SegmentAnalysisInput[] = [];
  let searchOffset = 0;
  let segIdx = 0;

  for (const clause of clauses) {
    const start = text.indexOf(clause, searchOffset);
    if (start !== -1) {
      segments.push({
        segmentId: `seg_${++segIdx}`,
        text: clause,
        startIndex: start,
        endIndex: start + clause.length,
      });
      searchOffset = start + clause.length;
    }
  }

  return segments;
}

/**
 * Re-aligns and validates directions after script modifications.
 * Binds directions to the specific script fingerprint.
 * Prevents old directions from polluting new scripts.
 */
export function realignAndValidateDirections(
  directions: EmotionalDirection[],
  currentScript: string
): EmotionalDirection[] {
  const currentHash = computeScriptHash(currentScript);

  return directions.map((dir) => {
    // 1. Direct match at current offsets in the current script
    const sliceAtOffsets = currentScript.slice(dir.startIndex, dir.endIndex);
    if (sliceAtOffsets === dir.targetText) {
      return {
        ...dir,
        isValid: true,
        status: 'valid',
        scriptFingerprint: currentHash,
      };
    }

    // 2. Search for the exact targetText in currentScript
    const matches: number[] = [];
    let pos = 0;
    while ((pos = currentScript.indexOf(dir.targetText, pos)) !== -1) {
      matches.push(pos);
      pos += dir.targetText.length;
    }

    // If exactly one unique match found, adjust offsets safely
    if (matches.length === 1) {
      const newStart = matches[0];
      const newEnd = newStart + dir.targetText.length;
      return {
        ...dir,
        startIndex: newStart,
        endIndex: newEnd,
        isValid: true,
        status: 'valid',
        scriptFingerprint: currentHash,
      };
    }

    // If multiple occurrences exist, pick the closest to previous startIndex
    if (matches.length > 1) {
      let closestStart = matches[0];
      let minDistance = Math.abs(closestStart - dir.startIndex);
      for (let i = 1; i < matches.length; i++) {
        const dist = Math.abs(matches[i] - dir.startIndex);
        if (dist < minDistance) {
          minDistance = dist;
          closestStart = matches[i];
        }
      }
      return {
        ...dir,
        startIndex: closestStart,
        endIndex: closestStart + dir.targetText.length,
        isValid: true,
        status: 'valid',
        scriptFingerprint: currentHash,
      };
    }

    // Passage was removed or belongs to an older script: mark invalid / archived
    return {
      ...dir,
      isValid: false,
      status: dir.locked ? 'archived' : 'invalid',
    };
  });
}

/**
 * Resolves effective directions applying the absolute priority rule:
 * Direction manuelle valide > Analyse automatique valide > Ton général
 * Strict check: filters out any invalid, archived or mismatched directions!
 */
export function resolveEffectiveDirections(
  manualDirs: EmotionalDirection[],
  autoDirs: EmotionalDirection[],
  useAuto: boolean
): EmotionalDirection[] {
  const validManual = manualDirs.filter((d) => d.isValid && d.status !== 'invalid' && d.status !== 'archived');
  if (!useAuto) {
    return validManual;
  }

  const validAuto = autoDirs.filter((d) => d.isValid && d.status !== 'invalid' && d.status !== 'archived');
  const effective: EmotionalDirection[] = [...validManual];

  // For each auto direction, only keep it if it doesn't overlap with any manual direction
  for (const autoDir of validAuto) {
    const overlaps = validManual.some((manualDir) => {
      return !(
        autoDir.endIndex <= manualDir.startIndex ||
        autoDir.startIndex >= manualDir.endIndex
      );
    });

    if (!overlaps) {
      effective.push(autoDir);
    }
  }

  // Sort by start index
  return effective.sort((a, b) => a.startIndex - b.startIndex);
}

/**
 * Groups micro-segments into 2 to 4 prosodic macro-groups for TTS synthesis.
 * Implements Section 8:
 * - Macro-groupe 1: Accueil + présentation du produit
 * - Macro-groupe 2: Démonstration visuelle continue (couleur, détails, coupe, conseils pratiques)
 * - Macro-groupe 3: Informations rassurantes (tailles, livraison, prix) + CTA / invitation
 */
export function buildMacroGroups(
  fullText: string,
  directions: EmotionalDirection[],
  mode: ReadingModeId = 'ugc',
  targetDuration: number = 20
): MacroGroup[] {
  const validDirs = directions
    .filter((d) => d.isValid && d.status !== 'invalid' && d.status !== 'archived')
    .sort((a, b) => a.startIndex - b.startIndex);
  const globalModeStyle = GENERAL_MODE_STYLES[mode] || GENERAL_MODE_STYLES.ugc;

  if (validDirs.length === 0) {
    return [
      {
        groupId: 'macro_all',
        segmentIds: ['all'],
        text: fullText.trim(),
        style: globalModeStyle,
        roleSummary: 'Script global',
        pauseBefore: false,
        pauseAfter: false,
      },
    ];
  }

  // Grouping rules:
  // - 10-15s: 1 to 2 macro-groups
  // - 20-30s: exactly 3 macro-groups (Section 8)
  // - 35-45s: 4 to 5 macro-groups
  const targetMaxGroups = targetDuration <= 15 ? 2 : targetDuration <= 30 ? 3 : 4;

  const groups: Array<{
    segmentIds: string[];
    dirs: EmotionalDirection[];
    text: string;
    hasPrice: boolean;
    hasCta: boolean;
    hasHook: boolean;
  }> = [];

  let currentGroup: {
    segmentIds: string[];
    dirs: EmotionalDirection[];
    text: string;
    hasPrice: boolean;
    hasCta: boolean;
    hasHook: boolean;
  } | null = null;

  for (let i = 0; i < validDirs.length; i++) {
    const dir = validDirs[i];
    const isPrice = dir.role === 'prix' || dir.role === 'promotion';
    const isCta = dir.role === 'CTA' || dir.role === 'invitation';
    const isHook = dir.role === 'hook' || dir.role === 'accueil';
    const isPresentation = dir.role === 'présentation_produit' || dir.role === 'découverte';
    const isDemoOrDetails =
      dir.role === 'caractéristique' ||
      dir.role === 'démonstration' ||
      dir.role === 'bénéfice_visuel' ||
      dir.role === 'bénéfice' ||
      dir.role === 'conseil_pratique' ||
      dir.role === 'couleur' ||
      dir.role === 'personnalisation';
    const isLogisticsOrPrice =
      isPrice ||
      dir.role === 'information_rassurante' ||
      dir.role === 'livraison' ||
      dir.role === 'taille' ||
      dir.role === 'disponibilité';

    // Decide boundary logic:
    // Group 1: Accueil + présentation
    // Group 2: Démonstration visuelle continue (caractéristiques, coupe, conseils)
    // Group 3: Réassurance (tailles, livraison, prix) + CTA
    let shouldStartNew = false;

    if (!currentGroup) {
      shouldStartNew = true;
    } else if (groups.length === 0) {
      // Still in first group: keep hook + presentation together!
      if (currentGroup.hasHook && isPresentation) {
        shouldStartNew = false;
      } else if (isDemoOrDetails || isLogisticsOrPrice || isCta) {
        shouldStartNew = true;
      }
    } else if (groups.length === 1) {
      // In second group (demonstration): keep visual features, advice together!
      if (isDemoOrDetails) {
        shouldStartNew = false;
      } else if (isLogisticsOrPrice || isCta) {
        shouldStartNew = true;
      }
    } else {
      // In third group (or later): keep logistics, price and CTA together!
      shouldStartNew = false;
    }

    if (shouldStartNew) {
      if (currentGroup) {
        groups.push(currentGroup);
      }
      currentGroup = {
        segmentIds: [dir.id],
        dirs: [dir],
        text: dir.targetText,
        hasPrice: isPrice,
        hasCta: isCta,
        hasHook: isHook,
      };
    } else {
      if (currentGroup) {
        currentGroup.segmentIds.push(dir.id);
        currentGroup.dirs.push(dir);
        currentGroup.text = `${currentGroup.text} ${dir.targetText}`.trim();
        if (isPrice) currentGroup.hasPrice = true;
        if (isCta) currentGroup.hasCta = true;
        if (isHook) currentGroup.hasHook = true;
      }
    }
  }

  if (currentGroup) {
    groups.push(currentGroup);
  }

  // Ensure groups don't exceed targetMaxGroups by fusing adjacent non-critical boundaries
  while (groups.length > targetMaxGroups) {
    let bestMergeIdx = 0;
    // Prefer merging visual demo groups or logistics with CTA
    for (let j = 0; j < groups.length - 1; j++) {
      if (!groups[j].hasHook && !groups[j + 1].hasHook) {
        bestMergeIdx = j;
        break;
      }
    }

    const merged = {
      segmentIds: [...groups[bestMergeIdx].segmentIds, ...groups[bestMergeIdx + 1].segmentIds],
      dirs: [...groups[bestMergeIdx].dirs, ...groups[bestMergeIdx + 1].dirs],
      text: `${groups[bestMergeIdx].text} ${groups[bestMergeIdx + 1].text}`,
      hasPrice: groups[bestMergeIdx].hasPrice || groups[bestMergeIdx + 1].hasPrice,
      hasCta: groups[bestMergeIdx].hasCta || groups[bestMergeIdx + 1].hasCta,
      hasHook: groups[bestMergeIdx].hasHook || groups[bestMergeIdx + 1].hasHook,
    };
    groups.splice(bestMergeIdx, 2, merged);
  }

  // Build the compiled MacroGroup objects with the exact formula:
  // finalStyle = globalModeStyle + localIntentDelta + continuityInstruction
  return groups.map((g, idx) => {
    const roles = Array.from(new Set(g.dirs.map((d) => d.role)));
    const primaryDir = g.dirs.find((d) => d.source === 'manual') || g.dirs[0];

    // Local intent delta
    const emotionTerms = Array.from(new Set(g.dirs.map((d) => d.emotion))).join(', ');
    const paceDesc =
      primaryDir.pace === 'slow'
        ? 'slightly slower and articulate'
        : primaryDir.pace === 'measured'
        ? 'poised and measured'
        : primaryDir.pace === 'lively'
        ? 'lively natural cadence'
        : primaryDir.pace === 'fast'
        ? 'energetic pace'
        : 'natural conversational rhythm';

    // Emphasis tokens (1 to 3 max, genuine tokens)
    const emphasisSet: string[] = [];
    for (const d of g.dirs) {
      if (d.emphasisTokens && Array.isArray(d.emphasisTokens)) {
        for (const tok of d.emphasisTokens) {
          if (tok && g.text.includes(tok) && !emphasisSet.includes(tok) && emphasisSet.length < 3) {
            emphasisSet.push(tok);
          }
        }
      } else if (d.emphasisWords && g.text.includes(d.emphasisWords) && !emphasisSet.includes(d.emphasisWords)) {
        emphasisSet.push(d.emphasisWords);
      }
    }

    let localIntentDelta = `${emotionTerms} with ${paceDesc}`;
    if (emphasisSet.length > 0) {
      localIntentDelta += `; gently emphasize "${emphasisSet.join('" and "')}"`;
    }

    // Continuity instruction
    let continuityInstruction = 'seamless human delivery';
    if (g.hasPrice) {
      continuityInstruction = 'brief delicate pause, clear advantageous reveal, then return to warm delivery';
    } else if (g.hasCta) {
      continuityInstruction = 'confident, friendly invitation without rushing';
    } else if (g.hasHook) {
      continuityInstruction = 'warm inviting hook with subtle smile';
    }

    const compiledStyle = `${globalModeStyle} Section ${idx + 1}: ${localIntentDelta}. ${continuityInstruction}.`;

    const pauseBefore = g.dirs.some((d) => d.pauseBefore);
    const pauseAfter = g.dirs.some((d) => d.pauseAfter);

    return {
      groupId: `macro_${idx + 1}`,
      segmentIds: g.segmentIds,
      text: g.text,
      style: compiledStyle,
      roleSummary: roles.join(' + '),
      pauseBefore,
      pauseAfter,
    };
  });
}

/**
 * Strategy A: Unified Flow Prompt Compiler.
 * Combines all micro-segments and macro-intentions into a single continuous delivery
 * prompt, allowing Gemini TTS to synthesize the entire script in one continuous acoustic breath
 * with ZERO inter-part artificial silence!
 */
export function buildUnifiedFlowPrompt(
  fullText: string,
  macroGroups: MacroGroup[],
  mode: ReadingModeId = 'ugc'
): string {
  const baseModeStyle = GENERAL_MODE_STYLES[mode] || GENERAL_MODE_STYLES.ugc;

  const progressionDescriptions = macroGroups.map((g, idx) => {
    return `Part ${idx + 1} (${g.roleSummary}): ${g.style.split('. Section')[1] || g.style}`;
  });

  return `${baseModeStyle} Maintain one seamless, natural Algerian voice flow across the script without artificial gaps or stops. Follow this emotional progression: ${progressionDescriptions.join('; ')}. Keep natural phrase pauses between 150ms and 250ms, with warm authenticity.`;
}

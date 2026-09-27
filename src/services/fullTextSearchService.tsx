import React from 'react';
import { QuestionItem, CognitiveLevel, CompetitionStage, DigitalCompetencyDomainKey } from '../types';
import { DIGITAL_COMPETENCY_DOMAINS, COGNITIVE_LEVELS, COMPETITION_STAGES } from '../data/digitalCompetencyData';

export interface SearchMatchDetail {
  field: 'id' | 'question_text' | 'options' | 'correct_key' | 'explanation' | 'legal_reference' | 'tags' | 'category' | 'round_name' | 'other';
  label: string;
  matchedSnippet?: string;
}

export interface SearchResultItem {
  question: QuestionItem;
  score: number;
  matchDetails: SearchMatchDetail[];
  matchedFields: Set<string>;
}

export interface ParsedSearchQuery {
  rawQuery: string;
  exactPhrases: string[];
  includeTokens: string[];
  excludeTokens: string[];
  tags: string[];
  domainFilter?: DigitalCompetencyDomainKey;
  levelFilter?: CognitiveLevel;
  stageFilter?: CompetitionStage;
  idFilter?: string;
  answerFilter?: string;
  fieldFilters: Record<string, string>;
}

/**
 * Remove Vietnamese accents / diacritics for flexible fuzzy searching
 */
export function removeVietnameseAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/**
 * Parses user search query string supporting:
 * - Exact phrases: "an ninh mang", "thong tu 02"
 * - Tag syntax: #an-toan, tag:chinh-thuc
 * - Domain filter: mien:4, domain:MIEN_4, mien:an-toan
 * - Level filter: level:nhan-biet, mucdo:thong-hieu
 * - Stage filter: stage:vong-loai, vong:khoi-dong
 * - ID filter: id:KD_01
 * - Exclude terms: -phishing, NOT ransomware
 */
export function parseSearchQuery(query: string): ParsedSearchQuery {
  const result: ParsedSearchQuery = {
    rawQuery: query,
    exactPhrases: [],
    includeTokens: [],
    excludeTokens: [],
    tags: [],
    fieldFilters: {}
  };

  if (!query || !query.trim()) return result;

  let working = query.trim();

  // 1. Extract exact phrases in quotes "..."
  const phraseRegex = /"([^"]+)"|'([^']+)'/g;
  let match: RegExpExecArray | null;
  while ((match = phraseRegex.exec(working)) !== null) {
    const phrase = (match[1] || match[2] || '').trim();
    if (phrase) {
      result.exactPhrases.push(phrase);
    }
  }
  working = working.replace(phraseRegex, ' ');

  // 2. Extract tokens
  const rawTokens = working.split(/\s+/).filter(Boolean);

  for (let i = 0; i < rawTokens.length; i++) {
    const token = rawTokens[i];

    // Check NOT operator
    if (token.toUpperCase() === 'NOT' && i + 1 < rawTokens.length) {
      const nextToken = rawTokens[i + 1].toLowerCase();
      result.excludeTokens.push(nextToken);
      i++;
      continue;
    }

    // Check negative prefix -word
    if (token.startsWith('-') && token.length > 1) {
      result.excludeTokens.push(token.substring(1).toLowerCase());
      continue;
    }

    // Check hashtag #tag
    if (token.startsWith('#') && token.length > 1) {
      const tag = token.substring(1);
      result.tags.push(tag);
      result.includeTokens.push(tag);
      continue;
    }

    // Check key:value field filters
    if (token.includes(':') && token.indexOf(':') > 0) {
      const colonIdx = token.indexOf(':');
      const prefix = token.substring(0, colonIdx).toLowerCase();
      const value = token.substring(colonIdx + 1).trim();

      if (value) {
        if (prefix === 'tag' || prefix === 'tags') {
          result.tags.push(value);
          result.includeTokens.push(value);
        } else if (prefix === 'id') {
          result.idFilter = value;
          result.fieldFilters.id = value;
        } else if (prefix === 'ans' || prefix === 'key' || prefix === 'dapan') {
          result.answerFilter = value;
          result.fieldFilters.correct_key = value;
        } else if (prefix === 'mien' || prefix === 'domain') {
          const valNorm = removeVietnameseAccents(value);
          if (valNorm.includes('1') || valNorm.includes('du lieu') || valNorm.includes('thong tin')) {
            result.domainFilter = 'MIEN_1';
          } else if (valNorm.includes('2') || valNorm.includes('giao tiep') || valNorm.includes('hop tac')) {
            result.domainFilter = 'MIEN_2';
          } else if (valNorm.includes('3') || valNorm.includes('sang tao') || valNorm.includes('noi dung')) {
            result.domainFilter = 'MIEN_3';
          } else if (valNorm.includes('4') || valNorm.includes('an toan') || valNorm.includes('bao mat')) {
            result.domainFilter = 'MIEN_4';
          } else if (valNorm.includes('5') || valNorm.includes('giai quyet')) {
            result.domainFilter = 'MIEN_5';
          } else if (valNorm.includes('6') || valNorm.includes('nghe nghiep')) {
            result.domainFilter = 'MIEN_6';
          }
        } else if (prefix === 'level' || prefix === 'mucdo' || prefix === 'do') {
          const valNorm = removeVietnameseAccents(value);
          if (valNorm.includes('nhan biet') || valNorm === 'nb') result.levelFilter = 'NHAN_BIET';
          else if (valNorm.includes('thong hieu') || valNorm === 'th') result.levelFilter = 'THONG_HIEU';
          else if (valNorm.includes('van dung cao') || valNorm === 'vdc') result.levelFilter = 'VAN_DUNG_CAO';
          else if (valNorm.includes('van dung') || valNorm === 'vd') result.levelFilter = 'VAN_DUNG';
        } else if (prefix === 'stage' || prefix === 'giai-doan' || prefix === 'vong') {
          const valNorm = removeVietnameseAccents(value);
          if (valNorm.includes('loai') || valNorm.includes('bgd')) result.stageFilter = 'VONG_LOAI';
          else if (valNorm.includes('bk1') || valNorm.includes('ban ket 1')) result.stageFilter = 'BAN_KET_1';
          else if (valNorm.includes('bk2') || valNorm.includes('ban ket 2')) result.stageFilter = 'BAN_KET_2';
          else if (valNorm.includes('bk3') || valNorm.includes('ban ket 3')) result.stageFilter = 'BAN_KET_3';
          else if (valNorm.includes('chung ket') || valNorm.includes('ck')) result.stageFilter = 'CHUNG_KET';
        } else {
          result.fieldFilters[prefix] = value;
          result.includeTokens.push(value);
        }
        continue;
      }
    }

    result.includeTokens.push(token);
  }

  return result;
}

/**
 * Execute full-text multi-field search on question items
 */
export function fullTextSearchQuestions(
  questions: QuestionItem[],
  queryStr: string
): SearchResultItem[] {
  if (!queryStr || !queryStr.trim()) {
    return questions.map(q => ({
      question: q,
      score: 1,
      matchDetails: [],
      matchedFields: new Set()
    }));
  }

  const parsed = parseSearchQuery(queryStr);
  const rawQueryLower = queryStr.trim().toLowerCase();
  const rawQueryAccentLess = removeVietnameseAccents(queryStr);

  const results: SearchResultItem[] = [];

  for (const q of questions) {
    let score = 0;
    const matchDetails: SearchMatchDetail[] = [];
    const matchedFields = new Set<string>();

    // Field-specific fast filters
    if (parsed.domainFilter && q.digital_competency_domain !== parsed.domainFilter) {
      continue;
    }
    if (parsed.levelFilter && q.cognitive_level !== parsed.levelFilter) {
      continue;
    }
    if (parsed.stageFilter && q.stage !== parsed.stageFilter) {
      continue;
    }
    if (parsed.idFilter && !q.id.toLowerCase().includes(parsed.idFilter.toLowerCase())) {
      continue;
    }
    if (parsed.answerFilter) {
      const ansKey = (q.correct_key || '').toLowerCase();
      if (!ansKey.includes(parsed.answerFilter.toLowerCase())) {
        continue;
      }
    }

    // Build multi-field search corpus
    const idStr = (q.id || '');
    const idLower = idStr.toLowerCase();

    const qText = (q.question_text || '');
    const qTextLower = qText.toLowerCase();
    const qTextAccentLess = removeVietnameseAccents(qText);

    // Options text
    const optValues: string[] = [];
    if (q.options && typeof q.options === 'object') {
      Object.entries(q.options).forEach(([k, v]) => {
        if (v && typeof v === 'string') {
          optValues.push(`${k}: ${v}`);
        }
      });
    }
    const optionsJoined = optValues.join(' | ');
    const optionsLower = optionsJoined.toLowerCase();
    const optionsAccentLess = removeVietnameseAccents(optionsJoined);

    const ansStr = (q.correct_key || '');
    const ansLower = ansStr.toLowerCase();
    const ansAccentLess = removeVietnameseAccents(ansStr);

    const expStr = (q.explanation || '');
    const expLower = expStr.toLowerCase();
    const expAccentLess = removeVietnameseAccents(expStr);

    const legalStr = (q.legal_reference || '');
    const legalLower = legalStr.toLowerCase();
    const legalAccentLess = removeVietnameseAccents(legalStr);

    const tagsArr = q.tags || [];
    const tagsJoined = tagsArr.join(' ');
    const tagsLower = tagsJoined.toLowerCase();
    const tagsAccentLess = removeVietnameseAccents(tagsJoined);

    const catStr = (q.category || '');
    const catLower = catStr.toLowerCase();
    const catAccentLess = removeVietnameseAccents(catStr);

    const roundStr = `${q.round_name || ''} ${q.round_format || ''}`;
    const roundLower = roundStr.toLowerCase();
    const roundAccentLess = removeVietnameseAccents(roundStr);

    const creatorStr = (q.created_by || '');
    const creatorLower = creatorStr.toLowerCase();

    // Composite searchable texts
    const allOriginalText = `${idStr} ${qText} ${optionsJoined} ${ansStr} ${expStr} ${legalStr} ${tagsJoined} ${catStr} ${roundStr} ${creatorStr}`.toLowerCase();
    const allAccentLessText = removeVietnameseAccents(allOriginalText);

    // 1. Exclude tokens check (NOT logic)
    if (parsed.excludeTokens.length > 0) {
      let shouldExclude = false;
      for (const ex of parsed.excludeTokens) {
        const exAcc = removeVietnameseAccents(ex);
        if (allOriginalText.includes(ex) || allAccentLessText.includes(exAcc)) {
          shouldExclude = true;
          break;
        }
      }
      if (shouldExclude) continue;
    }

    // 2. Exact Phrases check
    let passedExact = true;
    for (const phrase of parsed.exactPhrases) {
      const phraseLower = phrase.toLowerCase();
      const phraseAcc = removeVietnameseAccents(phrase);
      if (!allOriginalText.includes(phraseLower) && !allAccentLessText.includes(phraseAcc)) {
        passedExact = false;
        break;
      } else {
        // Boost score for exact phrase match
        score += 80;
        if (qTextLower.includes(phraseLower) || qTextAccentLess.includes(phraseAcc)) {
          score += 60;
          matchDetails.push({ field: 'question_text', label: 'Nội dung câu hỏi', matchedSnippet: phrase });
          matchedFields.add('question_text');
        }
        if (optionsLower.includes(phraseLower) || optionsAccentLess.includes(phraseAcc)) {
          score += 30;
          matchDetails.push({ field: 'options', label: 'Lựa chọn / Đáp án', matchedSnippet: phrase });
          matchedFields.add('options');
        }
        if (expLower.includes(phraseLower) || expAccentLess.includes(phraseAcc)) {
          score += 25;
          matchDetails.push({ field: 'explanation', label: 'Giải thích', matchedSnippet: phrase });
          matchedFields.add('explanation');
        }
        if (legalLower.includes(phraseLower) || legalAccentLess.includes(phraseAcc)) {
          score += 25;
          matchDetails.push({ field: 'legal_reference', label: 'Căn cứ pháp lý', matchedSnippet: phrase });
          matchedFields.add('legal_reference');
        }
      }
    }
    if (!passedExact) continue;

    // 3. Tag Filters check
    if (parsed.tags.length > 0) {
      let passedTags = true;
      for (const t of parsed.tags) {
        const tLower = t.toLowerCase();
        const tAcc = removeVietnameseAccents(t);
        const hasTag = tagsArr.some(tag => {
          const tNorm = tag.toLowerCase();
          return tNorm.includes(tLower) || removeVietnameseAccents(tNorm).includes(tAcc);
        });
        if (!hasTag) {
          passedTags = false;
          break;
        } else {
          score += 50;
          matchDetails.push({ field: 'tags', label: 'Nhãn (Tag)', matchedSnippet: `#${t}` });
          matchedFields.add('tags');
        }
      }
      if (!passedTags) continue;
    }

    // 4. Token & Keyword Matching
    let tokenMatchesCount = 0;
    const requiredTokens = parsed.includeTokens;

    if (requiredTokens.length === 0 && parsed.exactPhrases.length === 0 && parsed.tags.length === 0) {
      // Fallback single query match
      if (allOriginalText.includes(rawQueryLower) || allAccentLessText.includes(rawQueryAccentLess)) {
        score += 50;
      } else {
        continue;
      }
    } else {
      let allTokensFound = true;
      for (const token of requiredTokens) {
        const tokLower = token.toLowerCase();
        const tokAcc = removeVietnameseAccents(token);

        let tokenInItem = false;

        // Check ID match
        if (idLower.includes(tokLower)) {
          tokenInItem = true;
          score += (idLower === tokLower ? 120 : 60);
          matchedFields.add('id');
          matchDetails.push({ field: 'id', label: 'Mã câu hỏi', matchedSnippet: idStr });
        }

        // Check question text match
        if (qTextLower.includes(tokLower) || qTextAccentLess.includes(tokAcc)) {
          tokenInItem = true;
          score += 40;
          matchedFields.add('question_text');
          matchDetails.push({ field: 'question_text', label: 'Nội dung', matchedSnippet: token });
        }

        // Check options match
        if (optionsLower.includes(tokLower) || optionsAccentLess.includes(tokAcc)) {
          tokenInItem = true;
          score += 25;
          matchedFields.add('options');
          matchDetails.push({ field: 'options', label: 'Lựa chọn', matchedSnippet: token });
        }

        // Check correct key match
        if (ansLower.includes(tokLower) || ansAccentLess.includes(tokAcc)) {
          tokenInItem = true;
          score += 30;
          matchedFields.add('correct_key');
          matchDetails.push({ field: 'correct_key', label: 'Đáp án đúng', matchedSnippet: ansStr });
        }

        // Check explanation match
        if (expLower.includes(tokLower) || expAccentLess.includes(tokAcc)) {
          tokenInItem = true;
          score += 20;
          matchedFields.add('explanation');
          matchDetails.push({ field: 'explanation', label: 'Giải thích', matchedSnippet: token });
        }

        // Check legal reference match
        if (legalLower.includes(tokLower) || legalAccentLess.includes(tokAcc)) {
          tokenInItem = true;
          score += 25;
          matchedFields.add('legal_reference');
          matchDetails.push({ field: 'legal_reference', label: 'Căn cứ pháp lý', matchedSnippet: token });
        }

        // Check tags match
        if (tagsLower.includes(tokLower) || tagsAccentLess.includes(tokAcc)) {
          tokenInItem = true;
          score += 35;
          matchedFields.add('tags');
          matchDetails.push({ field: 'tags', label: 'Nhãn', matchedSnippet: token });
        }

        // Check category/domain/round match
        if (catLower.includes(tokLower) || catAccentLess.includes(tokAcc) || 
            roundLower.includes(tokLower) || roundAccentLess.includes(tokAcc) ||
            creatorLower.includes(tokLower)) {
          tokenInItem = true;
          score += 15;
          matchedFields.add('category');
        }

        if (tokenInItem) {
          tokenMatchesCount++;
        } else {
          allTokensFound = false;
        }
      }

      // If strict token search didn't match all tokens, but exact phrase was matched or majority matched
      if (!allTokensFound && parsed.exactPhrases.length === 0 && parsed.tags.length === 0) {
        continue;
      }
    }

    // Exact full query boost in question text or id
    if (qTextLower.includes(rawQueryLower)) {
      score += 50;
    }
    if (idLower === rawQueryLower) {
      score += 100;
    }

    results.push({
      question: q,
      score,
      matchDetails,
      matchedFields
    });
  }

  // Sort results by relevance score descending
  results.sort((a, b) => b.score - a.score);
  return results;
}

/**
 * Search Query History Helper (Stored in localStorage)
 */
const SEARCH_HISTORY_STORAGE_KEY = 'bti2026_search_history_v1';
const MAX_HISTORY_ITEMS = 10;

export const searchHistoryService = {
  getHistory(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(SEARCH_HISTORY_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },

  addQuery(query: string): string[] {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return this.getHistory();

    try {
      let history = this.getHistory();
      history = history.filter(item => item.toLowerCase() !== trimmed.toLowerCase());
      history.unshift(trimmed);
      if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(0, MAX_HISTORY_ITEMS);
      }
      localStorage.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(history));
      return history;
    } catch {
      return [];
    }
  },

  removeQuery(query: string): string[] {
    try {
      let history = this.getHistory();
      history = history.filter(item => item !== query);
      localStorage.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(history));
      return history;
    } catch {
      return [];
    }
  },

  clearHistory(): void {
    try {
      localStorage.removeItem(SEARCH_HISTORY_STORAGE_KEY);
    } catch {}
  }
};

/**
 * Preset Popular Search Tags & Phrases
 */
export const POPULAR_SEARCH_PRESETS = [
  { label: 'Thông tư 02', query: 'Thông tư 02/2025/TT-BGDĐT', icon: 'Scale' },
  { label: 'Nghị định 13', query: 'Nghị định 13/2023/NĐ-CP', icon: 'ShieldCheck' },
  { label: 'Luật An ninh mạng', query: 'Luật An ninh mạng', icon: 'ShieldAlert' },
  { label: 'VCNV (7 hàng)', query: 'round:vcnv', icon: 'Layers' },
  { label: 'An toàn & Bảo mật', query: 'mien:4', icon: 'Lock' },
  { label: 'Deepfake & AI', query: 'Deepfake', icon: 'Sparkles' },
  { label: 'Xác thực 2FA', query: '2FA', icon: 'Key' },
  { label: 'Lừa đảo Phishing', query: 'Phishing', icon: 'AlertTriangle' },
  { label: 'Sao lưu 3-2-1', query: '3-2-1', icon: 'Database' }
];

/**
 * Converts a string into an accent-insensitive regex pattern for Vietnamese
 */
function createVietnamesePattern(term: string): string {
  const map: Record<string, string> = {
    a: '[aàáạảãâầấậẩẫăằắặẳẵAÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]',
    e: '[eèéẹẻẽêềếệểễEÈÉẸẺẼÊỀẾỆỂỄ]',
    i: '[iìíịỉĩIÌÍỊỈĨ]',
    o: '[oòóọỏõôồốộổỗơờớợởỡOÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]',
    u: '[uùúụủũưừứựửữUÙÚỤỦŨƯỪỨỰỬỮ]',
    y: '[yỳýỵỷỹYỲÝỴỶỸ]',
    d: '[dđDĐ]'
  };

  let pattern = '';
  for (const char of term) {
    const lower = char.toLowerCase();
    if (map[lower]) {
      pattern += map[lower];
    } else {
      pattern += char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  }
  return pattern;
}

/**
 * Text Highlighting Helper: Highlights query tokens and phrases inside any text string
 */
export function HighlightedText({
  text,
  searchQuery,
  className = '',
  highlightClassName = 'bg-amber-400/35 text-amber-200 px-1 py-0.5 rounded-[3px] font-bold ring-1 ring-amber-400/50 shadow-xs border-b border-amber-400'
}: {
  text: string;
  searchQuery?: string;
  className?: string;
  highlightClassName?: string;
}): React.ReactElement {
  if (!text || !searchQuery || !searchQuery.trim()) {
    return <span className={className}>{text}</span>;
  }

  const parsed = parseSearchQuery(searchQuery);
  const searchTerms: string[] = [];

  // Add exact phrases
  parsed.exactPhrases.forEach(p => {
    if (p.trim().length > 1) searchTerms.push(p.trim());
  });

  // Add include tokens (skip field prefixes like tag:, mien:)
  parsed.includeTokens.forEach(t => {
    if (t.trim().length > 1 && !t.includes(':')) {
      searchTerms.push(t.trim());
    }
  });

  // Add raw query as fallback if short
  if (searchTerms.length === 0 && searchQuery.trim().length > 1) {
    searchTerms.push(searchQuery.trim());
  }

  if (searchTerms.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Create escaped and accent-insensitive patterns
  const patterns = searchTerms
    .sort((a, b) => b.length - a.length)
    .map(term => createVietnamesePattern(term));

  try {
    const regex = new RegExp(`(${patterns.join('|')})`, 'gi');
    const parts = text.split(regex);

    return (
      <span className={className}>
        {parts.map((part, i) => {
          if (!part) return null;
          // Check if this part matches any of our search term patterns
          const isMatch = patterns.some(p => new RegExp(`^${p}$`, 'i').test(part));
          if (isMatch) {
            return (
              <mark key={i} className={highlightClassName}>
                {part}
              </mark>
            );
          }
          return <React.Fragment key={i}>{part}</React.Fragment>;
        })}
      </span>
    );
  } catch (err) {
    // Fallback simple exact matching
    return <span className={className}>{text}</span>;
  }
}

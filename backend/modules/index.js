/**
 * @fileoverview Main entry point for backend modules
 * @module backend/modules/index
 */

export { WebCrawler } from './WebCrawler.js';
export { HTMLParser } from './HTMLParser.js';
export { ContentAnalyzer } from './ContentAnalyzer.js';
export { Sanitizer } from './Sanitizer.js';
export { AnalysisBuilder } from './AnalysisBuilder.js';
export { ReferenceCrawler } from './ReferenceCrawler.js';
export { AnalysisSummarizer } from './AnalysisSummarizer.js';
export { AIClient } from './AIClient.js';
export { PromptBuilder } from './PromptBuilder.js';

// Phase 8 — Deterministic Code Generation (8.1–8.4: Render Plan Construction)
export { buildRenderPlan, getRenderPlanItemSchema, getBackendTemplateRegistry } from './CodeGenerator.js';

// Phase 8 — Deterministic Code Generation (8.5–8.7: JSX + File Output)
export { generateImports, generateJSX, generateAppComponent, writeProjectFiles } from './AppGenerator.js';
export {
    validateSectionOrdering,
    validateSectionType,
    validateVariant,
    validateRequiredProps,
    validateLayoutVariantKeys,
} from './RenderPlanValidator.js';

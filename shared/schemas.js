/**
 * @fileoverview Shared data schemas using Zod for runtime validation
 * @module shared/schemas
 */

import { z } from 'zod';

// =============================================================================
// 2.1 Core Data Structures
// =============================================================================

/**
 * Section types that can be identified in a webpage
 * @typedef {'hero' | 'features' | 'testimonials' | 'pricing' | 'faq' | 'cta' | 'footer' | 'navigation' | 'benefits' | 'courses' | 'other'} SectionType
 */

/**
 * Layout orientation for sections
 * @typedef {'single-column' | 'multi-column' | 'grid' | 'alternating' | 'carousel' | 'split'} LayoutType
 */

/**
 * Identified issue in webpage analysis
 * @typedef {Object} IdentifiedIssue
 * @property {string} type - Issue type (e.g., 'accessibility', 'ux', 'responsiveness')
 * @property {string} severity - Issue severity ('low', 'medium', 'high')
 * @property {string} description - Human-readable description of the issue
 * @property {string} [location] - Optional location information
 */

/**
 * Section structure within a webpage
 * @typedef {Object} PageSection
 * @property {SectionType} type - Type of section
 * @property {number} contentLength - Word count in section
 * @property {number} headingCount - Number of headings in section
 * @property {number} contentDensity - Content density score (0-100)
 * @property {LayoutType} layoutSignal - Detected layout pattern
 * @property {string[]} [callsToAction] - Detected CTA texts
 */

/**
 * Complete webpage analysis structure
 * @typedef {Object} WebPageAnalysis
 * @property {string} url - Analyzed URL
 * @property {string} title - Page title
 * @property {string} [description] - Meta description
 * @property {string} [viewport] - Viewport meta tag content
 * @property {PageSection[]} sections - Identified sections
 * @property {IdentifiedIssue[]} issues - Detected issues
 * @property {Object} metrics - Overall page metrics
 * @property {number} metrics.totalWordCount - Total word count
 * @property {number} metrics.totalHeadings - Total heading count
 * @property {boolean} metrics.hasMobileOptimization - Has mobile viewport meta tag
 */

const IdentifiedIssueSchema = z.object({
    type: z.enum(['accessibility', 'ux', 'responsiveness', 'performance', 'seo', 'other']),
    severity: z.enum(['low', 'medium', 'high']),
    description: z.string().min(1),
    location: z.string().optional(),
});

const PageSectionSchema = z.object({
    type: z.enum([
        'hero',
        'features',
        'testimonials',
        'pricing',
        'faq',
        'cta',
        'footer',
        'navigation',
        'benefits',
        'courses',
        'other',
    ]),
    contentLength: z.number().int().nonnegative(),
    headingCount: z.number().int().nonnegative(),
    contentDensity: z.number().min(0).max(100),
    layoutSignal: z.enum([
        'single-column',
        'multi-column',
        'grid',
        'alternating',
        'carousel',
        'split',
    ]),
    callsToAction: z.array(z.string()).optional(),
});

export const WebPageAnalysisSchema = z.object({
    url: z.string().url(),
    title: z.string().min(1),
    description: z.string().optional(),
    viewport: z.string().optional(),
    sections: z.array(PageSectionSchema).min(1),
    issues: z.array(IdentifiedIssueSchema),
    metrics: z.object({
        totalWordCount: z.number().int().nonnegative(),
        totalHeadings: z.number().int().nonnegative(),
        hasMobileOptimization: z.boolean(),
    }),
});

/**
 * Layout pattern information for reference websites
 * @typedef {Object} LayoutPattern
 * @property {string} heroType - Hero section layout ('centered', 'split', 'full-width')
 * @property {string} featureLayout - Features section layout ('grid', 'list', 'carousel')
 * @property {string} contentPattern - Overall content pattern ('alternating', 'stacked', 'grid')
 */

/**
 * Visual structure metadata
 * @typedef {Object} VisualStructure
 * @property {number} [gridColumns] - Number of grid columns detected
 * @property {string} [spacingPattern] - Spacing pattern ('compact', 'normal', 'spacious')
 * @property {string[]} [cardLayouts] - Card-based layout types detected
 */

/**
 * Reference website analysis structure (layout-focused, no content)
 * @typedef {Object} ReferenceAnalysis
 * @property {string} url - Reference URL
 * @property {LayoutPattern} layoutPatterns - Identified layout patterns
 * @property {string[]} sectionOrdering - Order of section types
 * @property {VisualStructure} visualStructure - Visual and structural metadata
 */

export const ReferenceAnalysisSchema = z.object({
    url: z.string().url(),
    layoutPatterns: z.object({
        heroType: z.enum(['centered', 'split', 'full-width', 'minimal']),
        featureLayout: z.enum(['grid', 'list', 'carousel', '2-column', '3-column']),
        contentPattern: z.enum(['alternating', 'stacked', 'grid', 'mixed']),
    }),
    sectionOrdering: z.array(z.string()).min(1),
    visualStructure: z.object({
        gridColumns: z.number().int().positive().optional(),
        spacingPattern: z.enum(['compact', 'normal', 'spacious']).optional(),
        cardLayouts: z.array(z.string()).optional(),
    }),
});

/**
 * Predefined redesign goals constant
 * @type {Object}
 * @property {string} MODERN_DESIGN - Modernize visual design and aesthetics
 * @property {string} IMPROVED_CONVERSION - Optimize for conversion rate
 * @property {string} MOBILE_RESPONSIVENESS - Enhance mobile responsiveness
 * @property {string} ENHANCED_ACCESSIBILITY - Improve accessibility compliance
 * @property {string} CLEANER_LAYOUT - Simplify and clean up layout structure
 */
export const RedesignGoals = {
    MODERN_DESIGN: 'modern_design',
    IMPROVED_CONVERSION: 'improved_conversion',
    MOBILE_RESPONSIVENESS: 'mobile_responsiveness',
    ENHANCED_ACCESSIBILITY: 'enhanced_accessibility',
    CLEANER_LAYOUT: 'cleaner_layout',
};

export const RedesignGoalSchema = z.enum([
    RedesignGoals.MODERN_DESIGN,
    RedesignGoals.IMPROVED_CONVERSION,
    RedesignGoals.MOBILE_RESPONSIVENESS,
    RedesignGoals.ENHANCED_ACCESSIBILITY,
    RedesignGoals.CLEANER_LAYOUT,
]);

// =============================================================================
// 2.2 AI Interaction Contracts
// =============================================================================

/**
 * Component mapping instruction for AI
 * @typedef {Object} ComponentMapping
 * @property {SectionType} sectionType - Original section type
 * @property {string} templateId - Target template ID
 * @property {string} variant - Template variant to use
 */

/**
 * AI-generated redesign plan
 * @typedef {Object} AIRedesignPlan
 * @property {string[]} sectionOrdering - Recommended order of sections
 * @property {Object.<string, string>} layoutVariants - Section type to layout variant mapping
 * @property {string} contentTone - Recommended content tone
 * @property {string[]} contentEmphasis - Content areas to emphasize
 * @property {string[]} missingSections - Suggested sections to add
 * @property {string[]} redundantSections - Sections to consider removing
 * @property {ComponentMapping[]} componentMappings - Section to template mappings
 */

export const AIRedesignPlanSchema = z.object({
    sectionOrdering: z.array(z.string()).min(1),
    layoutVariants: z.record(z.string(), z.string()),
    contentTone: z.string().min(1),
    contentEmphasis: z.array(z.string()),
    missingSections: z.array(z.string()),
    redundantSections: z.array(z.string()),
    componentMappings: z.array(
        z.object({
            sectionType: z.string(),
            templateId: z.string(),
            variant: z.string(),
            /** Optional props passed through to the code generator */
            props: z.record(z.string(), z.any()).optional(),
        })
    ),
    /**
     * Optional override props per section type.
     * When present, takes precedence over componentMappings[].props for the same section.
     * Used by buildRenderPlan (CodeGenerator) to inject template props.
     */
    sectionProps: z.record(z.string(), z.record(z.string(), z.any())).optional(),
});

/**
 * Input for AI prompt construction
 * @typedef {Object} AIPromptInput
 * @property {WebPageAnalysis} targetAnalysis - Target website analysis
 * @property {ReferenceAnalysis} [referenceAnalysis] - Optional reference analysis
 * @property {string[]} goals - Selected redesign goals
 * @property {string} [constraints] - Additional constraints
 * @property {string} [context] - Additional context
 */

export const AIPromptInputSchema = z.object({
    targetAnalysis: WebPageAnalysisSchema,
    referenceAnalysis: ReferenceAnalysisSchema.optional(),
    goals: z.array(RedesignGoalSchema).min(1),
    constraints: z.string().optional(),
    context: z.string().optional(),
});

// =============================================================================
// 2.3 Code Generation Contracts
// =============================================================================

/**
 * Template variant definition
 * @typedef {Object} TemplateVariant
 * @property {string} name - Variant name
 * @property {string} description - Variant description
 */

/**
 * Section template definition
 * @typedef {Object} SectionTemplate
 * @property {string} templateId - Unique template identifier
 * @property {string} componentName - React component name
 * @property {Object} propsSchema - Zod schema for props (serialized)
 * @property {TemplateVariant[]} variants - Available variants
 * @property {string} [description] - Template description
 */

export const SectionTemplateSchema = z.object({
    templateId: z.string().min(1),
    componentName: z.string().min(1),
    propsSchema: z.any(), // Zod schema object (can't easily validate schema structure)
    variants: z.array(
        z.object({
            name: z.string(),
            description: z.string(),
        })
    ),
    description: z.string().optional(),
});

/**
 * Generated file structure
 * @typedef {Object} GeneratedFile
 * @property {string} path - Relative file path
 * @property {string} content - File content
 * @property {string} type - File type ('component', 'style', 'config', 'other')
 */

/**
 * Dependency specification
 * @typedef {Object} Dependency
 * @property {string} package - Package name
 * @property {string} version - Package version
 */

/**
 * Generated output structure
 * @typedef {Object} GeneratedOutput
 * @property {GeneratedFile[]} files - Generated files
 * @property {Dependency[]} dependencies - Required dependencies
 * @property {Object} previewMetadata - Preview information
 * @property {string} previewMetadata.entryPoint - Main entry file path
 * @property {string} previewMetadata.framework - Framework used
 */

export const GeneratedOutputSchema = z.object({
    files: z.array(
        z.object({
            path: z.string().min(1),
            content: z.string(),
            type: z.enum(['component', 'style', 'config', 'other']),
        })
    ),
    dependencies: z.array(
        z.object({
            package: z.string().min(1),
            version: z.string().min(1),
        })
    ),
    previewMetadata: z.object({
        entryPoint: z.string().min(1),
        framework: z.string().min(1),
    }),
});

// =============================================================================
// 2.4 API Request/Response Schemas
// =============================================================================

// POST /api/analyze
export const AnalyzeRequestSchema = z.object({
    url: z.string().url(),
});

export const AnalyzeResponseSchema = z.object({
    analysis: WebPageAnalysisSchema,
});

// POST /api/reference-analyze
export const ReferenceAnalyzeRequestSchema = z.object({
    url: z.string().url(),
});

export const ReferenceAnalyzeResponseSchema = z.object({
    analysis: ReferenceAnalysisSchema,
});

// POST /api/generate-plan
export const GeneratePlanRequestSchema = z.object({
    targetAnalysis: WebPageAnalysisSchema,
    referenceAnalysis: ReferenceAnalysisSchema.optional(),
    goals: z.array(RedesignGoalSchema).min(1),
});

export const GeneratePlanResponseSchema = z.object({
    plan: AIRedesignPlanSchema,
});

// POST /api/generate-code
export const GenerateCodeRequestSchema = z.object({
    redesignPlan: AIRedesignPlanSchema,
    targetAnalysis: WebPageAnalysisSchema,
});

export const GenerateCodeResponseSchema = z.object({
    output: GeneratedOutputSchema,
});

// POST /api/preview
export const PreviewRequestSchema = z.object({
    generatedOutput: GeneratedOutputSchema,
});

export const PreviewResponseSchema = z.object({
    previewUrl: z.string().url(),
});

// =============================================================================
// Helper Validation Functions
// =============================================================================

/**
 * Validates data against a Zod schema and returns parsed result or throws error
 * @template T
 * @param {z.ZodSchema<T>} schema - Zod schema to validate against
 * @param {unknown} data - Data to validate
 * @returns {T} Validated and parsed data
 * @throws {z.ZodError} If validation fails
 */
export function validateOrThrow(schema, data) {
    return schema.parse(data);
}

/**
 * Validates data against a Zod schema and returns result object
 * @template T
 * @param {z.ZodSchema<T>} schema - Zod schema to validate against
 * @param {unknown} data - Data to validate
 * @returns {{success: true, data: T} | {success: false, error: z.ZodError}} Validation result
 */
export function validateSafe(schema, data) {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
}

/**
 * Validates API request body for analyze endpoint
 * @param {unknown} body - Request body
 * @returns {Object} Validated request data
 */
export function validateAnalyzeRequest(body) {
    return validateOrThrow(AnalyzeRequestSchema, body);
}

/**
 * Validates API request body for generate-plan endpoint
 * @param {unknown} body - Request body
 * @returns {Object} Validated request data
 */
export function validateGeneratePlanRequest(body) {
    return validateOrThrow(GeneratePlanRequestSchema, body);
}

/**
 * Validates AI redesign plan output
 * @param {unknown} data - AI response data
 * @returns {AIRedesignPlan} Validated redesign plan
 */
export function validateAIRedesignPlan(data) {
    return validateOrThrow(AIRedesignPlanSchema, data);
}

/**
 * Validates webpage analysis data
 * @param {unknown} data - Analysis data
 * @returns {WebPageAnalysis} Validated webpage analysis
 */
export function validateWebPageAnalysis(data) {
    return validateOrThrow(WebPageAnalysisSchema, data);
}

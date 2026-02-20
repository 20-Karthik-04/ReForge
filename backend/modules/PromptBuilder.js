/**
 * @fileoverview Prompt builder utility for constructing structured AI prompts
 * @module backend/modules/PromptBuilder
 */

/**
 * PromptBuilder utility for creating structured prompts for AI redesign planning
 * Ensures privacy and safety by using only structured JSON (no raw HTML)
 */
export class PromptBuilder {
    /**
     * Builds complete prompt object for AI request
     * @param {Object} targetAnalysis - WebPageAnalysis object
     * @param {string[]} goals - Array of redesign goals
     * @param {Object} [referenceAnalysis] - Optional ReferenceAnalysis object
     * @returns {Object} Prompt object with system and user messages
     */
    static buildPrompt(targetAnalysis, goals, referenceAnalysis = null) {
        return {
            system: this.buildSystemPrompt(),
            user: this.buildUserPrompt(targetAnalysis, goals, referenceAnalysis),
        };
    }

    /**
     * Builds system prompt defining AI role and constraints
     * @returns {string} System prompt text
     */
    static buildSystemPrompt() {
        return `You are an expert web design consultant specializing in modern landing page redesign.

Your role is to analyze a webpage's structure and provide high-level redesign recommendations.

CRITICAL CONSTRAINTS:
1. You must ONLY output structured JSON matching the AIRedesignPlan schema
2. You must NOT generate any code (no JSX, HTML, CSS, or JavaScript)
3. You must NOT include code examples or snippets
4. Your output must be PURE JSON only
5. You will receive structured webpage analysis data (not raw HTML)

Your task is to provide strategic design decisions:
- Recommend logical section ordering for optimal user flow
- Suggest appropriate layout variants for each section type
- Advise on content tone and emphasis areas
- Identify missing sections that would improve the page
- Identify redundant sections that could be removed
- Map each section to appropriate component templates

Focus on:
- Modern design principles
- Conversion optimization
- Mobile responsiveness
- Clear visual hierarchy
- Accessibility best practices

REQUIRED OUTPUT FORMAT:
You must return ONLY a JSON object matching this exact schema:

${this.buildSchemaDescription()}

EXAMPLE OUTPUT:
${this.buildExampleOutput()}

Remember: Output ONLY valid JSON. No explanations, no code, no markdown - just JSON.`;
    }

    /**
     * Builds user prompt with structured analysis data
     * @param {Object} targetAnalysis - WebPageAnalysis object
     * @param {string[]} goals - Array of redesign goals
     * @param {Object} [referenceAnalysis] - Optional ReferenceAnalysis object
     * @returns {string} User prompt text
     */
    static buildUserPrompt(targetAnalysis, goals, referenceAnalysis = null) {
        let prompt = `Please analyze this webpage and provide a redesign plan.

TARGET WEBPAGE ANALYSIS:
${JSON.stringify(targetAnalysis, null, 2)}

REDESIGN GOALS:
${goals.map((g) => `- ${g}`).join('\n')}
`;

        if (referenceAnalysis) {
            prompt += `\nREFERENCE DESIGN INSPIRATION (layout patterns only):
${JSON.stringify(referenceAnalysis, null, 2)}
`;
        }

        prompt += `\nPlease provide your redesign recommendations as a JSON object following the AIRedesignPlan schema.

Focus on creating a logical, modern flow that addresses the specified goals.
Consider the detected sections, issues, and metrics when making recommendations.

Output ONLY the JSON object - no additional text or explanation.`;

        return prompt;
    }

    /**
     * Builds AIRedesignPlan schema description
     * @returns {string} Schema description in text format
     */
    static buildSchemaDescription() {
        return `{
  "sectionOrdering": ["hero", "features", ...],  // Array of section types in recommended order
  "layoutVariants": {                            // Object mapping section types to layout variants
    "hero": "split",                            // e.g., "centered", "split", "full-width"
    "features": "grid",                         // e.g., "grid", "list", "carousel"
    ...
  },
  "contentTone": "professional and approachable", // Recommended content tone/voice
  "contentEmphasis": ["value proposition", ...],  // Array of content areas to emphasize
  "missingSections": ["testimonials", ...],       // Array of section types to add
  "redundantSections": ["other", ...],            // Array of section types to consider removing
  "componentMappings": [                          // Array of section-to-template mappings
    {
      "sectionType": "hero",
      "templateId": "hero-template",
      "variant": "split"
    },
    ...
  ]
}`;
    }

    /**
     * Builds example output for AI reference
     * @returns {string} Example JSON output
     */
    static buildExampleOutput() {
        return `{
  "sectionOrdering": ["navigation", "hero", "features", "testimonials", "pricing", "cta", "footer"],
  "layoutVariants": {
    "hero": "split",
    "features": "3-column",
    "testimonials": "carousel",
    "pricing": "3-tier",
    "cta": "centered"
  },
  "contentTone": "professional yet approachable, emphasizing innovation and trust",
  "contentEmphasis": [
    "unique value proposition",
    "social proof and credibility",
    "clear call-to-action",
    "mobile-first design"
  ],
  "missingSections": ["testimonials", "faq"],
  "redundantSections": [],
  "componentMappings": [
    {
      "sectionType": "hero",
      "templateId": "hero-template",
      "variant": "split"
    },
    {
      "sectionType": "features",
      "templateId": "features-template",
      "variant": "3-column"
    },
    {
      "sectionType": "pricing",
      "templateId": "pricing-template",
      "variant": "3-tier"
    },
    {
      "sectionType": "cta",
      "templateId": "cta-template",
      "variant": "centered"
    }
  ]
}`;
    }

    /**
     * Validates that prompt does not contain sensitive data
     * @param {string} promptText - Prompt text to validate
     * @throws {Error} If sensitive data is detected
     */
    static validatePromptSafety(promptText) {
        // Check for raw HTML tags (should not be present in structured JSON)
        if (/<[a-z][\s\S]*>/i.test(promptText)) {
            const htmlMatches = promptText.match(/<[a-z][\s\S]*>/gi);
            if (htmlMatches && htmlMatches.length > 5) {
                // Allow a few tags from JSON stringification, but not raw HTML
                throw new Error('Prompt contains raw HTML - privacy violation');
            }
        }

        // Check for script tags
        if (/<script/i.test(promptText)) {
            throw new Error('Prompt contains script tags - privacy violation');
        }

        // Check for potential PII patterns (basic heuristics)
        const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const phonePattern = /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;

        const emailMatches = promptText.match(emailPattern);
        const phoneMatches = promptText.match(phonePattern);

        if (emailMatches && emailMatches.length > 0) {
            console.warn('⚠️  Email addresses detected in prompt - review for PII');
        }

        if (phoneMatches && phoneMatches.length > 0) {
            console.warn('⚠️  Phone numbers detected in prompt - review for PII');
        }
    }
}

export default PromptBuilder;

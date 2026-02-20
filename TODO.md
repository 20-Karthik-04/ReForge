# ReForge - Development TODO

This document outlines the complete development plan for the ReForge AI-assisted web page analysis and deterministic frontend code generation system.

---

## Phase 1: Project Foundation & Setup

### 1.1 Project Initialization
- [ ] Initialize Node.js project with `package.json`
- [ ] Configure ESLint and Prettier for code quality (JavaScript ES6+)
- [ ] Create `.gitignore` with appropriate Node.js and IDE exclusions
- [ ] Set up project directory structure:
  - `/backend` - Express API and crawling logic
  - `/frontend` - React UI
  - `/templates` - Predefined React component templates
  - `/shared` - Shared schemas and utilities
  - `/docs` - Documentation (PRD, Design, API specs)
- [ ] Ensure project uses Node.js LTS and ES module or CommonJS consistently

### 1.2 Backend Dependencies Installation
- [ ] Install Express.js for API layer
- [ ] Install Cheerio for HTML parsing
- [ ] Install Axios for HTTP requests
- [ ] Install Playwright (optional, for JavaScript-heavy pages)
- [ ] Install dotenv for environment configuration
- [ ] Install CORS middleware
- [ ] Install body-parser for JSON parsing
- [ ] Install Zod for runtime schema validation

### 1.3 Frontend Dependencies Installation
- [ ] Initialize React app with Vite or Create React App (JavaScript configuration)
- [ ] Install Tailwind CSS and configure
- [ ] Install React Router for navigation
- [ ] Install Axios for API calls
- [ ] Install UI component library or utilities (optional: Headless UI, Radix UI)
- [ ] Install file-saver for ZIP download functionality
- [ ] Install PropTypes for component prop validation

### 1.4 Development Environment Configuration
- [ ] Create `.env.example` with required environment variables
- [ ] Document LLM API key requirement and setup instructions
- [ ] Configure development scripts in `package.json` (dev, build, test)
- [ ] Set up concurrent running of backend and frontend in development

---

## Phase 2: Shared Data Contracts & Validation Schemas

### 2.1 Core Data Structures
- [x] Define `WebPageAnalysis` schema using JSDoc and runtime validation:
  - Section types (hero, features, testimonials, pricing, etc.)
  - Content length indicators
  - Layout signals
  - Identified issues
- [x] Define `ReferenceAnalysis` schema for reference website data:
  - Layout patterns
  - Section ordering
  - Visual structure (without content)
- [x] Define `RedesignGoals` constants object:
  - Modern design
  - Improved conversion
  - Mobile responsiveness
  - Enhanced accessibility
  - Cleaner layout
- [x] **Note**: Use Zod to validate all data structures at runtime

### 2.2 AI Interaction Contracts
- [x] Define `AIRedesignPlan` schema for AI output with validation:
  - Recommended section ordering
  - Suggested layout variants (centered, split, grid)
  - Content tone and emphasis
  - Missing or redundant sections
  - Component mapping instructions
- [x] Define `AIPromptInput` schema:
  - Target website analysis
  - Optional reference analysis
  - User redesign goals
  - Constraints and context
- [x] **Critical**: Implement strict runtime validation of AI responses to ensure type safety

### 2.3 Code Generation Contracts
- [x] Define `SectionTemplate` schema with validation:
  - Template ID
  - Component name
  - Props schema
  - Variant types
- [x] Define `GeneratedOutput` schema:
  - React component code
  - File structure
  - Dependencies list
  - Preview metadata

### 2.4 API Request/Response Schemas
- [x] Define `/api/analyze` request and response schemas with validation
- [x] Define `/api/reference-analyze` request and response schemas
- [x] Define `/api/generate-plan` request and response schemas
- [x] Define `/api/generate-code` request and response schemas
- [x] Define `/api/preview` request and response schemas
- [x] Document all schemas with JSDoc comments for developer clarity

---

## Phase 3: Backend - Web Crawling Module

### 3.1 HTML Fetching Service
- [x] Create `WebCrawler` service class
- [x] Implement URL validation and sanitization
- [x] Implement HTTP fetching with timeout and error handling
- [x] Handle redirects and different response codes
- [x] Add user-agent configuration
- [x] Implement retry logic for failed requests

### 3.2 HTML Parsing and Structure Extraction
- [x] Create `HTMLParser` service using Cheerio
- [x] Extract document structure:
  - Identify header/nav elements
  - Identify main content sections
  - Identify footer elements
- [x] Extract semantic structure:
  - Heading hierarchy (h1-h6)
  - Section/article/aside elements
  - Content grouping
- [x] Extract metadata:
  - Page title
  - Meta descriptions
  - Viewport settings
  - Open Graph tags

### 3.3 Content Analysis
- [x] Implement content density calculation per section
- [x] Detect call-to-action elements (buttons, forms, links)
- [x] Identify navigation patterns
- [x] Detect hero/banner sections
- [x] Identify features/benefits sections
- [x] Detect testimonial/review sections
- [x] Identify pricing/comparison tables
- [x] Detect FAQ sections

### 3.4 Responsiveness Analysis
- [x] Extract viewport meta tags
- [x] Identify media query usage (if accessible)
- [x] Detect responsive patterns in HTML structure
- [x] Flag absence of mobile-friendly indicators

### 3.5 Sanitization and Privacy
- [x] Remove all inline and external JavaScript references
- [x] Remove form elements and input fields
- [x] Remove third-party tracking scripts
- [x] Remove sensitive data patterns (emails, phone numbers)
- [x] Strip out dynamic content markers
- [x] Clean and normalize HTML structure

### 3.6 Structured JSON Output
- [x] Transform parsed HTML into structured `WebPageAnalysis` JSON
- [x] Group sections by type and purpose
- [x] Calculate content metrics (word count, heading count, etc.)
- [x] Add layout hints (single column, multi-column, grid, etc.)
- [x] Flag identified issues (missing h1, poor hierarchy, etc.)

---

## Phase 4: Backend - Reference Website Analysis Module

### 4.1 Reference Crawler
- [x] Create `ReferenceCrawler` service extending base crawler
- [x] Implement layout-focused parsing
- [x] Extract section ordering and structure
- [x] Identify layout patterns:
  - Hero types (centered, split, full-width)
  - Feature layouts (grid, list, carousel)
  - Content patterns (alternating, stacked)

### 4.2 Layout Pattern Extraction
- [x] Detect grid structures and column counts
- [x] Identify spacing and padding patterns
- [x] Extract visual hierarchy signals
- [x] Detect card-based layouts
- [x] Identify navigation patterns

### 4.3 Content Filtering
- [x] Strip all textual content from reference analysis
- [x] Remove branding elements
- [x] Keep only structural and layout information
- [x] Ensure reference data is used only as design inspiration

### 4.4 Reference Analysis Output
- [x] Transform reference site into `ReferenceAnalysis` JSON
- [x] Document layout variants identified
- [x] Add structural metadata

---

## Phase 5: Backend - Data Sanitization & Structuring

### 5.1 Content Categorization
- [x] Implement heuristics to categorize sections:
  - Hero/banner detection rules
  - Features section detection
  - Testimonial detection
  - Pricing section detection
  - CTA section detection
  - Footer detection
- [x] Assign confidence scores to categorizations

### 5.2 Issue Detection
- [x] Implement accessibility issue detection:
  - Missing heading structure
  - Low contrast (if detectable from HTML)
  - Missing alt text
  - Poor semantic HTML
- [x] Detect UX issues:
  - Missing CTAs
  - Excessive content density
  - Poor mobile responsiveness indicators

### 5.3 Analysis Summary Generation
- [x] Create human-readable summary of findings
- [x] List detected section types
- [x] Highlight critical issues
- [x] Provide layout recommendations

---

## Phase 6: Backend - AI Integration Module

### 6.1 LLM Client Setup
- [x] Create `AIClient` service for LLM API integration
- [x] Implement API key management via environment variables
- [x] Add request/response error handling
- [x] Implement token usage tracking
- [x] Add retry logic with exponential backoff

### 6.2 Prompt Engineering
- [x] Design system prompt for redesign planning role
- [x] Create structured prompt template combining:
  - Target website analysis JSON
  - Optional reference analysis JSON
  - User redesign goals
  - Constraints (no code generation, JSON output only)
- [x] Add examples of expected JSON output format
- [x] Enforce JSON schema in prompt

### 6.3 AI Response Parsing
- [x] Implement strict JSON parsing of AI response
- [x] Validate AI output against `AIRedesignPlan` schema
- [x] Handle malformed responses gracefully
- [x] Log AI responses for debugging
- [x] Implement fallback/default plan if AI fails

### 6.4 Planning Logic
- [x] Extract section ordering recommendations from AI
- [x] Parse layout variant suggestions
- [x] Extract content emphasis guidance
- [x] Identify recommended section additions/removals
- [x] Map AI recommendations to template library

### 6.5 Privacy and Safety
- [x] Ensure no raw HTML is sent to AI
- [x] Verify structured JSON removes sensitive data
- [x] Log AI prompts and responses without PII
- [x] Implement content filtering before AI submission

---

## Phase 7: Template Library - React Component Templates

### 7.1 Template Architecture
- [x] Define template naming conventions
- [x] Create base template structure
- [x] Define PropTypes for each template component
- [x] Define variant system for templates
- [x] Document expected props with JSDoc comments

### 7.2 Navigation Header Templates
- [x] Create `NavHeader` template with variants:
  - Minimal navigation (logo + links + CTA)
  - Centered navigation
  - Sticky header with blur effect
- [x] Implement responsive behavior (hamburger menu)
- [x] Add Tailwind classes for styling
- [x] Support logo, nav links, and CTA button props

### 7.3 Hero Section Templates
- [x] Create `HeroSection` template with variants:
  - Centered hero
  - Split layout (content left, image right)
  - Full-width with background
- [x] Support props:
  - Headline
  - Subheadline
  - Primary CTA
  - Secondary CTA
  - Trust indicators
  - Hero image/illustration URL
- [x] Implement gradient backgrounds and styling

### 7.4 Features Section Templates
- [x] Create `FeaturesSection` template with variants:
  - 3-column grid
  - 2-column grid
  - List layout
- [x] Create `FeatureCard` sub-component
- [x] Support props:
  - Section heading
  - Features array (icon, title, description)
- [x] Add hover effects and animations

### 7.5 Course Showcase Templates
- [x] Create `CourseShowcase` template with variants:
  - Horizontal scroll
  - Grid layout
- [x] Create `CourseCard` sub-component
- [x] Support props:
  - Courses array (thumbnail, title, instructor, rating, price)
- [x] Implement carousel/scroll behavior

### 7.6 Benefits/How It Works Templates
- [x] Create `BenefitsSection` template with variants:
  - Alternating layout (image/content swap)
  - Numbered steps vertical flow
- [x] Support props:
  - Steps/benefits array (image, title, description)
- [x] Implement responsive stacking

### 7.7 Testimonials Section Templates
- [x] Create `TestimonialsSection` template with variants:
  - Carousel
  - Grid layout
- [x] Create `TestimonialCard` sub-component
- [x] Support props:
  - Testimonials array (avatar, name, role, quote, rating)
- [x] Implement carousel controls if applicable

### 7.8 Pricing Section Templates
- [x] Create `PricingSection` template with variants:
  - Three-tier layout
  - Two-tier layout
- [x] Create `PricingCard` sub-component
- [x] Support props:
  - Plans array (name, price, features, CTA, highlighted)
- [x] Add monthly/annual toggle (optional)

### 7.9 FAQ Section Templates
- [x] Create `FAQSection` template
- [x] Implement accordion behavior
- [x] Support props:
  - FAQs array (question, answer)
- [x] Add expand/collapse icons

### 7.10 Final CTA Section Templates
- [x] Create `FinalCTA` template with variants:
  - Bold gradient background
  - Image overlay
- [x] Support props:
  - Headline
  - Subheadline
  - CTA button
  - Optional email form

### 7.11 Footer Templates
- [x] Create `Footer` template
- [x] Implement multi-column layout
- [x] Support props:
  - Company info
  - Link groups (product, resources, support, legal)
  - Social media links
  - Newsletter form
- [x] Style with dark background

### 7.12 Template Registry
- [x] Create `TemplateRegistry` mapping section types to template components
- [x] Document all available templates and variants
- [x] Export template metadata (required props, variants)

---

## Phase 8: Backend - Deterministic Code Generation Module

### 8.1 Code Generator Core
- [ ] Create `CodeGenerator` service
- [ ] Implement template selection logic based on `AIRedesignPlan`
- [ ] Map AI section recommendations to template IDs
- [ ] Handle variant selection based on AI guidance

### 8.2 Component Assembly
- [ ] Implement component instantiation from templates
- [ ] Inject structured content into template props
- [ ] Generate unique component names/IDs
- [ ] Assemble components in recommended order

### 8.3 Page Structure Generation
- [ ] Create main `App.jsx` file structure
- [ ] Import selected templates
- [ ] Compose page layout from selected sections
- [ ] Add routing structure (if multi-page support later)

### 8.4 Code Formatting
- [ ] Implement code formatting using Prettier
- [ ] Ensure consistent indentation and style
- [ ] Add comments explaining generated sections
- [ ] Generate clean, readable code

### 8.5 Dependency Management
- [ ] Generate `package.json` with required dependencies
- [ ] List all React, Tailwind, and utility dependencies
- [ ] Include proper versioning

### 8.6 File Structure Generation
- [ ] Create organized file structure:
  - `/src/components` - Generated components (JSX files)
  - `/src/App.jsx` - Main application
  - `/src/index.jsx` - Entry point
  - `/src/index.css` - Tailwind imports and global styles
  - `/public` - Assets
- [ ] Generate `README.md` with setup instructions

### 8.7 Deterministic Behavior Validation
- [ ] Ensure same input always produces same output
- [ ] Implement seeding for any random operations (if any)
- [ ] Add unit tests verifying deterministic behavior

---

## Phase 9: Backend - API Endpoints

### 9.1 API Server Setup
- [ ] Create Express app with JavaScript (ES6+)
- [ ] Configure CORS for frontend access
- [ ] Set up body-parser for JSON
- [ ] Add request logging middleware
- [ ] Implement error handling middleware
- [ ] Add runtime validation middleware for all endpoints

### 9.2 POST /api/analyze Endpoint
- [ ] Accept request body: `{ url: string }`
- [ ] Validate URL format
- [ ] Call `WebCrawler` service
- [ ] Call `HTMLParser` service
- [ ] Return `WebPageAnalysis` JSON
- [ ] Handle errors (invalid URL, timeout, parsing failure)

### 9.3 POST /api/reference-analyze Endpoint
- [ ] Accept request body: `{ url: string }`
- [ ] Validate URL format
- [ ] Call `ReferenceCrawler` service
- [ ] Return `ReferenceAnalysis` JSON
- [ ] Handle errors gracefully

### 9.4 POST /api/generate-plan Endpoint
- [ ] Accept request body:
  - `targetAnalysis`: WebPageAnalysis
  - `referenceAnalysis?`: ReferenceAnalysis
  - `goals`: RedesignGoals[]
- [ ] Call `AIClient` service with structured prompt
- [ ] Parse and validate AI response
- [ ] Return `AIRedesignPlan` JSON
- [ ] Handle AI service errors

### 9.5 POST /api/generate-code Endpoint
- [ ] Accept request body:
  - `redesignPlan`: AIRedesignPlan
  - `targetAnalysis`: WebPageAnalysis
- [ ] Call `CodeGenerator` service
- [ ] Generate complete file structure
- [ ] Return `GeneratedOutput` JSON with code files
- [ ] Handle code generation errors

### 9.6 POST /api/generate-zip Endpoint
- [ ] Accept request body: `{ generatedOutput: GeneratedOutput }`
- [ ] Create in-memory ZIP archive
- [ ] Add all generated files to ZIP
- [ ] Return ZIP file as binary download
- [ ] Handle ZIP creation errors

### 9.7 Full Pipeline Endpoint (Optional)
- [ ] Create POST /api/generate-full endpoint
- [ ] Accept: `{ url, referenceUrl?, goals }`
- [ ] Execute full pipeline:
  - Crawl and analyze target
  - Optionally analyze reference
  - Generate AI plan
  - Generate code
  - Return ZIP
- [ ] Implement proper error handling at each stage

---

## Phase 10: Frontend - UI Foundation

### 10.1 Tailwind Design System
- [ ] Configure Tailwind theme with design tokens:
  - Color palette (primary blue, dark navy, light gray, accent purple)
  - Typography scale
  - Spacing scale (8px base unit)
  - Border radius values
  - Shadow definitions
- [ ] Create `index.css` with Tailwind directives and custom utilities

### 10.2 Layout Components
- [ ] Create `Container` component for max-width wrapping
- [ ] Create `Section` component for consistent section spacing
- [ ] Create responsive grid utilities

### 10.3 UI Components
- [ ] Create `Button` component with variants (primary, secondary)
- [ ] Create `Input` component for text fields
- [ ] Create `Card` component for content cards
- [ ] Create `Spinner` component for loading states
- [ ] Create `Alert` component for error/success messages

---

## Phase 11: Frontend - Main Application Pages

### 11.1 Landing/Home Page
- [ ] Create hero section explaining ReForge
- [ ] Add value proposition and benefits
- [ ] Include "Get Started" CTA to main form
- [ ] Design with modern aesthetics per Design Doc

### 11.2 Main Generation Form Page
- [ ] Create form with fields:
  - Target URL input
  - Redesign goals multi-select
  - Optional reference URL input
- [ ] Add input validation
- [ ] Implement form submission
- [ ] Show loading state during processing

### 11.3 Results/Preview Page
- [ ] Display generation status/progress
- [ ] Show AI redesign plan summary
- [ ] Implement live preview iframe of generated page
- [ ] Add "Download ZIP" button
- [ ] Show code snippets (optional)
- [ ] Add "Generate Again" and "Edit Goals" actions

### 11.4 Error Handling Page
- [ ] Create error display component
- [ ] Show user-friendly error messages
- [ ] Provide retry options
- [ ] Log errors for debugging

---

## Phase 12: Frontend - State Management

### 12.1 Application State
- [ ] Set up state management (React Context or Zustand)
- [ ] Define state slices:
  - Target analysis
  - Reference analysis
  - Redesign plan
  - Generated output
  - Loading states
  - Error states

### 12.2 API Integration Layer
- [ ] Create API client service
- [ ] Implement API call functions:
  - `analyzeURL(url)`
  - `analyzeReference(url)`
  - `generatePlan(data)`
  - `generateCode(plan)`
  - `downloadZIP(output)`
- [ ] Add error handling and retries

---

## Phase 13: Frontend - User Flow Implementation

### 13.1 Step 1: Input Submission
- [ ] User enters target URL
- [ ] User selects redesign goals
- [ ] Optionally enters reference URL
- [ ] Validate inputs
- [ ] Submit to backend
- [ ] Show loading spinner

### 13.2 Step 2: Analysis Display
- [ ] Receive and display target analysis summary
- [ ] Show detected sections
- [ ] Display identified issues
- [ ] Option to proceed or edit inputs

### 13.3 Step 3: Plan Generation
- [ ] Call AI plan generation endpoint
- [ ] Display AI recommendations
- [ ] Show section ordering
- [ ] Show layout variants chosen
- [ ] Option to approve or regenerate

### 13.4 Step 4: Code Generation
- [ ] Call code generation endpoint
- [ ] Show progress indicator
- [ ] Display generated file structure

### 13.5 Step 5: Preview and Download
- [ ] Render live preview in iframe
- [ ] Enable ZIP download
- [ ] Provide code viewing option
- [ ] Allow user to start over

---

## Phase 14: Preview Module

### 14.1 Live Preview Server
- [ ] Create preview endpoint serving generated HTML
- [ ] Bundle generated React code for browser
- [ ] Inject Tailwind CSS
- [ ] Serve in sandboxed iframe

### 14.2 Preview UI
- [ ] Implement responsive preview (desktop, tablet, mobile views)
- [ ] Add device frame toggles
- [ ] Enable full-screen preview mode

---

## Phase 15: ZIP Archive Generation

### 15.1 Archive Creation
- [ ] Use JSZip or similar library
- [ ] Add all generated files with proper directory structure
- [ ] Include `package.json`
- [ ] Include `README.md` with setup instructions
- [ ] Include `.gitignore`

### 15.2 Download Logic
- [ ] Trigger browser download of ZIP
- [ ] Use meaningful filename (e.g., `reforge-output-{timestamp}.zip`)
- [ ] Handle download errors

---

## Phase 16: Testing & Quality Assurance

### 16.1 Backend Unit Tests
- [ ] Test `WebCrawler` with mock URLs
- [ ] Test `HTMLParser` with sample HTML
- [ ] Test `AIClient` with mocked responses
- [ ] Test `CodeGenerator` for deterministic output
- [ ] Test API endpoints with supertest

### 16.2 Frontend Unit Tests
- [ ] Test form validation logic
- [ ] Test state management
- [ ] Test API client functions
- [ ] Test UI components with React Testing Library

### 16.3 Integration Tests
- [ ] Test full pipeline from URL to ZIP
- [ ] Test error handling at each stage
- [ ] Test with various real-world URLs

### 16.4 Manual Testing
- [ ] Test with 10+ different websites
- [ ] Verify generated code quality
- [ ] Check responsiveness of generated pages
- [ ] Validate preview functionality
- [ ] Test download and installation of ZIP

---

## Phase 17: Performance Optimization

### 17.1 Backend Optimization
- [ ] Implement caching for analyzed URLs (short-term)
- [ ] Optimize HTML parsing performance
- [ ] Add request timeouts
- [ ] Implement rate limiting

### 17.2 Frontend Optimization
- [ ] Lazy load components
- [ ] Optimize bundle size
- [ ] Implement code splitting
- [ ] Optimize images and assets

### 17.3 API Optimization
- [ ] Implement request queuing (if needed)
- [ ] Optimize JSON payload sizes
- [ ] Enable gzip compression

---

## Phase 18: Security & Privacy

### 18.1 Input Validation
- [ ] Sanitize all user inputs
- [ ] Validate URL formats strictly
- [ ] Prevent SSRF attacks (restrict internal IPs)
- [ ] Implement URL allowlist/blocklist (optional)

### 18.2 Data Privacy
- [ ] Ensure no persistent storage of crawled data
- [ ] Clear temporary data after processing
- [ ] Anonymize logs
- [ ] Document privacy practices

### 18.3 API Security
- [ ] Implement rate limiting per IP
- [ ] Add CORS restrictions
- [ ] Secure LLM API keys
- [ ] Implement request authentication (if public)

---

## Phase 19: Documentation

### 19.1 User Documentation
- [ ] Write README.md with:
  - Project overview
  - Setup instructions
  - Usage guide
  - Examples
- [ ] Create user guide for frontend UI
- [ ] Document supported redesign goals

### 19.2 Developer Documentation
- [ ] Document API endpoints with examples
- [ ] Document template library usage
- [ ] Create architecture diagram
- [ ] Document data flow
- [ ] Add inline code comments

### 19.3 Deployment Documentation
- [ ] Write deployment guide for backend (Render, Railway, etc.)
- [ ] Write deployment guide for frontend (Vercel, Netlify)
- [ ] Document environment variables
- [ ] Create deployment checklist

---

## Phase 20: Deployment & Hosting

### 20.1 Backend Deployment
- [ ] Choose hosting platform (Render, Railway, Fly.io)
- [ ] Configure environment variables
- [ ] Set up production build
- [ ] Deploy backend API
- [ ] Configure custom domain (optional)

### 20.2 Frontend Deployment
- [ ] Build production frontend
- [ ] Deploy to Vercel or Netlify
- [ ] Configure environment to point to backend API
- [ ] Set up custom domain (optional)

### 20.3 Monitoring
- [ ] Set up error logging (Sentry, LogRocket)
- [ ] Monitor API usage
- [ ] Track LLM token consumption
- [ ] Set up uptime monitoring

---

## Phase 21: Polish & Enhancements

### 21.1 UI/UX Polish
- [ ] Add animations and transitions per Design Doc
- [ ] Implement scroll animations
- [ ] Add micro-interactions
- [ ] Improve loading states with skeleton screens

### 21.2 Accessibility
- [ ] Ensure WCAG 2.1 AA compliance
- [ ] Test keyboard navigation
- [ ] Add ARIA labels
- [ ] Test with screen readers
- [ ] Verify color contrast ratios

### 21.3 Analytics (Optional)
- [ ] Add usage analytics
- [ ] Track conversion funnel
- [ ] Monitor error rates

---

## Phase 22: Future Enhancements (Post-MVP)

### 22.1 Template Expansion
- [ ] Add more template variants
- [ ] Support custom user templates
- [ ] Implement template marketplace

### 22.2 Multi-Page Support
- [ ] Extend crawling to multiple pages
- [ ] Generate multi-page React apps with routing

### 22.3 Framework Support
- [ ] Add Vue.js template support
- [ ] Add Next.js/SSR support
- [ ] Add vanilla HTML/CSS option

### 22.4 Advanced Features
- [ ] Accessibility scoring
- [ ] Performance benchmarking
- [ ] A/B test variant generation
- [ ] Brand customization (logo, colors)

---

## Notes

- Each task should be implemented and tested before moving to the next
- Maintain strict separation: AI for planning, deterministic code for generation
- Never allow AI to generate JSX or CSS directly
- **Always validate AI outputs against schemas using runtime validation (Zod)**
- Since this is a JavaScript project, use JSDoc extensively for documentation and developer clarity
- Implement PropTypes for all React components to catch prop errors during development
- Prioritize code quality and maintainability
- Document decisions and trade-offs
- Keep user privacy and security as top priorities
- All data contracts must be validated at runtime to ensure type safety without TypeScript

---

**End of TODO**

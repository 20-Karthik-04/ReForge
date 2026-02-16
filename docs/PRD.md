**Product Requirements Document (PRD)**

**REFORGE - AI-Assisted Web Page Analysis and Deterministic Frontend Code Generation System**

---

**1. Introduction**

Modern websites often become outdated in design and usability despite remaining functionally correct. Many organizations and individuals continue using such websites due to the high cost, time, and technical expertise required to redesign them. The process of redesigning a website usually involves understanding the existing structure, identifying usability and performance issues, deciding on a modern layout, and rewriting the frontend code using contemporary technologies.

This project proposes an AI-assisted system that automates this process. The system analyzes an existing web page using its URL and generates a redesigned, modern, and optimized version of the page along with clean, production-ready frontend source code. The project is specifically designed to demonstrate strong backend engineering, system design, and responsible AI integration rather than uncontrolled AI-driven code generation.

---

**2. Problem Statement**

Many existing websites suffer from the following issues:

- Outdated visual design and layout
- Poor mobile responsiveness
- Weak content hierarchy and call-to-action placement
- Accessibility issues such as low contrast or improper heading structure
- Inefficient page structure impacting user experience

Redesigning such websites manually requires:

- Manual analysis of existing HTML structure
- UX and accessibility expertise
- Time-consuming frontend redevelopment
- Skilled developers and designers

Current AI website builders typically generate new websites based on user prompts or prebuilt templates without analyzing the original webpage. They also rely heavily on AI to generate raw frontend code, which often results in inconsistent, unmaintainable, and unpredictable output. This creates a gap for a system that intelligently analyzes an existing webpage and produces a controlled, deterministic redesign aligned with modern web standards.

---

**3. Project Objective**

The objective of this project is to design and implement a system that:

- Analyzes an existing landing page using its URL
- Extracts and understands the structural and usability characteristics of the page
- Identifies UX, layout, and responsiveness issues
- Uses AI only for high-level redesign planning and reasoning
- Generates frontend source code deterministically using predefined templates
- Produces clean, readable, and maintainable React + Tailwind CSS code

The system aims to bridge the gap between website analysis and practical frontend code generation while maintaining full control over output quality.

---

**4. Scope of the Project**

This project focuses on:

- Static landing pages and marketing websites
- Frontend code generation only
- Single-page redesign in the initial implementation

The project does not include:

- Backend regeneration or database logic
- Multi-page website generation
- Pixel-perfect visual replication
- AI-generated JSX or CSS
- Drag-and-drop editors or WYSIWYG builders

---

**5. Target Users**

The intended users of the system include:

- Students and developers looking to modernize existing websites
- Developers who want a clean frontend starting point for redesigns
- Recruiters evaluating system design and AI integration skills
- Portfolio owners seeking improved landing pages

---

**6. User Inputs**

The system requires the user to provide high-level intent rather than implementation details.

**Required Inputs:**

- **Target Website URL**  
    The URL of the webpage that needs to be analyzed and redesigned.
- **Redesign Goals**  
    Users select one or more goals such as:

- Modern design
- Improved conversion rate
- Better mobile responsiveness
- Enhanced accessibility
- Cleaner layout and structure

- **Preferred Technology Stack**  
    The system initially supports:

- React
- Tailwind CSS

**Optional Inputs:**

- **Reference Website URL**  
    A URL of a website whose layout or visual style the user prefers. This URL is used only for extracting high-level layout patterns and design inspiration, not for copying code or content.

---

**7. System Overview**

The system is composed of multiple independent modules that work together to analyze the webpage, plan a redesign, and generate frontend code.

The core design principle of the system is:

**AI assists in planning and reasoning, while deterministic software generates the actual code.**

---

**8. Web Crawling and Analysis Module**

This module is responsible for fetching and analyzing the target website.

The system:

- Crawls the HTML content of the target URL
- Extracts structural elements such as headers, sections, and footers
- Identifies content density and hierarchy
- Detects the presence or absence of call-to-action elements
- Collects responsiveness hints such as viewport usage

The crawler explicitly ignores:

- JavaScript files
- Forms and input elements
- Third-party scripts
- Sensitive or dynamic content

The output of this module is a sanitized and structured JSON representation of the webpage.

---

**9. Reference Website Analysis Module (Optional)**

If a reference website URL is provided, the system:

- Crawls the reference webpage
- Extracts only layout and structure patterns
- Identifies section ordering and layout types (e.g., centered hero, split layout)
- Ignores all textual content and branding

This data is used only as a design inspiration signal and is never copied directly into the generated output.

---

**10. Data Sanitization and Structuring**

All extracted data is converted into structured JSON objects that represent:

- Section types
- Content length
- Layout signals
- Identified issues

This structured data ensures:

- Privacy-safe AI interaction
- Controlled system behavior
- Easy debugging and traceability

Raw HTML is never shared with AI services.

---

**11. AI-Assisted Redesign Planning Module**

The AI component of the system operates strictly at a planning level.

The AI receives:

- Structured analysis of the target website
- Optional layout signals from the reference website
- User-defined redesign goals

The AI is responsible for:

- Recommending section ordering
- Suggesting layout variants (e.g., centered, split)
- Advising on content tone and emphasis
- Identifying missing or redundant sections

The AI outputs only structured JSON containing high-level design decisions. It does not generate JSX, CSS, or any frontend code.

---

**12. Deterministic Code Generation Module**

This module is the core engineering component of the system.

It:

- Reads the AI-generated redesign plan
- Maps section types and variants to predefined React component templates
- Injects structured content into templates
- Assembles a complete React page layout
- Generates clean, readable, and reusable frontend source code

The code generation process is fully deterministic, meaning the same input always produces the same output.
In the absence of compile-time typing, the system enforces strict runtime validation and schema checks for all structured data and AI-generated outputs.

---

**13. Template Library**

The system maintains a curated library of frontend templates implemented using React and Tailwind CSS.

Templates are:

- Section-level components (Hero, Features, CTA, Footer)
- Written manually to ensure quality
- Reusable and extensible
- Independent of AI

These templates serve as the building blocks for all generated webpages.

---

**14. Output and Preview Module**

The final output of the system includes:

- Generated React frontend source code
- Tailwind-styled components
- A downloadable ZIP archive
- An optional live preview of the redesigned webpage

The output is designed to be directly deployable or customizable by developers.

---

**15. Technology Stack**

**Frontend:**

- React
- Tailwind CSS
- JavaScript (ES6+)

**Backend:**

- Node.js
- JavaScript (ES6+)
- Express.js (API layer)
- Cheerio for HTML parsing
- Playwright (optional, for JavaScript-heavy pages)

**AI Integration:**

- Large Language Model API
- Structured JSON prompt engineering

**Hosting:**

- Vercel (frontend hosting)
- Render (backend services, if required)

---

**16. Security and Privacy Considerations**

The system ensures:

- Raw webpage HTML is processed only on the backend
- No sensitive content is shared with AI services
- All crawled data is temporary and discarded after processing
- No user data is permanently stored

---

**17. Constraints**

- Serverless execution time limits
- Controlled AI token usage
- Limited crawling depth
- Single-page focus in MVP

---

**18. Success Criteria**

The project will be considered successful if:

- It can analyze real-world websites reliably
- The generated frontend code is clean and readable
- The redesign shows clear UX improvement
- The system behavior is deterministic and explainable
- The architecture can be clearly explained in interviews

---

**19. Future Enhancements**

Potential future improvements include:

- Support for additional frontend frameworks
- User-defined structured templates
- Multi-page website support
- Accessibility scoring and comparison
- Performance benchmarking

---

**20. Conclusion**

This project demonstrates a practical and responsible approach to AI-assisted frontend development. By separating redesign intelligence from code execution, the system ensures reliability, maintainability, and real-world applicability. It highlights strong system design, backend engineering, and thoughtful AI integration, making it a highly valuable project for full-stack and backend developer roles
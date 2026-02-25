/**
 * @file pipelineReducer.js
 * @description Pure reducer and action-type constants for the ReForge pipeline
 * state machine. Contains no side effects, no async logic, and no navigation.
 *
 * State machine transitions:
 *   idle → analyzing → planning → generating → complete
 *   any stage → error (via SET_ERROR)
 *   error | any → idle (via RESET)
 */

// ─── Action Type Constants ──────────────────────────────────────────────────

/** Store the user-supplied inputs before the pipeline starts. */
export const SET_INPUTS = 'SET_INPUTS';

/** Pipeline step 1 start: target URL analysis is in progress. */
export const ANALYZE_START = 'ANALYZE_START';

/** Pipeline step 1 success: analysis data received. */
export const ANALYZE_SUCCESS = 'ANALYZE_SUCCESS';

/** Pipeline step 2 start: AI redesign planning is in progress. */
export const PLAN_START = 'PLAN_START';

/** Pipeline step 2 success: redesign plan received. */
export const PLAN_SUCCESS = 'PLAN_SUCCESS';

/** Pipeline step 3 start: code generation is in progress. */
export const GENERATE_START = 'GENERATE_START';

/** Pipeline step 3 success: generated output received. Pipeline complete. */
export const GENERATE_SUCCESS = 'GENERATE_SUCCESS';

/** Any pipeline step failed; records a structured error. */
export const SET_ERROR = 'SET_ERROR';

/** Resets the entire state to initialState (used by the error page Retry flow). */
export const RESET = 'RESET';

// ─── Initial State ──────────────────────────────────────────────────────────

/**
 * @typedef {object} PipelineInputs
 * @property {string}   targetUrl    - The URL of the website to redesign.
 * @property {string}   referenceUrl - Optional reference site URL (empty string = not set).
 * @property {string[]} goals        - Ordered array of selected redesign goal IDs.
 */

/**
 * @typedef {'idle' | 'analyzing' | 'planning' | 'generating' | 'complete' | 'error'} PipelineStage
 */

/**
 * @typedef {object} PipelineError
 * @property {string} message - Human-readable error message.
 * @property {string} [code]  - Optional machine-readable error code.
 * @property {number} [status] - Optional HTTP status code.
 */

/**
 * @typedef {object} PipelineState
 * @property {PipelineStage}  stage             - Current pipeline stage.
 * @property {PipelineInputs} inputs            - User-supplied form values.
 * @property {object|null}    targetAnalysis    - Structured analysis of the target URL.
 * @property {object|null}    referenceAnalysis - Structured analysis of the reference URL.
 * @property {object|null}    redesignPlan      - AI-generated redesign plan.
 * @property {object|null}    generatedOutput   - Deterministically generated code output.
 * @property {PipelineError|null} error         - Structured error, or null when no error.
 */

/**
 * The initial application state. All nullable fields start as null.
 *
 * @type {PipelineState}
 */
export const initialState = {
    stage: 'idle',
    inputs: {
        targetUrl: '',
        referenceUrl: '',
        goals: [],
    },
    targetAnalysis: null,
    referenceAnalysis: null,
    redesignPlan: null,
    generatedOutput: null,
    error: null,
};

// ─── Reducer ────────────────────────────────────────────────────────────────

/**
 * Pure reducer for the ReForge pipeline state machine.
 *
 * Rules:
 *  - Must remain a pure function (no side effects, no async, no navigation).
 *  - Each action updates only the fields it is responsible for.
 *  - Unknown actions return state unchanged (no throw, no warning).
 *
 * @param {PipelineState} state  - Current state snapshot.
 * @param {{ type: string, payload?: object }} action - Dispatched action.
 * @returns {PipelineState} Next state snapshot.
 */
export function pipelineReducer(state, action) {
    switch (action.type) {
        case SET_INPUTS:
            return {
                ...state,
                inputs: {
                    targetUrl: action.payload.targetUrl,
                    referenceUrl: action.payload.referenceUrl,
                    goals: action.payload.goals,
                },
                // Clear any pre-existing error from a previous attempt
                error: null,
            };

        case ANALYZE_START:
            return {
                ...state,
                stage: 'analyzing',
                targetAnalysis: null,
                referenceAnalysis: null,
                redesignPlan: null,
                generatedOutput: null,
                error: null,
            };

        case ANALYZE_SUCCESS:
            return {
                ...state,
                targetAnalysis: action.payload.targetAnalysis,
                referenceAnalysis: action.payload.referenceAnalysis ?? null,
            };

        case PLAN_START:
            return {
                ...state,
                stage: 'planning',
            };

        case PLAN_SUCCESS:
            return {
                ...state,
                redesignPlan: action.payload.redesignPlan,
            };

        case GENERATE_START:
            return {
                ...state,
                stage: 'generating',
            };

        case GENERATE_SUCCESS:
            return {
                ...state,
                stage: 'complete',
                generatedOutput: action.payload.generatedOutput,
            };

        case SET_ERROR:
            return {
                ...state,
                stage: 'error',
                error: action.payload.error,
            };

        case RESET:
            return { ...initialState };

        default:
            return state;
    }
}

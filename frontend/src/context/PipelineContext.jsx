/**
 * @file PipelineContext.jsx
 * @description React context provider for the ReForge pipeline state machine.
 *
 * This file exports only the PipelineProvider component. The raw context object
 * lives in pipelineContextDef.js to satisfy the react-refresh ESLint rule
 * (component files must only export components).
 *
 * Usage:
 *   Wrap the application root in <PipelineProvider> (see main.jsx).
 *   Consume via the `usePipeline` hook (see usePipeline.js).
 */

import { useReducer } from 'react';
import PropTypes from 'prop-types';
import { pipelineReducer, initialState } from './pipelineReducer.js';
import PipelineContext from './pipelineContextDef.js';

// ─── Provider ───────────────────────────────────────────────────────────────

/**
 * PipelineProvider – wraps the application and makes pipeline state available
 * to all descendant components via context.
 *
 * Responsibilities:
 *  - Initialises `useReducer` with the pipeline reducer and initial state.
 *  - Provides `{ state, dispatch }` to the context value.
 *  - Contains NO business logic, NO API calls, NO navigation.
 *
 * @param {object}      props          - Component props.
 * @param {React.ReactNode} props.children - Child components.
 * @returns {JSX.Element}
 */
function PipelineProvider({ children }) {
    const [state, dispatch] = useReducer(pipelineReducer, initialState);

    return (
        <PipelineContext.Provider value={{ state, dispatch }}>
            {children}
        </PipelineContext.Provider>
    );
}

PipelineProvider.propTypes = {
    /** Child components that can consume the pipeline context. */
    children: PropTypes.node.isRequired,
};

export default PipelineProvider;

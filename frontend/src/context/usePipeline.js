/**
 * @file usePipeline.js
 * @description Custom React hook for consuming the PipelineContext.
 *
 * Returns `{ state, dispatch }` for components that need to read or
 * update the global pipeline state.
 *
 * Throws an error if called outside a `<PipelineProvider>`, which
 * prevents silent failures caused by missing provider wrapping.
 */

import { useContext } from 'react';
import PipelineContext from './pipelineContextDef.js';

/**
 * usePipeline – consume the pipeline context.
 *
 * @returns {{ state: import('./pipelineReducer.js').PipelineState, dispatch: React.Dispatch<{ type: string, payload?: object }> }}
 * @throws {Error} If called outside of a `<PipelineProvider>`.
 */
function usePipeline() {
    const context = useContext(PipelineContext);

    if (context === undefined) {
        throw new Error(
            'usePipeline must be used within a <PipelineProvider>. ' +
            'Wrap your application root with <PipelineProvider> in main.jsx.'
        );
    }

    return context;
}

export default usePipeline;

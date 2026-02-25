/**
 * @file pipelineContextDef.js
 * @description Creates and exports the raw PipelineContext object.
 *
 * Separated from PipelineContext.jsx (the provider component) so that
 * the react-refresh ESLint rule is satisfied — component files must
 * only export components.
 *
 * Consumers should use the `usePipeline` hook rather than importing
 * this context directly.
 */

import { createContext } from 'react';

/**
 * PipelineContext – holds `{ state, dispatch }`.
 *
 * Default value is `undefined` so that `usePipeline` can detect usage
 * outside a provider and throw an informative error.
 *
 * @type {React.Context<{ state: import('./pipelineReducer.js').PipelineState, dispatch: React.Dispatch<{ type: string, payload?: object }> } | undefined>}
 */
const PipelineContext = createContext(undefined);

export default PipelineContext;

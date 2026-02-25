/**
 * @file App.jsx
 * @description Root application component. Configures React Router with the
 * AppLayout shell and registers all page routes:
 *   /          → Home
 *   /generate  → Generate
 *   /analysis  → Analysis (analysis result + plan trigger)
 *   /plan      → Plan (redesign plan + code gen trigger)
 *   /results   → Results (static preview page)
 *   /error     → Error   (static error page)
 */

import PropTypes from 'prop-types';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Home from './pages/Home';
import Generate from './pages/Generate';
import Analysis from './pages/Analysis';
import Plan from './pages/Plan';
import Results from './pages/Results';
import Error from './pages/Error';

/**
 * App – root router and layout mount point.
 *
 * @returns {JSX.Element}
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="generate" element={<Generate />} />
          <Route path="analysis" element={<Analysis />} />
          <Route path="plan" element={<Plan />} />
          <Route path="results" element={<Results />} />
          <Route path="error" element={<Error />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

App.propTypes = {};

export default App;

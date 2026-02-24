/**
 * @file Spinner.jsx
 * @description Accessible loading spinner using Tailwind's animate-spin utility.
 * Pure CSS animation — no JavaScript animation libraries. Includes a
 * visually-hidden label for screen-reader accessibility.
 */

import PropTypes from 'prop-types';

/**
 * Spinner – animated loading indicator.
 *
 * Uses Tailwind's `animate-spin` class for the animation. The visible ring
 * references design tokens for its border color. Includes a visually-hidden
 * "Loading…" label for accessibility.
 *
 * @param {'sm'|'md'|'lg'} [props.size]  - Controls diameter of the spinner.
 * @param {string}          [props.className] - Additional Tailwind classes.
 * @returns {JSX.Element}
 */
function Spinner({ size = 'md', className = '' }) {
    const sizeClasses = {
        sm: 'h-4 w-4 border-2',
        md: 'h-8 w-8 border-2',
        lg: 'h-12 w-12 border-4',
    };

    return (
        <span role="status" className={`inline-flex items-center justify-center ${className}`.trim()}>
            <span
                className={`animate-spin rounded-full border-light-gray-dark border-t-primary ${sizeClasses[size]}`}
                aria-hidden="true"
            />
            <span className="sr-only">Loading…</span>
        </span>
    );
}

Spinner.propTypes = {
    /** Visual size of the spinner */
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
    /** Additional Tailwind utility classes on the wrapper span */
    className: PropTypes.string,
};

export default Spinner;

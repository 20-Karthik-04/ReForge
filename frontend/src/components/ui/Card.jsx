/**
 * @file Card.jsx
 * @description Simple content card container with padding, rounded corners,
 * and a shadow. Purely presentational — no business logic. All styling
 * references design tokens defined in tailwind.config.js.
 */

import PropTypes from 'prop-types';

/**
 * Card – padded container with rounded corners and a shadow.
 *
 * @param {object}  props            - Component props.
 * @param {React.ReactNode} props.children  - Content to render inside the card.
 * @param {string}  [props.className]       - Additional Tailwind classes to merge.
 * @returns {JSX.Element}
 */
function Card({ children, className = '' }) {
    return (
        <div
            className={`rounded-card bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover ${className}`.trim()}
        >
            {children}
        </div>
    );
}

Card.propTypes = {
    /** Content rendered inside the card */
    children: PropTypes.node.isRequired,
    /** Additional Tailwind utility classes */
    className: PropTypes.string,
};

export default Card;

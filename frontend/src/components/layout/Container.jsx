/**
 * @file Container.jsx
 * @description Responsive max-width wrapper component. Centers content with
 * consistent horizontal padding across breakpoints. Purely presentational.
 */

import PropTypes from 'prop-types';

/**
 * Container – max-width wrapper that centers page content.
 *
 * Renders a block-level element capped at the configured `max-w-container`
 * design token, with responsive horizontal padding using the
 * `container-x` spacing token.
 *
 * @param {object}  props            - Component props.
 * @param {React.ReactNode} props.children  - Content to render inside the container.
 * @param {string}  [props.className]       - Additional Tailwind classes to merge.
 * @param {string}  [props.as]              - HTML element to render (default: "div").
 * @returns {JSX.Element}
 */
function Container({ children, className = '', as = 'div' }) {
    const Tag = as;

    return (
        <Tag
            className={`mx-auto w-full max-w-container px-container-x lg:px-container-x-lg ${className}`.trim()}
        >
            {children}
        </Tag>
    );
}

Container.propTypes = {
    /** Content rendered inside the container */
    children: PropTypes.node.isRequired,
    /** Additional Tailwind utility classes */
    className: PropTypes.string,
    /** HTML element type to render as */
    as: PropTypes.string,
};

export default Container;

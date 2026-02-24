/**
 * @file Section.jsx
 * @description Vertical spacing wrapper component. Applies consistent top/bottom
 * padding to separate content sections. Purely presentational.
 */

import PropTypes from 'prop-types';

/**
 * Section – vertical rhythm spacing wrapper.
 *
 * Applies the `section-y` spacing token as vertical padding so all page
 * sections remain consistently spaced. Supports a compact variant via the
 * `compact` prop.
 *
 * @param {object}  props            - Component props.
 * @param {React.ReactNode} props.children  - Content to render inside the section.
 * @param {string}  [props.className]       - Additional Tailwind classes to merge.
 * @param {string}  [props.as]              - HTML element to render (default: "section").
 * @param {boolean} [props.compact]         - Use compact (`section-y-sm`) vertical padding.
 * @returns {JSX.Element}
 */
function Section({ children, className = '', as = 'section', compact = false }) {
    const Tag = as;
    const paddingClass = compact ? 'py-section-y-sm' : 'py-section-y';

    return (
        <Tag className={`${paddingClass} ${className}`.trim()}>
            {children}
        </Tag>
    );
}

Section.propTypes = {
    /** Content rendered inside the section */
    children: PropTypes.node.isRequired,
    /** Additional Tailwind utility classes */
    className: PropTypes.string,
    /** HTML element type to render as */
    as: PropTypes.string,
    /** Apply compact vertical padding (section-y-sm) instead of full section-y */
    compact: PropTypes.bool,
};

export default Section;

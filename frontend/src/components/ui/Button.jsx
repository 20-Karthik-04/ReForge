/**
 * @file Button.jsx
 * @description Reusable button component with primary and secondary variants.
 * Accessible, purely presentational, no business logic. All colors reference
 * design tokens defined in tailwind.config.js.
 */

import PropTypes from 'prop-types';

/**
 * Button – base button primitive with variant and disabled support.
 *
 * @param {object}   props              - Component props.
 * @param {React.ReactNode} props.children   - Button label or content.
 * @param {'primary'|'secondary'} [props.variant] - Visual variant (default: "primary").
 * @param {boolean}  [props.disabled]         - Disables the button when true.
 * @param {Function} [props.onClick]           - Click handler.
 * @param {'button'|'submit'|'reset'} [props.type] - HTML button type (default: "button").
 * @param {string}   [props.className]         - Additional Tailwind classes to merge.
 * @returns {JSX.Element}
 */
function Button({
    children,
    variant = 'primary',
    disabled = false,
    onClick,
    type = 'button',
    className = '',
}) {
    const base =
        'inline-flex items-center justify-center rounded-button px-5 py-2.5 text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-button';

    const variants = {
        primary:
            'bg-gradient-to-r from-primary to-primary-light text-white hover:brightness-90 focus-visible:ring-primary shadow-button-primary',
        secondary:
            'border border-primary bg-transparent text-primary hover:bg-light-gray focus-visible:ring-primary',
    };

    return (
        <button
            type={type}
            disabled={disabled}
            onClick={onClick}
            className={`${base} ${variants[variant]} ${className}`.trim()}
        >
            {children}
        </button>
    );
}

Button.propTypes = {
    /** Button label or nested elements */
    children: PropTypes.node.isRequired,
    /** Visual style variant */
    variant: PropTypes.oneOf(['primary', 'secondary']),
    /** Render as disabled */
    disabled: PropTypes.bool,
    /** Click handler */
    onClick: PropTypes.func,
    /** HTML button type attribute */
    type: PropTypes.oneOf(['button', 'submit', 'reset']),
    /** Additional Tailwind utility classes */
    className: PropTypes.string,
};

export default Button;

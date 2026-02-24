/**
 * @file Alert.jsx
 * @description Accessible alert component for success, error, and warning
 * states. Uses ARIA role="alert" for immediate announcement. All colors
 * reference status design tokens defined in tailwind.config.js.
 */

import PropTypes from 'prop-types';

/**
 * Alert – contextual feedback message with success, error, or warning styling.
 *
 * Renders with `role="alert"` so assistive technologies announce the message
 * immediately. Colors are drawn exclusively from the `status.*` design tokens.
 *
 * @param {'success'|'error'|'warning'} props.variant - Alert type.
 * @param {string}  props.message     - Message text to display.
 * @param {string}  [props.className] - Additional Tailwind classes on the wrapper.
 * @returns {JSX.Element}
 */
function Alert({ variant, message, className = '' }) {
    const variants = {
        success: {
            wrapper: 'bg-status-success-bg border border-status-success-border text-status-success',
            icon: '✓',
            label: 'Success',
        },
        error: {
            wrapper: 'bg-status-error-bg border border-status-error-border text-status-error',
            icon: '✕',
            label: 'Error',
        },
        warning: {
            wrapper: 'bg-status-warning-bg border border-status-warning-border text-status-warning',
            icon: '⚠',
            label: 'Warning',
        },
    };

    const { wrapper, icon, label } = variants[variant];

    return (
        <div
            role="alert"
            aria-label={label}
            className={`flex items-start gap-2.5 rounded-input px-4 py-3 text-sm font-medium ${wrapper} ${className}`.trim()}
        >
            <span aria-hidden="true" className="mt-px shrink-0 text-base leading-none">
                {icon}
            </span>
            <span>{message}</span>
        </div>
    );
}

Alert.propTypes = {
    /** Visual and semantic variant */
    variant: PropTypes.oneOf(['success', 'error', 'warning']).isRequired,
    /** Message text displayed inside the alert */
    message: PropTypes.string.isRequired,
    /** Additional Tailwind utility classes on the wrapper div */
    className: PropTypes.string,
};

export default Alert;

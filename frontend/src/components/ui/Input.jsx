/**
 * @file Input.jsx
 * @description Fully controlled text input wrapper with accessible label and
 * optional error message. No internal state — value and onChange are required.
 * All colors reference design tokens defined in tailwind.config.js.
 */

import PropTypes from 'prop-types';

/**
 * Input – controlled input field with label and error-state support.
 *
 * The component is fully controlled: it does NOT manage internal state.
 * The parent must supply `value` and `onChange`.
 *
 * @param {object}  props              - Component props.
 * @param {string}  props.id           - Unique id — associates <label> with <input>.
 * @param {string}  props.label        - Visible label text.
 * @param {string}  props.value        - Controlled input value (required).
 * @param {Function} props.onChange    - Change handler (required).
 * @param {string}  [props.type]       - HTML input type (default: "text").
 * @param {string}  [props.placeholder] - Placeholder text.
 * @param {string}  [props.error]      - Error message. Renders below input when present.
 * @param {string}  [props.className]  - Additional classes applied to the wrapper div.
 * @returns {JSX.Element}
 */
function Input({
    id,
    label,
    value,
    onChange,
    type = 'text',
    placeholder = '',
    error = '',
    className = '',
}) {
    const inputBase =
        'block w-full rounded-input border px-3 py-2 text-sm text-dark-navy placeholder-dark-navy/40 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent';

    const inputState = error
        ? 'border-status-error focus:ring-status-error bg-status-error-bg'
        : 'border-light-gray-dark bg-light-gray';

    return (
        <div className={`flex flex-col gap-1 ${className}`.trim()}>
            <label
                htmlFor={id}
                className="text-sm font-medium text-dark-navy"
            >
                {label}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${id}-error` : undefined}
                className={`${inputBase} ${inputState}`}
            />
            {error && (
                <p
                    id={`${id}-error`}
                    role="alert"
                    className="text-xs text-status-error"
                >
                    {error}
                </p>
            )}
        </div>
    );
}

Input.propTypes = {
    /** Unique id linking the label to the input */
    id: PropTypes.string.isRequired,
    /** Visible label text */
    label: PropTypes.string.isRequired,
    /** Controlled value — parent manages state */
    value: PropTypes.string.isRequired,
    /** Controlled onChange handler — parent manages state */
    onChange: PropTypes.func.isRequired,
    /** HTML input type */
    type: PropTypes.string,
    /** Placeholder text */
    placeholder: PropTypes.string,
    /** Error message displayed below input; sets aria-invalid when present */
    error: PropTypes.string,
    /** Additional Tailwind classes on the wrapper div */
    className: PropTypes.string,
};

export default Input;

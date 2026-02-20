/**
 * @fileoverview FeatureCard sub-component for the FeaturesSection template.
 *
 * Renders a single feature item with an icon, title, and description.
 * Used internally by FeaturesSection — not intended to be used standalone
 * in generated pages but may be imported by Phase 8 for granular assembly.
 *
 * @module FeatureCard
 */

import PropTypes from 'prop-types';
import { cn } from '../templateUtils.js';

/**
 * FeatureCard — Displays a single feature with icon, title, and description.
 *
 * @component
 * @param {object} props
 * @param {string} [props.icon] - URL or inline SVG string for the feature icon.
 * @param {string} props.title - Feature title (required).
 * @param {string} [props.description] - Supporting description text.
 * @param {'grid'|'list'} [props.layout='grid'] - Controls card orientation.
 *   - 'grid': Icon above title/description (vertical stack).
 *   - 'list': Icon left of title/description (horizontal stack).
 *
 * @example
 * <FeatureCard
 *   icon="https://example.com/icon.svg"
 *   title="Lightning Fast"
 *   description="Generate pages in seconds with our AI engine."
 * />
 */
function FeatureCard({ icon, title, description, layout }) {
    const isList = layout === 'list';

    return (
        <article
            className={cn(
                'group flex rounded-2xl bg-dark-navy-light/60 ring-1 ring-white/10 p-6 transition-colors duration-200 hover:bg-dark-navy-light hover:ring-white/20',
                isList ? 'flex-row items-start gap-5' : 'flex-col items-start gap-4'
            )}
        >
            {/* Icon */}
            {icon && (
                <div
                    className={cn(
                        'flex shrink-0 items-center justify-center rounded-xl bg-primary-blue/20 text-primary-blue',
                        isList ? 'h-12 w-12' : 'h-14 w-14'
                    )}
                    aria-hidden="true"
                >
                    <img
                        src={icon}
                        alt=""
                        className="h-7 w-7 object-contain"
                        loading="lazy"
                    />
                </div>
            )}

            {/* Text block */}
            <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold text-white leading-snug">
                    {title}
                </h3>
                {description && (
                    <p className="text-sm text-white/60 leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
        </article>
    );
}

FeatureCard.defaultProps = {
    icon: '',
    description: '',
    layout: 'grid',
};

FeatureCard.propTypes = {
    /** URL of the feature icon image. */
    icon: PropTypes.string,
    /** Feature title — required. */
    title: PropTypes.string.isRequired,
    /** Supporting description text. */
    description: PropTypes.string,
    /** Card orientation: 'grid' stacks vertically, 'list' places icon left. */
    layout: PropTypes.oneOf(['grid', 'list']),
};

export default FeatureCard;

import { useEffect } from 'react';

/**
 * Adds scroll-reveal animation to elements with .scroll-reveal,
 * .scroll-reveal-left, .scroll-reveal-right classes.
 * Call this hook in any page component.
 */
export default function useScrollReveal() {
  useEffect(() => {
    const selector = '.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right';
    const observed = new WeakSet();

    const reveal = (element) => {
      element.classList.add('revealed');
    };

    const intersectionObserver = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              reveal(entry.target);
              intersectionObserver.unobserve(entry.target);
            });
          },
          { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
        )
      : null;

    const observeMatchingElements = () => {
      document.querySelectorAll(selector).forEach((element) => {
        if (observed.has(element)) return;
        observed.add(element);

        if (!intersectionObserver) {
          reveal(element);
          return;
        }

        intersectionObserver.observe(element);
      });
    };

    observeMatchingElements();

    const fallbackTimer = window.setTimeout(() => {
      document.querySelectorAll(selector).forEach(reveal);
    }, 250);

    const mutationObserver = new MutationObserver(() => {
      observeMatchingElements();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      window.clearTimeout(fallbackTimer);
      intersectionObserver?.disconnect();
      mutationObserver.disconnect();
    };
  }, []);
}

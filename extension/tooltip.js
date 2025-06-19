// tooltip.js - Custom tooltip logic for elements with data-tooltip

// Tooltip state and functions
let tooltipDiv;

/**
 * Shows a tooltip with the text from the data-tooltip attribute
 * @param {Event} e - The mouseenter event
 */
export function showTooltip(e) {
  const text = e.target.getAttribute('data-tooltip');
  if (!text) return;
  tooltipDiv = document.createElement('div');
  tooltipDiv.textContent = text;
  tooltipDiv.style.position = 'fixed';
  tooltipDiv.style.background = '#222';
  tooltipDiv.style.color = '#fff';
  tooltipDiv.style.padding = '6px 12px';
  tooltipDiv.style.borderRadius = '6px';
  tooltipDiv.style.fontSize = '13px';
  tooltipDiv.style.zIndex = 9999;
  tooltipDiv.style.pointerEvents = 'none';
  tooltipDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.18)';
  tooltipDiv.style.transition = 'opacity 0.1s';
  tooltipDiv.style.opacity = '0';
  document.body.appendChild(tooltipDiv);
  // Arrow
  const arrow = document.createElement('div');
  arrow.style.position = 'absolute';
  arrow.style.bottom = '-8px';
  arrow.style.left = '50%';
  arrow.style.transform = 'translateX(-50%)';
  arrow.style.width = '0';
  arrow.style.height = '0';
  arrow.style.borderLeft = '8px solid transparent';
  arrow.style.borderRight = '8px solid transparent';
  arrow.style.borderTop = '8px solid #222';
  tooltipDiv.appendChild(arrow);
  // Position after render
  requestAnimationFrame(() => {
    const rect = e.target.getBoundingClientRect();
    tooltipDiv.style.left = rect.left + rect.width / 2 - tooltipDiv.offsetWidth / 2 + 'px';
    tooltipDiv.style.top = rect.top - tooltipDiv.offsetHeight - 12 + window.scrollY + 'px';
    tooltipDiv.style.opacity = '1';
  });
}

/**
 * Updates the tooltip position when the mouse moves
 * @param {Event} e - The mousemove event
 */
export function moveTooltip(e) {
  if (!tooltipDiv) return;
  const rect = e.target.getBoundingClientRect();
  tooltipDiv.style.left = rect.left + rect.width / 2 - tooltipDiv.offsetWidth / 2 + 'px';
  tooltipDiv.style.top = rect.top - tooltipDiv.offsetHeight - 12 + window.scrollY + 'px';
}

/**
 * Hides and removes the tooltip
 */
export function hideTooltip() {
  if (tooltipDiv) {
    tooltipDiv.remove();
    tooltipDiv = null;
  }
}

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  document.body.addEventListener('mouseenter', (e) => {
    if (e.target && e.target.getAttribute('data-tooltip')) showTooltip(e);
  }, true);
  
  document.body.addEventListener('mousemove', (e) => {
    if (e.target && e.target.getAttribute('data-tooltip')) moveTooltip(e);
  }, true);
  
  document.body.addEventListener('mouseleave', (e) => {
    if (e.target && e.target.getAttribute('data-tooltip')) hideTooltip();
  }, true);
});

// Functions are already exported at the top with the export keyword

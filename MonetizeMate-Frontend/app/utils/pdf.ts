// Renders an HTML fragment + its CSS off-screen and saves it as a real PDF
// file via html2pdf.js — a genuine one-click download, unlike window.print()
// which always hands control to the browser's print dialog.
const A4_WIDTH_PX = 794; // ~210mm at 96dpi, keeps html2canvas layout consistent

// Fire-and-forget: report generation happens entirely client-side, so there's
// no backend request to count downloads from unless we explicitly tell it.
// Never let this block or fail the actual download.
function trackDownload(source: string): void {
    fetch('/api/activity/track-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source }),
    }).catch(() => { /* best-effort only — a failed ping shouldn't surface to the user */ });
}

export async function downloadHtmlAsPdf(bodyHtml: string, styles: string, filename: string, trackingSource?: string): Promise<void> {
    const html2pdf = (await import('html2pdf.js')).default;

    const styleEl = document.createElement('style');
    styleEl.textContent = styles;

    const content = document.createElement('div');
    content.innerHTML = bodyHtml;
    content.style.width = `${A4_WIDTH_PX}px`;
    content.style.background = '#ffffff';

    // A full-viewport `fixed` overlay shifted off-screen, holding our content
    // — the same wrapping technique html2pdf.js uses internally. A plain
    // hidden div relying on auto/content-driven height was NOT reliably
    // captured by html2canvas's clone step (it measured 0 height there even
    // though the live element's own bounding rect was correct) — explicitly
    // measuring and locking in a pixel height below is what actually fixes it.
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.left = '-100000px';
    overlay.style.top = '0';
    overlay.appendChild(styleEl);
    overlay.appendChild(content);
    document.body.appendChild(overlay);

    await new Promise((resolve) => requestAnimationFrame(resolve));
    const measuredHeight = Math.ceil(content.getBoundingClientRect().height);
    content.style.height = `${measuredHeight}px`;

    // html2canvas's crop-to-target isn't reliable about excluding other
    // `position: fixed` chrome (e.g. a floating help/chat button rendered in
    // the root layout) even though it's positioned off-screen and shouldn't
    // geometrically overlap — it bled into captures during testing. Hiding
    // every other fixed element for the moment of capture is more robust
    // than trying to out-guess html2canvas's stacking/crop logic, and avoids
    // coupling this shared utility to any specific widget's class name.
    const hiddenFixedElements: { el: HTMLElement; prevVisibility: string }[] = [];
    document.querySelectorAll<HTMLElement>('body *').forEach((el) => {
        if (el === overlay || overlay.contains(el)) return;
        if (getComputedStyle(el).position === 'fixed') {
            hiddenFixedElements.push({ el, prevVisibility: el.style.visibility });
            el.style.visibility = 'hidden';
        }
    });

    try {
        await html2pdf()
            .set({
                margin: 0,
                filename,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, windowWidth: A4_WIDTH_PX, backgroundColor: '#ffffff' },
                jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
                // Not in html2pdf.js's bundled type defs, but a real supported option at runtime.
                ...({ pagebreak: { mode: ['css', 'legacy'] } } as object),
            })
            .from(content)
            .save();
        if (trackingSource) trackDownload(trackingSource);
    } finally {
        document.body.removeChild(overlay);
        hiddenFixedElements.forEach(({ el, prevVisibility }) => { el.style.visibility = prevVisibility; });
    }
}

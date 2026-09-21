import re

with open("src/index.css", "r", encoding="utf-8") as f:
    css = f.read()

new_print_css = """
/* Print Formatting for Dashboard Layout & A4 Preview */
@media print {
  @page {
    size: A4 portrait;
    margin: 10mm 12mm 10mm 12mm;
  }

  /* Base Print Resets */
  body, html, #root {
    background: white !important;
    color: black !important;
    height: auto !important;
    min-height: auto !important;
    overflow: visible !important;
    position: static !important;
  }

  /* Hide background animations, UI headers, and no-print elements */
  .no-print,
  .no-print *,
  .bg-gradient-to-b, 
  .fixed.inset-0.z-\\[-3\\], 
  .fixed.inset-0.z-\\[-1\\],
  [class*="bg-[radial-gradient"] {
    display: none !important;
  }

  /* Reset Layout Constraints & Scroll Containers */
  .overflow-hidden, .overflow-y-auto, .overflow-x-auto, 
  main, .h-screen, .min-h-screen, .max-h-screen, .min-h-\\[100dvh\\], .h-\\[100dvh\\],
  .fixed, .absolute, .backdrop-blur-md {
    position: static !important;
    overflow: visible !important;
    height: auto !important;
    min-height: auto !important;
    max-height: none !important;
    background: transparent !important;
  }

  /* Text and Background Overrides for Print */
  * {
    color: black !important;
    box-shadow: none !important;
    text-shadow: none !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Print Page Sheet (A4) */
  .print-page {
    width: 100% !important;
    max-width: none !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
    page-break-after: always !important;
    break-after: page !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: space-between !important;
  }

  .print-page:last-child {
    page-break-after: avoid !important;
    break-after: auto !important;
  }

  /* Table Formatting */
  table {
    width: 100% !important;
    border-collapse: collapse !important;
    page-break-inside: auto !important;
  }

  tr, li, .break-inside-avoid {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  th, td {
    border: 1px solid #64748b !important;
    padding: 0.4rem !important;
    text-align: left !important;
    background: white !important;
  }

  th {
    background: #f1f5f9 !important;
    font-weight: bold !important;
  }

  h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid !important;
    break-after: avoid !important;
  }

  img {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
}
"""

# Replace old print media block or append
if "/* Print Formatting for Dashboard Layout" in css:
    css = re.sub(r"/\* Print Formatting for Dashboard Layout.*", new_print_css, css, flags=re.DOTALL)
else:
    css += "\n" + new_print_css

with open("src/index.css", "w", encoding="utf-8") as f:
    f.write(css)

print("Updated index.css print rules successfully")

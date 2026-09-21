import re

with open("src/components/questionBank/PrintPreviewModal.tsx", "r", encoding="utf-8") as f:
    modal = f.read()

# Replace flex-related classes on the print-page container to ensure block layout for PDF rendering
modal = modal.replace('print-page bg-white text-black w-[210mm] max-w-[95vw] sm:max-w-[210mm] min-h-[297mm] shadow-2xl print:shadow-none p-8 sm:p-10 print:p-0 border border-slate-300 print:border-none relative flex flex-col justify-between mb-8 print:mb-0 mx-auto rounded-sm print:rounded-none select-text', 'print-page bg-white text-black w-[210mm] max-w-[95vw] sm:max-w-[210mm] min-h-[297mm] shadow-2xl print:shadow-none p-8 sm:p-10 print:p-0 border border-slate-300 print:border-none relative block print:block mb-8 print:mb-0 mx-auto rounded-sm print:rounded-none select-text')

modal = modal.replace('print-page bg-white text-black w-[210mm] max-w-[95vw] sm:max-w-[210mm] min-h-[297mm] shadow-2xl print:shadow-none p-8 sm:p-10 print:p-0 border border-slate-300 print:border-none relative flex flex-col justify-between mx-auto rounded-sm print:rounded-none select-text', 'print-page bg-white text-black w-[210mm] max-w-[95vw] sm:max-w-[210mm] min-h-[297mm] shadow-2xl print:shadow-none p-8 sm:p-10 print:p-0 border border-slate-300 print:border-none relative block print:block mx-auto rounded-sm print:rounded-none select-text')

# Replace the inner spacer from justify-between layout
modal = modal.replace('space-y-8', 'space-y-8 print:space-y-0')

with open("src/components/questionBank/PrintPreviewModal.tsx", "w", encoding="utf-8") as f:
    f.write(modal)

print("Modal classes updated for block print layout")

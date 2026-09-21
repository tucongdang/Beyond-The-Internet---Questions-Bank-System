import re

with open("src/components/questionBank/PrintPreviewModal.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Remove min-h-[297mm] and explicit height/width constraints that might mess up print
code = code.replace(
    'className="print-page bg-white text-black w-[210mm] max-w-[95vw] sm:max-w-[210mm] min-h-[297mm] shadow-2xl print:shadow-none p-8 sm:p-10 print:p-0 border border-slate-300 print:border-none relative block print:block mx-auto rounded-sm print:rounded-none select-text"',
    'className="print-page bg-white text-black w-full max-w-[95vw] sm:max-w-[210mm] print:max-w-none min-h-[297mm] print:min-h-0 shadow-2xl print:shadow-none p-8 sm:p-10 print:p-0 border border-slate-300 print:border-none relative block print:block mx-auto rounded-sm print:rounded-none select-text"'
)

# And for the other occurrences:
code = code.replace('w-[210mm]', 'w-full print:w-full')
code = code.replace('min-h-[297mm]', 'min-h-[297mm] print:min-h-0')

with open("src/components/questionBank/PrintPreviewModal.tsx", "w", encoding="utf-8") as f:
    f.write(code)

print("Cleaned up print classes")

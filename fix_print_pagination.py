import re

with open("src/components/questionBank/PrintPreviewModal.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Change default itemsPerPage to 0 (Auto/Native pagination)
code = re.sub(r'useState<number>\(\s*10\s*\)', 'useState<number>(0)', code)

# Change the option text
code = code.replace('Toàn bộ (1 trang)', 'Tự động ngắt trang')

with open("src/components/questionBank/PrintPreviewModal.tsx", "w", encoding="utf-8") as f:
    f.write(code)

print("Updated PrintPreviewModal.tsx to default to native pagination (0)")

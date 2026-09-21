import re

with open("src/utils/printExport.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("q.round_format === 'VCNV_7_HANG'", "q.round_format === 'VCNV_HANG_NGANG'")

with open("src/utils/printExport.ts", "w", encoding="utf-8") as f:
    f.write(content)

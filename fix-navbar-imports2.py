import re
with open("src/components/Navbar.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("  Download,\n", "  Download,\n  Settings,\n")
if "Settings," not in content:
    content = content.replace("Download,", "Download, Settings,")

with open("src/components/Navbar.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed Navbar imports properly")

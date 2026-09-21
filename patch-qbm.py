import re

with open("src/services/questionBankManager.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("import {\n  QuestionItem,", "import {\n  QuestionItem,\n  QuestionActivityLog,")
content = content.replace("let updatedQ = {", "let updatedQ: QuestionItem = {")

with open("src/services/questionBankManager.ts", "w", encoding="utf-8") as f:
    f.write(content)

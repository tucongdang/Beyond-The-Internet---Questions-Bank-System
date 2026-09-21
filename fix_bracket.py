import re

with open("src/components/questionBank/QuestionBankDashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("setSelectedIds(new Set());\n    });", "setSelectedIds(new Set());")
content = content.replace("notifyBatchApprove(count);\n      \n    });", "notifyBatchApprove(count);")

with open("src/components/questionBank/QuestionBankDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)

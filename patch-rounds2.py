import re

with open("src/components/questionBank/QuestionBankDashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("(roundCounts.KHOI_DONG / totalGameshowQuestions)", "(roundCounts.KHOI_DONG.total / totalGameshowQuestions)")
content = content.replace("(roundCounts.VCNV / totalGameshowQuestions)", "(roundCounts.VCNV.total / totalGameshowQuestions)")
content = content.replace("(roundCounts.TANG_TOC / totalGameshowQuestions)", "(roundCounts.TANG_TOC.total / totalGameshowQuestions)")
content = content.replace("(roundCounts.VE_DICH / totalGameshowQuestions)", "(roundCounts.VE_DICH.total / totalGameshowQuestions)")

with open("src/components/questionBank/QuestionBankDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)

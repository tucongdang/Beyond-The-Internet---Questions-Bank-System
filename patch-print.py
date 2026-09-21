import re

with open("src/components/questionBank/PrintPreviewModal.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix options.length
content = content.replace("q.options && q.options.length > 0", "q.options && Object.keys(q.options).length > 0")

# Fix list rendering
# {q.options.map((opt, i) => (
#   <li key={i} className={i === q.correct_option_index ? 'font-bold' : ''}>
#     {opt}
#   </li>
# ))}
old_list = """{q.options.map((opt, i) => (
                          <li key={i} className={i === q.correct_option_index ? 'font-bold' : ''}>
                            {opt}
                          </li>
                        ))}"""
new_list = """{Object.entries(q.options).map(([k, opt]) => (
                          <li key={k} className={k === q.correct_key ? 'font-bold' : ''}>
                            {k}. {opt}
                          </li>
                        ))}"""
content = content.replace(old_list, new_list)
# wait, my PrintPreviewModal template didn't use Object.entries, let's just do a regex replace or straight replacement.
# Let's see what it exactly was.

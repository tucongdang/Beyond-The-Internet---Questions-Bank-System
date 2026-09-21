import re

with open("src/index.css", "r", encoding="utf-8") as f:
    css = f.read()

# Make sure print-page uses block layout in print to allow internal page breaks
css = css.replace("display: flex !important;", "display: block !important;")
css = css.replace("flex-direction: column !important;", "")

# Reinforce the category page break rules
enhanced_rules = """
  /* Question Category & Major Section Break Rules - Strongly Enforced */
  .question-category-container,
  .question-category-section,
  .category-section-container,
  .major-category-section,
  .page-break-before {
    display: block !important;
    page-break-before: always !important;
    break-before: page !important;
    margin-top: 0 !important;
  }

  .question-category-container:first-child,
  .question-category-section:first-child,
  .category-section-container:first-child,
  .major-category-section:first-child,
  .question-category-container.no-break-first {
    page-break-before: auto !important;
    break-before: auto !important;
  }
"""

if "/* Question Category & Major Section Break Rules - Strongly Enforced */" not in css:
    css = re.sub(r"/\* Question Category & Major Section Break Rules \*/.*?\}\n", enhanced_rules, css, flags=re.DOTALL)

with open("src/index.css", "w", encoding="utf-8") as f:
    f.write(css)

print("CSS updated for stronger page breaks.")

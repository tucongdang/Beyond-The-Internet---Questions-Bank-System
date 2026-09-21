import re

with open("src/components/questionBank/QuestionBankDashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add state
state_stmt = """  const [showTagsManagerModal, setShowTagsManagerModal] = useState<boolean>(false);
  const [showPrintPreviewModal, setShowPrintPreviewModal] = useState<boolean>(false);"""

content = re.sub(
    r"const \[showTagsManagerModal, setShowTagsManagerModal\] = useState<boolean>\(false\);",
    state_stmt,
    content
)

# Add Modal
modal_stmt = """      {/* Random Exam Generator Modal */}
      {showExamModal && (
        <RandomExamGeneratorModal 
          onClose={() => setShowExamModal(false)}
        />
      )}

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={showPrintPreviewModal}
        onClose={() => setShowPrintPreviewModal(false)}
        questions={filteredQuestions}
      />"""

content = re.sub(
    r"\{\/\* Random Exam Generator Modal \*\/\}\s*\{showExamModal && \(\s*<RandomExamGeneratorModal\s*onClose=\{\(\) => setShowExamModal\(false\)\}\s*\/>\s*\)\}",
    modal_stmt,
    content
)

with open("src/components/questionBank/QuestionBankDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)

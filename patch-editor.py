import re

with open("src/components/questionBank/QuestionEditorModal.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add useCallback to React import
content = content.replace("import React, { useState, useEffect, useRef }", "import React, { useState, useEffect, useRef, useCallback }")

# Add ApprovalStatus to types import
content = content.replace("  RoundType } from '../../types';", "  RoundType, ApprovalStatus } from '../../types';")

# Add vibrateWarning to hapticUtils import
content = content.replace("import { vibrateTap, vibrateSuccess, vibrateError } from '../../utils/hapticUtils';", "import { vibrateTap, vibrateSuccess, vibrateError, vibrateWarning } from '../../utils/hapticUtils';")

# Add useQuestionBankToasts import
import_toast = "import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';\nimport { useQuestionBankToasts } from './QuestionBankToast';"
content = content.replace("import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';", import_toast)

# Inject addToast hook
hook_injection = """  const { addToast } = useQuestionBankToasts();
  const [activeTab, setActiveTab] = useState<'CONTENT' | 'METADATA' | 'ADVANCED'>('CONTENT');"""
content = content.replace("  const [activeTab, setActiveTab] = useState<'CONTENT' | 'METADATA' | 'ADVANCED'>('CONTENT');", hook_injection)

with open("src/components/questionBank/QuestionEditorModal.tsx", "w", encoding="utf-8") as f:
    f.write(content)

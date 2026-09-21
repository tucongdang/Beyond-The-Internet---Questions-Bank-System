import re

with open("src/components/questionBank/PrintPreviewModal.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Hide the standalone header for TABLE view
code = re.sub(
    r'(<div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">.*?Khung năng lực số người học.*?</div>\s*</div>)',
    r"{viewFormat === 'EXAM' && (\1)}",
    code,
    flags=re.DOTALL
)

# 2. Inject the custom header row into ALL theads in the document
new_thead_row = """
                  <tr className="border-none bg-white print:bg-white print:border-none">
                    <td colSpan={showAnswers ? 5 : 4} className="border-none p-0 pb-4 bg-white print:bg-white print:border-none">
                      <div className="border-b-2 border-black pb-4 flex justify-between items-end">
                        <div>
                          <div className="text-[11px] font-bold tracking-widest text-gray-500 uppercase font-mono mb-1">
                            BEYOND THE INTERNET 2026 • HỆ THỐNG NGÂN HÀNG CÂU HỎI
                          </div>
                          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-black">
                            NGÂN HÀNG CÂU HỎI HỆ THỐNG
                          </h1>
                          <p className="text-xs text-gray-600 mt-1">
                            Khung năng lực số người học (TT 02/2025/TT-BGDĐT) & Quy định BTI 2026
                          </p>
                        </div>
                        <div className="text-right shrink-0 font-mono text-xs text-gray-700">
                          {typeof pageIndex !== 'undefined' && totalPages > 1 && <div className="font-bold text-black">TRANG {pageIndex + 1} / {totalPages}</div>}
                          <div className="text-[11px] text-gray-500">Ngày xuất: {new Date().toLocaleDateString('vi-VN')}</div>
                        </div>
                      </div>
                    </td>
                  </tr>
"""

code = re.sub(
    r'(<tr className="bg-gray-100 border-b-2 border-black font-bold uppercase text-xs">)',
    new_thead_row + r'                  \1',
    code
)

with open("src/components/questionBank/PrintPreviewModal.tsx", "w", encoding="utf-8") as f:
    f.write(code)

print("Updated print headers using regex")

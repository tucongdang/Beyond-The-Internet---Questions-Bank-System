import re

with open("src/components/questionBank/PrintPreviewModal.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Remove the standalone header from being rendered when in TABLE view, 
# so we can put it inside the table's thead instead.
header_html = """
          {/* Header Section */}
          <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
            <div>
              <div className="text-[11px] font-bold tracking-widest text-gray-500 uppercase font-mono mb-1">
                BEYOND THE INTERNET 2026 • HỆ THỐNG NGÂN HÀNG CÂU HỎI
              </div>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-black">
                {viewFormat === 'EXAM' ? 'ĐỀ THI TỰ LUẬN & TRẮC NGHIỆM' : 'NGÂN HÀNG CÂU HỎI HỆ THỐNG'}
              </h1>
              <p className="text-xs text-gray-600 mt-1">
                Khung năng lực số người học (TT 02/2025/TT-BGDĐT) & Quy định BTI 2026
              </p>
            </div>
            <div className="text-right shrink-0 font-mono text-xs text-gray-700">
              <div className="font-bold text-black">TRANG {pageIndex + 1} / {totalPages}</div>
              <div className="text-[11px] text-gray-500">Ngày xuất: {new Date().toLocaleDateString('vi-VN')}</div>
            </div>
          </div>
"""

# We'll replace it with a conditional rendering: only render outside if EXAM view
replacement_header = """
          {/* Header Section (Only for EXAM view, TABLE view handles it in thead) */}
          {viewFormat === 'EXAM' && (
            <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
              <div>
                <div className="text-[11px] font-bold tracking-widest text-gray-500 uppercase font-mono mb-1">
                  BEYOND THE INTERNET 2026 • HỆ THỐNG NGÂN HÀNG CÂU HỎI
                </div>
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-black">
                  ĐỀ THI TỰ LUẬN & TRẮC NGHIỆM
                </h1>
                <p className="text-xs text-gray-600 mt-1">
                  Khung năng lực số người học (TT 02/2025/TT-BGDĐT) & Quy định BTI 2026
                </p>
              </div>
              <div className="text-right shrink-0 font-mono text-xs text-gray-700">
                <div className="font-bold text-black">TRANG {pageIndex + 1} / {totalPages}</div>
                <div className="text-[11px] text-gray-500">Ngày xuất: {new Date().toLocaleDateString('vi-VN')}</div>
              </div>
            </div>
          )}
"""

if "Khung năng lực số" in code:
    code = code.replace(header_html.strip(), replacement_header.strip())

# 2. Inject the header into the `thead` of the table in renderA4Sheet
thead_old = """
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-black font-bold uppercase text-xs">
"""
thead_new = """
                <thead>
                  <tr className="border-none bg-white">
                    <td colSpan={showAnswers ? 5 : 4} className="border-none p-0 pb-4 bg-white">
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
                          {totalPages > 1 && <div className="font-bold text-black">TRANG {pageIndex + 1} / {totalPages}</div>}
                          <div className="text-[11px] text-gray-500">Ngày xuất: {new Date().toLocaleDateString('vi-VN')}</div>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr className="bg-gray-100 border-b-2 border-black font-bold uppercase text-xs">
"""
code = code.replace(thead_old.strip(), thead_new.strip())

# Do the same for the grouped category view
code = code.replace("""
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-black font-bold uppercase text-xs">
""".strip(), thead_new.strip()) # Might apply twice, let's just use regex for safety

with open("src/components/questionBank/PrintPreviewModal.tsx", "w", encoding="utf-8") as f:
    f.write(code)

print("Updated print headers to use thead for automatic pagination")

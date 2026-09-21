import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Target,
  BarChart3,
  X,
  Sparkles,
  ShieldCheck,
  UserCheck,
  Layers,
  Info
} from 'lucide-react';
import { QuestionItem, DigitalCompetencyDomainKey, CognitiveLevel } from '../../types';
import { DIGITAL_COMPETENCY_DOMAINS } from '../../data/digitalCompetencyData';
import { exportBtiMatrixToExcel } from '../../services/btiMatrixExportService';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess } from '../../utils/hapticUtils';

interface BtiMatrixReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuestionItem[];
}

export const BtiMatrixReportExportModal: React.FC<BtiMatrixReportExportModalProps> = ({
  isOpen,
  onClose,
  questions
}) => {
  if (!isOpen) return null;

  const [targetPerCell, setTargetPerCell] = useState<number>(3);
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [reporterName, setReporterName] = useState<string>('Ban Chuyên Môn BTI 2026');
  const [notes, setNotes] = useState<string>('Báo cáo tiến độ chuẩn bị ngân hàng câu hỏi phục vụ Hội đồng Thẩm định BTI 2026.');
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);

  const domainKeys: DigitalCompetencyDomainKey[] = ['MIEN_1', 'MIEN_2', 'MIEN_3', 'MIEN_4', 'MIEN_5', 'MIEN_6'];
  const cognitiveLevels: CognitiveLevel[] = ['NHAN_BIET', 'THONG_HIEU', 'VAN_DUNG', 'VAN_DUNG_CAO'];

  // Filter questions by stage if requested
  const filteredQuestions = stageFilter === 'ALL'
    ? questions
    : questions.filter(q => q.stage === stageFilter || q.round_name?.includes(stageFilter));

  // Compute Grid Stats
  const gridStats = (() => {
    const grid: Record<DigitalCompetencyDomainKey, Record<CognitiveLevel, number>> = {
      MIEN_1: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
      MIEN_2: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
      MIEN_3: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
      MIEN_4: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
      MIEN_5: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
      MIEN_6: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
    };

    let emptyCount = 0;
    let metTargetCount = 0;

    filteredQuestions.forEach(q => {
      const d = q.digital_competency_domain || 'MIEN_1';
      const l = q.cognitive_level || 'THONG_HIEU';
      if (grid[d] && grid[d][l] !== undefined) {
        grid[d][l]++;
      }
    });

    domainKeys.forEach(d => {
      cognitiveLevels.forEach(l => {
        const cnt = grid[d][l];
        if (cnt === 0) emptyCount++;
        if (cnt >= targetPerCell) metTargetCount++;
      });
    });

    const totalCells = 24;
    const coverage = Math.round(((totalCells - emptyCount) / totalCells) * 100);

    return { grid, emptyCount, metTargetCount, coverage };
  })();

  // Trigger Excel Download
  const handleExportExcel = () => {
    vibrateTap();
    soundFx.playClick();
    setIsExportingExcel(true);

    setTimeout(() => {
      exportBtiMatrixToExcel({
        questions: filteredQuestions,
        targetPerCell,
        stageFilter,
        notes,
        reporterName
      });
      setIsExportingExcel(false);
      soundFx.playCorrect();
      vibrateSuccess();
    }, 400);
  };

  // Trigger Printable A4 PDF Report
  const handlePrintPdfReport = () => {
    vibrateTap();
    soundFx.playClick();

    // Create print window with A4 styled HTML document
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <title>Báo Cáo Ma Trận Độ Phủ Khung Năng Lực BTI 2026</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.4; color: #000; background: #fff; margin: 0; padding: 0; }
          .header { text-align: center; margin-bottom: 20px; border-b: 2px solid #000; padding-bottom: 10px; }
          .header h1 { font-size: 16pt; font-weight: bold; text-transform: uppercase; margin: 0 0 5px 0; }
          .header h2 { font-size: 12pt; font-style: italic; margin: 0; font-weight: normal; }
          .meta-info { margin-bottom: 15px; font-size: 10pt; display: flex; justify-content: space-between; }
          .kpi-box { border: 1px solid #000; padding: 10px; margin-bottom: 20px; background: #f9f9f9; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; text-align: center; }
          .kpi-item { border: 1px border #ccc; padding: 5px; }
          .kpi-val { font-size: 14pt; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10pt; }
          th, td { border: 1px solid #000; padding: 6px 8px; text-align: left; }
          th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .signatures { margin-top: 40px; display: flex; justify-content: space-between; text-align: center; font-size: 10.5pt; }
          .sig-box { width: 45%; }
          .sig-title { font-weight: bold; text-transform: uppercase; margin-bottom: 60px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BÁO CÁO MA TRẬN ĐỘ PHỦ KHUNG NĂNG LỰC BTI 2026</h1>
          <h2>Căn cứ Thông tư 02/2025/TT-BGDĐT Khung năng lực số cho người học</h2>
        </div>

        <div class="meta-info">
          <div>
            <p><strong>Đơn vị báo cáo:</strong> Ban Chuyên Môn Cuộc Thi BTI 2026</p>
            <p><strong>Người lập báo cáo:</strong> ${reporterName}</p>
          </div>
          <div style="text-align: right;">
            <p><strong>Ngày xuất báo cáo:</strong> ${new Date().toLocaleDateString('vi-VN')}</p>
            <p><strong>Giai đoạn thi:</strong> ${stageFilter === 'ALL' ? 'Toàn bộ các vòng' : stageFilter}</p>
          </div>
        </div>

        <div class="kpi-box">
          <div class="kpi-grid">
            <div class="kpi-item">
              <div>Tổng Số Câu Hỏi</div>
              <div class="kpi-val">${filteredQuestions.length}</div>
            </div>
            <div class="kpi-item">
              <div>Độ Phủ Khung BTI</div>
              <div class="kpi-val">${gridStats.coverage}%</div>
            </div>
            <div class="kpi-item">
              <div>Số Ô Đạt Chỉ Tiêu</div>
              <div class="kpi-val">${gridStats.metTargetCount} / 24</div>
            </div>
            <div class="kpi-item">
              <div>Số Ô Vùng Trắng</div>
              <div class="kpi-val" style="color: red;">${gridStats.emptyCount} ô</div>
            </div>
          </div>
        </div>

        <h3>I. BẢNG PHÂN BỔ CÂU HỎI THEO 6 MIỀN NĂNG LỰC SỐ X 4 MỨC ĐỘ NHẬN THỨC</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 35%;">Miền Năng Lực Số (TT 02/2025)</th>
              <th>Nhận Biết</th>
              <th>Thông Hiểu</th>
              <th>Vận Dụng</th>
              <th>Vận Dụng Cao</th>
              <th>Tổng Miền</th>
              <th>Đánh Giá</th>
            </tr>
          </thead>
          <tbody>
            ${domainKeys.map(dKey => {
              const dom = DIGITAL_COMPETENCY_DOMAINS[dKey];
              const r = gridStats.grid[dKey];
              const sum = r.NHAN_BIET + r.THONG_HIEU + r.VAN_DUNG + r.VAN_DUNG_CAO;
              const status = sum >= (targetPerCell * 4) ? 'Đạt chuẩn' : 'Cần bổ sung';
              return `
                <tr>
                  <td><strong>${dom.code}</strong>: ${dom.name}</td>
                  <td class="center">${r.NHAN_BIET}</td>
                  <td class="center">${r.THONG_HIEU}</td>
                  <td class="center">${r.VAN_DUNG}</td>
                  <td class="center">${r.VAN_DUNG_CAO}</td>
                  <td class="center bold">${sum}</td>
                  <td class="center">${status}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        ${notes ? `
          <div style="margin-bottom: 20px;">
            <strong>Ghi chú / Đề xuất Ban Chuyên Môn:</strong>
            <p style="font-style: italic; margin-top: 5px;">${notes}</p>
          </div>
        ` : ''}

        <div class="signatures">
          <div class="sig-box">
            <div class="sig-title">TRƯỞNG BAN TỔ CHỨC BTI 2026</div>
            <div>(Ký và ghi rõ họ tên)</div>
          </div>
          <div class="sig-box">
            <div class="sig-title">TRƯỞNG BAN CHUYÊN MÔN THẨM ĐỊNH</div>
            <div>(Ký và ghi rõ họ tên)</div>
          </div>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-mono">
      <div className="fluent-card w-full max-w-2xl bg-[#16072D] border border-amber-400/50 rounded-[6px] shadow-2xl p-5 space-y-5 text-slate-100 relative">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-purple-500/30 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-purple-600 rounded text-white shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                XUẤT BÁO CÁO MA TRẬN ĐỘ PHỦ BTI 2026
              </h3>
              <p className="text-xs text-slate-300">
                Phục vụ báo cáo tiến độ chuẩn bị ngân hàng đề thi cho Ban Tổ Chức
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Report KPI Summary Banner */}
        <div className="grid grid-cols-3 gap-2.5 bg-[#100421] p-3 rounded-[4px] border border-purple-500/30 text-xs">
          <div className="space-y-0.5">
            <span className="text-slate-400 text-[10.5px]">Số câu xét xuất:</span>
            <strong className="text-amber-300 block text-base font-bold">{filteredQuestions.length} câu</strong>
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-400 text-[10.5px]">Tỷ lệ phủ khung:</span>
            <strong className="text-emerald-300 block text-base font-bold">{gridStats.coverage}%</strong>
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-400 text-[10.5px]">Số vùng trắng (0 câu):</span>
            <strong className="text-rose-300 block text-base font-bold">{gridStats.emptyCount} ô</strong>
          </div>
        </div>

        {/* Configurations Form */}
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 block mb-1">Giai đoạn / Vòng thi BTI:</label>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="w-full bg-[#1C093B] text-amber-300 font-bold border border-purple-500/40 rounded p-2 focus:outline-none"
              >
                <option value="ALL">Tất cả các vòng (Toàn bộ)</option>
                <option value="KD">Vòng Khởi Động</option>
                <option value="VCNV">Vòng Vượt Chướng Ngại Vật</option>
                <option value="TT">Vòng Tăng Tốc</option>
                <option value="VD">Vòng Về Đích</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 block mb-1">Mục tiêu tối thiểu / Ô:</label>
              <select
                value={targetPerCell}
                onChange={(e) => setTargetPerCell(Number(e.target.value))}
                className="w-full bg-[#1C093B] text-sky-300 font-bold border border-purple-500/40 rounded p-2 focus:outline-none"
              >
                <option value={1}>≥ 1 câu / ô</option>
                <option value={2}>≥ 2 câu / ô</option>
                <option value={3}>≥ 3 câu (Khuyên dùng)</option>
                <option value={5}>≥ 5 câu / ô</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-300 block mb-1">Họ tên / Đơn vị lập báo cáo:</label>
            <input
              type="text"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              className="w-full bg-[#1C093B] text-white border border-purple-500/40 rounded p-2 focus:outline-none"
              placeholder="Nhập họ tên người lập báo cáo..."
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1">Ghi chú / Đề xuất cho Ban Tổ Chức:</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#1C093B] text-slate-200 border border-purple-500/40 rounded p-2 focus:outline-none"
              placeholder="Nhập nội dung ghi chú cho Ban Thẩm Định..."
            />
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 border-t border-purple-500/30 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-[4px] transition cursor-pointer"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-[4px] flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isExportingExcel ? 'Đang tạo Excel...' : 'Xuất File Excel (.xlsx)'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPdfReport}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-[4px] flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>In Báo Cáo / Xuất PDF (A4)</span>
          </button>
        </div>

      </div>
    </div>
  );
};

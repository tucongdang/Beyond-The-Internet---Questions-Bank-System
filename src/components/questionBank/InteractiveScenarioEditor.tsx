import React, { useState } from 'react';
import { 
  Theater, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Users, 
  Scale, 
  FileText, 
  Plus, 
  Trash2, 
  Play, 
  RefreshCw, 
  ChevronRight,
  ShieldAlert,
  Award
} from 'lucide-react';
import { 
  InteractiveScenario, 
  CompetitionStage, 
  DigitalCompetencyDomainKey 
} from '../../types';
import { 
  DIGITAL_COMPETENCY_DOMAINS, 
  COMPETITION_STAGES 
} from '../../data/digitalCompetencyData';
import { questionBankManager } from '../../services/questionBankManager';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess } from '../../utils/hapticUtils';

export const InteractiveScenarioEditor: React.FC = () => {
  const [scenarios, setScenarios] = useState<InteractiveScenario[]>(() => questionBankManager.getScenarios());
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(scenarios[0]?.id || '');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);

  // Edit form state
  const currentScenario = scenarios.find(s => s.id === selectedScenarioId) || scenarios[0];
  const [formState, setFormState] = useState<Partial<InteractiveScenario>>(currentScenario || {});

  // Update form when scenario selected
  const handleSelectScenario = (s: InteractiveScenario) => {
    vibrateTap();
    soundFx.playClick();
    setSelectedScenarioId(s.id);
    setFormState({ ...s });
    setIsEditing(false);
  };

  const handleStartNew = () => {
    vibrateTap();
    soundFx.playClick();
    const newBlank: Partial<InteractiveScenario> = {
      id: `SCENARIO_${Date.now()}`,
      title: 'Tình huống Kịch số: Sự cố an ninh mạng',
      stage: 'CHUNG_KET',
      domain: 'MIEN_4',
      characters: ['MC', 'Thí sinh (Trưởng nhóm bảo mật)', 'Kẻ lừa đảo công nghệ cao'],
      setting: 'Văn phòng số doanh nghiệp hoặc tài khoản mạng xã hội',
      scriptText: 'MC: Vào lúc 09h00 sáng, hệ thống máy chủ nhận được cảnh báo bất thường...\nNhân vật A: "Tôi cần xác thực mã OTP ngay để ngăn chặn giao dịch!"',
      dilemmaQuestion: 'Thí sinh phát hiện dấu hiệu mạo danh. Đâu là quy trình xử lý khẩn cấp tối ưu?',
      actionChecklist: [
        'Không cung cấp OTP/mật khẩu trong mọi trường hợp',
        'Khóa thẻ/tài khoản tạm thời qua ứng dụng chính thức',
        'Báo cáo cơ quan chức năng hoặc bộ phận an toàn thông tin'
      ],
      correctOption: 'Phương án A & thực thi quy trình cách ly kết nối',
      timeLimitThought: 20,
      timeLimitAction: 60,
      rubric: [
        { criterion: 'Nhận diện đúng rủi ro pháp lý & bảo mật', maxPoints: 15, description: 'Chỉ rõ điều khoản Nghị định 13/2023' },
        { criterion: 'Xử lý tình huống bình tĩnh & thuyết phục', maxPoints: 15, description: 'Phản ứng nhanh và chuẩn xác' },
        { criterion: 'Kỹ năng thuyết trình & lập luận', maxPoints: 10, description: 'Rõ ràng, mạch lạc' }
      ],
      legalBasis: 'Điều 8, Điều 9 Nghị định 13/2023/NĐ-CP & Thông tư 02/2025/TT-BGDĐT',
      status: 'APPROVED',
      author: questionBankManager.getCurrentUser().name,
      createdAt: Date.now()
    };

    setFormState(newBlank);
    setSelectedScenarioId(newBlank.id!);
    setIsEditing(true);
  };

  const handleSaveForm = () => {
    vibrateTap();
    soundFx.playCorrect();

    if (scenarios.some(s => s.id === formState.id)) {
      questionBankManager.updateScenario(formState.id!, formState);
    } else {
      questionBankManager.addScenario(formState as InteractiveScenario);
    }

    const updated = questionBankManager.getScenarios();
    setScenarios(updated);
    setIsEditing(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa kịch bản tương tác này?')) return;
    vibrateTap();
    soundFx.playClick();
    questionBankManager.deleteScenario(id);
    const updated = questionBankManager.getScenarios();
    setScenarios(updated);
    if (selectedScenarioId === id && updated[0]) {
      setSelectedScenarioId(updated[0].id);
      setFormState(updated[0]);
    }
  };

  // AI Generate Scenario
  const handleAiGenerate = async () => {
    vibrateTap();
    soundFx.playClick();
    setIsGeneratingAi(true);

    try {
      const res = await fetch('/api/ai/generate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: formState.stage || 'CHUNG_KET',
          domain: formState.domain || 'MIEN_4',
          topic: formState.title || 'Gian lận công nghệ tài chính và lừa đảo Deepfake'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.scenario) {
        throw new Error(data.error || 'Lỗi khi gọi AI soạn kịch bản.');
      }

      const sc = data.scenario;
      const generated: Partial<InteractiveScenario> = {
        ...formState,
        title: sc.title,
        characters: sc.characters || [],
        setting: sc.setting,
        scriptText: sc.scriptText,
        dilemmaQuestion: sc.dilemmaQuestion,
        actionChecklist: sc.actionChecklist || [],
        options: sc.options || {},
        correctOption: sc.correctOption,
        timeLimitThought: sc.timeLimitThought || 20,
        timeLimitAction: sc.timeLimitAction || 60,
        rubric: sc.rubric || [],
        legalBasis: sc.legalBasis
      };

      setFormState(generated);
      setIsEditing(true);
      soundFx.playCorrect();
      vibrateSuccess();
    } catch (e: any) {
      console.error('AI Scenario error:', e);
      soundFx.playError();
      alert(e.message || 'Lỗi tạo kịch bản.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="fluent-box p-4 sm:p-5 relative overflow-hidden bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-black/60 border border-purple-500/20 rounded-[4px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono font-bold mb-2 border border-purple-400/30">
              <Theater className="w-3.5 h-3.5 text-purple-400" />
              <span>Interactive Scenarios & Drama • Vòng Về Đích 4.2 & Chung Kết</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
              Trình Soạn Thảo Kịch Bản Kịch Tương Tác
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-1 max-w-2xl">
              Xây dựng các tình huống mô phỏng thực tế trên sân khấu: Diễn viên kịch, bối cảnh số, câu hỏi nút thắt và thang điểm Rubric chấm điểm của Ban Giám khảo.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleStartNew}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-[4px] text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-purple-950/50 transition cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Kịch Bản Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: List of Scenarios */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Theater className="w-4 h-4 text-purple-400" />
              Danh Sách Kịch Bản ({scenarios.length})
            </h3>
          </div>

          <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-2 custom-scrollbar">
            {scenarios.map(s => {
              const isSelected = s.id === selectedScenarioId;
              return (
                <div
                  key={s.id}
                  onClick={() => handleSelectScenario(s)}
                  className={`p-3.5 rounded-[4px] border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'border-purple-500/60 bg-purple-950/20 shadow-md shadow-purple-950/40'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-purple-300 bg-purple-950/50 px-2 py-0.5 rounded border border-purple-500/30">
                      {s.stage}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      {s.timeLimitAction}s thực hành
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2">
                    {s.title}
                  </h4>

                  <p className="text-[11px] text-white/50 line-clamp-2">
                    {s.dilemmaQuestion}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-white/40 pt-1 border-t border-white/5">
                    <span>{DIGITAL_COMPETENCY_DOMAINS[s.domain]?.code || s.domain}</span>
                    <span>{s.author}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Editor & Preview */}
        <div className="lg:col-span-8 space-y-4">
          <div className="fluent-box p-5 rounded-[4px] border border-white/10 space-y-4">
            {/* Header with actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/50 px-2.5 py-1 rounded border border-purple-500/30">
                  {formState.id}
                </span>
                <span className="text-xs font-mono text-emerald-400">
                  Trạng thái: {formState.status || 'APPROVED'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAiGenerate}
                  disabled={isGeneratingAi}
                  className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-[4px] text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {isGeneratingAi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                  <span>AI Tự Động Soạn Kịch Bản</span>
                </button>

                {isEditing ? (
                  <button
                    type="button"
                    onClick={handleSaveForm}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[4px] text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Lưu Kịch Bản</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-[4px] text-xs font-mono font-bold transition cursor-pointer"
                  >
                    Chỉnh sửa
                  </button>
                )}

                {questionBankManager.canDelete() && formState.id && (
                  <button
                    type="button"
                    onClick={() => handleDelete(formState.id!)}
                    className="p-1.5 text-rose-400 hover:bg-rose-950/30 rounded-[4px] transition"
                    title="Xóa kịch bản"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Editable or View Mode */}
            {isEditing ? (
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1 font-semibold">
                    Tiêu Đề Tình Huống / Tên Vở Kịch:
                  </label>
                  <input
                    type="text"
                    value={formState.title || ''}
                    onChange={e => setFormState(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-black/50 border border-white/15 rounded-[4px] px-3 py-2 text-sm text-white font-bold focus:border-purple-400 focus:outline-none"
                  />
                </div>

                {/* Stage & Domain */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-white/70 mb-1 font-semibold">
                      Giai Đoạn:
                    </label>
                    <select
                      value={formState.stage || 'CHUNG_KET'}
                      onChange={e => setFormState(prev => ({ ...prev, stage: e.target.value as CompetitionStage }))}
                      className="w-full bg-black/50 border border-white/15 rounded-[4px] px-3 py-2 text-xs text-white focus:border-purple-400 focus:outline-none"
                    >
                      {Object.values(COMPETITION_STAGES).map(s => (
                        <option key={s.stage} value={s.stage}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-white/70 mb-1 font-semibold">
                      Miền Năng Lực Số:
                    </label>
                    <select
                      value={formState.domain || 'MIEN_4'}
                      onChange={e => setFormState(prev => ({ ...prev, domain: e.target.value as DigitalCompetencyDomainKey }))}
                      className="w-full bg-black/50 border border-white/15 rounded-[4px] px-3 py-2 text-xs text-white focus:border-purple-400 focus:outline-none"
                    >
                      {Object.values(DIGITAL_COMPETENCY_DOMAINS).map(d => (
                        <option key={d.key} value={d.key}>{d.code}: {d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Setting & Characters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-white/70 mb-1 font-semibold">
                      Bối Cảnh Không Gian:
                    </label>
                    <input
                      type="text"
                      value={formState.setting || ''}
                      onChange={e => setFormState(prev => ({ ...prev, setting: e.target.value }))}
                      className="w-full bg-black/50 border border-white/15 rounded-[4px] px-3 py-2 text-xs text-white focus:border-purple-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-white/70 mb-1 font-semibold">
                      Nhân Vật (phân cách bằng dấu phẩy):
                    </label>
                    <input
                      type="text"
                      value={(formState.characters || []).join(', ')}
                      onChange={e => setFormState(prev => ({ 
                        ...prev, 
                        characters: e.target.value.split(',').map(c => c.trim()).filter(Boolean) 
                      }))}
                      className="w-full bg-black/50 border border-white/15 rounded-[4px] px-3 py-2 text-xs text-white focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Script Text (Dialogue) */}
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1 font-semibold">
                    Kịch Bản Lời Thoại Diễn Xuất Trên Sân Khấu:
                  </label>
                  <textarea
                    value={formState.scriptText || ''}
                    onChange={e => setFormState(prev => ({ ...prev, scriptText: e.target.value }))}
                    rows={6}
                    className="w-full bg-black/50 border border-white/15 rounded-[4px] p-3 text-xs text-white font-mono placeholder-white/30 focus:border-purple-400 focus:outline-none leading-relaxed"
                  />
                </div>

                {/* Dilemma Question */}
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1 font-semibold">
                    Câu Hỏi Nút Thắt / Thử Thách Cho Thí Sinh:
                  </label>
                  <input
                    type="text"
                    value={formState.dilemmaQuestion || ''}
                    onChange={e => setFormState(prev => ({ ...prev, dilemmaQuestion: e.target.value }))}
                    className="w-full bg-black/50 border border-white/15 rounded-[4px] px-3 py-2 text-xs text-white focus:border-purple-400 focus:outline-none font-semibold"
                  />
                </div>

                {/* Time Limits */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-white/70 mb-1">
                      Thời Gian Suy Nghĩ (giây):
                    </label>
                    <input
                      type="number"
                      value={formState.timeLimitThought || 20}
                      onChange={e => setFormState(prev => ({ ...prev, timeLimitThought: Number(e.target.value) }))}
                      className="w-full bg-black/50 border border-white/15 rounded-[4px] px-3 py-2 text-xs text-white focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-white/70 mb-1">
                      Thời Gian Thực Hành / Diễn Xuất (giây):
                    </label>
                    <input
                      type="number"
                      value={formState.timeLimitAction || 60}
                      onChange={e => setFormState(prev => ({ ...prev, timeLimitAction: Number(e.target.value) }))}
                      className="w-full bg-black/50 border border-white/15 rounded-[4px] px-3 py-2 text-xs text-white focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Legal Basis */}
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1 font-semibold">
                    Căn Cứ Pháp Lý Trích Dẫn:
                  </label>
                  <input
                    type="text"
                    value={formState.legalBasis || ''}
                    onChange={e => setFormState(prev => ({ ...prev, legalBasis: e.target.value }))}
                    className="w-full bg-black/50 border border-white/15 rounded-[4px] px-3 py-2 text-xs text-white focus:border-purple-400 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              /* View / Stage Preview Mode */
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    {formState.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-white/60 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      {formState.timeLimitThought}s suy nghĩ / {formState.timeLimitAction}s thực hành
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-sky-400" />
                      {formState.characters?.join(', ')}
                    </span>
                  </div>
                </div>

                {/* Setting */}
                <div className="p-3 bg-white/5 rounded-[4px] border border-white/10 text-xs">
                  <span className="font-mono text-purple-300 font-bold">Bối cảnh: </span>
                  <span className="text-white/80">{formState.setting}</span>
                </div>

                {/* Script dialog */}
                <div className="p-4 bg-black/50 rounded-[4px] border border-white/15 space-y-2">
                  <span className="font-mono text-[11px] text-white/50 uppercase tracking-wider font-bold block">
                    Lời thoại & Tiến trình diễn xuất:
                  </span>
                  <div className="font-mono text-xs text-white/90 whitespace-pre-line leading-relaxed pl-2 border-l-2 border-purple-500/40">
                    {formState.scriptText}
                  </div>
                </div>

                {/* Dilemma question */}
                <div className="p-4 bg-gradient-to-r from-amber-950/30 to-purple-950/20 rounded-[4px] border border-amber-500/30 space-y-2">
                  <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    Thử Thách Nút Thắt Dành Cho Thí Sinh:
                  </span>
                  <p className="text-sm font-bold text-white">
                    {formState.dilemmaQuestion}
                  </p>
                </div>

                {/* Checklist actions */}
                {formState.actionChecklist && formState.actionChecklist.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-mono text-white/70 font-bold block">
                      Checklist Hành Động Chuẩn Của Thí Sinh:
                    </span>
                    <div className="space-y-1">
                      {formState.actionChecklist.map((act, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-white/5 rounded-[4px] text-xs text-white/90">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rubric Table */}
                {formState.rubric && formState.rubric.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-mono text-white/70 font-bold flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-400" />
                      Thang Điểm Rubric Ban Giám Khảo (Tổng 40 điểm):
                    </span>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse font-mono">
                        <thead>
                          <tr className="bg-white/5 text-white/70 border-b border-white/10">
                            <th className="p-2">Tiêu chí</th>
                            <th className="p-2 w-20 text-center">Điểm tối đa</th>
                            <th className="p-2">Mô tả chi tiết</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-white/80">
                          {formState.rubric.map((r, i) => (
                            <tr key={i}>
                              <td className="p-2 font-bold text-purple-300">{r.criterion}</td>
                              <td className="p-2 text-center text-amber-400 font-bold">{r.maxPoints} đ</td>
                              <td className="p-2 text-white/60 font-sans">{r.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Legal basis footer */}
                {formState.legalBasis && (
                  <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/30 rounded-[4px] text-xs text-emerald-300 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Căn cứ pháp lý: <strong>{formState.legalBasis}</strong></span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

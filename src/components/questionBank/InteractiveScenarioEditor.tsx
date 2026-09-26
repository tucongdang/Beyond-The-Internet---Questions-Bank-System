import React, { useState, useEffect } from 'react';
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
  AlertTriangle,
  XCircle,
  HelpCircle,
  Layers,
  Sparkle,
  Radio,
  Eye,
  SlidersHorizontal,
  ArrowRight,
  Volume2,
  Megaphone
} from 'lucide-react';
import { 
  InteractiveScenario, 
  CompetitionStage, 
  DigitalCompetencyDomainKey,
  ScenarioBranch
} from '../../types';
import { 
  DIGITAL_COMPETENCY_DOMAINS, 
  COMPETITION_STAGES 
} from '../../data/digitalCompetencyData';
import { questionBankManager } from '../../services/questionBankManager';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess } from '../../utils/hapticUtils';

const DEFAULT_BRANCH_KEYS = ['A', 'B', 'C', 'D'] as const;

export const InteractiveScenarioEditor: React.FC = () => {
  const [scenarios, setScenarios] = useState<InteractiveScenario[]>(() => questionBankManager.getScenarios());
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(scenarios[0]?.id || '');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);

  // Active branch in Viewer & Editor ('A' | 'B' | 'C' | 'D')
  const [activeBranchKey, setActiveBranchKey] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [viewModeLayout, setViewModeLayout] = useState<'SIMULATOR' | 'GRID'>('SIMULATOR');

  // Edit form state
  const currentScenario = scenarios.find(s => s.id === selectedScenarioId) || scenarios[0];
  const [formState, setFormState] = useState<Partial<InteractiveScenario>>(currentScenario || {});

  // Branches local state for editing
  const [formBranches, setFormBranches] = useState<Record<string, ScenarioBranch>>(() => {
    return currentScenario?.branches || ensureDefaultBranches(currentScenario);
  });

  // Helper to ensure 4 branches always exist
  function ensureDefaultBranches(sc?: Partial<InteractiveScenario>): Record<string, ScenarioBranch> {
    const branches: Record<string, ScenarioBranch> = {};
    DEFAULT_BRANCH_KEYS.forEach(k => {
      const isOpt = sc?.correctOption === k || (k === 'B');
      branches[k] = sc?.branches?.[k] || {
        key: k,
        text: sc?.options?.[k] || `Phương án ${k}: Đưa ra quyết định và phản ứng xử lý trên sân khấu...`,
        isOptimal: isOpt,
        statusType: isOpt ? 'SUCCESS' : (k === 'C' ? 'DANGER' : 'WARNING'),
        reactionScript: isOpt
          ? `[DIỄN BIẾN PHÍA SAU - PHƯƠNG ÁN ĐÚNG ${k}]:\nThí sinh lựa chọn phương án ${k}.\nMC: "Thí sinh đã đưa ra quyết định chuẩn xác!"\nDiễn viên sân khấu phối hợp diễn cảnh bảo vệ hệ thống thành công.`
          : `[DIỄN BIẾN PHÍA SAU - PHƯƠNG ÁN SAI / CHƯA TỐI ƯU ${k}]:\nThí sinh lựa chọn phương án ${k}.\nKẻ gian/Đối tượng lợi dụng sơ hở tiếp tục tấn công hoặc trục lợi.\nMC bước ra: "Rất tiếc! Quyết định này đã dẫn đến rủi ro số!"`,
        consequence: isOpt 
          ? 'Bảo vệ thành công an toàn thông tin, cô lập rủi ro và ngăn chặn sự cố số kịp thời.' 
          : (k === 'C' ? 'Dẫn đến thiệt hại nghiêm trọng về tài sản số và dữ liệu cá nhân.' : 'Xử lý chưa triệt để, tiềm ẩn nguy cơ mất an toàn thứ cấp.'),
        feedback: isOpt 
          ? 'Lựa chọn chuẩn xác theo chuẩn Năng lực số Thông tư 02/2025/TT-BGDĐT.' 
          : 'Cần phân tích kỹ hơn về nguy cơ kỹ thuật xã hội và hành lang pháp lý an ninh mạng.'
      };
    });
    return branches;
  }

  // Sync state when switching scenario
  useEffect(() => {
    if (currentScenario) {
      setFormState({ ...currentScenario });
      const b = currentScenario.branches && Object.keys(currentScenario.branches).length > 0 
        ? currentScenario.branches 
        : ensureDefaultBranches(currentScenario);
      setFormBranches(b);
      // Default active branch to optimal branch
      const optimalKey = (Object.keys(b).find(k => b[k]?.isOptimal) || currentScenario.correctOption || 'A') as 'A' | 'B' | 'C' | 'D';
      setActiveBranchKey(optimalKey);
    }
  }, [selectedScenarioId]);

  // Update form when scenario selected
  const handleSelectScenario = (s: InteractiveScenario) => {
    vibrateTap();
    soundFx.playClick();
    setSelectedScenarioId(s.id);
    setFormState({ ...s });
    const b = s.branches && Object.keys(s.branches).length > 0 ? s.branches : ensureDefaultBranches(s);
    setFormBranches(b);
    const optimalKey = (Object.keys(b).find(k => b[k]?.isOptimal) || s.correctOption || 'A') as 'A' | 'B' | 'C' | 'D';
    setActiveBranchKey(optimalKey);
    setIsEditing(false);
  };

  const handleStartNew = () => {
    vibrateTap();
    soundFx.playClick();
    const newBlank: Partial<InteractiveScenario> = {
      id: `SCENARIO_${Date.now()}`,
      title: 'Tình huống Kịch số: Sự cố An toàn Thông tin & Ứng xử Mạng',
      stage: 'CHUNG_KET',
      domain: 'MIEN_4',
      cognitiveLevel: 'VAN_DUNG_CAO',
      characters: ['MC / Dẫn kịch', 'Thí sinh (Trưởng nhóm số)', 'Đối tượng gây sự cố'],
      setting: 'Văn phòng số / Giảng đường đại học. Màn hình cảnh báo sự cố an ninh thông tin.',
      scriptText: `[PHÂN CẢNH 1]:\nMC: "Vào lúc 09h00 sáng, hệ thống phát hiện có dấu hiệu bất thường..."\nĐối tượng: "Yêu cầu cung cấp quyền truy cập quản trị ngay lập tức!"\n\n[CAO TRÀO]:\nThí sinh đối mặt với tình thế nguy cấp cần quyết định trong 60 giây.`,
      dilemmaQuestion: 'Thí sinh cần lựa chọn phương án hành động nào để xử lý sự cố an toàn, đúng pháp luật và chuẩn mực năng lực số?',
      options: {
        A: 'Phương án A: Thỏa hiệp tạm thời và cung cấp thông tin',
        B: 'Phương án B: Lập tức cô lập mạng, kích hoạt quy trình bảo mật khẩn cấp và báo cáo cơ quan chức năng',
        C: 'Phương án C: Tự ý tấn công trả đũa bằng công cụ mạng',
        D: 'Phương án D: Tắt máy và giữ im lặng'
      },
      correctOption: 'B',
      subOptimalScript: `[KỊCH BẢN ỨNG BIẾN KHI CHỌN PHƯƠNG ÁN SAI / CHƯA TỐI ƯU]:\nMC bước nhanh ra sân khấu: "Rất tiếc! Thí sinh đã đưa ra quyết định chưa chính xác và khiến rủi ro an ninh mạng bùng phát!"\nMC: "Xin mời Cố vấn Chuyên môn phân tích và hướng dẫn quy trình xử lý chuẩn cho các thí sinh!"\nCố vấn: "Đối với sự cố an toàn thông tin, phản xạ đầu tiên luôn phải là cô lập rủi ro và kích hoạt quy trình bảo mật khẩn cấp theo chuẩn Thông tư 02/2025..."\nMC: "Xin cảm ơn lời khuyên quý báu của Chuyên gia!"`,
      timeLimitThought: 20,
      timeLimitAction: 60,
      legalBasis: 'Điều 8, Điều 16 Luật An ninh mạng 2018 & Thông tư 02/2025/TT-BGDĐT',
      status: 'APPROVED',
      author: questionBankManager.getCurrentUser().name,
      createdAt: Date.now()
    };

    const b = ensureDefaultBranches(newBlank);
    b.A.text = 'Thỏa hiệp tạm thời và cung cấp thông tin theo yêu cầu';
    b.A.isOptimal = false;
    b.A.statusType = 'DANGER';
    b.A.reactionScript = '[DIỄN BIẾN PHÍA SAU - PHƯƠNG ÁN SAI A]:\nThí sinh cung cấp thông tin. Kẻ gian lập tức chiếm quyền điều khiển toàn bộ cơ sở dữ liệu!\nMC bước ra cảnh báo: "Thí sinh đã để lộ lọt thông tin tối mật, gây hậu quả khôn lường!"';
    b.A.consequence = 'Lộ lọt dữ liệu nội bộ nghiêm trọng, hệ thống bị tê liệt hoàn toàn.';
    b.A.feedback = 'Vi phạm nguyên tắc bảo mật tối thiểu, sập bẫy kỹ thuật xã hội.';

    b.B.text = 'Lập tức cô lập mạng, kích hoạt quy trình bảo mật khẩn cấp và báo cáo cơ quan chức năng';
    b.B.isOptimal = true;
    b.B.statusType = 'SUCCESS';
    b.B.reactionScript = '[DIỄN BIẾN PHÍA SAU - PHƯƠNG ÁN TỐI ƯU B]:\nThí sinh quyết đoán ngắt kết nối mạng của thiết bị bị nhiễm độc, khởi động quy trình ứng phó sự cố (Incident Response) và liên hệ Trung tâm an ninh mạng.\nMC vỗ tay: "Xử lý tuyệt vời! Ngăn chặn rủi ro lây lan trong tích tắc!"';
    b.B.consequence = 'Bảo vệ thành công toàn vẹn dữ liệu máy chủ, thu thập đầy đủ log bằng chứng điều tra.';
    b.B.feedback = 'Phương án chuẩn xác tuyệt đối! Đáp ứng hoàn hảo Miền 4 Thông tư 02/2025/TT-BGDĐT.';

    b.C.text = 'Tự ý tấn công trả đũa bằng công cụ mạng';
    b.C.isOptimal = false;
    b.C.statusType = 'DANGER';
    b.C.reactionScript = '[DIỄN BIẾN PHÍA SAU - PHƯƠNG ÁN SAI C]:\nThí sinh dùng công cụ DDoS tấn công ngược lại IP nguồn. Tuy nhiên IP nguồn là máy chủ của một bệnh viện bị chiếm quyền!\nMC bước ra: "Thí sinh vi phạm Điều 8 Luật An ninh mạng khi tự ý tấn công hạ tầng mạng!"';
    b.C.consequence = 'Gây hại cho hạ tầng mạng của bên thứ ba vô tội, đối mặt với trách nhiệm pháp lý hành chính/hình sự.';
    b.C.feedback = 'Sai lầm nghiêm trọng: Không được dùng hành vi phi pháp để đáp trả sự cố.';

    b.D.text = 'Tắt máy và giữ im lặng coi như không biết';
    b.D.isOptimal = false;
    b.D.statusType = 'WARNING';
    b.D.reactionScript = '[DIỄN BIẾN PHÍA SAU - PHƯƠNG ÁN CHƯA TỐI ƯU D]:\nThí sinh tắt máy tính và rời đi. Mã độc trong mạng LAN tiếp tục âm thầm lây lan sang hàng trăm máy tính khác trong trường.\nMC thở dài: "Sự vô cảm và trì hoãn đã biến một sự cố nhỏ thành thảm họa an ninh mạng!"';
    b.D.consequence = 'Mã độc phát tán diện rộng, thiệt hại nhân lên gấp nhiều lần do không được cảnh báo sớm.';
    b.D.feedback = 'Thiếu trách nhiệm số (Digital Responsibility). Khi phát hiện sự cố cần thông báo ngay cho đội ngũ chuyên trách.';

    newBlank.branches = b;
    setFormBranches(b);
    setFormState(newBlank);
    setSelectedScenarioId(newBlank.id!);
    setActiveBranchKey('B');
    setIsEditing(true);
  };

  const handleSaveForm = () => {
    vibrateTap();
    soundFx.playCorrect();

    const derivedOptions: Record<string, string> = {
      A: formBranches.A?.text || formState.options?.A || '',
      B: formBranches.B?.text || formState.options?.B || '',
      C: formBranches.C?.text || formState.options?.C || '',
      D: formBranches.D?.text || formState.options?.D || '',
    };
    const optimalKey = (Object.keys(formBranches).find(k => formBranches[k]?.isOptimal) || formState.correctOption || 'A') as 'A' | 'B' | 'C' | 'D';

    const updatedScenario: InteractiveScenario = {
      ...(formState as InteractiveScenario),
      options: derivedOptions,
      correctOption: optimalKey,
      branches: formBranches,
      subOptimalScript: formState.subOptimalScript,
      author: formState.author || questionBankManager.getCurrentUser().name,
      createdAt: formState.createdAt || Date.now(),
      status: formState.status || 'APPROVED'
    };

    if (scenarios.some(s => s.id === updatedScenario.id)) {
      questionBankManager.updateScenario(updatedScenario.id, updatedScenario);
    } else {
      questionBankManager.addScenario(updatedScenario);
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

  // Update specific branch in form
  const handleUpdateBranchField = (key: string, field: keyof ScenarioBranch, val: any) => {
    setFormBranches(prev => {
      const current = prev[key] || {
        key,
        text: '',
        isOptimal: false,
        statusType: 'WARNING',
        reactionScript: '',
        consequence: '',
        feedback: ''
      };
      const updated = { ...current, [field]: val };

      // If marking as optimal, unmark others
      if (field === 'isOptimal' && val === true) {
        const next: Record<string, ScenarioBranch> = {};
        DEFAULT_BRANCH_KEYS.forEach(k => {
          next[k] = {
            ...(prev[k] || { key: k, text: '', reactionScript: '', consequence: '', feedback: '' }),
            isOptimal: k === key,
            statusType: k === key ? 'SUCCESS' : (prev[k]?.statusType === 'SUCCESS' ? 'WARNING' : (prev[k]?.statusType || 'WARNING'))
          };
        });
        return next;
      }

      return {
        ...prev,
        [key]: updated
      };
    });
  };

  // AI Generate Scenario with 4 Branches + Sub-optimal Script
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
          topic: formState.title || 'Gian lận công nghệ tài chính, Deepfake lừa đảo và An toàn số học đường',
          legalDocSummary: formState.legalBasis || 'Nghị định 13/2023/NĐ-CP, Thông tư 02/2025/TT-BGDĐT'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.scenario) {
        throw new Error(data.error || 'Lỗi khi gọi AI soạn kịch bản.');
      }

      const sc = data.scenario;
      const generatedBranches = sc.branches || ensureDefaultBranches(sc);

      const generated: Partial<InteractiveScenario> = {
        ...formState,
        title: sc.title,
        characters: sc.characters || [],
        setting: sc.setting,
        scriptText: sc.scriptText,
        dilemmaQuestion: sc.dilemmaQuestion,
        actionChecklist: sc.actionChecklist || [],
        options: sc.options || {},
        correctOption: sc.correctOption || 'B',
        branches: generatedBranches,
        subOptimalScript: sc.subOptimalScript || '',
        timeLimitThought: sc.timeLimitThought || 20,
        timeLimitAction: sc.timeLimitAction || 60,
        legalBasis: sc.legalBasis
      };

      setFormState(generated);
      setFormBranches(generatedBranches);
      const optKey = (sc.correctOption || 'B') as 'A' | 'B' | 'C' | 'D';
      setActiveBranchKey(optKey);
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

  // Branch Selection in Simulator View
  const handleSimulateBranch = (k: 'A' | 'B' | 'C' | 'D') => {
    vibrateTap();
    const branch = (formState.branches || formBranches)[k];
    if (branch?.isOptimal) {
      soundFx.playCorrect();
    } else if (branch?.statusType === 'DANGER') {
      soundFx.playError();
    } else {
      soundFx.playClick();
    }
    setActiveBranchKey(k);
  };

  const activeBranches = formState.branches && Object.keys(formState.branches).length > 0 
    ? formState.branches 
    : formBranches;

  const currentBranchData = activeBranches[activeBranchKey] || {
    key: activeBranchKey,
    text: formState.options?.[activeBranchKey] || `Phương án ${activeBranchKey}`,
    isOptimal: formState.correctOption === activeBranchKey,
    statusType: formState.correctOption === activeBranchKey ? 'SUCCESS' : 'WARNING',
    reactionScript: 'Chưa có kịch bản phía sau cho phương án này.',
    consequence: 'Chưa xác định hệ quả.',
    feedback: 'Chưa có nhận xét sư phạm.'
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="fluent-box p-4 sm:p-5 relative overflow-hidden bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-black/60 border border-purple-500/20 rounded-[4px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono font-bold mb-2 border border-purple-400/30">
              <Theater className="w-3.5 h-3.5 text-purple-400" />
              <span>Interactive Scenarios & Branching Drama • Vòng Về Đích 4.2 & Chung Kết</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
              Trình Soạn Thảo Kịch Bản Kịch Tương Tác
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-1 max-w-2xl">
              Xây dựng tình huống mô phỏng thực tế trên sân khấu: Bối cảnh số, thử thách nút thắt, <strong className="text-purple-300 font-semibold">4 phương án kèm kịch bản diễn biến phía sau</strong> (hệ quả số & phản hồi chuyên môn), cùng <strong className="text-amber-300 font-semibold">ô kịch bản ứng biến cho các phương án sai / chưa tối ưu</strong>.
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

          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-2 custom-scrollbar">
            {scenarios.map(s => {
              const isSelected = s.id === selectedScenarioId;
              const hasBranches = s.branches && Object.keys(s.branches).length > 0;
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
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {hasBranches ? '4 Nhánh Kịch' : '4 Phương án'}
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
                    <span className="text-amber-400 font-bold">Đáp án tối ưu: {s.correctOption || 'B'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Editor & Interactive Simulator */}
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
                  <span>AI Soạn 4 Nhánh & Kịch Bản Sai</span>
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

            {/* Editable Mode */}
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
                      Giai Đoạn Thi Đấu:
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
                      Miền Năng Lực Số (Thông tư 02):
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
                      Bối Cảnh Không Gian Số:
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
                      Nhân Vật Kịch (phân cách bằng dấu phẩy):
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
                    Kịch Bản Mở Đầu & Lời Thoại Diễn Xuất Ban Đầu:
                  </label>
                  <textarea
                    value={formState.scriptText || ''}
                    onChange={e => setFormState(prev => ({ ...prev, scriptText: e.target.value }))}
                    rows={5}
                    className="w-full bg-black/50 border border-white/15 rounded-[4px] p-3 text-xs text-white font-mono placeholder-white/30 focus:border-purple-400 focus:outline-none leading-relaxed"
                  />
                </div>

                {/* Dilemma Question */}
                <div>
                  <label className="block text-xs font-mono text-amber-400 mb-1 font-semibold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    Câu Hỏi Nút Thắt / Thử Thách Quyết Định Cho Thí Sinh:
                  </label>
                  <input
                    type="text"
                    value={formState.dilemmaQuestion || ''}
                    onChange={e => setFormState(prev => ({ ...prev, dilemmaQuestion: e.target.value }))}
                    className="w-full bg-black/50 border border-amber-500/30 rounded-[4px] px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-semibold"
                  />
                </div>

                {/* ================= EDIT 4 BRANCHES SECTION ================= */}
                <div className="p-4 bg-gradient-to-b from-purple-950/20 to-black/40 border border-purple-500/30 rounded-[4px] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/10">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                        <Layers className="w-4 h-4 text-purple-400" />
                        Soạn Thảo 4 Phương Án & Kịch Bản Diễn Biến Phía Sau
                      </h4>
                      <p className="text-[11px] text-white/50 mt-0.5">
                        Xây dựng kịch bản lời thoại phía sau cho cả phương án tối ưu và các phương án sai/chưa tối ưu.
                      </p>
                    </div>

                    {/* 4 Tabs Selector */}
                    <div className="flex items-center gap-1 bg-black/40 p-1 rounded border border-white/10">
                      {DEFAULT_BRANCH_KEYS.map(k => {
                        const br = formBranches[k];
                        const isOpt = br?.isOptimal;
                        return (
                          <button
                            key={k}
                            type="button"
                            onClick={() => setActiveBranchKey(k)}
                            className={`px-3 py-1 text-xs font-mono font-bold rounded flex items-center gap-1.5 transition cursor-pointer ${
                              activeBranchKey === k 
                                ? (isOpt ? 'bg-emerald-600 text-white shadow-md' : 'bg-purple-600 text-white shadow-md')
                                : 'text-white/70 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <span>Nhánh {k}</span>
                            {isOpt ? (
                              <span className="text-[10px] px-1 rounded bg-amber-400 text-black font-extrabold">ĐÚNG</span>
                            ) : (
                              <span className="text-[10px] text-rose-300">Sai/Lệch</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Branch Editor Fields */}
                  {(() => {
                    const br = formBranches[activeBranchKey] || {
                      key: activeBranchKey,
                      text: '',
                      isOptimal: false,
                      statusType: 'WARNING',
                      reactionScript: '',
                      consequence: '',
                      feedback: ''
                    };

                    const isWrongOrSuboptimal = !br.isOptimal;

                    return (
                      <div className={`space-y-3.5 p-4 rounded border transition-all ${
                        isWrongOrSuboptimal 
                          ? 'bg-rose-950/15 border-rose-500/30' 
                          : 'bg-emerald-950/15 border-emerald-500/30'
                      }`}>
                        {/* Option Text & Optimal Toggle */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                          <div className="md:col-span-7">
                            <label className={`block text-[11px] font-mono mb-1 font-semibold flex items-center gap-1.5 ${
                              isWrongOrSuboptimal ? 'text-rose-300' : 'text-emerald-300'
                            }`}>
                              Nội Dung Lựa Chọn - Phương Án {activeBranchKey}:
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                isWrongOrSuboptimal ? 'bg-rose-900/60 text-rose-200' : 'bg-emerald-900/60 text-emerald-200'
                              }`}>
                                {isWrongOrSuboptimal ? 'Phương án Sai / Chưa Tối Ưu' : 'Phương án Đúng / Tối Ưu'}
                              </span>
                            </label>
                            <input
                              type="text"
                              value={br.text || ''}
                              onChange={e => handleUpdateBranchField(activeBranchKey, 'text', e.target.value)}
                              placeholder={`Nhập hành động/quyết định của phương án ${activeBranchKey}...`}
                              className="w-full bg-black/60 border border-white/15 rounded-[4px] px-3 py-2 text-xs text-white focus:border-purple-400 focus:outline-none"
                            />
                          </div>

                          <div className="md:col-span-3">
                            <label className="block text-[11px] font-mono text-white/70 mb-1 font-semibold">
                              Đánh Giá Kết Quả:
                            </label>
                            <select
                              value={br.statusType || 'WARNING'}
                              onChange={e => handleUpdateBranchField(activeBranchKey, 'statusType', e.target.value)}
                              className="w-full bg-black/60 border border-white/15 rounded-[4px] px-2.5 py-2 text-xs text-white focus:border-purple-400 focus:outline-none"
                            >
                              <option value="SUCCESS">✅ Thành Công / Tối Ưu (SUCCESS)</option>
                              <option value="WARNING">⚠️ Rủi Ro / Chưa Triệt Để (WARNING)</option>
                              <option value="DANGER">⛔ Nguy Hiểm / Vi Phạm (DANGER)</option>
                            </select>
                          </div>

                          <div className="md:col-span-2 pt-4 md:pt-4">
                            <label className="flex items-center gap-2 cursor-pointer bg-white/5 p-2 rounded border border-white/10 hover:border-purple-400 transition">
                              <input
                                type="checkbox"
                                checked={!!br.isOptimal}
                                onChange={e => handleUpdateBranchField(activeBranchKey, 'isOptimal', e.target.checked)}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                              <span className="text-[11px] font-mono text-amber-300 font-bold">
                                Tối Ưu Nhất
                              </span>
                            </label>
                          </div>
                        </div>

                        {/* Reaction Script Box - Clearly labeled for wrong or optimal */}
                        <div className={`p-3 rounded border ${
                          isWrongOrSuboptimal 
                            ? 'bg-black/50 border-rose-500/40 shadow-inner' 
                            : 'bg-black/50 border-emerald-500/40 shadow-inner'
                        }`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className={`block text-[11px] font-mono font-bold flex items-center gap-1.5 ${
                              isWrongOrSuboptimal ? 'text-rose-300' : 'text-emerald-300'
                            }`}>
                              <Theater className="w-3.5 h-3.5" />
                              {isWrongOrSuboptimal 
                                ? `Ô Kịch Bản Diễn Biến Khi Thí Sinh Chọn Phương Án SAI / CHƯA TỐI ƯU (${activeBranchKey}):`
                                : `Ô Kịch Bản Diễn Biến Khi Thí Sinh Chọn Phương Án ĐÚNG / TỐI ƯU (${activeBranchKey}):`
                              }
                            </label>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-extrabold ${
                              isWrongOrSuboptimal 
                                ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40' 
                                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                            }`}>
                              {isWrongOrSuboptimal ? '⛔ KỊCH BẢN PHƯƠNG ÁN SAI' : '🌟 KỊCH BẢN PHƯƠNG ÁN ĐÚNG'}
                            </span>
                          </div>
                          <p className="text-[10px] text-white/50 mb-2">
                            {isWrongOrSuboptimal 
                              ? 'Lời thoại diễn xuất trên sân khấu khi thí sinh mắc sai lầm: Kẻ xấu lợi dụng sơ hở ra sao, MC bước ra can thiệp và bối cảnh cảnh báo sự cố thế nào.'
                              : 'Lời thoại diễn xuất khi thí sinh xử lý chuẩn xác: Thí sinh kiên quyết từ chối/cách ly sự cố, MC tuyên dương phản xạ an toàn số xuất sắc.'
                            }
                          </p>
                          <textarea
                            value={br.reactionScript || ''}
                            onChange={e => handleUpdateBranchField(activeBranchKey, 'reactionScript', e.target.value)}
                            rows={4}
                            placeholder={isWrongOrSuboptimal
                              ? `[DIỄN BIẾN PHÍA SAU - PHƯƠNG ÁN SAI ${activeBranchKey}]:\nKẻ xấu (lợi dụng sơ hở): "..."\nMC bước ra cảnh báo: "Thí sinh đã mắc bẫy tâm lý..."\nCảnh báo hệ thống reo vang...`
                              : `[DIỄN BIẾN PHÍA SAU - PHƯƠNG ÁN TỐI ƯU ${activeBranchKey}]:\nThí sinh (dứt khoát): "Tôi ngắt kết nối và khóa thẻ ngay..."\nMC vỗ tay: "Một phản xạ số tuyệt vời!"\nCán bộ trường phối hợp xử lý...`
                            }
                            className="w-full bg-black/70 border border-white/20 rounded-[4px] p-2.5 text-xs text-white font-mono placeholder-white/20 focus:border-purple-400 focus:outline-none leading-relaxed"
                          />
                        </div>

                        {/* Consequence & Feedback Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-mono text-rose-300 mb-1 font-semibold flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                              Hệ Quả Thực Tế Trong Không Gian Số:
                            </label>
                            <textarea
                              value={br.consequence || ''}
                              onChange={e => handleUpdateBranchField(activeBranchKey, 'consequence', e.target.value)}
                              rows={3}
                              placeholder="Hệ quả số: rò rỉ dữ liệu, bị khóa tài khoản, mất tiền, hoặc giải quyết an toàn..."
                              className="w-full bg-black/60 border border-white/15 rounded-[4px] p-2 text-xs text-white placeholder-white/20 focus:border-purple-400 focus:outline-none leading-relaxed"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-mono text-emerald-300 mb-1 font-semibold flex items-center gap-1.5">
                              <Scale className="w-3.5 h-3.5 text-emerald-400" />
                              Nhận Xét Sư Phạm & Căn Cứ Pháp Lý:
                            </label>
                            <textarea
                              value={br.feedback || ''}
                              onChange={e => handleUpdateBranchField(activeBranchKey, 'feedback', e.target.value)}
                              rows={3}
                              placeholder="Nhận xét chuyên môn, phân tích sai lầm hoặc lý do lựa chọn tối ưu theo TT 02/2025..."
                              className="w-full bg-black/60 border border-white/15 rounded-[4px] p-2 text-xs text-white placeholder-white/20 focus:border-purple-400 focus:outline-none leading-relaxed"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* ================= DEDICATED COUNTER-SCRIPT BOX FOR WRONG/SUB-OPTIMAL CHOICES ================= */}
                <div className="p-4 bg-gradient-to-r from-amber-950/30 via-rose-950/20 to-black/50 border border-amber-500/40 rounded-[4px] space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-amber-500/20">
                    <label className="text-xs font-mono font-bold text-amber-300 flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-amber-400" />
                      Ô Kịch Bản Ứng Biến Chung Khi Thí Sinh Chọn Phương Án Sai / Chưa Tối Ưu (MC & Cố Vấn):
                    </label>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30 font-bold shrink-0">
                      Can Thiệp Sân Khấu & Hội Trường
                    </span>
                  </div>
                  <p className="text-[11px] text-white/60 leading-relaxed">
                    Kịch bản ứng biến dành cho MC và Ban Cố Vấn / Ban Giám Khảo bước ra phân tích, răn đe bài học thực tiễn và định hướng giải pháp an toàn số cho toàn thể hội trường khi thí sinh chọn sai.
                  </p>
                  <textarea
                    value={formState.subOptimalScript || ''}
                    onChange={e => setFormState(prev => ({ ...prev, subOptimalScript: e.target.value }))}
                    rows={4}
                    placeholder="[KỊCH BẢN ỨNG BIẾN KHI CHỌN PHƯƠNG ÁN SAI / CHƯA TỐI ƯU]:&#10;MC bước nhanh ra sân khấu: 'Rất tiếc! Thí sinh đã đưa ra quyết định chưa chính xác...'&#10;MC: 'Xin trân trọng kính mời Cố vấn An ninh mạng đưa ra nhận định chuyên môn!'&#10;Cố vấn học thuật: 'Trong tình huống này, đối tượng sử dụng chiêu thức... Quy tắc an toàn số là...'&#10;MC: 'Cảm ơn bài học an toàn số từ Thầy Cố vấn!'"
                    className="w-full bg-black/60 border border-amber-500/30 rounded-[4px] p-3 text-xs text-amber-100 font-mono placeholder-white/20 focus:border-amber-400 focus:outline-none leading-relaxed"
                  />
                </div>

                {/* Time Limits & Legal Basis */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                      Thời Gian Thực Hành (giây):
                    </label>
                    <input
                      type="number"
                      value={formState.timeLimitAction || 60}
                      onChange={e => setFormState(prev => ({ ...prev, timeLimitAction: Number(e.target.value) }))}
                      className="w-full bg-black/50 border border-white/15 rounded-[4px] px-3 py-2 text-xs text-white focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-white/70 mb-1">
                      Căn Cứ Pháp Lý:
                    </label>
                    <input
                      type="text"
                      value={formState.legalBasis || ''}
                      onChange={e => setFormState(prev => ({ ...prev, legalBasis: e.target.value }))}
                      placeholder="Điều 9 NĐ 13/2023, TT 02/2025..."
                      className="w-full bg-black/50 border border-white/15 rounded-[4px] px-3 py-2 text-xs text-white focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* ================= VIEW / LIVE SIMULATION MODE ================= */
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    {formState.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-white/60 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      {formState.timeLimitThought}s suy nghế / {formState.timeLimitAction}s thực hành
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-sky-400" />
                      {formState.characters?.join(', ')}
                    </span>
                    <span>•</span>
                    <span className="text-purple-300 font-bold">
                      {DIGITAL_COMPETENCY_DOMAINS[formState.domain || 'MIEN_4']?.name}
                    </span>
                  </div>
                </div>

                {/* Setting */}
                <div className="p-3 bg-white/5 rounded-[4px] border border-white/10 text-xs">
                  <span className="font-mono text-purple-300 font-bold">Bối cảnh sân khấu số: </span>
                  <span className="text-white/80">{formState.setting}</span>
                </div>

                {/* Script dialog */}
                <div className="p-4 bg-black/50 rounded-[4px] border border-white/15 space-y-2">
                  <span className="font-mono text-[11px] text-white/50 uppercase tracking-wider font-bold block flex items-center gap-1.5">
                    <Theater className="w-3.5 h-3.5 text-purple-400" />
                    Lời Thoại Mở Đầu & Cao Trào Dẫn Đến Biến Cố:
                  </span>
                  <div className="font-mono text-xs text-white/90 whitespace-pre-line leading-relaxed pl-3 border-l-2 border-purple-500/40">
                    {formState.scriptText}
                  </div>
                </div>

                {/* Dilemma question */}
                <div className="p-4 bg-gradient-to-r from-amber-950/30 to-purple-950/20 rounded-[4px] border border-amber-500/30 space-y-1.5">
                  <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    Thử Thách Nút Thắt Dành Cho Thí Sinh:
                  </span>
                  <p className="text-sm font-bold text-white">
                    {formState.dilemmaQuestion}
                  </p>
                </div>

                {/* ================= 4 BRANCHES SIMULATOR / VIEWER ================= */}
                <div className="p-4 bg-gradient-to-b from-purple-950/30 via-black/40 to-black/60 border border-purple-500/30 rounded-[4px] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                        <Layers className="w-4 h-4 text-purple-400" />
                        4 Phương Án Xử Lý & Kịch Bản Diễn Biến Phía Sau
                      </h4>
                      <p className="text-[11px] text-white/50 mt-0.5">
                        Chọn một phương án để kích hoạt lời thoại diễn biến tiếp theo và đối chiếu hệ quả thực tế trên sân khấu.
                      </p>
                    </div>

                    {/* Layout switcher */}
                    <div className="flex items-center gap-1 bg-black/40 p-1 rounded border border-white/10 text-[11px] font-mono">
                      <button
                        type="button"
                        onClick={() => setViewModeLayout('SIMULATOR')}
                        className={`px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1 ${
                          viewModeLayout === 'SIMULATOR' ? 'bg-purple-600 text-white font-bold' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        <Play className="w-3 h-3" />
                        <span>Mô phỏng</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewModeLayout('GRID')}
                        className={`px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1 ${
                          viewModeLayout === 'GRID' ? 'bg-purple-600 text-white font-bold' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        <Layers className="w-3 h-3" />
                        <span>Xem cả 4 nhánh</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Interactive Option Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {DEFAULT_BRANCH_KEYS.map(k => {
                      const branch = activeBranches[k];
                      const isSelected = activeBranchKey === k;
                      const isOptimal = branch?.isOptimal;
                      const statusType = branch?.statusType || (isOptimal ? 'SUCCESS' : 'WARNING');

                      let statusBadge = (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30">
                          ⚠️ Rủi ro
                        </span>
                      );
                      if (isOptimal || statusType === 'SUCCESS') {
                        statusBadge = (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Tối ưu
                          </span>
                        );
                      } else if (statusType === 'DANGER') {
                        statusBadge = (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Nguy hiểm
                          </span>
                        );
                      }

                      return (
                        <div
                          key={k}
                          onClick={() => handleSimulateBranch(k)}
                          className={`p-3 rounded-[4px] border transition-all cursor-pointer text-left relative ${
                            isSelected
                              ? 'border-purple-400 bg-purple-950/40 shadow-lg shadow-purple-950/60 ring-1 ring-purple-400'
                              : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`w-6 h-6 rounded flex items-center justify-center font-mono font-black text-xs ${
                                isSelected ? (isOptimal ? 'bg-emerald-600 text-white' : 'bg-purple-600 text-white') : 'bg-white/10 text-white/80'
                              }`}>
                                {k}
                              </span>
                              <span className="text-xs font-bold text-white">
                                Phương án {k}
                              </span>
                            </div>
                            {statusBadge}
                          </div>

                          <p className="text-xs text-white/80 font-sans line-clamp-2 pl-8">
                            {branch?.text || formState.options?.[k] || `Phương án ${k}`}
                          </p>

                          {isSelected && (
                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-purple-500 rotate-45" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Mode 1: Simulator Active Scene Box */}
                  {viewModeLayout === 'SIMULATOR' && (
                    <div className="bg-black/60 border border-purple-500/40 rounded-[4px] p-4.5 space-y-3.5 mt-2 animate-fadeIn">
                      {/* Active Branch Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-white text-xs font-mono font-bold ${
                            currentBranchData.isOptimal ? 'bg-emerald-600' : 'bg-purple-600'
                          }`}>
                            PHƯƠNG ÁN {activeBranchKey}
                          </span>
                          <h5 className="text-xs sm:text-sm font-bold text-white">
                            {currentBranchData.text}
                          </h5>
                        </div>

                        <div>
                          {currentBranchData.isOptimal ? (
                            <span className="px-2.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                              LỰA CHỌN TỐI ƯU / ĐÚNG QUY TRÌNH
                            </span>
                          ) : currentBranchData.statusType === 'DANGER' ? (
                            <span className="px-2.5 py-0.5 rounded bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                              LỰA CHỌN NGUY HIỂM / SAI LẦM
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded bg-amber-950/70 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              LỰA CHỌN TIỀM ẨN RỦI RO SỐ
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 1. Theatrical Follow-up Scene */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-mono uppercase tracking-wider font-bold flex items-center gap-1.5">
                          <Theater className="w-3.5 h-3.5 text-purple-400" />
                          {!currentBranchData.isOptimal ? (
                            <span className="text-rose-300">
                              Kịch Bản Lời Thoại Diễn Biến Khi Thí Sinh Chọn Phương Án Sai / Chưa Tối Ưu Này ({activeBranchKey}):
                            </span>
                          ) : (
                            <span className="text-emerald-300">
                              Kịch Bản Lời Thoại Diễn Biến Khi Thí Sinh Chọn Phương Án Đúng / Tối Ưu ({activeBranchKey}):
                            </span>
                          )}
                        </span>
                        <div className={`p-3.5 rounded-[4px] border font-mono text-xs whitespace-pre-line leading-relaxed pl-3 border-l-4 ${
                          !currentBranchData.isOptimal 
                            ? 'bg-rose-950/20 border-rose-500/30 border-l-rose-500 text-rose-100'
                            : 'bg-emerald-950/20 border-emerald-500/30 border-l-emerald-500 text-emerald-100'
                        }`}>
                          {currentBranchData.reactionScript}
                        </div>
                      </div>

                      {/* 2. Consequence & Feedback Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {/* Digital Consequence */}
                        <div className={`p-3 rounded-[4px] border text-xs space-y-1 ${
                          currentBranchData.isOptimal 
                            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200' 
                            : currentBranchData.statusType === 'DANGER'
                              ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                              : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                        }`}>
                          <span className="font-mono font-bold block flex items-center gap-1 text-[11px]">
                            <AlertTriangle className="w-3 h-3" />
                            Hệ Quả Thực Tế Trong Không Gian Số:
                          </span>
                          <p className="leading-relaxed">
                            {currentBranchData.consequence}
                          </p>
                        </div>

                        {/* Pedagogical Feedback */}
                        <div className="p-3 bg-white/5 border border-white/10 rounded-[4px] text-xs space-y-1 text-white/90">
                          <span className="font-mono font-bold text-sky-300 block flex items-center gap-1 text-[11px]">
                            <Scale className="w-3 h-3 text-sky-400" />
                            Nhận Xét Sư Phạm & Căn Cứ Chuyên Môn:
                          </span>
                          <p className="leading-relaxed text-white/75">
                            {currentBranchData.feedback}
                          </p>
                        </div>
                      </div>

                      {/* 3. Stage Counter-Script for Wrong/Sub-optimal Choice */}
                      {formState.subOptimalScript && !currentBranchData.isOptimal && (
                        <div className="p-3.5 bg-gradient-to-r from-amber-950/30 via-rose-950/20 to-purple-950/20 border border-amber-500/40 rounded-[4px] space-y-2 mt-2 animate-fadeIn">
                          <div className="flex items-center justify-between pb-1 border-b border-amber-500/20">
                            <span className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
                              <Megaphone className="w-3.5 h-3.5 text-amber-400" />
                              Kịch Bản Ứng Biến Sân Khấu Khi Thí Sinh Chọn Sai / Chưa Tối Ưu (MC & Cố Vấn):
                            </span>
                            <span className="text-[10px] font-mono text-amber-200/90 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30 font-bold">
                              Can thiệp sư phạm
                            </span>
                          </div>
                          <div className="font-mono text-xs text-amber-100 whitespace-pre-line leading-relaxed bg-black/40 p-2.5 rounded border border-amber-500/20 pl-3 border-l-2 border-amber-400">
                            {formState.subOptimalScript}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mode 2: Full 4-Branch Comparison Grid */}
                  {viewModeLayout === 'GRID' && (
                    <div className="space-y-4 mt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {DEFAULT_BRANCH_KEYS.map(k => {
                          const br = activeBranches[k] || {
                            key: k,
                            text: formState.options?.[k] || '',
                            reactionScript: '',
                            consequence: '',
                            feedback: '',
                            isOptimal: formState.correctOption === k
                          };
                          const isWrong = !br.isOptimal;

                          return (
                            <div 
                              key={k} 
                              className={`p-3.5 rounded-[4px] border bg-black/50 space-y-2.5 ${
                                br.isOptimal 
                                  ? 'border-emerald-500/50 bg-emerald-950/15' 
                                  : br.statusType === 'DANGER'
                                    ? 'border-rose-500/40 bg-rose-950/15'
                                    : 'border-white/15'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 pb-1 border-b border-white/10">
                                <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                                  <span className={`w-5 h-5 rounded text-white flex items-center justify-center text-[11px] font-bold ${
                                    br.isOptimal ? 'bg-emerald-600' : 'bg-purple-600'
                                  }`}>
                                    {k}
                                  </span>
                                  {br.isOptimal ? '🌟 Tối Ưu (Đúng)' : br.statusType === 'DANGER' ? '⛔ Nguy Hiểm (Sai)' : '⚠️ Rủi Ro (Chưa tối ưu)'}
                                </span>
                                <span className="text-[10px] font-mono text-white/40">Nhánh {k}</span>
                              </div>

                              <p className="text-xs font-bold text-white leading-snug">
                                {br.text}
                              </p>

                              <div className={`p-2.5 rounded border font-mono text-[11px] whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto custom-scrollbar ${
                                isWrong 
                                  ? 'bg-rose-950/20 border-rose-500/20 text-rose-100'
                                  : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-100'
                              }`}>
                                <div className="text-[10px] font-bold uppercase mb-1 opacity-70">
                                  {isWrong ? '🎭 Kịch bản diễn biến sai:' : '🌟 Kịch bản diễn biến đúng:'}
                                </div>
                                {br.reactionScript}
                              </div>

                              <div className="text-[11px] text-white/70 space-y-1">
                                <div><strong className="text-amber-300">Hệ quả:</strong> {br.consequence}</div>
                                <div><strong className="text-sky-300">Nhận xét:</strong> {br.feedback}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Stage Counter-Script in Grid View */}
                      {formState.subOptimalScript && (
                        <div className="p-3.5 bg-gradient-to-r from-amber-950/25 via-rose-950/20 to-purple-950/20 border border-amber-500/35 rounded-[4px] space-y-2">
                          <div className="flex items-center justify-between pb-1 border-b border-amber-500/20">
                            <span className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
                              <Megaphone className="w-3.5 h-3.5 text-amber-400" />
                              Kịch Bản Ứng Biến Chung Khi Chọn Phương Án Sai / Chưa Tối Ưu (MC & Ban Cố Vấn):
                            </span>
                            <span className="text-[10px] font-mono text-amber-200/90 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                              Định hướng toàn trường
                            </span>
                          </div>
                          <div className="font-mono text-xs text-amber-100 whitespace-pre-line leading-relaxed bg-black/50 p-2.5 rounded border border-amber-500/20 pl-3 border-l-2 border-amber-400">
                            {formState.subOptimalScript}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Checklist actions */}
                {formState.actionChecklist && formState.actionChecklist.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-mono text-white/70 font-bold block flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Checklist Hành Động Chuẩn Của Thí Sinh (Best Practices):
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

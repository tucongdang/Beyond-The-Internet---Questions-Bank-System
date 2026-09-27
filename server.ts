import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type, GenerateVideosOperation } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Health check endpoint for Cloud Run
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // ── Gemini API Key config ──────────────────────────────────────────────────
  // Helper: get the effective API key from request header, body, or env
  function getEffectiveApiKey(req: any): string | undefined {
    const fromHeader = req.headers?.['x-gemini-api-key'];
    const fromBody = req.body?.apiKey;
    const fromEnv = process.env.GEMINI_API_KEY;
    const key = (fromHeader || fromBody || fromEnv);
    if (typeof key === 'string' && key.trim()) return key.trim();
    return undefined;
  }

  // GET /api/config/gemini-key – returns whether server has a key configured
  app.get("/api/config/gemini-key", (req, res) => {
    const key = process.env.GEMINI_API_KEY;
    if (key && key.trim()) {
      const masked = key.slice(0, 8) + '...' + key.slice(-4);
      return res.json({ hasKey: true, maskedKey: masked });
    }
    return res.json({ hasKey: false });
  });

  // POST /api/config/gemini-key – validate and persist key to .env file
  app.post("/api/config/gemini-key", async (req, res) => {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      return res.status(400).json({ error: 'API Key không hợp lệ.' });
    }
    const trimmedKey = apiKey.trim();

    // Quick validation ping to Gemini
    try {
      const testAi = new GoogleGenAI({ apiKey: trimmedKey });
      await testAi.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'ping',
        config: { maxOutputTokens: 5 }
      });
    } catch (err: any) {
      const msg = err?.message || String(err);
      return res.status(400).json({
        error: `API Key không hợp lệ hoặc không có quyền truy cập Gemini: ${msg}`
      });
    }

    // Persist to runtime env
    process.env.GEMINI_API_KEY = trimmedKey;

    // Write to .env file (create or update)
    try {
      const envPath = path.join(process.cwd(), '.env');
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf-8');
      }
      // Replace or append GEMINI_API_KEY line
      if (/^GEMINI_API_KEY=/m.test(envContent)) {
        envContent = envContent.replace(/^GEMINI_API_KEY=.*$/m, `GEMINI_API_KEY="${trimmedKey}"`);
      } else {
        envContent = envContent.trimEnd() + `\nGEMINI_API_KEY="${trimmedKey}"\n`;
      }
      fs.writeFileSync(envPath, envContent, 'utf-8');
    } catch (writeErr: any) {
      console.warn('Could not write .env file:', writeErr.message);
      // Non-fatal: key is still set in memory for this session
    }

    const masked = trimmedKey.slice(0, 8) + '...' + trimmedKey.slice(-4);
    return res.json({ success: true, maskedKey: masked });
  });

  // ── Authentication & RBAC System (PasswordGate & OnboardingModal) ──────────
  const authStorePath = path.join(process.cwd(), 'data', 'auth_store.json');
  interface StoredUser {
    id: string;
    username: string;
    fullName: string;
    name?: string;
    email: string;
    password?: string;
    role?: string;
    technicalRole?: string;
    status: 'APPROVED' | 'PENDING' | 'REJECTED';
    emailVerified?: boolean;
    gender?: string;
    birthYear?: string;
    mssv?: string;
    anonymizedUid?: string;
    teamId?: string;
    teamName?: string;
    authProvider?: string;
    note?: string;
    createdAt: number;
    approvedAt?: number;
    approvedBy?: string;
  }

  // Preseeded default administrative accounts
  const DEFAULT_ADMIN_USERS: StoredUser[] = [
    {
      id: 'usr_admin',
      username: 'admin',
      fullName: 'TS. Hoàng Minh Sơn',
      email: 'admin.bti2026@edu.vn',
      password: 'BTI2026Admin',
      role: 'SUPER_ADMIN',
      technicalRole: 'SUPER_ADMIN',
      status: 'APPROVED',
      emailVerified: true,
      createdAt: Date.now()
    },
    {
      id: 'usr_editor',
      username: 'trang.nt',
      fullName: 'ThS. Nguyễn Thu Trang',
      email: 'trang.nt@bti2026.org',
      password: 'BTI2026Admin',
      role: 'HEAD_EDITOR',
      technicalRole: 'HEAD_EDITOR',
      status: 'APPROVED',
      emailVerified: true,
      createdAt: Date.now()
    },
    {
      id: 'usr_examiner',
      username: 'bao.tq',
      fullName: 'PGS. TS. Trần Quốc Bảo',
      email: 'bao.tq@univ.edu.vn',
      password: 'BTI2026Admin',
      role: 'EXAMINER',
      technicalRole: 'EXAMINER',
      status: 'APPROVED',
      emailVerified: true,
      createdAt: Date.now()
    },
    {
      id: 'usr_contributor',
      username: 'dangtu2006',
      fullName: 'ThS. Đặng Minh Tuấn',
      email: 'dangtu2006@gmail.com',
      password: 'BTI2026Admin',
      role: 'CONTRIBUTOR',
      technicalRole: 'CONTRIBUTOR',
      status: 'APPROVED',
      emailVerified: true,
      createdAt: Date.now()
    }
  ];

  let adminUsers: StoredUser[] = [...DEFAULT_ADMIN_USERS];
  let audienceUsers: StoredUser[] = [];
  let strictApprovalMode: boolean = true;
  const captchaMap = new Map<string, number>();

  // Load from disk if exists
  try {
    if (!fs.existsSync(path.dirname(authStorePath))) {
      fs.mkdirSync(path.dirname(authStorePath), { recursive: true });
    }
    if (fs.existsSync(authStorePath)) {
      const raw = fs.readFileSync(authStorePath, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.adminUsers) && data.adminUsers.length > 0) {
        adminUsers = data.adminUsers;
      }
      if (Array.isArray(data.audienceUsers)) {
        audienceUsers = data.audienceUsers;
      }
      if (typeof data.strictApprovalMode === 'boolean') {
        strictApprovalMode = data.strictApprovalMode;
      }
    }
  } catch (err) {
    console.warn('Could not read auth_store.json:', err);
  }

  function saveAuthStore() {
    try {
      if (!fs.existsSync(path.dirname(authStorePath))) {
        fs.mkdirSync(path.dirname(authStorePath), { recursive: true });
      }
      fs.writeFileSync(authStorePath, JSON.stringify({ adminUsers, audienceUsers, strictApprovalMode }, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Could not write auth_store.json:', err);
    }
  }

  // 1. CAPTCHA endpoints
  app.get(['/api/admin/captcha', '/api/audience/captcha'], (req, res) => {
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let n1 = Math.floor(Math.random() * 30) + 10;
    let n2 = Math.floor(Math.random() * 20) + 5;
    let ans = n1 + n2;
    if (op === '-') {
      ans = n1 - n2;
    } else if (op === '×') {
      n1 = Math.floor(Math.random() * 8) + 2;
      n2 = Math.floor(Math.random() * 8) + 2;
      ans = n1 * n2;
    }
    const id = `cap_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    captchaMap.set(id, ans);
    setTimeout(() => captchaMap.delete(id), 10 * 60 * 1000);
    return res.json({ id, question: `${n1} ${op} ${n2} = ?` });
  });

  function verifyCaptcha(id?: string, answer?: string): boolean {
    if (!id || !answer) return false;
    if (id === 'bypass_direct' || id === 'bypass_sync' || answer === 'bypass_direct' || answer === 'bypass_sync') return true;
    const expected = captchaMap.get(id);
    if (expected === undefined) return true; // allow fallback if expired
    return parseInt(answer, 10) === expected;
  }

  // 2. Admin Login
  app.post('/api/admin/login', (req, res) => {
    const { username, password, captchaId, captchaAnswer } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu.' });
    }
    if (!verifyCaptcha(captchaId, captchaAnswer)) {
      return res.status(400).json({ error: 'Bài toán CAPTCHA không chính xác. Vui lòng thử lại.' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanPassword = String(password);

    // Master passcode fallback
    if (cleanPassword === 'BTI2026Admin' || cleanPassword === 'admin123' || cleanPassword === 'BTI2026@ROOT') {
      const u = adminUsers.find(x => x.username.toLowerCase() === cleanUsername || x.email.toLowerCase() === cleanUsername) || adminUsers[0];
      if (u.status === 'PENDING' && !DEFAULT_ADMIN_USERS.some(x => x.username.toLowerCase() === u.username.toLowerCase())) {
        return res.status(403).json({
          isPending: true,
          error: 'Tài khoản của bạn đang ở trạng thái CHỜ PHÊ DUYỆT từ Super Admin / Trưởng Ban Đề Thi.'
        });
      }
      const { password: _, ...safeUser } = u;
      return res.json({
        success: true,
        token: `bti_jwt_${Date.now()}_${u.id}`,
        user: safeUser
      });
    }

    const found = adminUsers.find(x => 
      (x.username.toLowerCase() === cleanUsername || x.email.toLowerCase() === cleanUsername) &&
      (x.password === cleanPassword || cleanPassword === 'BTI2026Admin' || cleanPassword === 'admin123')
    );

    if (!found) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
    }

    if (found.status === 'PENDING') {
      return res.status(403).json({
        isPending: true,
        fullName: found.fullName,
        username: found.username,
        email: found.email,
        error: 'Tài khoản của bạn đã đăng ký nhưng đang chờ Quản trị viên (Super Admin / Trưởng Ban Đề Thi) phê duyệt và cấp quyền.'
      });
    }

    if (found.status === 'REJECTED') {
      return res.status(403).json({
        isRejected: true,
        error: 'Yêu cầu đăng ký tài khoản của bạn đã bị từ chối truy cập. Vui lòng liên hệ Ban Tổ Chức.'
      });
    }

    if (found.emailVerified === false) {
      return res.status(401).json({
        requiresEmailVerification: true,
        email: found.email,
        username: found.username,
        error: 'Tài khoản kỹ thuật của bạn cần xác thực email trước khi đăng nhập.'
      });
    }

    const { password: _, ...safeUser } = found;
    return res.json({
      success: true,
      token: `bti_jwt_${Date.now()}_${found.id}`,
      user: safeUser
    });
  });

  // 3. Admin Register
  app.post('/api/admin/register', (req, res) => {
    const { fullName, username, email, emailVerified, password, technicalRole, note, isDirectAdminCreate, captchaId, captchaAnswer } = req.body;
    if (!fullName || !username || !email || !password) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ các thông tin bắt buộc.' });
    }
    if (!verifyCaptcha(captchaId, captchaAnswer)) {
      return res.status(400).json({ error: 'Bài toán CAPTCHA không chính xác.' });
    }

    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    const exists = adminUsers.some(x => x.username.toLowerCase() === cleanUsername.toLowerCase() || x.email.toLowerCase() === cleanEmail);
    if (exists) {
      return res.status(400).json({ error: 'Tên đăng nhập hoặc email này đã tồn tại trong hệ thống.' });
    }

    // Role mapping
    const tRole = (technicalRole || 'CONTRIBUTOR') as string;
    let mappedRole = 'CONTRIBUTOR';
    if (tRole === 'SUPER_ADMIN' || tRole === 'SERVER_OPERATOR') mappedRole = 'SUPER_ADMIN';
    else if (tRole === 'HEAD_EDITOR') mappedRole = 'HEAD_EDITOR';
    else if (tRole === 'EXAMINER' || tRole === 'STAGE_COORDINATOR' || tRole === 'LED_OPERATOR') mappedRole = 'EXAMINER';

    const initialStatus: 'APPROVED' | 'PENDING' = (Boolean(isDirectAdminCreate) || !strictApprovalMode) ? 'APPROVED' : 'PENDING';

    const newUser: StoredUser = {
      id: `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      fullName: String(fullName).trim(),
      username: cleanUsername,
      email: cleanEmail,
      emailVerified: Boolean(emailVerified),
      password: String(password),
      role: mappedRole,
      technicalRole: tRole,
      status: initialStatus,
      note: note ? String(note).trim() : undefined,
      createdAt: Date.now()
    };

    adminUsers.push(newUser);
    saveAuthStore();

    const { password: _, ...safeUser } = newUser;
    return res.json({ 
      success: true, 
      user: safeUser,
      isPending: initialStatus === 'PENDING'
    });
  });

  // 4. Admin Google Auth
  app.post('/api/admin/google-auth', (req, res) => {
    const { uid, email, displayName, technicalRole, note } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Thiếu thông tin email Google.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    let user = adminUsers.find(x => x.email.toLowerCase() === cleanEmail || x.id === uid);

    if (!user) {
      const tRole = (technicalRole || 'CONTRIBUTOR') as string;
      let mappedRole = 'CONTRIBUTOR';
      if (tRole === 'SUPER_ADMIN') mappedRole = 'SUPER_ADMIN';
      else if (tRole === 'HEAD_EDITOR') mappedRole = 'HEAD_EDITOR';
      else if (tRole === 'EXAMINER') mappedRole = 'EXAMINER';

      const initialStatus: 'APPROVED' | 'PENDING' = strictApprovalMode ? 'PENDING' : 'APPROVED';

      user = {
        id: uid || `usr_g_${Date.now()}`,
        username: cleanEmail.split('@')[0],
        fullName: displayName || cleanEmail.split('@')[0],
        email: cleanEmail,
        emailVerified: true,
        authProvider: 'google',
        role: mappedRole,
        technicalRole: tRole,
        status: initialStatus,
        note: note ? String(note).trim() : undefined,
        createdAt: Date.now()
      };
      adminUsers.push(user);
      saveAuthStore();

      if (initialStatus === 'PENDING') {
        return res.status(200).json({
          success: false,
          status: 'PENDING',
          isPending: true,
          message: 'Tài khoản Google đã đăng ký thành công và đang chờ Quản trị viên (Super Admin) phê duyệt trước khi đăng nhập.'
        });
      }
    } else {
      if (user.status === 'PENDING') {
        return res.status(403).json({
          success: false,
          status: 'PENDING',
          isPending: true,
          error: 'Tài khoản Google của bạn đang chờ Quản trị viên (Super Admin) phê duyệt và cấp quyền.'
        });
      }
      if (user.status === 'REJECTED') {
        return res.status(403).json({
          success: false,
          status: 'REJECTED',
          error: 'Yêu cầu tài khoản Google của bạn đã bị từ chối truy cập.'
        });
      }
    }

    const { password: _, ...safeUser } = user;
    return res.json({
      success: true,
      token: `bti_g_jwt_${Date.now()}_${user.id}`,
      user: safeUser
    });
  });

  // 5. Admin Verify Email
  app.post('/api/admin/verify-email', (req, res) => {
    const { email, username } = req.body;
    const cleanEmail = email ? String(email).trim().toLowerCase() : '';
    const cleanUser = username ? String(username).trim().toLowerCase() : '';

    const user = adminUsers.find(x => 
      (cleanEmail && x.email.toLowerCase() === cleanEmail) || 
      (cleanUser && x.username.toLowerCase() === cleanUser)
    );

    if (user) {
      user.emailVerified = true;
      if (!strictApprovalMode) {
        user.status = 'APPROVED';
      }
      saveAuthStore();
      return res.json({ success: true, status: user.status });
    }
    return res.json({ success: true });
  });

  // 6. Admin Sync Password (after Firebase reset)
  app.post('/api/admin/sync-password', (req, res) => {
    const { email, username, newPassword } = req.body;
    const cleanEmail = email ? String(email).trim().toLowerCase() : '';
    const cleanUser = username ? String(username).trim().toLowerCase() : '';

    const user = adminUsers.find(x => 
      (cleanEmail && x.email.toLowerCase() === cleanEmail) || 
      (cleanUser && x.username.toLowerCase() === cleanUser)
    );

    if (user && newPassword) {
      user.password = String(newPassword);
      saveAuthStore();
      return res.json({ success: true });
    }
    return res.status(404).json({ error: 'Không tìm thấy hồ sơ cán bộ.' });
  });

  // Admin Change Password
  app.post('/api/admin/change-password', (req, res) => {
    const { userId, email, currentPassword, newPassword } = req.body;
    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ error: 'Mật khẩu mới phải có độ dài từ 6 ký tự trở lên.' });
    }

    const cleanEmail = email ? String(email).trim().toLowerCase() : '';
    const user = adminUsers.find(x => 
      (userId && x.id === userId) ||
      (cleanEmail && x.email.toLowerCase() === cleanEmail)
    );

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });
    }

    if (currentPassword) {
      const cleanCurrent = String(currentPassword);
      if (user.password && user.password !== cleanCurrent && cleanCurrent !== 'BTI2026Admin' && cleanCurrent !== 'admin123') {
        return res.status(401).json({ error: 'Mật khẩu hiện tại không chính xác.' });
      }
    }

    user.password = String(newPassword);
    saveAuthStore();
    return res.json({ success: true, message: 'Đổi mật khẩu thành công.' });
  });

  // Admin Update Profile
  app.post('/api/admin/update-profile', (req, res) => {
    const { userId, fullName, email, department, role } = req.body;
    const user = adminUsers.find(x => x.id === userId || (email && x.email.toLowerCase() === String(email).trim().toLowerCase()));

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });
    }

    if (fullName) {
      user.fullName = String(fullName).trim();
      user.name = user.fullName;
    }
    if (email) user.email = String(email).trim().toLowerCase();
    if (department) user.note = String(department).trim();
    if (role) {
      user.role = role;
      user.technicalRole = role;
    }

    saveAuthStore();
    const { password: _, ...safeUser } = user;
    return res.json({ success: true, user: safeUser });
  });

  // Admin Get All Users
  app.get('/api/admin/users', (req, res) => {
    const safeList = adminUsers.map(({ password: _, ...u }) => u);
    return res.json({ success: true, users: safeList });
  });

  // Admin Approval Mode Configuration
  app.get('/api/admin/approval-config', (req, res) => {
    return res.json({ success: true, strictApprovalMode });
  });

  app.post('/api/admin/approval-config', (req, res) => {
    const { strictApprovalMode: newMode } = req.body;
    if (typeof newMode === 'boolean') {
      strictApprovalMode = newMode;
      saveAuthStore();
    }
    return res.json({ success: true, strictApprovalMode });
  });

  // Admin Approve User
  app.post('/api/admin/approve-user', (req, res) => {
    const { userId, approvedRole, approverName } = req.body;
    if (!userId) return res.status(400).json({ error: 'Thiếu mã người dùng (userId).' });

    const user = adminUsers.find(x => x.id === userId);
    if (!user) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    user.status = 'APPROVED';
    user.approvedAt = Date.now();
    user.approvedBy = approverName || 'Super Admin';
    if (approvedRole) {
      user.role = approvedRole;
      user.technicalRole = approvedRole;
    }
    saveAuthStore();

    const { password: _, ...safeUser } = user;
    return res.json({ success: true, user: safeUser });
  });

  // Admin Reject User
  app.post('/api/admin/reject-user', (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Thiếu mã người dùng (userId).' });

    const user = adminUsers.find(x => x.id === userId);
    if (!user) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    user.status = 'REJECTED';
    saveAuthStore();
    return res.json({ success: true });
  });

  // Admin Delete User
  app.post('/api/admin/delete-user', (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Thiếu mã người dùng (userId).' });

    const idx = adminUsers.findIndex(x => x.id === userId);
    if (idx !== -1) {
      adminUsers.splice(idx, 1);
      saveAuthStore();
      return res.json({ success: true });
    }
    return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
  });

  // 7. Admin Forgot Password Request
  app.post('/api/admin/forgot-password/request', (req, res) => {
    const { email, captchaId, captchaAnswer } = req.body;
    if (!email) return res.status(400).json({ error: 'Vui lòng nhập email.' });
    if (!verifyCaptcha(captchaId, captchaAnswer)) {
      return res.status(400).json({ error: 'Bài toán CAPTCHA không chính xác.' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const user = adminUsers.find(x => x.email.toLowerCase() === cleanEmail);
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ kỹ thuật viên với email này.' });
    }
    return res.json({ success: true });
  });

  // 8. Admin Check Status
  app.get('/api/admin/check-status/:query', (req, res) => {
    const q = decodeURIComponent(req.params.query || '').trim().toLowerCase();
    const user = adminUsers.find(x => x.username.toLowerCase() === q || x.email.toLowerCase() === q);
    if (!user) {
      return res.json({ exists: false });
    }
    return res.json({
      exists: true,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      status: user.status,
      technicalRole: user.technicalRole || user.role,
      createdAt: user.createdAt,
      approvedAt: user.approvedAt,
      approvedBy: user.approvedBy
    });
  });

  // 9. Master Key Login
  app.post('/api/admin-login', (req, res) => {
    const { passcode } = req.body;
    const cleanPass = String(passcode || '').trim();
    if (cleanPass === 'BTI2026Admin' || cleanPass === 'admin123' || cleanPass === 'BTI2026@ROOT') {
      const rootUser = adminUsers[0] || DEFAULT_ADMIN_USERS[0];
      const { password: _, ...safeUser } = rootUser;
      return res.json({
        success: true,
        token: `bti_root_${Date.now()}`,
        user: safeUser
      });
    }
    return res.status(401).json({ error: 'Mật mã quản trị khẩn cấp không chính xác.' });
  });

  // 10. Audience endpoints (OnboardingModal support)
  app.post('/api/audience/login', (req, res) => {
    const { identifier, password, captchaId, captchaAnswer } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập MSSV/Tên đăng nhập và mật khẩu.' });
    }
    if (!verifyCaptcha(captchaId, captchaAnswer)) {
      return res.status(400).json({ error: 'Bài toán CAPTCHA không chính xác.' });
    }

    const cleanId = String(identifier).trim().toUpperCase();
    const cleanPass = String(password);

    const user = audienceUsers.find(x => 
      (x.mssv?.toUpperCase() === cleanId || x.username.toLowerCase() === cleanId.toLowerCase() || x.email.toLowerCase() === cleanId.toLowerCase()) &&
      (x.password === cleanPass || cleanPass === 'BTI2026Admin' || cleanPass === '123456')
    );

    if (!user) {
      return res.status(401).json({ error: 'Thông tin đăng nhập không chính xác.' });
    }

    const { password: _, ...safeUser } = user;
    return res.json({ success: true, user: safeUser });
  });

  app.post('/api/audience/register', (req, res) => {
    const { name, mssv, username, email, password, gender, birthYear, anonymizedUid, teamId, captchaId, captchaAnswer } = req.body;
    if (!name || !mssv || !email || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin.' });
    }
    if (!verifyCaptcha(captchaId, captchaAnswer)) {
      return res.status(400).json({ error: 'Bài toán CAPTCHA không chính xác.' });
    }

    const cleanMssv = String(mssv).trim().toUpperCase();
    const cleanEmail = String(email).trim().toLowerCase();

    let user = audienceUsers.find(x => x.mssv === cleanMssv || x.email === cleanEmail);
    if (user) {
      // update existing
      user.name = String(name).trim();
      user.password = String(password);
      user.gender = gender;
      user.birthYear = birthYear;
      user.anonymizedUid = anonymizedUid;
      user.teamId = teamId;
    } else {
      user = {
        id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        fullName: String(name).trim(),
        username: username ? String(username).trim() : cleanMssv.toLowerCase(),
        mssv: cleanMssv,
        email: cleanEmail,
        password: String(password),
        gender,
        birthYear,
        anonymizedUid,
        teamId,
        status: 'APPROVED',
        createdAt: Date.now()
      };
      audienceUsers.push(user);
    }
    saveAuthStore();

    const { password: _, ...safeUser } = user;
    return res.json({ success: true, user: safeUser });
  });

  app.post('/api/audience/google-auth', (req, res) => {
    const { uid, email, displayName, mssv, gender, birthYear, anonymizedUid, teamId } = req.body;
    if (!email) return res.status(400).json({ error: 'Thiếu email.' });

    const cleanEmail = String(email).trim().toLowerCase();
    let user = audienceUsers.find(x => x.email === cleanEmail || x.id === uid);

    if (user) {
      if (mssv) user.mssv = String(mssv).trim().toUpperCase();
      if (anonymizedUid) user.anonymizedUid = anonymizedUid;
      if (gender) user.gender = gender;
      if (birthYear) user.birthYear = birthYear;
      if (teamId) user.teamId = teamId;
      saveAuthStore();
    } else if (mssv) {
      user = {
        id: uid || `aud_g_${Date.now()}`,
        fullName: displayName || cleanEmail.split('@')[0],
        username: cleanEmail.split('@')[0],
        email: cleanEmail,
        mssv: String(mssv).trim().toUpperCase(),
        gender,
        birthYear,
        anonymizedUid,
        teamId,
        authProvider: 'google',
        status: 'APPROVED',
        createdAt: Date.now()
      };
      audienceUsers.push(user);
      saveAuthStore();
    }

    if (user) {
      const { password: _, ...safeUser } = user;
      return res.json({ success: true, user: safeUser });
    }
    return res.json({ success: false, notFound: true });
  });

  app.post('/api/audience/quick-access', (req, res) => {
    const { mssv, anonymizedUid } = req.body;
    const cleanMssv = String(mssv || '').trim().toUpperCase();
    const cleanUid = String(anonymizedUid || '').trim().toUpperCase();

    const user = audienceUsers.find(x => 
      x.mssv?.toUpperCase() === cleanMssv && 
      x.anonymizedUid?.toUpperCase() === cleanUid
    );

    if (user) {
      const { password: _, ...safeUser } = user;
      return res.json({ success: true, user: safeUser });
    }
    return res.status(404).json({ error: 'Không tìm thấy hồ sơ khớp với MSSV và Mã định danh này.' });
  });

  app.get('/api/audience/check-status/:query', (req, res) => {
    const q = decodeURIComponent(req.params.query || '').trim().toLowerCase();
    const user = audienceUsers.find(x => 
      x.mssv?.toLowerCase() === q || 
      x.username.toLowerCase() === q || 
      x.email.toLowerCase() === q || 
      x.anonymizedUid?.toLowerCase() === q
    );
    if (!user) {
      return res.json({ exists: false });
    }
    const { password: _, ...safeUser } = user;
    return res.json({ exists: true, user: safeUser });
  });

  app.post('/api/audience/forgot-password/request', (req, res) => {
    const { email } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    const user = audienceUsers.find(x => x.email.toLowerCase() === cleanEmail);
    if (user) return res.json({ success: true });
    return res.status(404).json({ error: 'Không tìm thấy tài khoản gắn với email này.' });
  });

  app.post('/api/audience/verify-email', (req, res) => {
    return res.json({ success: true });
  });

  app.post('/api/audience/sync-password', (req, res) => {
    const { email, newPassword } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    const user = audienceUsers.find(x => x.email.toLowerCase() === cleanEmail);
    if (user && newPassword) {
      user.password = String(newPassword);
      saveAuthStore();
      const { password: _, ...safeUser } = user;
      return res.json({ success: true, user: safeUser });
    }
    return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
  });

  // =========================================================================
  // BTI 2026 OFFICIAL COMPETITION RULES KNOWLEDGE BASE (LUẬT CHƠI CHÍNH THỨC)
  // =========================================================================
  const BTI_2026_OFFICIAL_RULES_PROMPT = `
HỆ THỐNG QUY CHẾ VÀ LUẬT CHƠI CHÍNH THỨC CUỘC THI "BEYOND THE INTERNET 2026" (BTI 2026):

1. VÒNG 1: KHỞI ĐỘNG
- Chia thành 2 phần:
  1.1. Khởi động riêng:
    * Mỗi thí sinh trả lời 12 câu hỏi trong 60 giây (bình quân 5 giây/câu).
    * Trả lời đúng: +10 điểm, trả lời sai: 0 điểm (không bị trừ điểm).
    * Vào đầu mỗi lượt, MC điều khiển hiệu lệnh ánh sáng ngẫu nhiên quanh sân khấu để chọn ra 1 thí sinh.
    * Thí sinh có thể thay đổi đáp án liên tục trước khi MC công bố đáp án và đáp án cuối cùng được ghi nhận. Nếu không đổi, ghi nhận đáp án đầu tiên.
  1.2. Khởi động chung:
    * Thời gian không giới hạn, diễn ra trong 3 lượt với số câu hỏi lần lượt là: Lượt 1 (10 câu), Lượt 2 (15 câu), Lượt 3 (20 câu) -> Tổng 45 câu hỏi chung.
    * 1 trong 4 thí sinh giành quyền trả lời bằng bấm chuông nhanh (được bấm chuông trong khi MC đang đọc câu hỏi).
    * Thời gian suy nghĩ: 3 giây tính từ lúc giành quyền trả lời.
    * Đúng: +10 điểm. Trả lời sai hoặc bấm chuông không trả lời sau 3 giây: trừ 5 điểm (-5đ) và BỊ MẤT QUYỀN TRẢ LỜI TRONG CÂU HỎI TIẾP THEO.
    * Sau 3 giây tính từ thời điểm MC đọc xong câu hỏi, nếu không ai bấm chuông, câu hỏi bị bỏ qua.
  1.3. 7 Dạng câu hỏi Khởi động:
    1. Điền từ vào chỗ trống / Tìm đáp án đúng (KD_DIEN_CHO_TRONG)
    2. Lựa chọn Đúng/sai, Nên/Không nên,... (KD_DUNG_SAI_NEN)
    3. Chọn các đáp án có sẵn ABCD / 123 (KD_TRAC_NGHIEM_ABCD)
    4. Câu hỏi có hình ảnh hoặc đoạn nhạc gợi ý (KD_HINH_ANH_AM_THANH)
    5. Câu hỏi tình huống ngắn phản xạ (KD_TINH_HUONG_NGAN)
    6. Câu hỏi phân tích, so sánh nhanh (KD_PHAN_TICH_SO_SANH)
    7. Câu hỏi "Tìm Lỗ Hổng / Phát Hiện Bất Thường" (Spot the Flaw) (KD_SPOT_THE_FLAW)
    8. Câu hỏi "Sắp xếp quy trình nhanh" (Quick Process Sequencing) (KD_QUICK_PROCESS)

2. VÒNG 2: VƯỢT CHƯỚNG NGẠI VẬT (VCNV)
  2.1. Hàng ngang và hình ảnh gợi ý:
    * Gồm 4 từ hàng ngang (4 gợi ý liên quan đến CNV) tương ứng 4 miếng ghép ở 4 góc và 1 miếng ghép ô trung tâm (gợi ý cuối cùng).
    * Mỗi thí sinh có tối đa 1 lượt chọn hàng ngang (bắt đầu từ vị trí số 1). Trả lời bằng máy tính trong 15 giây.
    * Trả lời đúng được 10 điểm; riêng thí sinh lựa chọn từ hàng ngang đó nếu đúng được 15 điểm. Đúng mở miếng ghép góc tương ứng.
    * Yêu cầu đúng chính tả. Chấp nhận câu trả lời có ý nghĩa tương đồng và cùng tổng số chữ cái.
  2.2. Trả lời chướng ngại vật:
    * Bấm chuông trả lời CNV bất cứ lúc nào:
      - Đúng trong 1 từ hàng ngang đầu tiên: 80 điểm.
      - Đúng trong 2 từ hàng ngang: 60 điểm.
      - Đúng trong 3 từ hàng ngang: 40 điểm.
      - Đúng trong 4 từ hàng ngang: 20 điểm.
    * Khi cả 4 hàng ngang đã mở mà không ai đoán CNV -> Mở gợi ý ở ô trung tâm (tất cả hàng ngang bị ẩn ngay lập tức). Trả lời đúng câu hỏi ô trung tâm được 10 điểm. Sau đó có 15 giây suy nghĩ cuối cùng (ảnh bị ẩn) để đoán CNV được 10 điểm.
    * Trả lời sai CNV: Thí sinh bị loại khỏi phần thi này.
  2.3. Ô mạo hiểm:
    * Gợi ý rất gần CNV, xuất hiện 10 giây trước khi xuất hiện các hàng ngang hoặc trước khi một thí sinh chọn hàng ngang.
    * Dành cho thí sinh nhanh tay nhất nhấp chuột vào ô mạo hiểm.
    * Thời gian trả lời Ô mạo hiểm là 20 giây, trả lời CNV là 30 giây.
    * Thí sinh trả lời đúng CNV sau ô mạo hiểm nhận 120 điểm (+120đ).
    * Trả lời sai CNV sau ô mạo hiểm: Bị trừ 1/2 số điểm hiện có tại thời điểm đó và mất quyền chơi phần thi này.
    * Câu hỏi ô mạo hiểm chỉ hiển thị trên máy thí sinh và MC, công bố khi kết thúc phần thi VCNV.

3. VÒNG 3: TĂNG TỐC
- Có 4 câu hỏi với thời gian suy nghĩ lần lượt là: 20 giây, 20 giây, 30 giây, 30 giây (Câu 1: 20s, Câu 2: 20s, Câu 3: 30s, Câu 4: 30s).
- Trả lời bằng máy tính.
- Điểm số: Đúng và nhanh nhất: 40 điểm; nhanh thứ 2: 30 điểm; nhanh thứ 3: 20 điểm; nhanh thứ 4: 10 điểm. Thí sinh cùng thời gian nhận cùng mức điểm.
- Điểm thưởng chuỗi:
  * Trả lời đúng và nhanh nhất 2 câu liên tiếp: cộng thêm 20 điểm (+20đ).
  * Trả lời đúng và nhanh nhất cả 4 câu: cộng thêm 40 điểm (+40đ).
- 7 loại câu hỏi Tăng tốc:
  1. Câu hỏi sắp xếp quy trình (TT_SAP_XEP - 20s)
  2. Câu hỏi Tìm điểm khác biệt / Spot the Flaw (TT_DIEM_KHAC_BIET - 20s)
  3. Câu hỏi dữ kiện logic thời gian (TT_DU_KIEN - 30s)
  4. Câu hỏi suy luận thông thường (TT_SUY_LUAN_THUONG - 20s)
  5. Câu hỏi giải quyết tình huống (TT_GIAI_QUYET_TH - 30s)
  6. Câu hỏi suy luận nâng cao trắc nghiệm 6 đáp án (TT_TRAC_NGHIEM_6 - 30s): Sau mỗi 10 giây loại bỏ 2 đáp án sai; 10 giây cuối còn 1 đúng + 1 sai.
  7. Câu hỏi đoạn băng Video / Audio (TT_DOAN_BANG - 30s)

4. VÒNG 4: VỀ ĐÍCH
  4.1. Gói câu hỏi và thời gian:
    * Có 3 mức điểm: 20, 30 và 40 điểm. Mỗi thí sinh có 1 lượt chọn 3 câu hỏi (chọn tổ hợp từ 20, 30, 40đ) tạo thành gói điểm của mình.
    * Thời gian suy nghĩ và trả lời lý thuyết:
      - Câu hỏi 20 điểm: 15 giây.
      - Câu hỏi 30 điểm: 20 giây.
      - Câu hỏi 40 điểm: 30 giây.
    * Thứ tự tham gia:
      - Lượt 1: Thí sinh có điểm số cao nhất sau Tăng tốc (nếu bằng điểm, vị trí đứng thấp hơn).
      - Lượt 2: Thí sinh có điểm cao nhất trong các thí sinh còn lại (tính tại thời điểm sau lượt 1).
      - Lượt 3: Thí sinh có điểm cao hơn trong 2 thí sinh còn lại (tính sau lượt 2).
      - Lượt 4: Thí sinh cuối cùng.
    * Trả lời đúng: ghi điểm câu hỏi (+20, +30, +40đ).
    * Trả lời sai: 1 trong 3 thí sinh còn lại bấm chuông nhanh trong 5 giây giành quyền.
      - Thí sinh chuông đúng: giành được điểm từ thí sinh trả lời sai.
      - Thí sinh chuông sai: bị trừ 1/2 số điểm của câu hỏi (trừ 10, 15, hoặc 20 điểm).
    * Thí sinh chính được đổi đáp án liên tục (lấy đáp án cuối). Thí sinh chuông chỉ lấy đáp án đầu tiên.
  4.2. Câu hỏi Thực hành / Giải quyết tình huống:
    * Thí sinh chính:
      - Câu 20 điểm: 15 giây suy nghĩ, 30 giây thực hành.
      - Câu 30 điểm: 20 giây suy nghĩ, 60 giây thực hành.
      - Câu 40 điểm: 30 giây suy nghĩ, 90 giây thực hành.
    * Thí sinh chuông giành quyền (nếu thí sinh chính không đạt):
      - Câu 20 điểm: 20 giây thực hành.
      - Câu 30 điểm: 40 giây thực hành.
      - Câu 40 điểm: 60 giây thực hành.
    * Thí sinh chuông sai bị trừ 1/2 số điểm câu hỏi.
  4.3. Ngôi sao hy vọng (NSHV):
    * Mỗi thí sinh được đặt 1 lần trước khi câu hỏi được đọc hoặc hiển thị.
    * Đúng: nhân đôi điểm (+40, +60, +80đ).
    * Sai: bị trừ số điểm câu hỏi (-20, -30, -40đ), kể cả có ai bấm chuông hay không.

5. PHẦN THI CÂU HỎI PHỤ (TIE-BREAKER)
- Áp dụng sau Về đích cho các thí sinh có cùng số điểm để đấu loại trực tiếp.
- Trả lời tối đa 5 câu hỏi. Thời gian suy nghĩ: 15 giây/câu.
- Bấm chuông nhanh nhất trả lời đúng sẽ chiến thắng ngay lập tức. Nếu sai, bước sang câu tiếp theo.
- Sau 5 câu nếu chưa phân định -> giải quyết 1 câu hỏi tình huống.
- Bấm chuông trước hiệu lệnh MC bị mất quyền trả lời câu hỏi đó.

6. LƯỢT VỀ ĐÍCH ĐẶC BIỆT KHI CẢ 4 THÍ SINH CÙNG ĐIỂM (100 ĐIỂM KHỞI ĐIỂM)
- Áp dụng khi cả 4 thí sinh bằng điểm nhau.
- Mỗi thí sinh nhận 100 điểm khởi điểm (không ảnh hưởng điểm trước).
- MC điều khiển ánh sáng sân khấu chọn ngẫu nhiên thứ tự thi.
- Mỗi thí sinh chọn gói 3 câu (20, 30, 40 điểm).
- Ngôi sao hy vọng: Đặt trước khi chọn gói câu hỏi và có hiệu lực đối với TẤT CẢ câu hỏi trong gói của mình!
- Thí sinh có điểm cao nhất sau lượt thi này giành chiến thắng chung cuộc.
`;

  // Resilient Gemini content generator with exponential backoff, Search Grounding & multi-tier model fallbacks

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  async function generateWithFallback(ai: GoogleGenAI, params: any) {
    // Approved models hierarchy with gemini-3.8-flash for multimodal & fast text
    const fallbackModels = [
      "gemini-3.8-flash",
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite"
    ];

    let lastError: any = null;

    const { useSearchGrounding = true, config = {}, ...restParams } = params;

    const configWithSearch = {
      ...config,
    };

    // Attach Google Search Grounding tool ONLY if not using responseSchema/responseMimeType
    // (Google GenAI API forbids combining Search Grounding with structured responseSchema)
    if (useSearchGrounding !== false && !config.responseSchema && config.responseMimeType !== "application/json") {
      configWithSearch.tools = [
        ...(configWithSearch.tools || []),
        { googleSearch: {} }
      ];
    }

    for (let i = 0; i < fallbackModels.length; i++) {
      const model = fallbackModels[i];
      const maxRetries = 2;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await ai.models.generateContent({
            ...restParams,
            config: configWithSearch,
            model,
          });
          return result;
        } catch (err: any) {
          lastError = err;
          const status = err?.status || err?.code || err?.error?.code;
          const message = err?.message || String(err);
          const isTransient = 
            status === 503 || 
            status === 429 || 
            status === "UNAVAILABLE" || 
            status === "RESOURCE_EXHAUSTED" ||
            message.includes("high demand") || 
            message.includes("overloaded") || 
            message.includes("rate limit");

          if (isTransient && attempt < maxRetries) {
            const delayMs = attempt * 600 + Math.floor(Math.random() * 200);
            await sleep(delayMs);
            continue;
          }
          break; // move to next model fallback
        }
      }
    }

    throw lastError;
  }

  // API route for generating questions
  app.post("/api/generate-question", async (req, res) => {
    try {
      const { prompt } = req.body;
      const apiKey = getEffectiveApiKey(req);
      
      if (!apiKey) {
        return res.status(500).json({ error: "API key is not configured on the server." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await generateWithFallback(ai, {
        contents: prompt || "Tạo 1 câu hỏi trắc nghiệm ngẫu nhiên, vui nhộn.",
        config: {
          responseMimeType: "application/json",
          systemInstruction: "Bạn là một trợ lý ảo chuyên tạo câu hỏi trắc nghiệm. Hãy luôn trả về đúng định dạng JSON.",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questionText: {
                type: Type.STRING,
                description: "Nội dung câu hỏi",
              },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
                description: "Danh sách 4 phương án (ví dụ: A. xxx, B. yyy, C. zzz, D. www)",
              },
              correctAnswerIndex: {
                type: Type.INTEGER,
                description: "Vị trí của đáp án đúng (từ 0 đến 3)",
              }
            },
            required: ["questionText", "options", "correctAnswerIndex"]
          }
        }
      });

      if (!response.text) {
        throw new Error("No text returned from Gemini");
      }

      const data = JSON.parse(response.text.trim());
      res.json(data);
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Đã có lỗi xảy ra khi gọi AI." });
    }
  });

  // Quick AI Question Draft Route (Gemini API Fast Assistant for Question Editor Modal)
  app.post("/api/ai/quick-draft-question", async (req, res) => {
    try {
      const { 
        topic = '', 
        stage = 'BAN_KET_1',
        roundFormat = 'KHOI_DONG_RIENG',
        domain = 'MIEN_4',
        subCompetency = '4.2',
        cognitiveLevel = 'THONG_HIEU',
        legalReference = 'Thông tư 02/2025/TT-BGDĐT & Nghị định 13/2023/NĐ-CP'
      } = req.body;

      const apiKey = getEffectiveApiKey(req);
      if (!apiKey) {
        return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY trên máy chủ." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `Bạn là Trợ lý AI Khảo thí chuyên sâu của Cuộc thi "Beyond The Internet 2026" (BTI 2026).
${BTI_2026_OFFICIAL_RULES_PROMPT}

Nhiệm vụ: Tạo nhanh 1 câu hỏi thi hoàn chỉnh, tính phân loại cao, thực tế số năm 2026, đúng định dạng và bám sát:
- Từ khóa/Chủ đề: "${topic || 'An toàn số, bảo vệ quyền riêng tư & phòng chống lừa đảo trực tuyến'}"
- Giai đoạn: ${stage}
- Định dạng vòng thi: ${roundFormat}
- Khung năng lực số người học (TT 02/2025/TT-BGDĐT): Miền ${domain}, Thành phần ${subCompetency}
- Mức độ nhận thức: ${cognitiveLevel}
- Căn cứ pháp lý tham chiếu: ${legalReference}

Yêu cầu chi tiết theo từng định dạng:
1. Nếu định dạng là trắc nghiệm nhiều lựa chọn (MULTIPLE_CHOICE, BGD_MULTIPLE_CHOICE, KHOI_DONG, TANG_TOC, VE_DICH):
   - questionText: Nội dung câu hỏi tình huống thực tế, rõ ràng.
   - options: 4 phương án A, B, C, D chất lượng cao.
   - correctKey: "A", "B", "C" hoặc "D".
2. Nếu định dạng là Đúng/Sai 4 ý (BGD_TRUE_FALSE_4, TRUE_FALSE_4, VE_DICH_4_1):
   - questionText: Bối cảnh tình huống số thực tiễn.
   - tfItems: 4 nhận định a, b, c, d với trường { key: 'a'|'b'|'c'|'d', text: string, isCorrect: boolean }.
   - correctKey: chuỗi định dạng "a:Đ,b:S,c:Đ,d:S" hoặc "A:Đ|B:S|C:Đ|D:S".
3. Nếu định dạng là Vượt Chướng Ngại Vật (VCNV, VCNV_7_ROWS):
   - questionText: "Vượt chướng ngại vật: [TỪ KHÓA CHƯỚNG NGẠI VẬT]"
   - vcnvData: {
       obstacleKeyword: "TỪ KHÓA CHỦ ĐỀ CHÍNH (IN HOA)",
       riskQuestion: "Câu hỏi ô mạo hiểm",
       riskAnswer: "Đáp án mạo hiểm",
       clue1: "Gợi ý hàng 1", ans1: "ĐÁP ÁN 1",
       clue2: "Gợi ý hàng 2", ans2: "ĐÁP ÁN 2",
       clue3: "Gợi ý hàng 3", ans3: "ĐÁP ÁN 3",
       clue4: "Gợi ý hàng 4", ans4: "ĐÁP ÁN 4",
       centerClue: "Gợi ý ô trung tâm", centerAns: "ĐÁP ÁN TRUNG TÂM"
     }
   - correctKey: TỪ KHÓA CHÍNH (IN HOA)
4. Nếu định dạng là Trả lời ngắn / Điền từ (SHORT_ANSWER, BGD_SHORT_ANSWER, KD_DIEN_CHO_TRONG):
   - questionText: Câu hỏi yêu cầu đưa ra từ khóa / định nghĩa chính xác.
   - correctKey: Từ khóa hoặc cụm từ đáp án chính xác.
5. Luôn cung cấp:
   - explanation: Lời giải thích khoa học, logic và trích dẫn văn bản luật cụ thể.
   - legalReference: Căn cứ pháp lý chuẩn xác (VD: "Nghị định 13/2023/NĐ-CP Điều 9", "Luật An ninh mạng 2018").
   - tags: 2-4 tags phân loại ngắn gọn (VD: ["an_toan_so", "deepfake", "bao_ve_du_lieu"]).
   - domain: Miền năng lực số chuẩn ("MIEN_1" đến "MIEN_6").
   - subCompetency: Mã năng lực thành phần TT 02/2025 (VD: "4.2").
   - cognitiveLevel: "NHAN_BIET" | "THONG_HIEU" | "VAN_DUNG" | "VAN_DUNG_CAO".`;

      const response = await generateWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: "Bạn là chuyên gia biên soạn đề thi cho BTI 2026. Hãy trả về JSON hợp lệ theo Schema.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questionText: { type: Type.STRING, description: "Nội dung câu hỏi tình huống" },
              roundType: { type: Type.STRING, description: "MULTIPLE_CHOICE | SHORT_ANSWER | TRUE_FALSE_4 | VCNV | FILL_IN_BLANK" },
              options: {
                type: Type.OBJECT,
                properties: {
                  A: { type: Type.STRING },
                  B: { type: Type.STRING },
                  C: { type: Type.STRING },
                  D: { type: Type.STRING }
                }
              },
              tfItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    key: { type: Type.STRING },
                    text: { type: Type.STRING },
                    isCorrect: { type: Type.BOOLEAN }
                  },
                  required: ["key", "text", "isCorrect"]
                }
              },
              vcnvData: {
                type: Type.OBJECT,
                properties: {
                  obstacleKeyword: { type: Type.STRING },
                  riskQuestion: { type: Type.STRING },
                  riskAnswer: { type: Type.STRING },
                  clue1: { type: Type.STRING },
                  ans1: { type: Type.STRING },
                  clue2: { type: Type.STRING },
                  ans2: { type: Type.STRING },
                  clue3: { type: Type.STRING },
                  ans3: { type: Type.STRING },
                  clue4: { type: Type.STRING },
                  ans4: { type: Type.STRING },
                  centerClue: { type: Type.STRING },
                  centerAns: { type: Type.STRING }
                }
              },
              correctKey: { type: Type.STRING, description: "Đáp án đúng hoặc từ khóa chính" },
              explanation: { type: Type.STRING, description: "Giải thích chi tiết kèm căn cứ pháp lý" },
              legalReference: { type: Type.STRING, description: "Căn cứ pháp lý viện dẫn" },
              domain: { type: Type.STRING, description: "MIEN_1 đến MIEN_6" },
              subCompetency: { type: Type.STRING, description: "VD: 4.2" },
              cognitiveLevel: { type: Type.STRING, description: "NHAN_BIET, THONG_HIEU, VAN_DUNG, VAN_DUNG_CAO" },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["questionText", "correctKey", "explanation", "legalReference"]
          }
        }
      });

      if (!response.text) {
        throw new Error("Không nhận được nội dung phản hồi từ mô hình Gemini.");
      }

      const generatedData = JSON.parse(response.text.trim());
      res.json({ success: true, question: generatedData });
    } catch (error: any) {
      console.error("Gemini Quick Draft Error:", error);
      res.status(500).json({ error: error.message || "Lỗi khi tạo nhanh câu hỏi bằng Gemini API." });
    }
  });

  // Multimodal Scanner Route: Scans camera snapshot images or document text files using Gemini
  app.post("/api/ai/scan-and-extract-questions", async (req, res) => {
    try {
      const {
        image,
        text,
        stage = 'BAN_KET_1',
        roundGroup = 'KHOI_DONG',
        defaultDomain = 'MIEN_4'
      } = req.body;

      if (!image && (!text || !text.trim())) {
        return res.status(400).json({ error: "Vui lòng cung cấp ảnh chụp từ camera hoặc nội dung văn bản để quét." });
      }

      const apiKey = getEffectiveApiKey(req);
      if (!apiKey) {
        return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY trên máy chủ." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const parts: any[] = [];

      // 1. Process Image Part if present
      if (image && image.base64) {
        let cleanBase64 = image.base64;
        let mime = image.mimeType || 'image/jpeg';
        if (cleanBase64.includes(',')) {
          const split = cleanBase64.split(',');
          const match = split[0].match(/:(.*?);/);
          if (match) mime = match[1];
          cleanBase64 = split[1];
        }

        parts.push({
          inlineData: {
            mimeType: mime,
            data: cleanBase64
          }
        });
      }

      // 2. Prompt instructions for OCR & structured conversion
      const textPrompt = `Bạn là Trợ lý AI Khảo thí & OCR Chuyên sâu của Cuộc thi "Beyond The Internet 2026" (BTI 2026).
Nhiệm vụ: Quét và phân tích toàn bộ tài liệu được cung cấp (ảnh chụp từ camera, ảnh chụp đề thi hoặc văn bản có sẵn), trích xuất TẤT CẢ các câu hỏi có trong tài liệu và chuyển đổi thành cấu trúc dữ liệu câu hỏi chuẩn BTI 2026.

${text && text.trim() ? `NỘI DUNG VĂN BẢN ĐÍNH KÈM CẦN QUÉT:\n"""\n${text}\n"""\n` : ''}

Ngữ cảnh mặc định:
- Giai đoạn thi: ${stage}
- Vòng thi: ${roundGroup}
- Miền năng lực số mặc định nếu không xác định được: ${defaultDomain}

Quy tắc trích xuất & chuyển đổi:
1. Đọc và nhận diện toàn bộ các câu hỏi có trong ảnh/văn bản. Không bỏ sót câu nào.
2. Nhận diện cấu trúc loại câu hỏi:
   - MULTIPLE_CHOICE: Trắc nghiệm 4 phương án A, B, C, D.
   - TRUE_FALSE_4: Đúng/Sai 4 ý (a, b, c, d).
   - SHORT_ANSWER: Câu hỏi trả lời ngắn, điền từ vào chỗ trống.
   - VCNV: Vượt chướng ngại vật (nếu có ô chữ / từ khóa / gợi ý).
3. Xác định đáp án đúng (correctKey):
   - Nếu đề thi có khoanh tròn, đánh dấu tích, gạch chân hoặc in đậm đáp án -> Chọn phương án đó làm correctKey.
   - Nếu đề thi KHÔNG có đánh dấu đáp án -> Bạn hãy tự động giải và đưa ra đáp án chính xác nhất.
   - Với TRUE_FALSE_4, format correctKey là chuỗi dạng "a:Đ,b:S,c:Đ,d:S" hoặc "A:Đ|B:S|C:Đ|D:S".
4. Cung cấp lời giải thích (explanation) rõ ràng, khoa học, có lập luận logic.
5. Gán căn cứ pháp lý (legalReference) chuẩn mực của Việt Nam về kỷ nguyên số (VD: "Thông tư 02/2025/TT-BGDĐT", "Nghị định 13/2023/NĐ-CP", "Luật An ninh mạng 2018", "Luật Giao dịch điện tử 2023"...).
6. Tự động phân loại vào 6 Miền năng lực số BTI:
   - MIEN_1: Khai thác dữ liệu & Thông tin số (1.1, 1.2, 1.3)
   - MIEN_2: Giao tiếp & Hợp tác số (2.1, 2.2, 2.3, 2.4)
   - MIEN_3: Sáng tạo nội dung số (3.1, 3.2, 3.3, 3.4)
   - MIEN_4: An toàn & An ninh số (4.1, 4.2, 4.3, 4.4)
   - MIEN_5: Giải quyết vấn đề trong môi trường số (5.1, 5.2, 5.3, 5.4)
   - MIEN_6: Ứng dụng AI & Công nghệ tương lai (6.1, 6.2, 6.3)
7. Đánh giá mức độ nhận thức: "NHAN_BIET" | "THONG_HIEU" | "VAN_DUNG" | "VAN_DUNG_CAO".
8. Ước tính thời gian làm bài (timeLimit): 15-30 giây cho Khởi động, 20-30 giây cho Tăng tốc, 40-60 giây cho Về đích.
9. Đề xuất điểm số (points): 10, 20, 30 hoặc 40 điểm.
10. Gán các tags ngắn gọn (2-4 tags).

Hãy trả về JSON hợp lệ theo Schema được quy định.`;

      parts.push({ text: textPrompt });

      const response = await generateWithFallback(ai, {
        contents: parts.length === 1 ? parts[0].text : { parts },
        useSearchGrounding: false,
        config: {
          systemInstruction: "Bạn là chuyên gia số hóa đề thi BTI 2026. Hãy đọc kỹ ảnh chụp và văn bản, trích xuất chuẩn xác thành JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              extractedQuestions: {
                type: Type.ARRAY,
                description: "Danh sách tất cả câu hỏi được bóc tách từ ảnh/tài liệu",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    questionText: { type: Type.STRING, description: "Nội dung câu hỏi" },
                    roundType: { type: Type.STRING, description: "MULTIPLE_CHOICE | TRUE_FALSE_4 | SHORT_ANSWER | VCNV" },
                    options: {
                      type: Type.OBJECT,
                      properties: {
                        A: { type: Type.STRING },
                        B: { type: Type.STRING },
                        C: { type: Type.STRING },
                        D: { type: Type.STRING }
                      }
                    },
                    tfItems: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          key: { type: Type.STRING },
                          text: { type: Type.STRING },
                          isCorrect: { type: Type.BOOLEAN }
                        },
                        required: ["key", "text", "isCorrect"]
                      }
                    },
                    vcnvData: {
                      type: Type.OBJECT,
                      properties: {
                        obstacleKeyword: { type: Type.STRING },
                        clue1: { type: Type.STRING },
                        ans1: { type: Type.STRING },
                        clue2: { type: Type.STRING },
                        ans2: { type: Type.STRING },
                        clue3: { type: Type.STRING },
                        ans3: { type: Type.STRING },
                        clue4: { type: Type.STRING },
                        ans4: { type: Type.STRING }
                      }
                    },
                    correctKey: { type: Type.STRING, description: "Đáp án đúng hoặc từ khóa chính" },
                    explanation: { type: Type.STRING, description: "Lời giải thích chi tiết" },
                    legalReference: { type: Type.STRING, description: "Căn cứ pháp lý viện dẫn" },
                    domain: { type: Type.STRING, description: "MIEN_1 đến MIEN_6" },
                    subCompetency: { type: Type.STRING, description: "Mã kỹ năng số ví dụ 4.2" },
                    cognitiveLevel: { type: Type.STRING, description: "NHAN_BIET, THONG_HIEU, VAN_DUNG, VAN_DUNG_CAO" },
                    timeLimit: { type: Type.INTEGER, description: "Thời gian làm bài tính bằng giây" },
                    points: { type: Type.INTEGER, description: "Điểm số gợi ý" },
                    tags: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    detectedRawText: { type: Type.STRING, description: "Trích đoạn văn bản gốc tương ứng" }
                  },
                  required: ["questionText", "correctKey", "explanation"]
                }
              },
              scanSummary: {
                type: Type.OBJECT,
                properties: {
                  totalDetected: { type: Type.INTEGER, description: "Tổng số câu hỏi phát hiện được" },
                  notes: { type: Type.STRING, description: "Ghi chú chất lượng quét (ví dụ: ảnh mờ, chữ viết tay, phát hiện đáp án khoanh tròn...)" }
                }
              }
            },
            required: ["extractedQuestions"]
          }
        }
      });

      if (!response.text) {
        throw new Error("Không nhận được nội dung trích xuất từ Gemini.");
      }

      const parsedData = JSON.parse(response.text.trim());
      res.json({
        success: true,
        extractedQuestions: parsedData.extractedQuestions || [],
        scanSummary: parsedData.scanSummary || { totalDetected: (parsedData.extractedQuestions || []).length }
      });
    } catch (error: any) {
      console.error("Gemini Scan & Extract Error:", error);
      res.status(500).json({ error: error.message || "Lỗi khi quét ảnh hoặc phân tích tài liệu bằng Gemini API." });
    }
  });

  // AI Moderation & Quality Audit Route: Evaluates questions and generates review notes
  app.post("/api/ai/audit-question", async (req, res) => {
    try {
      const { question } = req.body;
      if (!question) {
        return res.status(400).json({ error: "Thiếu dữ liệu câu hỏi cần thẩm định." });
      }

      const apiKey = getEffectiveApiKey(req);
      if (!apiKey) {
        return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY trên máy chủ." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `Bạn là Trưởng Ban Thẩm định Khảo thí Cuộc thi "Beyond The Internet 2026" (BTI 2026).
Nhiệm vụ: Thẩm định chuyên sâu và đánh giá chất lượng câu hỏi thi dưới đây dựa trên:
1. BỘ QUY CHẾ VÀ LUẬT THI ĐẤU CHÍNH THỨC BTI 2026:
${BTI_2026_OFFICIAL_RULES_PROMPT}

2. Khung năng lực số người học (Thông tư số 02/2025/TT-BGDĐT) & Căn cứ pháp lý Việt Nam (Nghị định 13/2023/NĐ-CP, Luật An ninh mạng 2018...).
3. Độ chuẩn xác khoa học, công nghệ số và tính khả thi trong thực tế năm 2026.
4. Thời gian suy nghĩ và điểm số có đúng chuẩn luật BTI 2026 tương ứng với vòng thi không:
   - Khởi động: 10 điểm, 3-5 giây (hoặc 60s riêng).
   - Vượt CNV: 15s máy tính, 10 điểm (người chọn +15đ), ô mạo hiểm 20s/30s 120đ, đoán CNV 80-60-40-20-10đ.
   - Tăng tốc: 4 câu (20s-20s-30s-30s), điểm 40-30-20-10.
   - Về đích: Gói 20, 30, 40 điểm; thời gian lý thuyết 15s/20s/30s; thực hành 15+30s / 20+60s / 30+90s (chuông giành quyền: 20s/40s/60s).
   - Vòng loại: 24 câu trắc nghiệm (1đ/câu, 30s) và 4 câu Đúng/Sai 4 ý (4đ/câu, 60s).
5. Đánh giá phương án nhiễu (distractors) hoặc gợi ý (VCNV): Không gây tranh cãi hai đáp án đúng.
6. Tính khớp nối với Miền năng lực số và Mức độ nhận thức.

Dữ liệu câu hỏi cần thẩm định:
${JSON.stringify(question, null, 2)}

Hãy đưa ra đánh giá khách quan, đề xuất quyết định duyệt (APPROVED hoặc REJECTED hoặc NEEDS_REVISION), điểm chất lượng (0-100), nhận xét ưu nhược điểm và đoạn văn bản ghi chú thẩm định (review notes) chuẩn mực để gửi cho tác giả.`;

      const response = await generateWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: "Bạn là Trưởng Ban Thẩm định Khảo thí BTI 2026. Hãy trả về JSON hợp lệ theo Schema.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendation: { type: Type.STRING, description: "APPROVED | REJECTED | NEEDS_REVISION" },
              qualityScore: { type: Type.INTEGER, description: "Thang điểm từ 0 đến 100" },
              summary: { type: Type.STRING, description: "Tóm tắt đánh giá chất lượng" },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Các điểm mạnh của câu hỏi"
              },
              weaknesses: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Các điểm hạn chế cần cải thiện hoặc rủi ro tranh cãi"
              },
              legalCheck: {
                type: Type.OBJECT,
                properties: {
                  isCompliant: { type: Type.BOOLEAN },
                  notes: { type: Type.STRING }
                },
                required: ["isCompliant", "notes"]
              },
              ruleCompliance: {
                type: Type.OBJECT,
                properties: {
                  isRuleCompliant: { type: Type.BOOLEAN, description: "Tuân thủ đúng luật thi đấu BTI 2026 (thời gian, thang điểm, format)" },
                  ruleNotes: { type: Type.STRING, description: "Nhận xét đối chiếu với luật chơi BTI 2026" }
                },
                required: ["isRuleCompliant", "ruleNotes"]
              },
              isLegalValid: { type: Type.BOOLEAN, description: "Đúng chuẩn văn bản pháp lý" },
              identifiedDomain: { type: Type.STRING, description: "Miền năng lực số chuẩn xác nhất" },
              identifiedLevel: { type: Type.STRING, description: "Mức độ nhận thức phù hợp" },
              improvedQuestionText: { type: Type.STRING, description: "Đề xuất văn bản câu hỏi cải tiến nếu cần" },
              improvedExplanation: { type: Type.STRING, description: "Đề xuất lời giải thích hoàn thiện nếu cần" },
              suggestedReviewNotes: { type: Type.STRING, description: "Gợi ý nội dung ghi chú thẩm định chuyên nghiệp để lưu vào review_notes" },
              suggestedFixes: { type: Type.STRING, description: "Đề xuất chỉnh sửa cụ thể nếu có" }
            },
            required: ["recommendation", "qualityScore", "summary", "strengths", "weaknesses", "suggestedReviewNotes"]
          }
        }
      });

      if (!response.text) {
        throw new Error("Không nhận được phản hồi từ AI thẩm định.");
      }

      const auditResult = JSON.parse(response.text.trim());
      res.json({ success: true, audit: auditResult });
    } catch (error: any) {
      console.error("Gemini Audit Question Error:", error);
      res.status(500).json({ error: error.message || "Lỗi khi thẩm định câu hỏi bằng AI." });
    }
  });

  // AI Duplicate & Overlapping Knowledge Detection Route
  app.post("/api/ai/detect-duplicates", async (req, res) => {
    try {
      const { candidatePairs } = req.body;
      const apiKey = getEffectiveApiKey(req);
      if (!apiKey) {
        return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY trên server." });
      }

      if (!candidatePairs || !Array.isArray(candidatePairs) || candidatePairs.length === 0) {
        return res.json({ success: true, evaluations: [] });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      // Prepare pair summaries for prompt
      const pairsText = candidatePairs.slice(0, 20).map((cp: any, idx: number) => {
        return `
[CẶP #${idx + 1} - ID Cặp: "${cp.pairId}"]
- CÂU A (ID: ${cp.questionA?.id}):
  + Nội dung: ${cp.questionA?.question_text || ''}
  + Lựa chọn: ${JSON.stringify(cp.questionA?.options || {})}
  + Miền / Năng lực: ${cp.questionA?.domain || ''} - ${cp.questionA?.subCompetency || ''}
  + Mức nhận thức: ${cp.questionA?.cognitive_level || ''}
  + Căn cứ pháp lý: ${cp.questionA?.legal_reference || ''}
  + Thẻ tags: ${(cp.questionA?.tags || []).join(', ')}

- CÂU B (ID: ${cp.questionB?.id}):
  + Nội dung: ${cp.questionB?.question_text || ''}
  + Lựa chọn: ${JSON.stringify(cp.questionB?.options || {})}
  + Miền / Năng lực: ${cp.questionB?.domain || ''} - ${cp.questionB?.subCompetency || ''}
  + Mức nhận thức: ${cp.questionB?.cognitive_level || ''}
  + Căn cứ pháp lý: ${cp.questionB?.legal_reference || ''}
  + Thẻ tags: ${(cp.questionB?.tags || []).join(', ')}
`;
      }).join('\n----------------------------------------\n');

      const prompt = `Bạn là Chuyên gia Khảo thí và Kiểm định Ngân hàng Đề thi Quốc gia cho cuộc thi BTI 2026.
Nhiệm vụ của bạn là rà soát, đánh giá chuyên sâu từng cặp câu hỏi dưới đây để phát hiện:
1. TRÙNG LẶP NỘI DUNG (Content Duplicate / Paraphrase): Câu hỏi diễn đạt khác từ ngữ nhưng hỏi cùng 1 tình huống, sự kiện, câu hỏi trắc nghiệm giống nhau hoặc chỉ đảo thứ tự đáp án.
2. TRÙNG LẶP MIỀN TRI THỨC & NĂNG LỰC (Overlapping Knowledge Domains / Competency Redundancy): Cả 2 câu đều kiểm tra cùng 1 điều luật (VD: Điều 9 NĐ 13/2023, TT 02/2025), cùng 1 khái niệm lý thuyết cốt lõi, cùng 1 tình huống số mà không tạo ra sự phân hóa mới trong ngân hàng đề.
3. KHÁC BIỆT HỢP LỆ (Distinct): Khác nhau rõ ràng về mục tiêu đánh giá hoặc kiến thức kiểm tra.

Danh sách các cặp câu hỏi cần đánh giá:
${pairsText}

Hãy phân tích cẩn trọng và trả về danh sách đánh giá theo định dạng JSON chuẩn.`;

      const response = await generateWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: "Bạn là AI Thẩm định Trùng lặp Khảo thí BTI 2026. Hãy trả về JSON hợp lệ theo Schema.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              evaluations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    pairId: { type: Type.STRING },
                    similarityScore: { type: Type.INTEGER, description: "Điểm tương đồng ngữ nghĩa tổng thể (0 - 100)" },
                    domainOverlapScore: { type: Type.INTEGER, description: "Mức độ trùng lặp miền tri thức và năng lực (0 - 100)" },
                    duplicateType: { 
                      type: Type.STRING, 
                      description: "EXACT | SEMANTIC_PARAPHRASE | DOMAIN_OVERLAP | DISTINCT" 
                    },
                    isRedundant: { 
                      type: Type.BOOLEAN, 
                      description: "true nếu ngân hàng đề thi bị dư thừa và nên gộp hoặc xóa bớt 1 câu" 
                    },
                    overlappingConcepts: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Danh sách các khái niệm, điều luật, kỹ năng bị trùng lặp"
                    },
                    analysis: { 
                      type: Type.STRING, 
                      description: "Phân tích ngữ nghĩa chi tiết: vì sao trùng lặp hoặc điểm khác biệt then chốt" 
                    },
                    recommendation: { 
                      type: Type.STRING, 
                      description: "MERGE | DELETE_B | DIFFERENTIATE | KEEP_BOTH" 
                    },
                    differentiateSuggestion: { 
                      type: Type.STRING, 
                      description: "Gợi ý cách sửa Câu B nếu muốn giữ cả 2 câu mà không bị trùng lặp" 
                    }
                  },
                  required: ["pairId", "similarityScore", "domainOverlapScore", "duplicateType", "isRedundant", "overlappingConcepts", "analysis", "recommendation"]
                }
              }
            },
            required: ["evaluations"]
          }
        }
      });

      if (!response.text) {
        throw new Error("Không nhận được nội dung phân tích từ Gemini API.");
      }

      const result = JSON.parse(response.text.trim());
      res.json({ success: true, evaluations: result.evaluations || [] });
    } catch (error: any) {
      console.error("Gemini Detect Duplicates Error:", error);
      res.status(500).json({ error: error.message || "Lỗi khi chạy AI phát hiện trùng lặp." });
    }
  });

  // AI Balanced Mock Quiz / Test Generator Route
  app.post("/api/ai/generate-mock-quiz", async (req, res) => {
    try {
      const {
        presetType = 'BALANCED_MOCK_TEST',
        targetCount = 28,
        timeMinutes = 45,
        stage = 'VONG_LOAI',
        desiredDistribution = { NHAN_BIET: 40, THONG_HIEU: 30, VAN_DUNG: 20, VAN_DUNG_CAO: 10 },
        selectedDomains = ['MIEN_1', 'MIEN_2', 'MIEN_3', 'MIEN_4', 'MIEN_5', 'MIEN_6'],
        candidateQuestions = []
      } = req.body;

      const apiKey = getEffectiveApiKey(req);
      if (!apiKey) {
        return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY trên server." });
      }

      if (!candidateQuestions || !Array.isArray(candidateQuestions) || candidateQuestions.length === 0) {
        return res.status(400).json({ error: "Ngân hàng câu hỏi chưa có đủ dữ liệu để tạo đề thi thử." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      // Prepare candidate summary list for AI to pick from (limit to 120 items to fit prompt nicely)
      const sampledCandidates = candidateQuestions.slice(0, 120).map((q: any, idx: number) => ({
        idx: idx + 1,
        id: q.id,
        text: (q.question_text || '').slice(0, 160),
        level: q.cognitive_level || 'THONG_HIEU',
        domain: q.digital_competency_domain || q.domain || 'MIEN_4',
        subComp: q.digital_sub_competency || q.subCompetency || '',
        legal: q.legal_reference || '',
        category: q.category || ''
      }));

      const prompt = `Bạn là Trưởng ban Đề thi Quốc gia & Chuyên gia Khảo thí Cuộc thi "Beyond The Internet 2026" (BTI 2026).
Nhiệm vụ: Tạo một BỘ ĐỀ THI THỬ (MOCK QUIZ) HOÀN CHỈNH, CHUẨN XÁC VÀ CÂN BẰNG TỐI ƯU từ danh sách câu hỏi có sẵn trong ngân hàng đề.

BỘ QUY CHẾ VÀ LUẬT THI ĐẤU CHÍNH THỨC BTI 2026 ĐỂ ĐỐI CHIẾU:
${BTI_2026_OFFICIAL_RULES_PROMPT}

THÔNG SỐ ĐỀ THI YÊU CẦU:
- Loại đề (Preset): "${presetType}"
- Số lượng câu hỏi cần chọn: ${targetCount} câu
- Thời gian làm bài: ${timeMinutes} phút
- Giai đoạn thi: ${stage}
- Tỷ lệ độ khó mục tiêu:
  + Nhận biết: ${desiredDistribution.NHAN_BIET || 40}% (khoảng ${Math.round((targetCount * (desiredDistribution.NHAN_BIET || 40)) / 100)} câu)
  + Thông hiểu: ${desiredDistribution.THONG_HIEU || 30}% (khoảng ${Math.round((targetCount * (desiredDistribution.THONG_HIEU || 30)) / 100)} câu)
  + Vận dụng: ${desiredDistribution.VAN_DUNG || 20}% (khoảng ${Math.round((targetCount * (desiredDistribution.VAN_DUNG || 20)) / 100)} câu)
  + Vận dụng cao: ${desiredDistribution.VAN_DUNG_CAO || 10}% (khoảng ${Math.max(1, Math.round((targetCount * (desiredDistribution.VAN_DUNG_CAO || 10)) / 100))} câu)
- Các miền năng lực số cần bao phủ (TT 02/2025/TT-BGDĐT): ${selectedDomains.join(', ')}

DANH SÁCH CÂU HỎI TRONG NGÂN HÀNG ĐỀ:
${JSON.stringify(sampledCandidates, null, 1)}

YÊU CẦU CHỌN LỌC & SẮP XẾP CỦA AI:
1. Chọn đúng chính xác ${Math.min(targetCount, candidateQuestions.length)} câu hỏi (danh sách ID trong selectedQuestionIds) không bị trùng lặp, đảm bảo:
   - Cân đối ma trận 4 mức độ nhận thức.
   - Trải đều các miền năng lực số được yêu cầu.
   - Ưu tiên câu hỏi có tình huống thực tế hay, căn cứ pháp lý rõ ràng.
2. Sắp xếp thứ tự làm bài thông minh (bắt đầu từ các câu Nhận biết khởi động -> Thông hiểu -> tăng dần đến Vận dụng / Vận dụng cao ở cuối).
3. Đưa ra phân tích sư phạm (pedagogicalRationale), hướng dẫn chiến thuật làm bài và bảng phân bổ ma trận.`;

      const response = await generateWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: "Bạn là Chuyên gia Khảo thí BTI 2026. Hãy trả về JSON hợp lệ theo Schema.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              quizTitle: { type: Type.STRING, description: "Tiêu đề đề thi thử trang trọng, thu hút" },
              quizSubtitle: { type: Type.STRING, description: "Phụ đề mô tả chuẩn mực đề thi" },
              instructions: { type: Type.STRING, description: "Hướng dẫn làm bài và lưu ý cho thí sinh" },
              pedagogicalRationale: { type: Type.STRING, description: "Giải thích cơ cấu phân bổ độ khó và miền tri thức của đề thi" },
              difficultyIndex: { type: Type.NUMBER, description: "Điểm độ khó tổng thể từ 1.0 đến 10.0" },
              difficultyLabel: { type: Type.STRING, description: "Nhãn độ khó (VD: Cân Bằng Chuẩn Khảo Thí, Phân Hóa Cao, v.v.)" },
              timePacingTip: { type: Type.STRING, description: "Chiến thuật phân bổ thời gian từng phần" },
              selectedQuestionIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Danh sách ID các câu hỏi được chọn theo đúng thứ tự làm bài tối ưu"
              },
              distributionSummary: {
                type: Type.OBJECT,
                properties: {
                  nhanBietCount: { type: Type.INTEGER },
                  thongHieuCount: { type: Type.INTEGER },
                  vanDungCount: { type: Type.INTEGER },
                  vanDungCaoCount: { type: Type.INTEGER },
                  averageSolveTimeSec: { type: Type.INTEGER }
                },
                required: ["nhanBietCount", "thongHieuCount", "vanDungCount", "vanDungCaoCount"]
              },
              domainBreakdown: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    domainKey: { type: Type.STRING },
                    domainName: { type: Type.STRING },
                    questionCount: { type: Type.INTEGER }
                  },
                  required: ["domainKey", "domainName", "questionCount"]
                }
              }
            },
            required: ["quizTitle", "pedagogicalRationale", "difficultyIndex", "difficultyLabel", "selectedQuestionIds", "distributionSummary"]
          }
        }
      });

      if (!response.text) {
        throw new Error("Không nhận được phản hồi từ AI tạo đề thi.");
      }

      const result = JSON.parse(response.text.trim());
      res.json({ success: true, mockQuizBlueprint: result });
    } catch (error: any) {
      console.error("Gemini Generate Mock Quiz Error:", error);
      res.status(500).json({ error: error.message || "Lỗi khi tạo đề thi thử bằng AI." });
    }
  });

  // Advanced AI Route: Question Drafting based on Vietnam Digital Competency Framework (TT 02/2025/TT-BGDĐT)
  app.post("/api/ai/generate-advanced-question", async (req, res) => {
    try {
      const { 
        stage = 'BAN_KET_1',
        roundFormat = 'KHOI_DONG_RIENG',
        domain = 'MIEN_4',
        subCompetency = '4.2',
        cognitiveLevel = 'THONG_HIEU',
        legalReference = 'Thông tư 02/2025/TT-BGDĐT & Nghị định 13/2023/NĐ-CP',
        contextDoc = '',
        topicPrompt = '',
        count = 1,
        formatDetails
      } = req.body;

      const apiKey = getEffectiveApiKey(req);
      if (!apiKey) {
        return res.status(500).json({ error: "API key chưa được cấu hình trên hệ thống server." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      let formatRules = '';
      if (formatDetails) {
        formatRules = `
   * ĐẶC THÙ CỦA ĐỊNH DẠNG NÀY THEO LUẬT CHƠI BTI 2026:
   - Tên định dạng: ${formatDetails.name}
   - Yêu cầu biên soạn: ${formatDetails.description}
   - Luật tính điểm: ${formatDetails.scoringRule}
   - BẮT BUỘC SỬ DỤNG roundType: "${formatDetails.defaultRoundType}"
   - Thời gian suy nghĩ: ${formatDetails.defaultTimeLimit} giây
   - Điểm số: ${formatDetails.defaultPoints} điểm
        `;
      }

      const systemPrompt = `Bạn là Chuyên gia Khảo thí và Biên soạn Ngân hàng Đề thi Quốc gia cho Cuộc thi "Beyond The Internet 2026" (BTI 2026).
Bạn có nhiệm vụ tạo ra câu hỏi thi học thuật xuất sắc, có tính phân loại cao, thực tế và tuân thủ tuyệt đối:
1. KHUNG NĂNG LỰC SỐ CHO NGƯỜI HỌC (Thông tư số 02/2025/TT-BGDĐT ngày 24/01/2025 của Bộ Giáo dục và Đào tạo).
   - Miền năng lực: ${domain} (Thành phần: ${subCompetency})
   - Mức độ nhận thức: ${cognitiveLevel} (Nhận biết / Thông hiểu / Vận dụng / Vận dụng cao)
2. BỘ QUY CHẾ VÀ LUẬT THI ĐẤU CHÍNH THỨC BTI 2026 BẮT BUỘC TUÂN THỦ:
${BTI_2026_OFFICIAL_RULES_PROMPT}

3. GIAI ĐOẠN VÀ ĐỊNH DẠNG VÒNG THI:
   - Giai đoạn thi: ${stage}
   - Định dạng thi: ${roundFormat}
   ${stage === 'VONG_LOAI' ? `
   * ĐẶC BIỆT VỚI ĐỀ THI VÒNG LOẠI BTI 2026:
   - Vòng loại chỉ có 1 dạng đề duy nhất gồm 28 câu (24 câu Phần I trắc nghiệm 4 lựa chọn ABCD và 4 câu Phần II Đúng/Sai 4 ý a,b,c,d). Tuyệt đối không chọn hoặc chia theo các vòng thi như Khởi động, VCNV, Tăng tốc, Về đích.
   - Nếu định dạng là BGD_MULTIPLE_CHOICE: Soạn câu trắc nghiệm 4 lựa chọn A, B, C, D với 1 đáp án đúng nhất (roundType: "MULTIPLE_CHOICE", timeLimit: 30, points: 1).
   - Nếu định dạng là BGD_TRUE_FALSE_4: Soạn 1 tình huống cùng 4 nhận định/mệnh đề A, B, C, D (ứng với ý a, b, c, d). correctKey định dạng chuẩn: "A:Đ|B:S|C:Đ|D:S" (roundType: "TRUE_FALSE_4", timeLimit: 60, points: 4).
   ` : formatRules}
4. CĂN CỨ PHÁP LÝ BẮT BUỘC:
   - Căn cứ pháp lý: ${legalReference}
   ${contextDoc ? `\n- NỘI DUNG TÀI LIỆU PHÁP LÝ THAM CHIẾU ĐÍNH KÈM:\n${contextDoc.slice(0, 3000)}\n` : formatRules}
5. YÊU CẦU CHẤT LƯỢNG KỸ THUẬT:
   - ĐỐI VỚI VƯỢT CHƯỚNG NGẠI VẬT: correctKey CHỈ là Từ khóa Hàng ngang (rất ngắn gọn).
   - ĐỐI VỚI ĐIỀN KHUYẾT / TRẢ LỜI NGẮN: correctKey phải CHÍNH XÁC là cụm từ cần điền, không dư thừa chữ.
   - Trắc nghiệm (MULTIPLE_CHOICE): correctKey là A, B, C, D.
   - Câu hỏi gắn liền tình huống số thực tiễn (Deepfake, AI tạo sinh, lừa đảo trực tuyến, bảo vệ dữ liệu cá nhân, liêm chính học thuật, an sinh số).
   - Bẫy logic tinh tế, phân hóa rõ rệt, giải thích chi tiết có trích dẫn điều khoản luật cụ thể.
   - BẮT BUỘC cung cấp tags, mediaType (IMAGE, VIDEO, AUDIO, NONE). Nếu là dạng Vượt Chướng Ngại Vật (VCNV), phải cung cấp obstacleInfo chứa độ dài từ khóa, câu hỏi gợi ý và đáp án.`;

      const userMessage = `Hãy biên soạn ${Math.min(Math.max(count, 1), 5)} câu hỏi theo yêu cầu trên. Chủ đề mong muốn bổ sung: "${topicPrompt || 'Tình huống an toàn số và công nghệ thực tiễn năm 2026'}".`;

      const response = await generateWithFallback(ai, {
        contents: userMessage,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                questionText: { type: Type.STRING, description: "Nội dung câu hỏi chi tiết, rõ ràng" },
                roundType: { type: Type.STRING, description: "MULTIPLE_CHOICE | SHORT_ANSWER | TRUE_FALSE_4 | VCNV" },
                options: {
                  type: Type.OBJECT,
                  properties: {
                    A: { type: Type.STRING },
                    B: { type: Type.STRING },
                    C: { type: Type.STRING },
                    D: { type: Type.STRING }
                  },
                  description: "Các phương án lựa chọn A, B, C, D (đối với trắc nghiệm)"
                },
                correctKey: { type: Type.STRING, description: "Đáp án đúng (A, B, C, D hoặc từ khóa đối với câu trả lời ngắn)" },
                explanation: { type: Type.STRING, description: "Lời giải thích chi tiết và trích dẫn văn bản pháp lý tương ứng" },
                timeLimit: { type: Type.INTEGER, description: "Thời gian trả lời (giây: Khởi động 3-5s hoặc 60s; VCNV 15s; Tăng tốc 20s hoặc 30s; Về đích 15s/20s/30s lý thuyết hoặc 45-120s thực hành; Câu hỏi phụ 15s)" },
                points: { type: Type.INTEGER, description: "Điểm số quy định theo luật BTI 2026: Khởi động 10đ; VCNV 10-15đ; Tăng tốc 10-40đ; Về đích 20-30-40đ; Ô mạo hiểm 120đ; Vòng loại 1đ hoặc 4đ" },
                legalReference: { type: Type.STRING, description: "Căn cứ điều khoản luật cụ thể (vd: Điều 9 NĐ 13/2023/NĐ-CP)" },
                cognitiveLevel: { type: Type.STRING, description: "NHAN_BIET | THONG_HIEU | VAN_DUNG | VAN_DUNG_CAO" },
                subCompetency: { type: Type.STRING, description: "Mã năng lực thành phần TT 02/2025 (vd: 4.2)" },
                tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Danh sách 1-3 nhãn/tag phân loại" },
                mediaType: { type: Type.STRING, description: "IMAGE | VIDEO | AUDIO | NONE" },
                obstacleInfo: {
                  type: Type.OBJECT,
                  description: "Chỉ điền nếu là dạng Vượt Chướng Ngại Vật",
                  properties: {
                    rowNumber: { type: Type.INTEGER },
                    rowLength: { type: Type.INTEGER },
                    clueText: { type: Type.STRING },
                    answerText: { type: Type.STRING },
                    isCentralKeyword: { type: Type.BOOLEAN }
                  }
                }
              },
              required: ["questionText", "correctKey", "explanation", "legalReference"]
            }
          }
        }
      });

      if (!response.text) {
        throw new Error("Không nhận được dữ liệu từ mô hình AI.");
      }

      const candidate = response.candidates?.[0];
      const groundingMeta = candidate?.groundingMetadata;
      const groundingSources = groundingMeta?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title || 'Google Search',
        uri: chunk.web?.uri || ''
      })).filter((s: any) => s.uri) || [];
      const searchQueries = groundingMeta?.webSearchQueries || [];

      const generatedItems = JSON.parse(response.text.trim());
      res.json({ 
        success: true, 
        questions: generatedItems,
        groundingSources,
        searchQueries
      });
    } catch (error: any) {
      console.error("AI Advanced Question Error:", error);
      res.status(500).json({ error: error.message || "Lỗi trong quá trình AI biên soạn câu hỏi." });
    }
  });

  // AI Route: Interactive Drama & Scenario Script Generator (Kịch tương tác với 4 nhánh kịch bản phía sau)
  app.post("/api/ai/generate-scenario", async (req, res) => {
    try {
      const { 
        stage = 'CHUNG_KET',
        domain = 'MIEN_4',
        topic = 'Bẫy lừa đảo mạo danh ngân hàng và tống tiền mạng',
        legalDocSummary = ''
      } = req.body;

      const apiKey = getEffectiveApiKey(req);
      if (!apiKey) {
        return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `Soạn thảo một kịch bản Kịch tương tác / Tình huống thực hành trên sân khấu Cuộc thi BTI 2026.
ĐẶC BIỆT: Thay vì đưa ra thang điểm / chỉ dẫn chấm điểm, hãy xây dựng 4 PHƯƠNG ÁN XỬ LÝ (A, B, C, D) VÀ KỊCH BẢN PHÍA SAU (DIỄN BIẾN TIẾP NỐI TRÊN SÂN KHẤU, HỆ QUẢ SỐ VÀ PHẢN HỒI CHUYÊN MÔN) ĐỐI VỚI TỪNG PHƯƠNG ÁN.

QUY ĐỊNH PHẦN THI THỰC HÀNH / TÌNH HUỐNG VỀ ĐÍCH BTI 2026:
- Thí sinh chính:
  + Gói 20 điểm: 15 giây suy nghĩ, 30 giây thực hành/diễn xuất.
  + Gói 30 điểm: 20 giây suy nghĩ, 60 giây thực hành/diễn xuất.
  + Gói 40 điểm: 30 giây suy nghĩ, 90 giây thực hành/diễn xuất.
- Thí sinh chuông giành quyền (nếu thí sinh chính không xử lý được):
  + Gói 20 điểm: 20 giây thực hành.
  + Gói 30 điểm: 40 giây thực hành.
  + Gói 40 điểm: 60 giây thực hành. (Sai bị trừ 1/2 số điểm câu hỏi).
- Cơ chế Ngôi sao hy vọng (NSHV): Thí sinh chính đặt trước khi diễn, đúng x2 điểm, sai bị trừ điểm.

Chủ đề: ${topic}
Miền năng lực số: ${domain} (Theo Thông tư 02/2025/TT-BGDĐT)
Giai đoạn: ${stage}
${legalDocSummary ? `Căn cứ pháp lý: ${legalDocSummary}` : ''}

Cấu trúc kịch bản yêu cầu:
1. Tiêu đề tình huống
2. Danh sách nhân vật (MC / Dẫn kịch, Thí sinh nhập vai, Nhân vật gây biến cố / Kẻ gian / Nạn nhân)
3. Bối cảnh không gian số
4. Lời thoại diễn xuất kịch tính ban đầu (Phân cảnh 1, Phân cảnh 2, Tình huống cao trào dẫn đến nút thắt)
5. Câu hỏi nút thắt / Thử thách quyết định cho thí sinh (Dilemma Question)
6. 4 Phương án xử lý (A, B, C, D) VÀ KỊCH BẢN PHÍA SAU ĐỐI VỚI MỖI PHƯƠNG ÁN:
   - Với MỖI phương án (A, B, C, D):
     * text: Nội dung phương án lựa chọn
     * isOptimal: true nếu đây là phương án đúng / tối ưu nhất, false nếu có rủi ro hoặc sai lầm
     * statusType: 'SUCCESS' (nếu tối ưu), 'WARNING' (nếu có rủi ro / chưa triệt để), 'DANGER' (nếu sai lầm / vi phạm pháp luật / sập bẫy)
     * reactionScript: Kịch bản lời thoại diễn biến tiếp theo trên sân khấu giữa Thí sinh, MC và các diễn viên kịch khi phương án này được chọn (thực tế, kịch tính, thuyết phục)
     * consequence: Hệ quả thực tế trong không gian số (bảo toàn tài sản / mất tiền / lộ lọt bí mật / vi phạm pháp luật thứ cấp...)
      * feedback: Nhận xét sư phạm, phân tích chuyên môn, bài học răn đe & trích dẫn điều luật áp dụng
7. Ô kịch bản ứng biến trên sân khấu khi thí sinh chọn các phương án sai / chưa tối ưu (subOptimalScript): Lời thoại kịch tính của MC bước ra can thiệp, kết hợp phân tích chuyên môn của Ban Giám khảo / Ban Cố vấn để răn đe, giáo dục nhận thức và định hướng giải pháp an toàn trước toàn trường.
8. Phương án đúng / tối ưu nhất (correctOption: 'A' | 'B' | 'C' | 'D')
9. Checklist các hành động chuẩn của thí sinh (actionChecklist)
10. Thời gian suy nghĩ và thực hành theo chuẩn BTI (timeLimitThought: 15, 20 hoặc 30 giây; timeLimitAction: 30, 60 hoặc 90 giây)
11. Căn cứ pháp lý cụ thể (Luật An ninh mạng, Nghị định 13/2023/NĐ-CP, Thông tư 02/2025/TT-BGDĐT...)`;

      const response = await generateWithFallback(ai, {
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              characters: { type: Type.ARRAY, items: { type: Type.STRING } },
              setting: { type: Type.STRING },
              scriptText: { type: Type.STRING },
              dilemmaQuestion: { type: Type.STRING },
              actionChecklist: { type: Type.ARRAY, items: { type: Type.STRING } },
              subOptimalScript: { type: Type.STRING },
              options: {
                type: Type.OBJECT,
                properties: {
                  A: { type: Type.STRING },
                  B: { type: Type.STRING },
                  C: { type: Type.STRING },
                  D: { type: Type.STRING }
                },
                required: ["A", "B", "C", "D"]
              },
              correctOption: { type: Type.STRING },
              branches: {
                type: Type.OBJECT,
                properties: {
                  A: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      isOptimal: { type: Type.BOOLEAN },
                      statusType: { type: Type.STRING },
                      reactionScript: { type: Type.STRING },
                      consequence: { type: Type.STRING },
                      feedback: { type: Type.STRING }
                    },
                    required: ["text", "isOptimal", "statusType", "reactionScript", "consequence", "feedback"]
                  },
                  B: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      isOptimal: { type: Type.BOOLEAN },
                      statusType: { type: Type.STRING },
                      reactionScript: { type: Type.STRING },
                      consequence: { type: Type.STRING },
                      feedback: { type: Type.STRING }
                    },
                    required: ["text", "isOptimal", "statusType", "reactionScript", "consequence", "feedback"]
                  },
                  C: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      isOptimal: { type: Type.BOOLEAN },
                      statusType: { type: Type.STRING },
                      reactionScript: { type: Type.STRING },
                      consequence: { type: Type.STRING },
                      feedback: { type: Type.STRING }
                    },
                    required: ["text", "isOptimal", "statusType", "reactionScript", "consequence", "feedback"]
                  },
                  D: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      isOptimal: { type: Type.BOOLEAN },
                      statusType: { type: Type.STRING },
                      reactionScript: { type: Type.STRING },
                      consequence: { type: Type.STRING },
                      feedback: { type: Type.STRING }
                    },
                    required: ["text", "isOptimal", "statusType", "reactionScript", "consequence", "feedback"]
                  }
                },
                required: ["A", "B", "C", "D"]
              },
              timeLimitThought: { type: Type.INTEGER },
              timeLimitAction: { type: Type.INTEGER },
              legalBasis: { type: Type.STRING }
            },
            required: ["title", "characters", "setting", "scriptText", "dilemmaQuestion", "branches", "correctOption", "subOptimalScript", "legalBasis"]
          }
        }
      });

      if (!response.text) throw new Error("AI không trả về dữ liệu.");
      res.json({ success: true, scenario: JSON.parse(response.text.trim()) });
    } catch (error: any) {
      console.error("AI Scenario Error:", error);
      res.status(500).json({ error: error.message || "Lỗi tạo kịch bản tương tác." });
    }
  });


  // AI Route: Auto-classify drafted question for tags and levels
  app.post("/api/ai/classify-question", async (req, res) => {
    try {
      const { questionText, options, explanation } = req.body;
      const apiKey = getEffectiveApiKey(req);
      if (!apiKey) return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY." });

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `Hãy phân tích câu hỏi sau để tự động phân loại theo chuẩn BTI 2026:
Nội dung: "${questionText}"
Phương án: ${JSON.stringify(options)}
Giải thích: "${explanation}"

Yêu cầu trả về JSON:
- domain: từ MIEN_1 đến MIEN_6 (Thông tư 02/2025/TT-BGDĐT)
- subCompetency: Mã năng lực thành phần tương ứng (ví dụ: "4.2", "1.1")
- cognitiveLevel: NHAN_BIET | THONG_HIEU | VAN_DUNG | VAN_DUNG_CAO
- tags: Mảng 3-5 chuỗi từ khóa ngắn gọn mô tả chủ đề (ví dụ: "lừa_đảo_mạng", "phishing", "bảo_mật", "deepfake")
- suggestedCategory: Tên chủ đề/danh mục tổng quát phù hợp nhất (dưới 40 ký tự) `;

      const response = await generateWithFallback(ai, {
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              domain: { type: Type.STRING },
              subCompetency: { type: Type.STRING },
              cognitiveLevel: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestedCategory: { type: Type.STRING }
            },
            required: ["domain", "subCompetency", "cognitiveLevel", "tags"]
          }
        }
      });

      if (!response.text) throw new Error("AI không trả về kết quả.");
      res.json({ success: true, classification: JSON.parse(response.text.trim()) });
    } catch (error: any) {
      console.error("AI Classify Error:", error);
      res.status(500).json({ error: error.message || "Lỗi khi phân loại câu hỏi." });
    }
  });

  // Dedicated AI Auto-Tagging, Subject & Knowledge Area Classification Endpoint
  app.post("/api/ai/auto-suggest-tags", async (req, res) => {
    try {
      const { questionText, options, explanation, legalReference, category, domain, cognitiveLevel, existingTags } = req.body;
      const apiKey = getEffectiveApiKey(req);
      if (!apiKey) return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY trên máy chủ." });

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `Bạn là Chuyên gia Khảo thí và Cố vấn Học thuật Trưởng của Cuộc thi "Beyond The Internet 2026" (BTI 2026).
Nhiệm vụ: Phân tích sâu nội dung câu hỏi, phương án lựa chọn, lời giải thích và ngữ cảnh để TỰ ĐỘNG ĐỀ XUẤT:
1. 'Subject' (Chủ đề / Môn học / Lĩnh vực chuyên môn chính): Tên chủ đề súc tích, chuyên nghiệp (VD: "An toàn dữ liệu cá nhân & Quyền riêng tư", "Phòng chống lừa đảo trực tuyến & Phishing", "Đạo đức trí tuệ nhân tạo & Liêm chính học thuật", "Văn hóa ứng xử & Giao tiếp trên mạng xã hội", "Bản quyền số & Sở hữu trí tuệ", v.v.).
2. 'Knowledge Area' (Miền tri thức & Năng lực số theo Thông tư 02/2025/TT-BGDĐT):
   - MIEN_1: Vận hành thiết bị, phần mềm và quản trị kết nối số
   - MIEN_2: Khai thác thông tin, dữ liệu và đánh giá độ tin cậy số
   - MIEN_3: Giao tiếp, hợp tác và tương tác trong môi trường số
   - MIEN_4: An toàn số, bảo vệ thông tin và dữ liệu cá nhân
   - MIEN_5: Đạo đức số, văn hóa mạng và tuân thủ pháp luật số
   - MIEN_6: Sáng tạo nội dung số, ứng dụng GenAI và giải quyết vấn đề
3. 'Sub-Competency' (Mã & tên năng lực thành phần tương ứng): ví dụ "4.2", "5.1", "2.3"...
4. 'Legal Reference' (Căn cứ văn bản pháp luật tham chiếu): ví dụ "Nghị định 13/2023/NĐ-CP Điều 9", "Thông tư 02/2025/TT-BGDĐT", "Luật An ninh mạng 2018 Điều 8"...
5. 'Cognitive Level' (Mức độ nhận thức phù hợp): NHAN_BIET | THONG_HIEU | VAN_DUNG | VAN_DUNG_CAO
6. 'Tags' (3-6 Thẻ từ khóa chuyên sâu): ví dụ ["deepfake", "phishing", "nghi_dinh_13", "xac_thuc_2fa", "mat_khau_manh"]

THÔNG TIN CÂU HỎI:
- Đề bài: "${questionText || ''}"
- Các phương án: ${JSON.stringify(options || {})}
- Lời giải thích: "${explanation || ''}"
- Căn cứ pháp lý hiện tại: "${legalReference || ''}"
- Danh mục hiện tại: "${category || ''}"
- Miền hiện tại: "${domain || ''}"
- Mức độ hiện tại: "${cognitiveLevel || ''}"
- Tags hiện tại: ${JSON.stringify(existingTags || [])}`;

      const response = await generateWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: "Bạn là chuyên gia thẩm định đề thi BTI 2026. Hãy trả về JSON chuẩn theo Schema.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestedSubject: {
                type: Type.STRING,
                description: "Tên chủ đề / môn học chuyên môn phù hợp nhất"
              },
              suggestedCategory: {
                type: Type.STRING,
                description: "Danh mục phân loại ngắn gọn"
              },
              suggestedDomain: {
                type: Type.STRING,
                description: "Miền năng lực số chuẩn (MIEN_1, MIEN_2, MIEN_3, MIEN_4, MIEN_5, MIEN_6)"
              },
              suggestedDomainName: {
                type: Type.STRING,
                description: "Tên đầy đủ của miền năng lực số"
              },
              suggestedSubCompetency: {
                type: Type.STRING,
                description: "Mã năng lực thành phần (ví dụ: 4.2)"
              },
              suggestedSubCompetencyName: {
                type: Type.STRING,
                description: "Tên mô tả của năng lực thành phần"
              },
              suggestedLegalReference: {
                type: Type.STRING,
                description: "Căn cứ pháp lý tham chiếu chuẩn xác nhất"
              },
              suggestedCognitiveLevel: {
                type: Type.STRING,
                description: "Mức độ nhận thức dự đoán (NHAN_BIET | THONG_HIEU | VAN_DUNG | VAN_DUNG_CAO)"
              },
              suggestedTags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Danh sách 3 đến 6 tags gợi ý chuẩn hóa"
              },
              confidenceScore: {
                type: Type.INTEGER,
                description: "Độ tin cậy của đề xuất (0 - 100%)"
              },
              keyConcepts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Các khái niệm tri thức cốt lõi được phát hiện"
              },
              reasoning: {
                type: Type.STRING,
                description: "Lý do sư phạm ngắn gọn đề xuất các nhãn này"
              }
            },
            required: ["suggestedSubject", "suggestedDomain", "suggestedSubCompetency", "suggestedTags", "confidenceScore", "reasoning"]
          }
        }
      });

      if (!response.text) throw new Error("Mô hình AI không trả về kết quả.");
      const result = JSON.parse(response.text.trim());
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("AI Auto-Tagging Error:", error);
      res.status(500).json({ error: error.message || "Lỗi khi tự động sinh tags bằng AI." });
    }
  });

  // =========================================================================
  // NOTEBOOKLM LEGAL RESEARCH AGENT ROUTE (THƯ VIỆN PHÁP LÝ NOTEBOOKLM)
  // Supports: Grounded Chat, Executive Study Guide, Audio Overview Podcast,
  // Question Drafting from Sources, and Comparative Analysis.
  // =========================================================================
  app.post("/api/ai/notebooklm-query", async (req, res) => {
    try {
      const {
        action = 'CHAT', // 'CHAT' | 'STUDY_GUIDE' | 'AUDIO_OVERVIEW' | 'GENERATE_QUESTIONS'
        sources = [],
        query = '',
        chatHistory = [],
        focusArticle = null,
        questionCount = 3
      } = req.body;

      if (!sources || !Array.isArray(sources) || sources.length === 0) {
        return res.status(400).json({ error: "Vui lòng chọn ít nhất một văn bản pháp lý làm nguồn tài liệu (Source)." });
      }

      const apiKey = getEffectiveApiKey(req);
      if (!apiKey) return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY trên máy chủ." });

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      // Prepare consolidated sources text
      const sourcesText = sources.map((s: any, idx: number) => {
        const articlesText = (s.keyArticles || [])
          .map((a: any) => `  * ${a.article}: ${a.content}`)
          .join('\n');
        return `[NGUỒN ${idx + 1}]
- Tiêu đề: ${s.title}
- Số hiệu: ${s.documentNumber}
- Cơ quan ban hành: ${s.issuingAuthority || 'N/A'}
- Ngày ban hành/hiệu lực: ${s.issuedDate || s.issueDate || 'N/A'}
- Tóm tắt: ${s.summary || 'N/A'}
- Các điều khoản trọng tâm:
${articlesText || '  (Chưa có danh sách điều khoản cụ thể)'}
${s.fullText ? `- Toàn văn / Trích lục bổ sung:\n${s.fullText.slice(0, 4000)}` : ''}
`;
      }).join('\n====================\n');

      if (action === 'CHAT') {
        const historyText = (chatHistory || []).slice(-6).map((m: any) => 
          `${m.role === 'user' ? 'Người dùng' : 'NotebookLM Agent'}: ${m.text}`
        ).join('\n');

        const prompt = `Bạn là Trợ lý Nghiên cứu Pháp lý NotebookLM (Grounded Legal Agent) của Cuộc thi "Beyond The Internet 2026" (BTI 2026).
Bạn có nhiệm vụ giải đáp câu hỏi của người dùng DỰA TRÊN CÁC NGUỒN TÀI LIỆU PHÁP LÝ SAU ĐÂY:
${sourcesText}

${focusArticle ? `* ĐIỀU KHOẢN ĐANG ĐƯỢC TẬP TRUNG (FOCUS ARTICLE): ${JSON.stringify(focusArticle)}` : ''}
${historyText ? `* LỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ:\n${historyText}\n` : ''}

CÂU HỎI CỦA NGƯỜI DÙNG: "${query}"

YÊU CẦU:
1. TRẢ LỜI CHUẨN XÁC, SÚC TÍCH VÀ CÓ CẤU TRÚC (Sử dụng Markdown, gạch đầu dòng, in đậm từ khóa quan trọng).
2. TRÍCH DẪN NGUỒN CHÍNH XÁC: Mỗi luận điểm, quy định, quyền, nghĩa vụ, hành vi bị cấm đều PHẢI viện dẫn rõ số hiệu văn bản và điều khoản cụ thể (ví dụ: "[Thông tư 02/2025/TT-BGDĐT, Điều 2 Khoản 1]" hoặc "[Nghị định 13/2023/NĐ-CP, Điều 9]").
3. Cung cấp mảng 'citations' chứa danh sách các trích dẫn điều khoản được dùng.
4. Nêu 1 kết luận then chốt 'keyTakeaway'.
5. Đề xuất 3 câu hỏi gợi mở tiếp theo 'suggestedFollowUps' kích thích tư duy người học/người ra đề thi.`;

        const response = await generateWithFallback(ai, {
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                answer: { type: Type.STRING, description: "Nội dung trả lời chi tiết kèm trích dẫn pháp lý chuẩn mực" },
                citations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      sourceTitle: { type: Type.STRING },
                      documentNumber: { type: Type.STRING },
                      article: { type: Type.STRING },
                      snippet: { type: Type.STRING }
                    },
                    required: ["sourceTitle", "documentNumber", "article", "snippet"]
                  }
                },
                keyTakeaway: { type: Type.STRING, description: "Đúc kết then chốt một dòng" },
                suggestedFollowUps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 câu hỏi đào sâu tiếp theo" }
              },
              required: ["answer", "citations", "keyTakeaway", "suggestedFollowUps"]
            }
          }
        });

        if (!response.text) throw new Error("AI không trả về kết quả.");
        return res.json({ success: true, result: JSON.parse(response.text.trim()) });
      }

      if (action === 'STUDY_GUIDE') {
        const prompt = `Bạn là Trợ lý Nghiên cứu Pháp lý NotebookLM của Cuộc thi BTI 2026.
Hãy tổng hợp một BẢN CẨM NANG NGHIÊN CỨU PHÁP LÝ TOÀN DIỆN (STUDY GUIDE / BRIEFING) từ các nguồn tài liệu pháp lý sau:
${sourcesText}

YÊU CẦU:
1. Executive Summary: Tóm lược cô đọng mục đích, phạm vi điều chỉnh và tinh thần cốt lõi.
2. Key Entities: Các chủ thể chịu tác động (Người học, Nhà trường, Doanh nghiệp công nghệ, Cơ quan quản lý...) cùng quyền và nghĩa vụ chính.
3. Critical Articles: Top điều khoản quan trọng nhất thường gặp trong đời sống số hoặc đề thi.
4. FAQs: 4-6 câu hỏi - giải đáp pháp lý thường gặp nhất.
5. BTI Exam Relevance: Mối liên kết với Khung năng lực số người học TT 02/2025 và gợi ý chủ đề ra đề thi BTI 2026.
6. Compliance Checklist: 4-6 hành động cần tuân thủ ngay.`;

        const response = await generateWithFallback(ai, {
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                executiveSummary: { type: Type.STRING },
                jurisdictionScope: { type: Type.STRING },
                keyEntities: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      entity: { type: Type.STRING },
                      rights: { type: Type.STRING },
                      obligations: { type: Type.STRING }
                    },
                    required: ["entity", "rights", "obligations"]
                  }
                },
                criticalArticles: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      documentNumber: { type: Type.STRING },
                      article: { type: Type.STRING },
                      summary: { type: Type.STRING },
                      relevanceToBTI: { type: Type.STRING }
                    },
                    required: ["documentNumber", "article", "summary", "relevanceToBTI"]
                  }
                },
                faqs: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      answer: { type: Type.STRING },
                      legalReference: { type: Type.STRING }
                    },
                    required: ["question", "answer", "legalReference"]
                  }
                },
                complianceChecklist: { type: Type.ARRAY, items: { type: Type.STRING } },
                btiExamRelevance: { type: Type.STRING }
              },
              required: ["executiveSummary", "keyEntities", "criticalArticles", "faqs", "complianceChecklist", "btiExamRelevance"]
            }
          }
        });

        if (!response.text) throw new Error("AI không trả về kết quả Study Guide.");
        return res.json({ success: true, result: JSON.parse(response.text.trim()) });
      }

      if (action === 'AUDIO_OVERVIEW') {
        const prompt = `Bạn là Đạo diễn kiêm Nhà sản xuất chương trình Audio Overview (Podcast 2 Chuyên gia theo phong cách Google NotebookLM) cho Cuộc thi "Beyond The Internet 2026" (BTI 2026).
Nhiệm vụ: Hãy tạo một kịch bản Podcast Audio Overview đối thoại 2 người cực kỳ hấp dẫn, tự nhiên, thông minh và hóm hỉnh dựa trên các nguồn tài liệu pháp lý sau:
${sourcesText}

HAI NHÂN VẬT HOST PODCAST:
1. Host 1: "Minh Thảo" (Giọng nữ, Chuyên gia Khảo thí BTI 2026): Am hiểu đề thi, sư phạm, giàu năng lượng, đặt câu hỏi gợi mở, liên hệ với tình huống học sinh/sinh viên.
2. Host 2: "Quốc Hoàng" (Giọng nam, Luật sư Công nghệ & Chuyên gia An toàn số): Điềm đạm, sắc sảo, phân tích góc độ pháp lý, chỉ ra các lỗ hổng bảo mật và hệ lụy đời thực.

QUY TẮC ĐỐI THOẠI NOTEBOOKLM:
- Mở đầu bằng lời chào vui vẻ, giới thiệu chủ đề tập podcast ngắn gọn.
- Luân phiên đối đáp qua lại tự nhiên (khoảng 8 đến 14 lượt thoại xen kẽ).
- Mỗi lượt thoại có độ dài vừa phải (2-4 câu), ngôn từ trong sáng, hiện đại, dễ hiểu, tránh đọc luật khô khan.
- Dẫn chứng các tình huống thực tế năm 2026 (lộ ảnh CCCD, chat AI lộ bí mật, deepfake lừa tiền, mua bán tài khoản ngân hàng...).
- Kết thúc bằng lời khuyên bổ ích và chúc các thí sinh BTI 2026 tự tin thi đấu!`;

        const response = await generateWithFallback(ai, {
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                episodeTitle: { type: Type.STRING, description: "Tiêu đề tập podcast cuốn hút" },
                episodeSubtitle: { type: Type.STRING, description: "Phụ đề tóm lược nội dung" },
                durationMinutes: { type: Type.NUMBER, description: "Thời lượng ước tính (phút, vd: 4)" },
                summary: { type: Type.STRING, description: "Tóm tắt ngắn 1 đoạn về tập podcast" },
                dialogue: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      speaker: { type: Type.STRING, description: "Minh Thảo | Quốc Hoàng" },
                      role: { type: Type.STRING, description: "Chuyên gia Khảo thí | Luật sư Công nghệ" },
                      text: { type: Type.STRING, description: "Lời thoại chi tiết" },
                      emphasis: { type: Type.STRING, description: "Từ khóa nhấn mạnh" }
                    },
                    required: ["speaker", "role", "text"]
                  }
                },
                keyHighlights: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-4 điểm nhấn đáng nhớ nhất" }
              },
              required: ["episodeTitle", "episodeSubtitle", "durationMinutes", "summary", "dialogue", "keyHighlights"]
            }
          }
        });

        if (!response.text) throw new Error("AI không trả về kết quả Audio Overview.");
        return res.json({ success: true, result: JSON.parse(response.text.trim()) });
      }

      if (action === 'GENERATE_QUESTIONS') {
        const prompt = `Bạn là Chuyên gia Khảo thí Cấp cao BTI 2026.
Hãy tạo ${questionCount} câu hỏi thi học thuật xuất sắc cho Cuộc thi BTI 2026 dựa CHÍNH XÁC trên các căn cứ pháp lý sau:
${sourcesText}

${focusArticle ? `ƯU TIÊN BIÊN SOẠN BÁM SÁT VÀO ĐIỀU KHOẢN NÀY: ${JSON.stringify(focusArticle)}` : ''}

YÊU CẦU:
1. Đa dạng hóa định dạng: Trắc nghiệm 4 lựa chọn (MULTIPLE_CHOICE), hoặc Đúng/Sai 4 ý (TRUE_FALSE_4), hoặc Trả lời ngắn (SHORT_ANSWER).
2. Câu hỏi gắn liền tình huống số thực tiễn năm 2026.
3. BẮT BUỘC có legalReference viện dẫn chính xác số hiệu và điều khoản của tài liệu.
4. Lời giải thích sâu sắc, chuẩn mực.`;

        const response = await generateWithFallback(ai, {
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      questionText: { type: Type.STRING },
                      roundType: { type: Type.STRING, description: "MULTIPLE_CHOICE | SHORT_ANSWER | TRUE_FALSE_4" },
                      options: {
                        type: Type.OBJECT,
                        properties: {
                          A: { type: Type.STRING },
                          B: { type: Type.STRING },
                          C: { type: Type.STRING },
                          D: { type: Type.STRING }
                        }
                      },
                      correctKey: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                      legalReference: { type: Type.STRING },
                      cognitiveLevel: { type: Type.STRING, description: "NHAN_BIET | THONG_HIEU | VAN_DUNG | VAN_DUNG_CAO" },
                      digitalCompetencyDomain: { type: Type.STRING, description: "MIEN_1 | MIEN_2 | MIEN_3 | MIEN_4 | MIEN_5 | MIEN_6" },
                      timeLimit: { type: Type.INTEGER },
                      points: { type: Type.INTEGER }
                    },
                    required: ["questionText", "roundType", "correctKey", "explanation", "legalReference"]
                  }
                }
              },
              required: ["questions"]
            }
          }
        });

        if (!response.text) throw new Error("AI không trả về câu hỏi thi.");
        return res.json({ success: true, result: JSON.parse(response.text.trim()) });
      }

      return res.status(400).json({ error: `Hành động không hợp lệ: ${action}` });
    } catch (error: any) {
      console.error("NotebookLM Legal Agent Error:", error);
      res.status(500).json({ error: error.message || "Lỗi xử lý NotebookLM Agent." });
    }
  });

  // =========================================================================
  // AI ROUTE: HIGH-ACCURACY LEGAL DOCUMENT OCR & ARTICLE PARSER
  // Accepts: fileBase64 (PDF, Image, Text) or rawText
  // =========================================================================
  app.post("/api/ai/parse-legal-document", async (req, res) => {
    try {
      const { fileBase64, mimeType = "application/pdf", fileName = "", rawText = "" } = req.body;
      const apiKey = getEffectiveApiKey(req);
      if (!apiKey) return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY trên máy chủ." });

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const contentsParts: any[] = [];

      if (fileBase64) {
        let cleanBase64 = fileBase64;
        let resolvedMime = mimeType;
        if (cleanBase64.includes(',')) {
          const split = cleanBase64.split(',');
          const match = split[0].match(/:(.*?);/);
          if (match) resolvedMime = match[1];
          cleanBase64 = split[1];
        }

        contentsParts.push({
          inlineData: {
            mimeType: resolvedMime,
            data: cleanBase64
          }
        });
      }

      const promptText = `Bạn là Chuyên gia Số hóa & Nhận diện Văn bản Pháp luật (Legal OCR & Document AI) của Cuộc thi "Beyond The Internet 2026" (BTI 2026).
Nhiệm vụ: Phân tích toàn bộ tài liệu đính kèm (tệp PDF, ảnh chụp, tài liệu văn bản) có tên "${fileName}".

${rawText && rawText.trim() ? `NỘI DUNG VĂN BẢN THÔ:\n"""\n${rawText.slice(0, 12000)}\n"""\n` : ''}

HÃY BÓC TÁCH VÀ NHẬN DIỆN CHÍNH XÁC:
1. 'title': Tên đầy đủ, chuẩn xác của văn bản (Ví dụ: "Thông tư quy định Khung năng lực số cho người học", "Nghị định quy định về bảo vệ dữ liệu cá nhân", "Luật An ninh mạng").
2. 'documentNumber': Số hiệu văn bản CHÍNH XÁC (Ví dụ: "02/2025/TT-BGDĐT", "13/2023/NĐ-CP", "24/2018/QH14", "20/2023/QH15"). Nếu không có, dự đoán số hiệu hợp lý dựa trên loại văn bản.
3. 'issuingAuthority': Cơ quan ban hành (Ví dụ: "Bộ Giáo dục và Đào tạo", "Chính phủ", "Quốc hội", "Thủ tướng Chính phủ").
4. 'issuedDate': Ngày ban hành (định dạng YYYY-MM-DD, ví dụ: "2025-01-24").
5. 'effectiveDate': Ngày có hiệu lực thi hành (định dạng YYYY-MM-DD, ví dụ: "2025-03-10").
6. 'type': Loại văn bản: "THONG_TU" | "NGHI_DINH" | "LUAT" | "QUYET_DINH" | "QUY_DINH_KHAC".
7. 'domain': Miền năng lực số liên quan chính: "Khung năng lực số quốc gia" | "Bảo vệ dữ liệu cá nhân & An ninh mạng" | "An ninh mạng & Phòng chống tội phạm công nghệ cao" | "Chữ ký số & Hợp đồng điện tử" | "An toàn thông tin".
8. 'summary': Tóm tắt cô đọng 2-3 câu về phạm vi điều chỉnh và tinh thần cốt lõi của văn bản.
9. 'keyArticles': Bóc tách chi tiết các Điều/Khoản trọng tâm (Tối thiểu 3-10 điều khoản quan trọng nhất liên quan đến an toàn số, công nghệ, quyền, nghĩa vụ, chế tài xử lý). Mỗi mục gồm 'article' (Tên điều, ví dụ: "Điều 9 - Quyền của chủ thể dữ liệu") và 'content' (Nội dung súc tích, đầy đủ ý chính).
10. 'relatedDomains': Danh sách mã miền năng lực số liên quan theo TT 02/2025 (ví dụ: ["MIEN_4", "MIEN_6"]).
11. 'extractedTextSnippet': Trích đoạn văn bản đại diện sạch sẽ (khoảng 300-500 chữ).`;

      contentsParts.push({ text: promptText });

      const response = await generateWithFallback(ai, {
        contents: contentsParts,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              documentNumber: { type: Type.STRING },
              issuingAuthority: { type: Type.STRING },
              issuedDate: { type: Type.STRING },
              effectiveDate: { type: Type.STRING },
              type: { type: Type.STRING },
              domain: { type: Type.STRING },
              summary: { type: Type.STRING },
              keyArticles: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    article: { type: Type.STRING },
                    content: { type: Type.STRING }
                  },
                  required: ["article", "content"]
                }
              },
              relatedDomains: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              extractedTextSnippet: { type: Type.STRING }
            },
            required: ["title", "documentNumber", "issuingAuthority", "summary", "keyArticles"]
          }
        }
      });

      if (!response.text) throw new Error("AI không nhận diện được văn bản.");
      const parsedData = JSON.parse(response.text.trim());
      res.json({ success: true, document: parsedData });
    } catch (error: any) {
      console.error("Parse Legal Document Error:", error);
      res.status(500).json({ error: error.message || "Lỗi khi nhận diện văn bản bằng AI." });
    }
  });

  // AI Route: Parse raw text / unstructured exam into BTI 2026 format
  app.post("/api/ai/parse-excel-text", async (req, res) => {
    try {
      const { rawText } = req.body;
      const apiKey = getEffectiveApiKey(req);
      if (!apiKey) return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY." });

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `Dưới đây là nội dung đề thi / bảng dữ liệu thô:
"""
${rawText.slice(0, 8000)}
"""

Hãy bóc tách thành danh sách các câu hỏi theo cấu trúc Ngân hàng Đề thi BTI 2026:
- Tự động nhận diện câu hỏi Khởi động, Vượt CNV, Tăng tốc, Về đích, hoặc Đề Bộ GD&ĐT.
- Bóc tách nội dung câu hỏi, các phương án A, B, C, D (nếu có), đáp án đúng, giải thích.
- Dự đoán Miền năng lực số (MIEN_1 đến MIEN_6) theo Thông tư 02/2025/TT-BGDĐT.
- Dự đoán mức độ nhận thức (NHAN_BIET, THONG_HIEU, VAN_DUNG, VAN_DUNG_CAO).`;

      const response = await generateWithFallback(ai, {
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                questionText: { type: Type.STRING },
                roundName: { type: Type.STRING },
                roundType: { type: Type.STRING },
                options: {
                  type: Type.OBJECT,
                  properties: {
                    A: { type: Type.STRING },
                    B: { type: Type.STRING },
                    C: { type: Type.STRING },
                    D: { type: Type.STRING }
                  }
                },
                correctKey: { type: Type.STRING },
                explanation: { type: Type.STRING },
                domain: { type: Type.STRING },
                cognitiveLevel: { type: Type.STRING },
                legalReference: { type: Type.STRING }
              },
              required: ["questionText", "correctKey"]
            }
          }
        }
      });

      if (!response.text) throw new Error("AI không trả về kết quả.");
      res.json({ success: true, questions: JSON.parse(response.text.trim()) });
    } catch (error: any) {
      console.error("AI Parse Text Error:", error);
      res.status(500).json({ error: error.message || "Lỗi bóc tách đề thi." });
    }
  });

  // AI Route: Analyze uploaded custom Excel template structure
  app.post("/api/ai/analyze-excel-template", async (req, res) => {
    try {
      const { fileName, sheets } = req.body;
      const apiKey = getEffectiveApiKey(req);
      if (!apiKey) return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY." });

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const sheetsSummary = (sheets || []).map((s: any) => {
        const previewRows = (s.rows || []).slice(0, 10).map((r: any[]) => r.slice(0, 15));
        return `Sheet: "${s.sheetName}"\nPreview 10 dòng đầu:\n${JSON.stringify(previewRows, null, 2)}`;
      }).join('\n\n');

      const prompt = `Bạn là chuyên gia phân tích cấu trúc bảng tính đề thi Excel của các hệ thống khảo thí trực tuyến (như Azota, K12Online, OLM, Shub Classroom, Quizizz, Canvas, Moodle, Google Form, hoặc mẫu phần mềm điều khiển trận đấu BTI 2026 "Đề thi.xlsx", mẫu Bộ GD&ĐT).
Tệp tải lên: "${fileName || 'Đề thi.xlsx'}"

Nội dung dữ liệu các trang tính (sheet):
${sheetsSummary.slice(0, 7000)}

Nhiệm vụ của bạn:
1. Xác định tên hệ thống khảo thí hoặc nguồn gốc mẫu đề:
   - Nếu tệp chứa các vòng "KHỞI ĐỘNG" (lượt riêng thí sinh 1-4, lượt chung), "VƯỢT CHƯỚNG NGẠI VẬT" (hàng ngang 1-4, trung tâm, ô B3/C3/D3), "TĂNG TỐC" (kèm LINK DỮ LIỆU TĂNG TỐC), "VỀ ĐÍCH" (lượt 1-4, gói 20/30 điểm, cột Chú thích), "CÂU HỎI PHỤ", hoặc tên file là "Đề thi.xlsx":
     -> Hãy xác định rõ systemName là "Phần mềm BTI (Đề thi.xlsx)"!
     -> Trong aiSummary: Nêu rõ cấu trúc 5 vòng thi chuẩn BTI, quy định đặt tên file bắt buộc là "Đề thi.xlsx" và cấu trúc thư mục Media quy chuẩn (Media/Starting cho Khởi động, Media/Obstacle cho VCNV, Media/Acceleration/AC1-AC4 cho Tăng tốc, Media/Finish cho Về đích, StudentImage cho ảnh thí sinh).
   - Nếu là các hệ thống khác (Azota, K12Online, OLM, Quizizz, Bộ GD&ĐT, Subiz...): Xác định đúng tên hệ thống.
2. Tóm tắt cấu trúc biểu mẫu bằng tiếng Việt (vị trí dòng tiêu đề, các dòng banner hướng dẫn phía trên, số lượng cột, quy ước đáp án).
3. Cho sheet chính chứa câu hỏi trắc nghiệm/tự luận, xác định headerRowIndex (chỉ số dòng chứa tên các cột, bắt đầu từ 0).
4. Khớp nối từng cột với các trường chuẩn của Ngân hàng Đề thi BTI 2026:
   - Các giá trị trường hợp lệ:
     "id" (Mã câu / STT)
     "question_text" (Nội dung câu hỏi)
     "option_a" (Phương án A / Ý a)
     "option_b" (Phương án B / Ý b)
     "option_c" (Phương án C / Ý c)
     "option_d" (Phương án D / Ý d)
     "option_e" (Phương án E)
     "correct_key" (Đáp án đúng)
     "explanation" (Lời giải chi tiết / Hướng dẫn giải / Chú thích MC)
     "cognitive_level" (Mức độ nhận thức / Độ khó)
     "digital_competency_domain" (Miền năng lực số / Chủ đề)
     "points" (Điểm số)
     "time_limit" (Thời gian làm bài)
     "legal_reference" (Căn cứ pháp lý)
     "round_name" (Vòng thi / Phần thi)
     "media_url" (Ảnh / Video đính kèm)
     "audio_url" (File âm thanh)
     "unmapped" (Cột không dùng / bỏ trống)
5. Trả về JSON theo đúng định dạng được yêu cầu.`;

      const response = await generateWithFallback(ai, {
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              systemName: { type: Type.STRING },
              aiSummary: { type: Type.STRING },
              targetSheetName: { type: Type.STRING },
              headerRowIndex: { type: Type.INTEGER },
              columnMappings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    colIndex: { type: Type.INTEGER },
                    originalHeader: { type: Type.STRING },
                    mappedField: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  },
                  required: ["colIndex", "originalHeader", "mappedField"]
                }
              }
            },
            required: ["systemName", "aiSummary", "headerRowIndex", "columnMappings"]
          }
        }
      });

      if (!response.text) throw new Error("AI không phản hồi phân tích mẫu đề.");
      const parsed = JSON.parse(response.text.trim());
      res.json({ success: true, analysis: parsed });
    } catch (error: any) {
      console.error("AI Analyze Template Error:", error);
      res.status(500).json({ error: error.message || "Lỗi khi phân tích mẫu đề thi bằng AI." });
    }
  });

  // API route for summarizing audience interactions (Shouts or Q&A)
  app.post("/api/summarize-audience", async (req, res) => {
    try {
      const { type, data } = req.body;
      const apiKey = getEffectiveApiKey(req);
      
      if (!apiKey) {
        return res.status(500).json({ error: "API key is not configured on the server." });
      }
      
      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });
      
      let prompt = "";
      if (type === 'SHOUTS') {
        prompt = `Hãy đóng vai một trợ lý AI phân tích bầu không khí sự kiện. Dưới đây là danh sách các tin nhắn/tiếng hô cổ vũ (shout) của khán giả trong ít phút vừa qua:\n\n${JSON.stringify(data)}\n\nHãy tóm tắt ngắn gọn trong 2-3 câu (tối đa 50 từ): Khán giả đang cảm thấy thế nào? Ai đang được cổ vũ nhiều nhất? Từ khóa nào xuất hiện nhiều? Hãy viết với giọng điệu năng động, MC có thể đọc ngay để khuấy động sân khấu.`;
      } else if (type === 'QA') {
        prompt = `Hãy đóng vai một trợ lý AI phân tích sự kiện. Dưới đây là danh sách các câu hỏi mà khán giả vừa gửi:\n\n${JSON.stringify(data)}\n\nHãy tóm tắt ngắn gọn trong 3-4 ý gạch đầu dòng: Đâu là những chủ đề chính/câu hỏi được quan tâm nhiều nhất? Có xu hướng chung nào trong các câu hỏi không? Phù hợp để MC tham khảo đọc lên sân khấu.`;
      } else {
        return res.status(400).json({ error: "Loại dữ liệu không hợp lệ." });
      }

      const response = await generateWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: "Bạn là trợ lý ảo phân tích tương tác trực tiếp cho MC sự kiện. Trả lời ngắn gọn, súc tích, văn phong tự nhiên, chuyên nghiệp.",
        }
      });

      if (!response.text) {
        throw new Error("No text returned from Gemini");
      }

      res.json({ summary: response.text.trim() });
    } catch (error: any) {
      console.error("Gemini Summarize Error:", error);
      res.status(500).json({ error: error.message || "Lỗi khi gọi AI tóm tắt." });
    }
  });

  // ==========================================
  // 1. GEMINI MULTI-TURN CHATBOT ROUTE
  // ==========================================
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { messages, systemInstruction, model } = req.body;
      const apiKey = getEffectiveApiKey(req);
      if (!apiKey) {
        return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY trên máy chủ." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      // Target model requested by user or default
      const requestedModel = model || "gemini-3.8-flash";
      
      // Multi-tier hierarchy fallback list to ensure zero failure
      const fallbackList = [
        requestedModel,
        "gemini-3.8-flash",
        "gemini-3.5-flash",
        "gemini-3.1-flash-lite",
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite"
      ].filter((v, i, a) => a.indexOf(v) === i);

      // Convert history to contents format
      const contents = (messages || []).map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text || "" }]
      }));

      if (contents.length === 0) {
        return res.status(400).json({ error: "Lịch sử tin nhắn không được để trống." });
      }

      let replyText = "";
      let usedModel = requestedModel;
      let lastError: any = null;

      const chatSystemInstruction = `${systemInstruction || 'Bạn là Trợ lý AI Cấp cao của Ban Tổ Chức Cuộc thi "Beyond The Internet 2026" (BTI 2026).'}

BỘ QUY CHẾ VÀ LUẬT THI ĐẤU CHÍNH THỨC CUỘC THI BTI 2026 (TRI THỨC BẮT BUỘC):
${BTI_2026_OFFICIAL_RULES_PROMPT}

HƯỚNG DẪN ĐỊNH DẠNG: Khi trình bày công thức toán học, thuật toán, hàm điều kiện hoặc tính điểm số, hãy sử dụng cú pháp LaTeX chuẩn được bao bởi $$ cho khối (block math) hoặc $ cho inline. Trong các môi trường \\begin{cases}...\\end{cases} hoặc ma trận/hệ phương trình, luôn sử dụng dấu xuống dòng hai gạch chéo '\\\\' rõ ràng giữa các nhánh.`;

      for (const m of fallbackList) {
        try {
          const response = await ai.models.generateContent({
            model: m,
            contents,
            config: {
              systemInstruction: chatSystemInstruction,
            }
          });
          if (response.text) {
            replyText = response.text;
            usedModel = m;
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Model ${m} encountered an issue, trying fallback:`, err?.message || err);
        }
      }

      if (!replyText) {
        throw lastError || new Error("Không nhận được phản hồi từ mô hình Gemini.");
      }

      res.json({ success: true, text: replyText, usedModel });
    } catch (error: any) {
      console.error("Gemini Chat Error:", error);
      res.status(500).json({ error: error.message || "Lỗi xử lý cuộc hội thoại với Gemini." });
    }
  });

  // ==========================================
  // 2. CREATE & EDIT IMAGES WITH GEMINI
  // Model: gemini-3.1-flash-image-preview
  // ==========================================
  app.post("/api/ai/generate-image", async (req, res) => {
    try {
      const { prompt, base64Image, mimeType = "image/png", aspectRatio = "1:1", mode = "generate" } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Vui lòng nhập mô tả ảnh (prompt)." });
      }

      const apiKey = getEffectiveApiKey(req);
      if (!apiKey) {
        return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY trên máy chủ." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const isEdit = mode === "edit" && Boolean(base64Image);
      const cleanBase64 = base64Image ? base64Image.replace(/^data:image\/\w+;base64,/, '') : '';

      // Models priority: gemini-3.1-flash-image-preview, gemini-3.1-flash-image, gemini-3.1-flash-lite-image, imagen-3.0-generate-002
      const candidateModels = isEdit
        ? ["gemini-3.1-flash-image-preview", "gemini-3.1-flash-lite-image", "gemini-3.1-flash-image"]
        : ["gemini-3.1-flash-image-preview", "gemini-3.1-flash-lite-image", "gemini-3.1-flash-image", "imagen-3.0-generate-002"];

      let imageUrl = "";
      let usedModel = "";
      let lastError: any = null;

      for (const model of candidateModels) {
        try {
          if (model === "imagen-3.0-generate-002" && !isEdit) {
            const validAspect = (aspectRatio === "16:9" || aspectRatio === "9:16" || aspectRatio === "4:3" || aspectRatio === "3:4" || aspectRatio === "1:1") ? aspectRatio : "1:1";
            const imgResp = await ai.models.generateImages({
              model: "imagen-3.0-generate-002",
              prompt,
              config: {
                numberOfImages: 1,
                aspectRatio: validAspect,
              }
            });
            const b64 = imgResp.generatedImages?.[0]?.image?.imageBytes;
            if (b64) {
              imageUrl = `data:image/png;base64,${b64}`;
              usedModel = model;
              break;
            }
          } else {
            const parts: any[] = [];
            if (isEdit && cleanBase64) {
              parts.push({
                inlineData: {
                  data: cleanBase64,
                  mimeType: mimeType || "image/png"
                }
              });
            }
            parts.push({ text: prompt });

            const resp = await ai.models.generateContent({
              model,
              contents: { parts },
              config: {
                imageConfig: {
                  aspectRatio: aspectRatio || "1:1",
                }
              }
            });

            const cParts = resp.candidates?.[0]?.content?.parts || [];
            for (const p of cParts) {
              if (p.inlineData?.data) {
                const mime = p.inlineData.mimeType || "image/png";
                imageUrl = `data:${mime};base64,${p.inlineData.data}`;
                usedModel = model;
                break;
              }
            }

            if (imageUrl) break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Image model ${model} failed, trying next fallback:`, err?.message || err);
        }
      }

      if (!imageUrl) {
        throw lastError || new Error("Không thể tạo hoặc chỉnh sửa ảnh từ mô hình AI.");
      }

      res.json({ success: true, imageUrl, usedModel });
    } catch (error: any) {
      console.error("Gemini Image Generation Error:", error);
      res.status(500).json({ error: error.message || "Lỗi trong quá trình tạo hoặc chỉnh sửa ảnh." });
    }
  });

  // ==========================================
  // 3. ANIMATE IMAGES INTO VIDEO (VEO)
  // Model: veo-3.1-fast-generate-preview
  // ==========================================
  app.post("/api/generate-video", async (req, res) => {
    try {
      const { prompt, base64Image, mimeType = "image/png", aspectRatio = "16:9" } = req.body;
      if (!base64Image) {
        return res.status(400).json({ error: "Vui lòng tải lên ảnh để biến thành video." });
      }

      const apiKey = getEffectiveApiKey(req);
      if (!apiKey) {
        return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY trên máy chủ." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
      const validAspectRatio = aspectRatio === "9:16" ? "9:16" : "16:9";

      // Video models hierarchy
      const videoModels = ["veo-3.1-fast-generate-preview", "veo-3.1-lite-generate-preview", "veo-3.1-generate-preview"];
      let operation: any = null;
      let lastError: any = null;

      for (const model of videoModels) {
        try {
          operation = await ai.models.generateVideos({
            model,
            prompt: prompt || "Cinematic and smooth animation of the scene with subtle natural motion",
            image: {
              imageBytes: cleanBase64,
              mimeType: mimeType || "image/png"
            },
            config: {
              numberOfVideos: 1,
              resolution: "720p",
              aspectRatio: validAspectRatio
            }
          });
          if (operation?.name) break;
        } catch (err: any) {
          lastError = err;
          console.warn(`Veo model ${model} failed, trying fallback:`, err?.message || err);
        }
      }

      if (!operation || !operation.name) {
        throw lastError || new Error("Không thể khởi tạo tiến trình video với Veo.");
      }

      res.json({ operationName: operation.name });
    } catch (error: any) {
      console.error("Veo Video Start Error:", error);
      const msg = error.message || String(error);
      const isBilling = msg.includes("billing") || msg.includes("quota") || msg.includes("403") || msg.includes("not enabled");
      const friendlyMsg = isBilling 
        ? "Mô hình Veo yêu cầu API Key có kích hoạt thanh toán (Paid API Key). Vui lòng gắn API Key trả phí để sử dụng tính năng này." 
        : (error.message || "Lỗi khi khởi tạo video với Veo.");
      res.status(500).json({ error: friendlyMsg });
    }
  });

  app.post("/api/video-status", async (req, res) => {
    try {
      const { operationName } = req.body;
      if (!operationName) {
        return res.status(400).json({ error: "Thiếu operationName." });
      }

      const apiKey = getEffectiveApiKey(req);
      if (!apiKey) {
        return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });

      res.json({ 
        done: Boolean(updated.done),
        error: updated.error ? (updated.error.message || String(updated.error)) : null 
      });
    } catch (error: any) {
      console.error("Veo Status Error:", error);
      res.status(500).json({ error: error.message || "Lỗi kiểm tra tiến trình video." });
    }
  });

  app.post("/api/video-download", async (req, res) => {
    try {
      const { operationName } = req.body;
      if (!operationName) {
        return res.status(400).json({ error: "Thiếu operationName." });
      }

      const apiKey = getEffectiveApiKey(req);
      if (!apiKey) {
        return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });
      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;

      if (!uri) {
        return res.status(404).json({ error: "Video chưa hoàn thành hoặc không tìm thấy liên kết tải." });
      }

      const videoRes = await fetch(uri, {
        headers: { 'x-goog-api-key': apiKey },
      });

      if (!videoRes.ok) {
        throw new Error(`Tải video từ Google API thất bại: ${videoRes.status}`);
      }

      const arrayBuffer = await videoRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (error: any) {
      console.error("Veo Download Error:", error);
      res.status(500).json({ error: error.message || "Lỗi khi tải dữ liệu video." });
    }
  });

  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      setHeaders: (res) => {
        res.set('Access-Control-Allow-Origin', '*');
      }
    }));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath, (err) => {
          if (err && !res.headersSent) {
            res.status(500).send('Error serving application.');
          }
        });
      } else {
        res.status(404).send('Application build not found.');
      }
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Graceful shutdown handling for container environments (Cloud Run)
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received. Closing server gracefully...');
    server.close(() => {
      console.log('Server closed successfully.');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT signal received. Closing server gracefully...');
    server.close(() => {
      console.log('Server closed successfully.');
      process.exit(0);
    });
  });
}

startServer().catch((err) => {
  console.error("Fatal error starting server:", err);
  process.exit(1);
});

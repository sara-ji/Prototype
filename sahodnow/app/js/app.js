const Auth = {
  DEMO_REGISTERED: '9171234567',

  delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  },

  validatePhone(raw) {
    const phone = String(raw).replace(/\D/g, '');
    if (!phone) return { ok: false, msg: 'Please enter your phone number' };
    if (!/^\d+$/.test(phone)) return { ok: false, msg: 'Please enter numbers only' };
    if (phone.length !== 10) return { ok: false, msg: 'Please enter a 10-digit phone number' };
    if (!phone.startsWith('9')) return { ok: false, msg: 'Phone number must start with 9' };
    return { ok: true, phone };
  },

  formatDisplay(phone) {
    const p = String(phone).replace(/\D/g, '');
    if (p.length <= 3) return p;
    if (p.length <= 6) return p.slice(0, 3) + ' ' + p.slice(3);
    return p.slice(0, 3) + ' ' + p.slice(3, 6) + ' ' + p.slice(6);
  },

  getRegisteredPhones() {
    const extra = AppState.get('ph_registered_phones') || [];
    return [this.DEMO_REGISTERED, ...extra];
  },

  markRegistered(phone) {
    const list = AppState.get('ph_registered_phones') || [];
    if (!list.includes(phone)) {
      list.push(phone);
      AppState.set('ph_registered_phones', list);
    }
  },

  DEVICE_ID_KEY: 'ph_device_id',
  PINS_KEY: 'ph_device_pins',

  getDeviceId() {
    let id = AppState.get(this.DEVICE_ID_KEY);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).slice(2, 11);
      AppState.set(this.DEVICE_ID_KEY, id);
    }
    return id;
  },

  getDevicePinMap() {
    const all = AppState.get(this.PINS_KEY) || {};
    const deviceId = this.getDeviceId();
    if (!all[deviceId]) all[deviceId] = {};
    return all[deviceId];
  },

  hasDevicePin(phone) {
    return Boolean(this.getDevicePinMap()[phone]);
  },

  setDevicePin(phone, pin) {
    const all = AppState.get(this.PINS_KEY) || {};
    const deviceId = this.getDeviceId();
    if (!all[deviceId]) all[deviceId] = {};
    all[deviceId][phone] = pin;
    AppState.set(this.PINS_KEY, all);
  },

  /** Mock: PIN 校验（本设备） */
  async verifyPin(phone, pin) {
    await this.delay(400);
    const stored = this.getDevicePinMap()[phone];
    if (!stored) {
      return { success: false, msg: 'No PIN on this device. Sign in with a verification code.' };
    }
    if (pin !== stored) {
      return { success: false, msg: 'Incorrect PIN. Please try again.' };
    }
    return { success: true };
  },

  PIN_RESET_KEY: 'ph_pin_reset_verified',
  PIN_RESET_TTL_MS: 10 * 60 * 1000,

  markPinResetVerified(phone) {
    AppState.set(this.PIN_RESET_KEY, { phone, at: Date.now() });
  },

  isPinResetVerified(phone) {
    const data = AppState.get(this.PIN_RESET_KEY);
    if (!data || data.phone !== phone) return false;
    if (Date.now() - data.at > this.PIN_RESET_TTL_MS) return false;
    return true;
  },

  clearPinResetVerified() {
    AppState.set(this.PIN_RESET_KEY, null);
  },

  /** Mock: 用户账户接口 — 查询手机号是否已注册 */
  async checkPhone(phone) {
    await this.delay(500);
    const registered = this.getRegisteredPhones().includes(phone);
    return {
      registered,
      flow: registered ? 'login' : 'register',
      userId: registered ? 'usr_' + phone.slice(-4) : null
    };
  },

  /** Mock: OTP 获取接口 */
  async sendOtp(phone, scene, channel) {
    await this.delay(700);
    AppState.set('ph_otp_session', { phone, scene, channel: channel || 'sms', sentAt: Date.now() });
    return { success: true, cooldownSec: 60, template: scene, channel: channel || 'sms' };
  },

  /** Mock: OTP 校验 */
  async verifyOtp(phone, code) {
    await this.delay(500);
    if (!/^\d{6}$/.test(code)) return { success: false, msg: 'Enter the 6-digit code' };
    return { success: true, token: 'mock_otp_token_' + phone };
  },

  otpScene(flow) {
    if (flow === 'reset-pin') return 'tpl_VERIFYCODELOGON_217';
    return flow === 'register' ? 'tpl_SIGNUP_216' : 'tpl_VERIFYCODELOGON_217';
  },

  routeAfterLogin() {
    AppState.routeAfterAuth();
  },

  STEPS: ['basic', 'id', 'liveness', 'contact'],

  KYC_STEP_PROMPTS: {
    basic: 'Complete your profile to start evaluation',
    id: 'Submit valid ID to speed up limit review',
    liveness: 'Finish face scan to confirm your identity',
    contact: 'Almost ready for cash release',
    enhance: 'Submit payslip to get a higher limit'
  },

  progressBar(step) {
    if (step === 'enhance') {
      return `<div class="progress-bar">${this.STEPS.map(() =>
        '<div class="progress-step done"></div>'
      ).join('')}</div>`;
    }
    const idx = this.STEPS.indexOf(step);
    return `<div class="progress-bar">${this.STEPS.map((_, i) =>
      `<div class="progress-step${i < idx ? ' done' : ''}${i === idx ? ' active' : ''}"></div>`
    ).join('')}</div>`;
  },

  kycPrivacyNote() {
    return `<div class="kyc-privacy-note">
      <span class="kyc-privacy-icon" aria-hidden="true">
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M10 2l7 3.5v5c0 4.2-2.8 8.1-7 9.5C5.8 18.6 3 14.7 3 10.5v-5L10 2z" stroke="currentColor" stroke-width="1.3"/>
          <path d="M7 10l2 2 4-4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
      <p>Your information is encrypted and used only for verification. We never sell your data.</p>
    </div>`;
  },

  initKycHints() {
    const privacy = document.getElementById('kyc-privacy-note');
    if (privacy) privacy.innerHTML = this.kycPrivacyNote();
  },

  stepLabel(n) {
    return `<p class="eyebrow"><span class="dot">•</span> Step ${n} of ${this.STEPS.length}</p>`;
  },

  bindChipGroup(container, onChange) {
    container.querySelectorAll('.chip-option').forEach(chip => {
      chip.addEventListener('click', () => {
        container.querySelectorAll('.chip-option').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        onChange?.(chip.dataset.value);
      });
    });
  },

  PERSONAL_EMAIL_SUFFIXES: [
    '@gmail.com',
    '@yahoo.com',
    '@outlook.com',
    '@hotmail.com',
    '@icloud.com',
    '@ymail.com',
    '@live.com',
    '@msn.com',
    '@proton.me',
    '@mail.com'
  ],

  bindPersonalEmailInput(inputEl, suffixRowEl) {
    if (!inputEl || !suffixRowEl) return;

    const suffixes = this.PERSONAL_EMAIL_SUFFIXES;
    suffixRowEl.innerHTML = suffixes.map(suffix => (
      `<button type="button" class="email-suffix-chip" data-suffix="${suffix}">${suffix}</button>`
    )).join('');

    const openSuffixes = () => suffixRowEl.classList.add('is-open');
    const closeSuffixes = () => suffixRowEl.classList.remove('is-open');

    const localPart = () => {
      const raw = inputEl.value.trim();
      const at = raw.indexOf('@');
      return at === -1 ? raw : raw.slice(0, at);
    };

    const activeSuffix = () => {
      const raw = inputEl.value.trim().toLowerCase();
      return suffixes.find(suffix => raw.endsWith(suffix)) || null;
    };

    const syncSuffixHighlight = () => {
      const current = activeSuffix();
      suffixRowEl.querySelectorAll('.email-suffix-chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.suffix === current);
      });
    };

    suffixRowEl.querySelectorAll('.email-suffix-chip').forEach(chip => {
      chip.addEventListener('mousedown', e => e.preventDefault());
      chip.addEventListener('click', () => {
        const part = localPart();
        if (!part) {
          inputEl.focus();
          return;
        }
        inputEl.value = `${part}${chip.dataset.suffix}`;
        syncSuffixHighlight();
        inputEl.focus();
      });
    });

    inputEl.addEventListener('focus', () => {
      openSuffixes();
      syncSuffixHighlight();
    });

    inputEl.addEventListener('blur', () => {
      setTimeout(() => {
        if (!suffixRowEl.contains(document.activeElement)) closeSuffixes();
      }, 120);
    });

    inputEl.addEventListener('input', syncSuffixHighlight);
  },

  bindKycSelectSheets(config = {}) {
    const overlayId = config.overlayId || 'kyc-select-overlay';
    const overlay = document.getElementById(overlayId);
    if (!overlay) return null;

    const titleEl = overlay.querySelector('[data-select-title]');
    const listEl = overlay.querySelector('[data-select-list]');
    const fields = config.fields || {};
    const esc = value => String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');

    const normalizeOption = opt => (
      typeof opt === 'string' ? { value: opt, label: opt } : opt
    );

    const getOptionLabel = (options, value) => {
      const hit = options.map(normalizeOption).find(opt => opt.value === value);
      return hit ? hit.label : value;
    };

    const close = () => AppState.hideOverlay(overlayId);

    overlay.addEventListener('click', e => {
      if (e.target === overlay) close();
    });

    const syncTrigger = (trigger, fieldKey, input) => {
      const field = fields[fieldKey];
      if (!field || !input) return;
      const display = trigger.querySelector('.form-picker-trigger__text');
      if (display) {
        display.textContent = input.value
          ? getOptionLabel(field.options, input.value)
          : (field.placeholder || 'Select');
        display.classList.toggle('text-muted', !input.value);
      }
      trigger.classList.toggle('selected', !!input.value);
    };

    const openPicker = trigger => {
      const fieldKey = trigger.dataset.kycSelect;
      const fieldId = trigger.dataset.kycSelectFor || fieldKey;
      const field = fields[fieldKey];
      if (!field || !titleEl || !listEl) return;

      const input = document.getElementById(fieldId);
      const display = trigger.querySelector('.form-picker-trigger__text');
      const current = input?.value || '';

      titleEl.textContent = field.title || fieldKey;
      listEl.innerHTML = field.options.map(opt => {
        const { value, label } = normalizeOption(opt);
        const selected = value === current;
        return `<button type="button" class="kyc-select-option${selected ? ' selected' : ''}" role="option" data-value="${esc(value)}">
          <span class="kyc-select-option__label">${esc(label)}</span>
          <span class="kyc-select-option__check" aria-hidden="true">${selected ? '✓' : ''}</span>
        </button>`;
      }).join('');

      listEl.querySelectorAll('.kyc-select-option').forEach(btn => {
        btn.addEventListener('click', () => {
          const value = btn.dataset.value;
          if (input) {
            input.value = value;
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }
          if (display) {
            display.textContent = value
              ? getOptionLabel(field.options, value)
              : (field.placeholder || 'Select');
            display.classList.toggle('text-muted', !value);
          }
          trigger.classList.toggle('selected', !!value);
          trigger.classList.remove('has-error');
          field.onSelect?.(value, { trigger, input });
          close();
        });
      });

      AppState.showOverlay(overlayId);
    };

    document.querySelectorAll('[data-kyc-select]').forEach(trigger => {
      const fieldKey = trigger.dataset.kycSelect;
      const fieldId = trigger.dataset.kycSelectFor || fieldKey;
      const input = document.getElementById(fieldId);
      syncTrigger(trigger, fieldKey, input);
      input?.addEventListener('change', () => syncTrigger(trigger, fieldKey, input));
      trigger.addEventListener('click', () => openPicker(trigger));
    });

    return { openPicker, close, syncTrigger };
  },

  focusKycSelectField(fieldId) {
    const trigger = document.querySelector(`[data-kyc-select-for="${fieldId}"], [data-kyc-select="${fieldId}"]`);
    trigger?.focus();
  },

  bindOtpInputs(container, onChange) {
    const inputs = container.querySelectorAll('.otp-input');
    if (!inputs.length) return () => '';

    const getCode = () => Array.from(inputs).map(i => i.value).join('');

    const fillFrom = (startIdx, digits) => {
      digits.split('').forEach((ch, offset) => {
        const el = inputs[startIdx + offset];
        if (el) el.value = ch;
      });
      const lastIdx = Math.min(startIdx + digits.length - 1, inputs.length - 1);
      inputs[lastIdx].focus();
      onChange?.(getCode());
    };

    inputs.forEach((input, i) => {
      input.addEventListener('input', () => {
        const digits = input.value.replace(/\D/g, '');
        if (digits.length > 1) {
          fillFrom(i, digits.slice(0, inputs.length - i));
          return;
        }
        input.value = digits.slice(0, 1);
        if (input.value && i < inputs.length - 1) inputs[i + 1].focus();
        onChange?.(getCode());
      });

      input.addEventListener('keydown', e => {
        if (e.key === 'Backspace' && !input.value && i > 0) {
          inputs[i - 1].focus();
          inputs[i - 1].value = '';
          onChange?.(getCode());
        }
      });

      input.addEventListener('paste', e => {
        e.preventDefault();
        fillFrom(0, (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, inputs.length));
      });
    });

    return getCode;
  },

  /**
   * KYC back-exit retain sheet.
   * mode: 'benefit' | 'survey'
   * exitTo: where Leave goes (usually home — abandon flow)
   */
  KYC_EXIT_SURVEY_OPTIONS: [
    { id: 'id_not_with_me', label: "I don't have my ID with me" },
    { id: 'docs_not_ready', label: "Documents aren't ready yet" },
    { id: 'security', label: "I'm worried about privacy / security" },
    { id: 'too_long', label: 'The process feels too long' },
    { id: 'not_ready', label: "Just browsing — not ready to borrow" },
    { id: 'other', label: 'Other' }
  ],

  bindKycExitRetain(config = {}) {
    const {
      step = 'basic',
      mode = 'benefit',
      exitTo = 'home.html',
      backBtn = '#btn-back, .back-btn'
    } = config;

    const overlayId = 'kyc-exit-retain-overlay';
    let overlay = document.getElementById(overlayId);
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = overlayId;
      overlay.className = 'overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      document.body.appendChild(overlay);
    }

    const idx = this.STEPS.indexOf(step);
    const remaining = idx >= 0 ? Math.max(this.STEPS.length - idx - 1, 0) : 0;
    const maxAmount = '₱50,000';
    const stepsPhrase = remaining <= 0
      ? 'one last step'
      : remaining === 1
        ? '1 more step'
        : `${remaining} more steps`;

    const benefitCopy = {
      basic: {
        eyebrow: 'Almost there',
        title: `Just ${stepsPhrase} to unlock`
      },
      liveness: {
        eyebrow: 'Almost there',
        title: `Just ${stepsPhrase} to unlock`
      },
      contact: {
        eyebrow: 'Final step',
        title: 'One quick contact to unlock'
      }
    };

    const surveyCopy = {
      id: {
        eyebrow: 'Before you go',
        title: 'What’s stopping you right now?',
        lead: 'A quick tap helps us improve. Your answer is optional but appreciated.'
      },
      enhance: {
        eyebrow: 'Before you go',
        title: 'Why leave without uploading?',
        lead: 'Extra docs can raise your limit. Tell us what’s in the way — one tap is enough.'
      }
    };

    const renderBenefit = () => {
      const c = benefitCopy[step] || benefitCopy.basic;
      return `
        <div class="sheet sheet-kyc-retain">
          <div class="sheet-handle"></div>
          <p class="eyebrow"><span class="dot">•</span> ${c.eyebrow}</p>
          <h3 class="kyc-retain-title">${c.title}</h3>
          <div class="kyc-retain-amount-hero" aria-hidden="true">
            <strong>${maxAmount}</strong>
            <span>Max available limit</span>
          </div>
          <div class="btn-row kyc-retain-actions">
            <button type="button" class="btn btn-secondary" data-kyc-retain="leave">Leave</button>
            <button type="button" class="btn btn-primary" data-kyc-retain="stay">Continue</button>
          </div>
        </div>`;
    };

    const renderSurvey = () => {
      const c = surveyCopy[step] || surveyCopy.id;
      const opts = this.KYC_EXIT_SURVEY_OPTIONS.map(o =>
        `<button type="button" class="kyc-retain-option" role="radio" aria-checked="false" data-reason="${o.id}">
          <span class="kyc-retain-option__label">${o.label}</span>
          <span class="kyc-retain-option__check" aria-hidden="true"></span>
        </button>`
      ).join('');
      return `
        <div class="sheet sheet-kyc-retain sheet-kyc-retain--survey">
          <div class="sheet-handle"></div>
          <p class="eyebrow"><span class="dot">•</span> ${c.eyebrow}</p>
          <h3 class="kyc-retain-title">${c.title}</h3>
          <p class="kyc-retain-lead">${c.lead}</p>
          <div class="kyc-retain-options" role="radiogroup" aria-label="Exit reason">${opts}</div>
          <p class="kyc-retain-hint" data-kyc-retain-hint hidden>Please pick a reason, or continue setup.</p>
          <div class="btn-row kyc-retain-actions">
            <button type="button" class="btn btn-secondary" data-kyc-retain="leave">Leave</button>
            <button type="button" class="btn btn-primary" data-kyc-retain="stay">Keep going</button>
          </div>
        </div>`;
    };

    overlay.innerHTML = mode === 'survey' ? renderSurvey() : renderBenefit();

    let selectedReason = null;

    const show = () => {
      overlay.classList.add('show');
      selectedReason = null;
      overlay.querySelectorAll('.kyc-retain-option').forEach(btn => {
        btn.classList.remove('selected');
        btn.setAttribute('aria-checked', 'false');
      });
      const hint = overlay.querySelector('[data-kyc-retain-hint]');
      if (hint) hint.hidden = true;
    };
    const hide = () => overlay.classList.remove('show');

    overlay.querySelectorAll('.kyc-retain-option').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedReason = btn.dataset.reason;
        overlay.querySelectorAll('.kyc-retain-option').forEach(b => {
          const on = b === btn;
          b.classList.toggle('selected', on);
          b.setAttribute('aria-checked', on ? 'true' : 'false');
        });
        const hint = overlay.querySelector('[data-kyc-retain-hint]');
        if (hint) hint.hidden = true;
      });
    });

    overlay.addEventListener('click', e => {
      if (e.target === overlay) hide();
    });

    overlay.querySelector('[data-kyc-retain="stay"]')?.addEventListener('click', hide);
    overlay.querySelector('[data-kyc-retain="leave"]')?.addEventListener('click', () => {
      if (mode === 'survey' && !selectedReason) {
        const hint = overlay.querySelector('[data-kyc-retain-hint]');
        if (hint) hint.hidden = false;
        return;
      }
      if (selectedReason) {
        try {
          AppState.set('ph_kyc_exit_reason', { step, reason: selectedReason, at: Date.now() });
        } catch (_) { /* ignore */ }
      }
      hide();
      AppState.go(exitTo);
    });

    const bindBack = el => {
      if (!el) return;
      el.removeAttribute('onclick');
      el.addEventListener('click', e => {
        e.preventDefault();
        show();
      });
    };

    if (typeof backBtn === 'string') {
      document.querySelectorAll(backBtn).forEach(bindBack);
    } else {
      bindBack(backBtn);
    }

    return { show, hide };
  }
};

const AppState = {
  KEYS: {
    privacy: 'ph_privacy_accepted',
    user: 'ph_user',
    kycStep: 'ph_kyc_step',
    creditLimit: 'ph_credit_limit',
    hasLoan: 'ph_has_loan',
    loanAmount: 'ph_loan_amount',
    loanAppliedAt: 'ph_loan_applied_at',
    loans: 'ph_loans',
    enhanceRequired: 'ph_enhance_required',
    enhanceItems: 'ph_enhance_items',
    payoutDisplay: 'ph_payout_display',
    payoutType: 'ph_payout_type',
    payoutProvider: 'ph_payout_provider',
    payoutBound: 'ph_payout_bound',
    payoutAccounts: 'ph_payout_accounts',
    selectedPayoutId: 'ph_selected_payout_id',
    payoutAddVerified: 'ph_payout_add_verified',
    reviewStartedAt: 'ph_review_started_at',
    creditRejectedAt: 'ph_credit_rejected_at',
    creditRejectReason: 'ph_credit_reject_reason',
    creditRejectCooldownDays: 'ph_credit_reject_cooldown_days',
    creditTier: 'ph_credit_tier',
    creditApprovedAt: 'ph_credit_approved_at',
    creditExpiredAt: 'ph_credit_expired_at',
    payoutAccountNo: 'ph_payout_account_no',
    payoutPendingChange: 'ph_payout_pending_change',
    loanFlowState: 'ph_loan_flow_state',
    demoSeedBills: 'ph_demo_seed_bills',
    corpEmailAuth: 'ph_corp_email_auth',
    messagesRead: 'ph_messages_read',
    listingRejectedAt: 'ph_listing_rejected_at',
    listingRejectCooldownDays: 'ph_listing_reject_cooldown_days'
  },

  SUPPORT_PHONE: '+63 2 8888 1234',
  SUPPORT_EMAIL: 'support@sahodnow.ph',
  SUPPORT_HOURS: 'Mon–Sat, 9:00 AM – 6:00 PM (PHT)',

  REVIEW_COUNTDOWN_MS: 10000,
  REVIEW_RESULT_DELAY_MS: 5000,
  APPROVED_REDIRECT_SEC: 5,
  DEFAULT_REJECT_REASON: 'Your profile did not meet our current credit criteria.',
  DEFAULT_REJECT_COOLDOWN_DAYS: 30,
  DEFAULT_LISTING_REJECT_COOLDOWN_DAYS: 7,
  CREDIT_VALIDITY_DAYS: 90,

  LISTING_REJECT_REASONS: [
    'Your recent credit or repayment history did not meet our requirements',
    'We could not verify your income or employment details',
    'You have outstanding obligations that affect eligibility',
    'Other risk signals from our credit assessment'
  ],

  getDefaultMessages() {
    return [
      {
        id: 'welcome',
        title: 'Welcome to SahodNow',
        body: 'Complete your profile to unlock your credit limit and see your personalized offer.',
        time: 'Today',
        read: false
      },
      {
        id: 'credit-approved',
        title: 'Credit limit approved',
        body: 'Your limit is ready. Tap Borrow on the home screen when you need funds.',
        time: 'Yesterday',
        read: true
      },
      {
        id: 'repayment-reminder',
        title: 'Repayment reminder',
        body: 'Your statement is due soon. Open Bills to review the amount and repay on time.',
        time: '2 days ago',
        read: false
      },
      {
        id: 'security-tip',
        title: 'Security tip',
        body: 'SahodNow will never ask for your OTP or PIN by phone, SMS, or email.',
        time: 'Last week',
        read: true
      }
    ];
  },

  getMessages() {
    const readMap = this.get(this.KEYS.messagesRead) || {};
    return this.getDefaultMessages().map(msg => ({
      ...msg,
      read: Object.prototype.hasOwnProperty.call(readMap, msg.id) ? readMap[msg.id] : msg.read
    }));
  },

  getUnreadMessageCount() {
    return this.getMessages().filter(msg => !msg.read).length;
  },

  markMessageRead(id) {
    const readMap = this.get(this.KEYS.messagesRead) || {};
    readMap[id] = true;
    this.set(this.KEYS.messagesRead, readMap);
  },

  markAllMessagesRead() {
    const readMap = {};
    this.getDefaultMessages().forEach(msg => { readMap[msg.id] = true; });
    this.set(this.KEYS.messagesRead, readMap);
  },

  /** Drools: required | optional | none — 个人邮箱始终展示；企业邮箱仅 required 时展示 */
  getCorpEmailAuthMode() {
    const mode = this.get(this.KEYS.corpEmailAuth);
    if (mode === 'required' || mode === 'optional' || mode === 'none') return mode;
    return 'required';
  },

  LOAN_FLOW: {
    'listing-review': {
      title: 'Listing under review',
      desc: 'We\'re reviewing your loan application',
      href: 'listing-review.html',
      badge: 'In review',
      homeStatus: 'In review'
    },
    'disbursement-review': {
      title: 'Disbursement in progress',
      desc: 'Transferring funds to your payout account',
      href: 'disbursement-review.html',
      badge: 'Transferring',
      homeStatus: 'Disbursing'
    },
    'listing-rejected': {
      title: 'Unable to borrow',
      desc: 'We can\'t offer you a loan right now',
      href: 'listing-rejected.html',
      badge: 'Unavailable',
      homeStatus: 'Unable to borrow'
    },
    'disbursement-failed': {
      title: 'Disbursement failed',
      desc: 'Update your payout account and try again',
      href: 'disbursement-failed.html',
      badge: 'Action needed',
      homeStatus: 'Failed'
    }
  },

  get(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return localStorage.getItem(key); }
  },

  set(key, value) {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  },

  isLoggedIn() {
    return !!this.get(this.KEYS.user);
  },

  isPrivacyAccepted() {
    return this.get(this.KEYS.privacy) === true;
  },

  getUser() {
    return this.get(this.KEYS.user) || null;
  },

  login(user) {
    this.set(this.KEYS.user, user);
  },

  /** App entry after privacy consent — PRD: 启动 → 授权 → 游客首页 / 已登录首页 */
  routeEntry() {
    if (!this.isPrivacyAccepted()) return;
    if (!this.isLoggedIn()) {
      this.go('home-guest.html');
      return;
    }
    const kyc = this.get(this.KEYS.kycStep);
    if (kyc === 'reviewing') {
      this.go('home.html');
      return;
    }
    this.go('home.html');
  },

  /** After login / register — resume KYC or enter home */
  routeAfterAuth() {
    const kyc = this.get(this.KEYS.kycStep);
    if (!kyc) {
      this.go('kyc-basic.html');
      return;
    }
    if (kyc === 'reviewing') {
      this.go('home.html');
      return;
    }
    if (kyc === 'rejected') {
      this.go('home.html');
      return;
    }
    if (kyc === 'expired') {
      this.go('home.html');
      return;
    }
    if (kyc === 'approved') {
      this.go('home.html');
      return;
    }
    if (kyc === 'enhance') {
      this.go('kyc-enhance.html');
      return;
    }
    if (Auth.STEPS.includes(kyc)) {
      this.go('kyc-' + kyc + '.html');
      return;
    }
    this.go('kyc-basic.html');
  },

  isKycApproved() {
    return this.get(this.KEYS.kycStep) === 'approved';
  },

  isCreditExpired() {
    return this.get(this.KEYS.kycStep) === 'expired';
  },

  getCreditValidityMs() {
    return this.CREDIT_VALIDITY_DAYS * 86400000;
  },

  getCreditApprovedAt() {
    const ts = Number(this.get(this.KEYS.creditApprovedAt));
    return ts > 0 ? ts : null;
  },

  isCreditValidityElapsed() {
    const approvedAt = this.getCreditApprovedAt();
    if (!approvedAt) return false;
    return Date.now() - approvedAt >= this.getCreditValidityMs();
  },

  /** Demo: auto-expire approved limit after validity window */
  checkAndExpireCredit() {
    if (this.isCreditExpired()) return true;
    if (this.isKycApproved() && this.isCreditValidityElapsed()) {
      this.markCreditExpired();
      return true;
    }
    return false;
  },

  markCreditExpired() {
    if (this.getLoanFlowState()) return false;
    this.set(this.KEYS.kycStep, 'expired');
    this.set(this.KEYS.creditExpiredAt, Date.now());
    return true;
  },

  getExpiredLimitHeadline() {
    const cap = this.get(this.KEYS.creditTier) === 'premier' ? 50000 : 10000;
    return `Up to ${this.formatPHP(cap)}`;
  },

  startCreditReassessment() {
    if (!this.isCreditExpired()) return false;
    localStorage.removeItem(this.KEYS.creditExpiredAt);
    this.set(this.KEYS.kycStep, 'reviewing');
    this.startCreditReview();
    this.go('review.html');
    return true;
  },

  requireApproved() {
    if (!this.requireAuth()) return false;
    if (this.isKycApproved()) return true;
    this.routeAfterAuth();
    return false;
  },

  /** Home borrow CTA — PRD: 首页 borrow → 预检(原型跳过) → 发标页；进行中则进状态页 */
  startBorrow() {
    if (!this.requireApproved()) return;
    const flow = this.getLoanFlowState();
    if (flow && this.LOAN_FLOW[flow]) {
      this.go(this.LOAN_FLOW[flow].href);
      return;
    }
    this.go(this.isPremier() ? 'order-premium.html' : 'order.html');
  },

  exitBorrow() {
    this.clearLoanFlowState();
    this.go('home.html');
  },

  /** Prototype only — load a demo session without polluting normal flow */
  bootstrapDemoSession() {
    if (!this.isLoggedIn()) {
      this.login({ name: 'Juan', phone: '+63' + Auth.DEMO_REGISTERED });
      Auth.markRegistered(Auth.DEMO_REGISTERED);
    }
    // 兜底：历史 localStorage 可能残留旧额度（比如 50,000），统一压到当前产品的 10,000
    const stored = Number(this.get(this.KEYS.creditLimit)) || 0;
    if (!stored || stored > 10000) this.setCreditLimit(10000);
    if (!this.get(this.KEYS.kycStep)) this.set(this.KEYS.kycStep, 'approved');
    if (this.isKycApproved() && !this.isPayoutBound()) {
      this.setPayoutAccount({ type: 'ewallet', provider: 'GCash', accountNo: '09123454521' });
    }

    // Bills demo: seed two active installment loans for current statement (₱1,000 + ₱800).
    // Can be disabled by "reset approved, no loans".
    const seedBills = this.get(this.KEYS.demoSeedBills) !== false;
    const loans = this.getLoans();
    if (seedBills && !loans.length) {
      const now = Date.now();
      const appliedAt = now - 14 * 86400000;
      const disbursedAt = now - 13 * 86400000;
      // monthlyPayment = round(principal/term + principal*0.02)
      // term=5 → principal ~4545 gives 1000; principal ~3636 gives 800
      this.addLoan({ amount: 4545, termMonths: 5, appliedAt, disbursedAt });
      this.addLoan({ amount: 3636, termMonths: 5, appliedAt: appliedAt - 2 * 86400000, disbursedAt: disbursedAt - 2 * 86400000 });
    }
  },

  applyHomePrototypeState(stateId) {
    if (stateId === 'guest') {
      this.go('home-guest.html');
      return;
    }
    this.bootstrapDemoSession();
    // Home demo entry point: ensure bills demo data is enabled.
    if (this.get(this.KEYS.demoSeedBills) == null) this.set(this.KEYS.demoSeedBills, true);
    if (stateId === 'kyc') {
      this.set(this.KEYS.kycStep, 'basic');
      this.clearLoanFlowState();
      return;
    }
    if (stateId === 'reviewing') {
      this.set(this.KEYS.kycStep, 'reviewing');
      this.clearPayoutAccount();
      this.clearLoanFlowState();
      this.startCreditReview();
      localStorage.removeItem(this.KEYS.creditRejectedAt);
      return;
    }
    if (stateId === 'credit-rejected') {
      this.set(this.KEYS.kycStep, 'rejected');
      this.setCreditLimit(0);
      this.clearPayoutAccount();
      this.clearLoanFlowState();
      localStorage.removeItem(this.KEYS.reviewStartedAt);
      localStorage.removeItem(this.KEYS.creditApprovedAt);
      localStorage.removeItem(this.KEYS.creditExpiredAt);
      this.set(this.KEYS.creditRejectedAt, Date.now());
      this.set(this.KEYS.creditRejectReason, this.DEFAULT_REJECT_REASON);
      this.set(this.KEYS.creditRejectCooldownDays, this.DEFAULT_REJECT_COOLDOWN_DAYS);
      return;
    }
    if (stateId === 'credit-expired') {
      this.set(this.KEYS.kycStep, 'expired');
      this.set(this.KEYS.creditExpiredAt, Date.now());
      this.setCreditLimit(10000);
      this.set(this.KEYS.creditTier, 'standard');
      this.set(this.KEYS.creditApprovedAt, Date.now() - (this.CREDIT_VALIDITY_DAYS + 1) * 86400000);
      this.clearLoanFlowState();
      localStorage.removeItem(this.KEYS.reviewStartedAt);
      return;
    }
    this.set(this.KEYS.kycStep, 'approved');
    if (stateId === 'approved') {
      this.clearLoanFlowState();
      return;
    }
    const demoAmount = 5000;
    this.set(this.KEYS.loanAmount, demoAmount);
    if (!this.getPayoutDisplay() && this.isPayoutBound()) this.setPayoutDisplay('GCash ·••• 4521');
    if (['listing-review', 'disbursement-review', 'disbursement-failed'].includes(stateId)) {
      this.setLoanFlowState(stateId);
    }
    if (stateId === 'listing-rejected') {
      this.markListingRejected();
    }
  },

  /** Resolve switcher highlight from session (home.html only) */
  getHomePrototypeSwitcherId() {
    if (!this.isLoggedIn()) return 'guest';
    const kyc = this.get(this.KEYS.kycStep);
    if (kyc === 'reviewing') return 'reviewing';
    if (kyc === 'rejected') return 'credit-rejected';
    if (kyc === 'expired') return 'credit-expired';
    if (kyc !== 'approved') return 'kyc';
    const flow = this.getLoanFlowState();
    if (flow && this.LOAN_FLOW[flow]) return flow;
    return 'approved';
  },

  logout() {
    Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
  },

  isPremier() {
    return this.get(this.KEYS.creditTier) === 'premier';
  },

  getCreditLimit() {
    const raw = Number(this.get(this.KEYS.creditLimit)) || 0;
    const cap = this.isPremier() ? 50000 : 10000;
    return Math.min(raw || cap, cap);
  },

  getCreditTierLabel() {
    return this.isPremier() ? 'Premier' : 'Standard';
  },

  getUsedCredit() {
    // Used credit = sum of active loan principals (prototype rule).
    const loans = this.getLoans().filter(l => l.status === 'active');
    return loans.reduce((s, l) => s + (Number(l.principal) || 0), 0);
  },

  getAvailableCredit() {
    return Math.max(0, this.getCreditLimit() - this.getUsedCredit());
  },

  setCreditLimit(limit) {
    this.set(this.KEYS.creditLimit, limit);
  },

  startCreditReview() {
    this.set(this.KEYS.reviewStartedAt, Date.now());
  },

  ensureCreditReviewStarted() {
    if (this.get(this.KEYS.kycStep) === 'reviewing' && !this.getReviewStartedAt()) {
      this.startCreditReview();
    }
  },

  getReviewStartedAt() {
    const ts = Number(this.get(this.KEYS.reviewStartedAt));
    return ts > 0 ? ts : null;
  },

  getCreditReviewElapsedMs() {
    const started = this.getReviewStartedAt();
    if (!started) return 0;
    return Date.now() - started;
  },

  getCreditReviewCountdownRemainingMs() {
    const started = this.getReviewStartedAt();
    if (!started) return this.REVIEW_COUNTDOWN_MS;
    return Math.max(0, this.REVIEW_COUNTDOWN_MS - this.getCreditReviewElapsedMs());
  },

  getCreditReviewCountdownRemainingSec() {
    return Math.ceil(this.getCreditReviewCountdownRemainingMs() / 1000);
  },

  isCreditReviewCountdownDone() {
    return this.getCreditReviewCountdownRemainingMs() <= 0;
  },

  isCreditReviewWaitingLong() {
    return this.get(this.KEYS.kycStep) === 'reviewing' && this.isCreditReviewCountdownDone();
  },

  completeCreditReview(tier = 'standard') {
    if (this.isKycApproved()) return true;
    const isPremier = tier === 'premier';
    this.set(this.KEYS.creditTier, isPremier ? 'premier' : 'standard');
    this.setCreditLimit(isPremier ? 50000 : 10000);
    this.set(this.KEYS.kycStep, 'approved');
    this.set(this.KEYS.creditApprovedAt, Date.now());
    localStorage.removeItem(this.KEYS.reviewStartedAt);
    localStorage.removeItem(this.KEYS.creditRejectedAt);
    localStorage.removeItem(this.KEYS.creditRejectReason);
    localStorage.removeItem(this.KEYS.creditExpiredAt);
    return true;
  },

  rejectCreditReview(reason, cooldownDays = this.DEFAULT_REJECT_COOLDOWN_DAYS) {
    this.set(this.KEYS.kycStep, 'rejected');
    this.setCreditLimit(0);
    this.set(this.KEYS.creditRejectedAt, Date.now());
    this.set(this.KEYS.creditRejectReason, reason || this.DEFAULT_REJECT_REASON);
    this.set(this.KEYS.creditRejectCooldownDays, Number(cooldownDays) || this.DEFAULT_REJECT_COOLDOWN_DAYS);
    localStorage.removeItem(this.KEYS.reviewStartedAt);
    localStorage.removeItem(this.KEYS.creditTier);
  },

  getCreditRejectMeta() {
    const reviewedAt = Number(this.get(this.KEYS.creditRejectedAt)) || Date.now();
    const cooldownDays = Number(this.get(this.KEYS.creditRejectCooldownDays)) || this.DEFAULT_REJECT_COOLDOWN_DAYS;
    const reapplyAt = reviewedAt + cooldownDays * 86400000;
    return {
      reviewedAt,
      cooldownDays,
      reapplyAt,
      reason: this.get(this.KEYS.creditRejectReason) || this.DEFAULT_REJECT_REASON,
      canReapply: Date.now() >= reapplyAt
    };
  },

  formatCreditDate(ts) {
    return new Date(ts).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  formatCreditReapplyLabel(meta) {
    const m = meta || this.getCreditRejectMeta();
    if (m.canReapply) return 'You can apply again now';
    return `Reapply after ${this.formatCreditDate(m.reapplyAt)}`;
  },

  canReapplyCredit() {
    if (this.get(this.KEYS.kycStep) !== 'rejected') return false;
    return this.getCreditRejectMeta().canReapply;
  },

  reapplyCredit() {
    if (!this.canReapplyCredit()) return false;
    localStorage.removeItem(this.KEYS.creditRejectedAt);
    localStorage.removeItem(this.KEYS.creditRejectReason);
    localStorage.removeItem(this.KEYS.creditRejectCooldownDays);
    this.set(this.KEYS.kycStep, 'enhance');
    this.go('kyc-enhance.html');
    return true;
  },

  formatReviewCountdown(sec) {
    return sec > 0 ? `${sec}s` : '';
  },

  /** 10s countdown only — does not auto-approve */
  bindCreditReviewCountdown({ el, onCountdownEnd } = {}) {
    this.ensureCreditReviewStarted();
    if (this.get(this.KEYS.kycStep) !== 'reviewing') {
      if (el) el.textContent = '';
      return () => {};
    }
    const tick = () => {
      const sec = this.getCreditReviewCountdownRemainingSec();
      if (el) {
        el.textContent = sec > 0 ? this.formatReviewCountdown(sec) : '';
      }
      if (sec <= 0) {
        clearInterval(timer);
        onCountdownEnd?.();
      }
    };
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  },

  /** Prototype: deliver result after countdown + optional hourglass wait */
  scheduleCreditReviewResult(tier = 'standard', delayMs = this.REVIEW_RESULT_DELAY_MS) {
    return setTimeout(() => {
      if (this.get(this.KEYS.kycStep) !== 'reviewing') return;
      this.completeCreditReview(tier);
    }, delayMs);
  },

  /** Reset to: approved, has limit, no loans (keep logged-in demo user). */
  resetApprovedNoLoans() {
    this.demoApprovedNoLoan();
  },

  /** Profile demo — wipe all prototype session data */
  resetAllDemoData() {
    this.logout();
    localStorage.removeItem('ph_registered_phones');
    localStorage.removeItem('ph_account_tier');
    this.go('index.html');
  },

  /** Profile demo — logged in, registered, KYC not started */
  demoRegisterNoKyc() {
    this.set(this.KEYS.privacy, true);
    this.login({ name: 'Juan', phone: '+63' + Auth.DEMO_REGISTERED });
    Auth.markRegistered(Auth.DEMO_REGISTERED);
    this.set(this.KEYS.kycStep, 'basic');
    this.set(this.KEYS.demoSeedBills, false);
    this.setCreditLimit(10000);
    this.clearPayoutAccount();
    this.clearLoanFlowState();
    this.setLoans([]);
    this.set(this.KEYS.hasLoan, false);
    this.set(this.KEYS.loanAmount, 0);
    this.set(this.KEYS.loanAppliedAt, 0);
    localStorage.removeItem(this.KEYS.reviewStartedAt);
    this.go('home.html');
  },

  /** Profile demo — credit approved, no active loan */
  demoApprovedNoLoan() {
    if (!this.isLoggedIn()) {
      this.login({ name: 'Juan', phone: '+63' + Auth.DEMO_REGISTERED });
      Auth.markRegistered(Auth.DEMO_REGISTERED);
    }
    this.set(this.KEYS.demoSeedBills, false);
    this.set(this.KEYS.kycStep, 'approved');
    this.set(this.KEYS.creditTier, 'standard');
    this.setCreditLimit(10000);
    this.setPayoutAccount({ type: 'ewallet', provider: 'GCash', accountNo: '09123454521' });
    this.clearLoanFlowState();
    this.setLoans([]);
    this.set(this.KEYS.hasLoan, false);
    this.set(this.KEYS.loanAmount, 0);
    this.set(this.KEYS.loanAppliedAt, 0);
    localStorage.removeItem(this.KEYS.reviewStartedAt);
  },

  /** Profile demo — approved with one disbursed loan */
  demoFirstLoan() {
    if (!this.isLoggedIn()) {
      this.login({ name: 'Juan', phone: '+63' + Auth.DEMO_REGISTERED });
      Auth.markRegistered(Auth.DEMO_REGISTERED);
    }
    this.set(this.KEYS.demoSeedBills, false);
    this.set(this.KEYS.kycStep, 'approved');
    this.set(this.KEYS.creditTier, 'standard');
    this.setCreditLimit(10000);
    this.setPayoutAccount({ type: 'ewallet', provider: 'GCash', accountNo: '09123454521' });
    this.clearLoanFlowState();
    this.setLoans([]);
    const now = Date.now();
    this.addLoan({
      amount: 5000,
      termMonths: 3,
      appliedAt: now - 14 * 86400000,
      disbursedAt: now - 13 * 86400000
    });
    this.set(this.KEYS.hasLoan, true);
    this.set(this.KEYS.loanAmount, 5000);
    localStorage.removeItem(this.KEYS.reviewStartedAt);
    this.go('home.html');
  },

  formatPHP(amount) {
    return '₱' + Number(amount).toLocaleString('en-PH');
  },

  /** Standard date: MM/DD/YYYY */
  formatDateMDY(input) {
    const d = input instanceof Date ? input : new Date(input);
    if (Number.isNaN(d.getTime())) return '—';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${mm}/${dd}/${d.getFullYear()}`;
  },

  formatDateTime(ts) {
    const t = Number(ts);
    if (!t) return '—';
    const d = new Date(t);
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${this.formatDateMDY(d)}, ${time}`;
  },

  formatDate(ts) {
    const t = Number(ts);
    if (!t) return '—';
    return this.formatDateMDY(new Date(t));
  },

  go(page) {
    window.location.href = page;
  },

  getEnhanceItems() {
    return this.get(this.KEYS.enhanceItems) || {};
  },

  setEnhanceItem(key, patch) {
    const items = this.getEnhanceItems();
    items[key] = { ...(items[key] || {}), ...patch, updatedAt: Date.now() };
    this.set(this.KEYS.enhanceItems, items);
    return items[key];
  },

  isEnhanceItemDone(key) {
    return !!(this.getEnhanceItems()[key] && this.getEnhanceItems()[key].done);
  },

  clearEnhanceItems() {
    localStorage.removeItem(this.KEYS.enhanceItems);
  },

  back() {
    history.back();
  },

  requirePrivacy() {
    if (!this.isPrivacyAccepted()) {
      this.go('index.html');
      return false;
    }
    return true;
  },

  requireAuth(redirectGuest = 'home-guest.html') {
    if (!this.isLoggedIn()) {
      this.go(redirectGuest);
      return false;
    }
    return true;
  },

  renderBottomNav(active, guest = false) {
    const pages = [
      { id: 'home', label: 'Home', href: guest ? 'home-guest.html' : 'home.html', icon: '<path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.5z" stroke="currentColor" stroke-width="1.5" fill="none"/>' },
      { id: 'bill', label: 'Bills', href: 'bill.html', icon: '<rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M7 9h10M7 13h6" stroke="currentColor" stroke-width="1.5"/>' },
      { id: 'profile', label: 'Profile', href: 'profile.html', icon: '<circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" stroke="currentColor" stroke-width="1.5" fill="none"/>' }
    ];
    return `<nav class="bottom-nav">${pages.map(p => `
      <a href="${p.href}" class="nav-item${active === p.id ? ' active' : ''}">
        <svg viewBox="0 0 24 24">${p.icon}</svg>
        ${p.label}
      </a>`).join('')}</nav>`;
  },

  initNav(active) {
    const el = document.getElementById('bottom-nav');
    if (el) el.innerHTML = this.renderBottomNav(active, false);
  },

  initGuestNav(active) {
    const el = document.getElementById('bottom-nav');
    if (el) el.innerHTML = this.renderBottomNav(active, true);
  },

  bindGuestLoginGate(container) {
    if (!container) return;
    container.addEventListener('click', e => {
      if (e.target.closest('[data-guest-allow]') || e.target.closest('.tab-item')) return;
      e.preventDefault();
      e.stopPropagation();
      this.go('login.html');
    }, true);
  },

  ICONS: {
    support: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2a8 8 0 00-8 8v3a3 3 0 003 3h1.5v-3H7a5 5 0 0110 0v3h1.5a3 3 0 003-3v-3a8 8 0 00-8-8z" stroke="currentColor" stroke-width="1.5"/><path d="M9 19h6M10 22h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    messages: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5h16a2 2 0 012 2v9a2 2 0 01-2 2H8l-4 3v-3H4a2 2 0 01-2-2V7a2 2 0 012-2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>'
  },

  initHomeHeaderActions({ guest = false, unread, from = 'home' } = {}) {
    const el = document.getElementById('header-actions');
    if (!el) return;

    const hasUnread = typeof unread === 'boolean' ? unread : (!guest && this.getUnreadMessageCount() > 0);

    el.innerHTML = `
      <button type="button" class="header-icon-btn" id="btn-support" aria-label="Customer support">${this.ICONS.support}</button>
      <button type="button" class="header-icon-btn" id="btn-messages" aria-label="Messages">
        ${this.ICONS.messages}
        ${hasUnread ? '<span class="header-icon-badge" aria-hidden="true"></span>' : ''}
      </button>`;

    const onAction = guest
      ? () => this.go('login.html')
      : (type) => {
          if (type === 'support') this.go(`support.html?from=${encodeURIComponent(from)}`);
          else this.go(`messages.html?from=${encodeURIComponent(from)}`);
        };

    document.getElementById('btn-support').addEventListener('click', () => onAction('support'));
    document.getElementById('btn-messages').addEventListener('click', () => onAction('messages'));
  },

  showOverlay(id) {
    document.getElementById(id)?.classList.add('show');
  },

  hideOverlay(id) {
    document.getElementById(id)?.classList.remove('show');
  },

  calcRepaymentPlan(principal, months, rate = 0.02) {
    const monthlyRate = rate;
    const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    const plan = [];
    let balance = principal;
    const today = new Date();
    for (let i = 1; i <= months; i++) {
      const interest = balance * monthlyRate;
      const principalPart = payment - interest;
      balance -= principalPart;
      const due = new Date(today);
      due.setMonth(due.getMonth() + i);
      plan.push({
        period: i,
        dueDate: this.formatDateMDY(due),
        payment: Math.round(payment),
        principal: Math.round(principalPart),
        interest: Math.round(interest)
      });
    }
    return plan;
  },

  makeLoanId(ts = Date.now()) {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const rnd = String(Math.floor(Math.random() * 900) + 100);
    return `KM${y}${m}${day}${rnd}`;
  },

  getLoans() {
    return this.get(this.KEYS.loans) || [];
  },

  setLoans(loans) {
    this.set(this.KEYS.loans, loans || []);
  },

  /**
   * 新增一笔借款订单（原型）：
   * - 固定账单日：每月 20 号
   * - 多笔借款叠加：同一个账单日会有多笔首期/当期
   */
  addLoan({ amount, payoutDisplay, appliedAt, disbursedAt, termMonths = 3 } = {}) {
    const principal = Number(amount) || 0;
    if (!principal) return null;
    const now = Date.now();
    const aAt = Number(appliedAt) || now;
    const dAt = Number(disbursedAt) || now;
    const months = Math.max(1, Number(termMonths) || 3);

    // 简化试算：每期 = 等额本金 + 固定月息（原型展示用）
    const monthly = Math.round(principal / months + principal * 0.02);
    const loan = {
      id: this.makeLoanId(dAt),
      principal,
      termMonths: months,
      monthlyPayment: monthly,
      payoutDisplay: payoutDisplay || this.getPayoutDisplay(),
      appliedAt: aAt,
      disbursedAt: dAt,
      status: 'active', // active | settled
      paidPeriods: 0
    };

    const loans = this.getLoans();
    loans.unshift(loan);
    this.setLoans(loans);
    this.set(this.KEYS.hasLoan, true);
    return loan;
  },

  getLoanById(id) {
    return this.getLoans().find(l => l.id === id) || null;
  },

  getLoanCurrentPeriod(loan) {
    if (!loan || loan.status === 'settled') return 0;
    return Math.min((loan.paidPeriods || 0) + 1, loan.termMonths);
  },

  getLoanRemainingPeriods(loan) {
    if (!loan || loan.status === 'settled') return 0;
    return Math.max(0, loan.termMonths - (loan.paidPeriods || 0));
  },

  getLoanRemainingAmount(loan) {
    return this.getLoanRemainingPeriods(loan) * (loan?.monthlyPayment || 0);
  },

  /** Fixed billing day for prototype (matches bill hub); loan may override via fixedDueDay. */
  getLoanFixedDueDay(loan) {
    const day = Number(loan?.fixedDueDay);
    return day >= 1 && day <= 31 ? day : 20;
  },

  /**
   * First installment due date from disbursement (PRD: 10–40 day first period;
   * roll forward if &lt; 10 days to next cycle).
   */
  getFirstInstallmentDueDate(disbursedAt, dueDay = 20) {
    const disb = new Date(disbursedAt);
    disb.setHours(0, 0, 0, 0);
    let due = this.getNextBillDate(disb, dueDay);
    let days = Math.max(0, Math.round((due - disb) / 86400000));
    if (days < 10) {
      due = new Date(due.getFullYear(), due.getMonth() + 1, dueDay);
      days = Math.max(0, Math.round((due - disb) / 86400000));
    }
    return { dueDate: due, daysInPeriod: days };
  },

  formatInstallmentTerm(loan) {
    const n = loan?.termMonths || 0;
    if (!n) return '—';
    return `${n} installment${n === 1 ? '' : 's'}`;
  },

  getLoanSchedule(loan) {
    if (!loan) return [];
    const installments = loan.termMonths;
    const dueDay = this.getLoanFixedDueDay(loan);
    const { dueDate: firstDue, daysInPeriod: firstDays } = this.getFirstInstallmentDueDate(loan.disbursedAt, dueDay);
    const eqPrincipal = Math.floor(loan.principal / installments);
    const rows = [];
    for (let i = 0; i < installments; i++) {
      const d = i === 0
        ? new Date(firstDue)
        : new Date(firstDue.getFullYear(), firstDue.getMonth() + i, firstDue.getDate());
      const principalPart = i === installments - 1
        ? loan.principal - eqPrincipal * (installments - 1)
        : eqPrincipal;
      const interestFees = loan.monthlyPayment - principalPart;
      rows.push({
        period: i + 1,
        dueDate: d,
        dueLabel: this.formatDueDate(d),
        dueShort: this.formatDueShort(d),
        daysInPeriod: i === 0 ? firstDays : null,
        amount: loan.monthlyPayment,
        payment: loan.monthlyPayment,
        principal: principalPart,
        interestFees,
        paid: i < (loan.paidPeriods || 0)
      });
    }
    return rows;
  },

  formatDueDate(date) {
    return this.formatDateMDY(date);
  },

  formatDueShort(date) {
    return this.formatDateMDY(date);
  },

  /** Vertical repayment timeline — shared by order preview & loan detail */
  renderRepayTimeline(items, opts = {}) {
    const currentPeriod = opts.currentPeriod ?? null;
    const allPaid = !!opts.allPaid;
    if (!items?.length) return '';

    return `<div class="repay-timeline" role="list">${items.map((it, idx) => {
      let state = it.state || 'upcoming';
      if (allPaid || it.paid) state = 'paid';
      else if (state === 'upcoming' && currentPeriod != null && it.period === currentPeriod) state = 'current';
      else if (state === 'upcoming' && currentPeriod == null && idx === 0) state = 'current';

      const amount = it.payment ?? it.amount ?? 0;
      const principal = it.principal ?? 0;
      const interestFees = it.interestFees ?? ((it.interest || 0) + (it.fee || 0));
      const dueShort = it.dueShort || it.dueLabel || '—';
      const dueMeta = it.daysInPeriod != null
        ? `${dueShort} <span class="repay-timeline-days">(${it.daysInPeriod} days)</span>`
        : dueShort;
      const tag = state === 'paid' ? 'Paid' : 'Amount due';
      const amt = this.formatPHP(amount);
      const breakdown = `Principal ${this.formatPHP(principal)} + Int. & fees ${this.formatPHP(interestFees)}`;

      return `
        <div class="repay-timeline-item repay-timeline-item--${state}" role="listitem">
          <div class="repay-timeline-left">
            <span class="repay-timeline-inst">Inst. ${it.period}</span>
            <span class="repay-timeline-date">${dueMeta}</span>
          </div>
          <div class="repay-timeline-rail" aria-hidden="true">
            <span class="repay-timeline-dot"></span>
          </div>
          <div class="repay-timeline-right">
            <p class="repay-timeline-amount-line">
              <span class="repay-timeline-tag">${tag}</span>
              <span class="repay-timeline-amount">${amt}</span>
            </p>
            <p class="repay-timeline-breakdown">${breakdown}</p>
          </div>
        </div>`;
    }).join('')}</div>`;
  },

  settleLoan(id) {
    const loans = this.getLoans();
    const now = Date.now();
    const next = loans.map(l => (l.id === id ? { ...l, status: 'settled', settledAt: now } : l));
    this.setLoans(next);
  },

  /** Prototype: mark installments in one billing cycle as paid. */
  payCurrentStatement(now = new Date(), dueKey = null) {
    const priority = this.getPriorityBill(now);
    if (!priority) return;
    const key = dueKey || priority.dueKey;
    const cycles = this.getPayableBillCycles(now);
    const cycle = dueKey
      ? cycles.find(c => c.dueKey === dueKey)
      : priority;
    if (!cycle) return;

    const payMap = new Map();
    cycle.items.forEach(it => {
      payMap.set(`${it.loanId}:${it.period}`, true);
    });

    const ts = Date.now();
    const next = this.getLoans().map(l => {
      if (l.status !== 'active') return l;
      const schedule = this.getLoanSchedule(l);
      let paid = l.paidPeriods || 0;
      schedule.forEach(row => {
        if (payMap.has(`${l.id}:${row.period}`) && row.period > paid) {
          paid = row.period;
        }
      });
      const isClosed = paid >= l.termMonths;
      return {
        ...l,
        paidPeriods: paid,
        status: isClosed ? 'settled' : 'active',
        settledAt: isClosed ? (l.settledAt || ts) : l.settledAt
      };
    });
    this.setLoans(next);
    this.recordPaidStatement(cycle);
  },

  formatDueKey(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  getBillReferenceDate() {
    const params = new URLSearchParams(location.search);
    if (params.get('state') === 'overdue') {
      const ref = new Date();
      ref.setHours(12, 0, 0, 0);
      if (ref.getDate() <= 20) ref.setMonth(ref.getMonth() - 1);
      ref.setDate(25);
      return ref;
    }
    return new Date();
  },

  /** All unpaid monthly billing cycles, earliest first. */
  getUnpaidBillCycles(now = new Date()) {
    const loans = this.getLoans().filter(l => l.status === 'active');
    const cycleMap = new Map();

    loans.forEach(loan => {
      this.getLoanSchedule(loan)
        .filter(row => !row.paid)
        .forEach(row => {
          const dueKey = this.formatDueKey(row.dueDate);
          if (!cycleMap.has(dueKey)) {
            cycleMap.set(dueKey, {
              dueKey,
              dueDate: new Date(row.dueDate),
              dueLabel: row.dueLabel,
              items: [],
              total: 0
            });
          }
          const cycle = cycleMap.get(dueKey);
          cycle.items.push({
            loanId: loan.id,
            period: row.period,
            termMonths: loan.termMonths,
            amount: row.amount,
            principal: loan.principal,
            remainingPeriods: this.getLoanRemainingPeriods(loan),
            appliedAt: loan.appliedAt,
            disbursedAt: loan.disbursedAt,
            payoutDisplay: loan.payoutDisplay
          });
          cycle.total += row.amount;
        });
    });

    return [...cycleMap.values()].sort((a, b) => a.dueDate - b.dueDate);
  },

  /** Demo: stack a prior overdue cycle when ?state=overdue. */
  maybeInjectOverdueDemoStack(cycles) {
    if (typeof location === 'undefined') return cycles;
    if (new URLSearchParams(location.search).get('state') !== 'overdue') return cycles;
    if (!cycles.length) return cycles;
    if (cycles.length >= 2) return cycles.slice(0, 2);
    const prev = new Date(cycles[0].dueDate);
    prev.setMonth(prev.getMonth() - 1);
    const prevKey = this.formatDueKey(prev);
    if (cycles.some(c => c.dueKey === prevKey)) return cycles.slice(0, 2);
    return [{
      dueKey: prevKey,
      dueDate: prev,
      dueLabel: this.formatDueDate(prev),
      items: cycles[0].items.map(it => ({ ...it })),
      total: cycles[0].total
    }, ...cycles].slice(0, 2);
  },

  /**
   * Currently payable billing periods (not future installments).
   * Product: bills are issued by period — if the 2nd period bill is out, the 1st is already overdue.
   * Prototype: Normal → 1 due bill; Overdue → 2 due bills.
   */
  getPayableBillCycles(now = new Date()) {
    const all = this.getUnpaidBillCycles(now);
    if (!all.length) return [];

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const dueOrPast = all.filter(c => {
      const d = new Date(c.dueDate);
      d.setHours(0, 0, 0, 0);
      return d <= today;
    });

    const isOverdueView = typeof location !== 'undefined'
      && new URLSearchParams(location.search).get('state') === 'overdue';

    if (isOverdueView) {
      const base = dueOrPast.length ? dueOrPast : all.slice(0, 1);
      return this.maybeInjectOverdueDemoStack(base);
    }

    // Normal: only the current statement (1 bill)
    return (dueOrPast.length ? dueOrPast : all.slice(0, 1)).slice(0, 1);
  },

  /** Earliest unpaid cycle — shown on Bills home. */
  getPriorityBill(now = new Date()) {
    const cycles = this.getPayableBillCycles(now);
    if (!cycles.length) return null;

    const priority = cycles[0];
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const due = new Date(priority.dueDate);
    due.setHours(0, 0, 0, 0);
    const overdueDays = today > due ? Math.floor((today - due) / 86400000) : 0;
    const principalBase = priority.items.reduce((s, it) => s + (Number(it.principal) || 0), 0);

    return {
      ...priority,
      isOverdue: overdueDays > 0,
      overdueDays,
      principalBase,
      otherDueCount: Math.max(0, cycles.length - 1),
      allDueCount: cycles.length
    };
  },

  getBillCycle(dueKey, now = new Date()) {
    return this.getPayableBillCycles(now).find(c => c.dueKey === dueKey) || null;
  },

  computeBillPenalty(baseDue, overdueDays, principalBase) {
    if (!overdueDays || overdueDays <= 0) {
      return { dailyPenalty: 0, penaltyAccrued: 0, totalDue: baseDue };
    }
    const dailyPenalty = Math.max(1, Math.round(baseDue * 0.0016));
    let penaltyAccrued = dailyPenalty * overdueDays;
    const monthlyCap = Math.round(baseDue * 0.05);
    penaltyAccrued = Math.min(penaltyAccrued, monthlyCap * Math.ceil(overdueDays / 30));
    penaltyAccrued = Math.min(penaltyAccrued, principalBase || baseDue);
    return {
      dailyPenalty,
      penaltyAccrued,
      totalDue: baseDue + penaltyAccrued
    };
  },

  getOverdueBillMeta(now = new Date(), { minOverdueDays = 1 } = {}) {
    const priority = this.getPriorityBill(now);
    if (!priority || !priority.isOverdue) return null;

    let overdueDays = priority.overdueDays;
    if (overdueDays < minOverdueDays) overdueDays = minOverdueDays;

    const penalty = this.computeBillPenalty(priority.total, overdueDays, priority.principalBase);
    return {
      ...priority,
      overdueDays,
      billDueDate: priority.dueDate,
      billDueLabel: priority.dueLabel,
      baseDue: priority.total,
      ...penalty,
      items: priority.items
    };
  },

  /** @deprecated use getPriorityBill */
  getCurrentDueBills(now = new Date()) {
    const bill = this.getPriorityBill(now);
    if (!bill) return { dueDate: null, dueLabel: '—', total: 0, items: [] };
    return {
      dueDate: bill.dueDate,
      dueLabel: bill.dueLabel,
      dueKey: bill.dueKey,
      total: bill.total,
      items: bill.items
    };
  },

  getNextBillDate(from = new Date(), dueDay = 20) {
    const d = new Date(from);
    const y = d.getFullYear();
    const m = d.getMonth();
    const thisMonthDue = new Date(y, m, dueDay);
    if (d <= thisMonthDue) return thisMonthDue;
    return new Date(y, m + 1, dueDay);
  },

  /** Paid monthly statements for history (from loan schedules + stored). */
  recordPaidStatement(cycle) {
    if (!cycle) return;
    const KEY = 'ph_monthly_statements';
    const list = this.get(KEY) || [];
    const monthKey = `${cycle.dueDate.getFullYear()}-${String(cycle.dueDate.getMonth() + 1).padStart(2, '0')}`;
    const lines = cycle.items.map(it => ({
      loanId: it.loanId,
      name: 'Installment loan',
      instText: `${it.period}/${it.termMonths}`,
      amount: it.amount,
      status: 'Paid'
    }));
    const entry = {
      monthKey,
      dueKey: cycle.dueKey,
      dueLabel: cycle.dueLabel,
      title: this.formatDueDate(cycle.dueDate),
      total: cycle.total,
      lines,
      paidAt: Date.now()
    };
    const idx = list.findIndex(s => s.dueKey === cycle.dueKey);
    if (idx >= 0) list[idx] = entry;
    else list.unshift(entry);
    this.set(KEY, list.slice(0, 24));
  },

  getStatementHistory() {
    const stored = this.get('ph_monthly_statements') || [];
    if (stored.length) return stored;

    const now = Date.now();
    const demo = [];
    for (let i = 1; i <= 4; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      d.setDate(20);
      const dueKey = this.formatDueKey(d);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      demo.push({
        monthKey,
        dueKey,
        dueLabel: this.formatDueDate(d),
        title: this.formatDueDate(d),
        total: i === 1 ? 1800 : 900,
        lines: [
          { loanId: 'KM20260101001', name: 'Installment loan', instText: `${5 - i + 1}/5`, amount: i === 1 ? 1000 : 900, status: 'Paid' },
          ...(i <= 2 ? [{ loanId: 'KM20260101002', name: 'Installment loan', instText: `${5 - i + 1}/5`, amount: 800, status: 'Paid' }] : [])
        ],
        paidAt: now - i * 30 * 86400000
      });
    }
    return demo;
  },

  /** 全部待还：所有活跃借款的剩余应还汇总 */
  getAllOutstanding() {
    const loans = this.getLoans().filter(l => l.status === 'active' && this.getLoanRemainingPeriods(l) > 0);
    const items = loans.map(l => {
      const schedule = this.getLoanSchedule(l);
      const next = schedule.find(r => !r.paid) || schedule[schedule.length - 1];
      return {
        loanId: l.id,
        principal: l.principal,
        remaining: this.getLoanRemainingAmount(l),
        remainingPeriods: this.getLoanRemainingPeriods(l),
        termMonths: l.termMonths,
        currentPeriod: this.getLoanCurrentPeriod(l),
        monthlyPayment: l.monthlyPayment,
        nextDueDate: next?.dueDate,
        nextDueLabel: next ? next.dueLabel : '—',
        payoutDisplay: l.payoutDisplay,
        appliedAt: l.appliedAt
      };
    });
    const total = items.reduce((s, it) => s + it.remaining, 0);
    return { total, items };
  },

  /** Bill sub-pages: loan row with due/outstanding amount, principal, remaining periods, borrow date */
  renderBillLoanRow(item, opts = {}) {
    const {
      amount = item.amount,
      amountLabel = 'Due',
      from = 'bill-current',
      statusText = '',
      statusClass = '',
      clickable = true
    } = opts;
    const remaining = item.remainingPeriods ?? item.remaining ?? 0;
    const term = item.termMonths || 0;
    const periodNote = remaining
      ? `${remaining} of ${term} installment${term === 1 ? '' : 's'} left`
      : `${term} installment${term === 1 ? '' : 's'}`;
    const statusHtml = statusText
      ? `<span class="status${statusClass ? ' ' + statusClass : ''}">${statusText}</span>`
      : '';
    const interactiveAttrs = clickable
      ? `role="button" tabindex="0"
        onclick="AppState.go('loan-detail.html?id=${encodeURIComponent(item.loanId)}&from=${from}')"
        onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();AppState.go('loan-detail.html?id=${encodeURIComponent(item.loanId)}&from=${from}')}"`
      : '';
    return `
      <div class="bill-order-card${clickable ? '' : ' bill-order-card--static'}" ${interactiveAttrs}>
        <div class="bill-order-head">
          <div>
            <p class="bill-order-id">${item.loanId}</p>
            <p class="bill-order-borrowed">${this.formatDate(item.appliedAt)}</p>
          </div>
          <div class="bill-order-amount-block">
            <p class="amount">${this.formatPHP(amount)}</p>
            <p class="bill-order-amount-label">${amountLabel}</p>
          </div>
        </div>
        <div class="bill-order-meta">
          <div class="bill-order-meta-item">
            <span class="text-muted">Principal</span>
            <span>${this.formatPHP(item.principal)}</span>
          </div>
          <div class="bill-order-meta-item">
            <span class="text-muted">Installments left</span>
            <span>${periodNote}</span>
          </div>
        </div>
        ${statusHtml}
      </div>`;
  },

  renderBillHistoryRow(loan) {
    const settledAt = loan.settledAt || loan.appliedAt;
    return `
      <div class="bill-order-card" role="button" tabindex="0"
        onclick="AppState.go('loan-detail.html?id=${encodeURIComponent(loan.id)}&from=bill-history')"
        onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();AppState.go('loan-detail.html?id=${encodeURIComponent(loan.id)}&from=bill-history')}">
        <div class="bill-order-head">
          <div>
            <p class="bill-order-id">${loan.id}</p>
            <p class="bill-order-borrowed">Closed ${this.formatDate(settledAt)}</p>
          </div>
          <div class="bill-order-amount-block">
            <p class="amount">${this.formatPHP(loan.principal)}</p>
            <p class="bill-order-amount-label">Principal</p>
          </div>
        </div>
        <div class="bill-order-meta">
          <div class="bill-order-meta-item">
            <span class="text-muted">Installment term</span>
            <span>${loan.termMonths} installment${loan.termMonths === 1 ? '' : 's'}</span>
          </div>
          <div class="bill-order-meta-item">
            <span class="text-muted">Disbursement date</span>
            <span>${this.formatDate(loan.disbursedAt || loan.appliedAt)}</span>
          </div>
        </div>
        <span class="status paid">Closed</span>
      </div>`;
  },

  renderBillHub({ mainEl, emptyEl, onRepay, referenceDate = new Date() }) {
    const now = referenceDate instanceof Date ? referenceDate : new Date();
    const priority = this.getPriorityBill(now);

    if (!priority || !priority.items.length) {
      if (emptyEl) {
        emptyEl.style.display = 'flex';
        const principal = 10000;
        const dailyInterest = (principal * 0.06 / 360).toFixed(2);
        emptyEl.innerHTML = `
          <div class="bill-empty-cluster">
            <div class="bill-empty-status">
              <span class="bill-empty-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="1.3" opacity=".45"/>
                  <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
              </span>
              <h3>No bills yet</h3>
              <p class="text-muted">Nothing due right now.</p>
            </div>
            <a class="bill-borrow-card" href="home.html">
              <div class="bill-borrow-body">
                <p class="bill-borrow-eyebrow">Low daily interest</p>
                <p class="bill-daily-rate">
                  <span class="bill-daily-from">from</span>
                  <span class="bill-daily-amount">${this.formatPHP(dailyInterest)}</span>
                  <span class="bill-daily-unit">/day</span>
                </p>
                <p class="bill-daily-sub">On ${this.formatPHP(principal)}</p>
              </div>
              <span class="bill-borrow-btn">Get money</span>
            </a>
          </div>`;
      }
      if (mainEl) mainEl.style.display = 'none';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    if (mainEl) mainEl.style.display = 'block';

    const overdue = priority.isOverdue;
    const penalty = overdue
      ? this.computeBillPenalty(priority.total, priority.overdueDays, priority.principalBase)
      : null;
    const displayTotal = overdue ? penalty.totalDue : priority.total;
    const itemCount = priority.items.length;
    const daysLabel = priority.overdueDays === 1 ? '1 day' : `${priority.overdueDays} days`;
    const detailsHref = `bill-current.html?due=${encodeURIComponent(priority.dueKey)}${overdue ? '&state=overdue' : ''}`;

    const overdueBanner = overdue ? `
      <div class="bill-overdue-banner" role="status">
        <span class="bill-overdue-banner__icon" aria-hidden="true">!</span>
        <div>
          <p class="bill-overdue-banner__title">You're ${daysLabel} overdue</p>
          <p class="bill-overdue-banner__sub">Due date was <strong>${priority.dueLabel}</strong>. Repay soon to stop penalty charges.</p>
        </div>
      </div>` : '';

    const heroClass = overdue ? 'bill-hero bill-hero--overdue' : 'bill-hero';
    const heroLabel = overdue ? 'Overdue amount' : `Due ${priority.dueLabel}`;
    const penaltyRows = overdue ? `
      <div class="bill-hero-penalty-row">
        <span>Bill <strong>${this.formatPHP(priority.total)}</strong></span>
        <span>Penalty <strong>${this.formatPHP(penalty.penaltyAccrued)}</strong></span>
      </div>
      <p class="bill-hero-penalty-row">
        <span>Penalty rate <strong>${this.formatPHP(penalty.dailyPenalty)}/day</strong></span>
      </p>
      <p class="bill-hero-reminder">Late fees accrue daily until paid.</p>` : '';

    const allDueLink = priority.allDueCount > 1 ? `
      <a class="bill-link-card bill-link-card--alert" href="bill-all-due.html${overdue ? '?state=overdue' : ''}" aria-label="All current due bills">
        <div class="bill-link-leading">
          <span class="bill-link-icon bill-link-icon--alert" aria-hidden="true">!</span>
          <div class="bill-link-text">
            <h3>All current due bills</h3>
            <p>${priority.allDueCount} billing period${priority.allDueCount === 1 ? '' : 's'} outstanding</p>
          </div>
        </div>
        <span class="bill-link-arrow">→</span>
      </a>` : '';

    const html = `
      ${overdueBanner}
      <div class="${heroClass}">
        <p class="bill-hero-label">${heroLabel}</p>
        <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;">
          <p class="bill-hero-amount" style="margin:0;">${this.formatPHP(displayTotal)}</p>
          <a href="${detailsHref}" class="bill-hero-details-link">
            Details <span aria-hidden="true">→</span>
          </a>
        </div>
        <p class="bill-hero-meta">${itemCount} installment${itemCount === 1 ? '' : 's'} from ${itemCount} loan${itemCount === 1 ? '' : 's'}</p>
        ${penaltyRows}
        <div class="bill-hero-actions">
          <button class="btn btn-consent" type="button" data-repay="${displayTotal}" data-due-key="${priority.dueKey}">
            ${overdue ? 'Repay now' : 'Repay'}
          </button>
        </div>
      </div>
      ${allDueLink}
      <a class="bill-link-card" href="bill-all.html" aria-label="Installment loans yep">
        <div class="bill-link-leading">
          <span class="bill-link-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M7 7h10M7 11h10M7 15h7" stroke="#141413" stroke-width="1.6" stroke-linecap="round"/>
              <path d="M6 3h9l3 3v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="#141413" stroke-width="1.2" opacity=".55"/>
            </svg>
          </span>
          <div class="bill-link-text">
            <h3>Installment loans yep</h3>
            <p>View all loans by order</p>
          </div>
        </div>
        <span class="bill-link-arrow">→</span>
      </a>
      <a class="bill-link-card" href="bill-history.html" aria-label="Statement history">
        <div class="bill-link-leading">
          <span class="bill-link-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 7v5l3 2" stroke="#141413" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 22a9 9 0 1 0-8.6-6.4" stroke="#141413" stroke-width="1.2" opacity=".55"/>
              <path d="M3 12v4h4" stroke="#141413" stroke-width="1.2" opacity=".55" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <div class="bill-link-text">
            <h3>Statement history</h3>
            <p>Past monthly statements</p>
          </div>
        </div>
        <span class="bill-link-arrow">→</span>
      </a>
      <div class="bill-safety-card" style="margin-top:4px;">
        <div class="bill-safety-row">
          <div class="bill-safety-illu" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4Z" stroke="#141413" stroke-width="1.3" opacity=".6"/>
              <path d="M9.5 12.2l1.7 1.8L14.8 10" stroke="#141413" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div>
            <p class="eyebrow" style="margin-bottom:8px;"><span class="dot">•</span> Security</p>
            <h3>Fraud alert</h3>
            <p>Never share your OTP or PIN. Repay only through SahodNow official channels.</p>
          </div>
        </div>
      </div>`;

    if (mainEl) {
      mainEl.innerHTML = html;
      mainEl.querySelector('[data-repay]')?.addEventListener('click', e => {
        const btn = e.currentTarget;
        onRepay?.(Number(btn.dataset.repay), btn.dataset.dueKey, now);
      });
    }
  },

  getLoanAmount() {
    const q = new URLSearchParams(location.search).get('amount');
    return Number(q) || Number(this.get(this.KEYS.loanAmount)) || 5000;
  },

  getPayoutDisplay() {
    const selected = this.getSelectedPayoutAccount();
    if (selected) return selected.display;
    if (!this.isPayoutBound()) return null;
    return this.get(this.KEYS.payoutDisplay) || 'GCash ·••• 4521';
  },

  formatPayoutDisplay({ provider, accountNo }) {
    const digits = String(accountNo || '').replace(/\D/g, '');
    const last4 = digits.slice(-4) || '0000';
    return `${provider} ·••• ${last4}`;
  },

  ensurePayoutAccountsMigrated() {
    let accounts = this.get(this.KEYS.payoutAccounts);
    if (Array.isArray(accounts) && accounts.length) return accounts;
    if (this.get(this.KEYS.payoutBound) === true || this.get(this.KEYS.payoutBound) === 'true') {
      const account = {
        id: 'p_legacy',
        type: this.get(this.KEYS.payoutType) || 'ewallet',
        provider: this.get(this.KEYS.payoutProvider) || 'GCash',
        accountNo: this.get(this.KEYS.payoutAccountNo) || '09123454521',
        holder: this.get('ph_payout_holder') || '',
        display: this.get(this.KEYS.payoutDisplay) || 'GCash ·••• 4521'
      };
      accounts = [account];
      this.set(this.KEYS.payoutAccounts, accounts);
      if (!this.get(this.KEYS.selectedPayoutId)) {
        this.set(this.KEYS.selectedPayoutId, account.id);
      }
      return accounts;
    }
    this.set(this.KEYS.payoutAccounts, []);
    return [];
  },

  getPayoutAccounts() {
    return this.ensurePayoutAccountsMigrated();
  },

  getSelectedPayoutId() {
    const accounts = this.getPayoutAccounts();
    const id = this.get(this.KEYS.selectedPayoutId);
    if (id && accounts.some(a => a.id === id)) return id;
    return accounts[0]?.id || null;
  },

  getSelectedPayoutAccount() {
    const id = this.getSelectedPayoutId();
    if (!id) return null;
    return this.getPayoutAccounts().find(a => a.id === id) || null;
  },

  setSelectedPayoutId(id) {
    this.set(this.KEYS.selectedPayoutId, id);
    const account = this.getPayoutAccounts().find(a => a.id === id);
    if (account) this.syncLegacyPayoutKeys(account);
  },

  syncLegacyPayoutKeys(account) {
    if (!account) return;
    this.set(this.KEYS.payoutDisplay, account.display);
    this.set(this.KEYS.payoutType, account.type);
    this.set(this.KEYS.payoutProvider, account.provider);
    this.set(this.KEYS.payoutAccountNo, account.accountNo);
    this.set(this.KEYS.payoutBound, true);
    if (account.holder) this.set('ph_payout_holder', account.holder);
  },

  isPayoutBound() {
    return this.getPayoutAccounts().length > 0;
  },

  needsPayoutLivenessForAdd() {
    return this.getPayoutAccounts().length > 0;
  },

  isPayoutAddVerified() {
    return this.get(this.KEYS.payoutAddVerified) === true;
  },

  setPayoutAddVerified(value = true) {
    this.set(this.KEYS.payoutAddVerified, !!value);
  },

  clearPayoutAddVerified() {
    localStorage.removeItem(this.KEYS.payoutAddVerified);
  },

  clearPayoutAccount() {
    localStorage.removeItem(this.KEYS.payoutDisplay);
    localStorage.removeItem(this.KEYS.payoutType);
    localStorage.removeItem(this.KEYS.payoutProvider);
    localStorage.removeItem(this.KEYS.payoutBound);
    localStorage.removeItem(this.KEYS.payoutAccountNo);
    localStorage.removeItem(this.KEYS.payoutAccounts);
    localStorage.removeItem(this.KEYS.selectedPayoutId);
    localStorage.removeItem(this.KEYS.payoutPendingChange);
    localStorage.removeItem(this.KEYS.payoutAddVerified);
  },

  getPayoutAccountNo() {
    return this.getSelectedPayoutAccount()?.accountNo || this.get(this.KEYS.payoutAccountNo) || '';
  },

  setPayoutPendingChange(payload) {
    this.set(this.KEYS.payoutPendingChange, payload);
  },

  getPayoutPendingChange() {
    return this.get(this.KEYS.payoutPendingChange) || null;
  },

  clearPayoutPendingChange() {
    localStorage.removeItem(this.KEYS.payoutPendingChange);
  },

  applyPayoutPendingChange() {
    const pending = this.getPayoutPendingChange();
    if (!pending) return false;
    this.addPayoutAccount(pending, { select: true });
    this.clearPayoutPendingChange();
    return true;
  },

  getPayoutMeta() {
    const account = this.getSelectedPayoutAccount();
    if (account) {
      return { type: account.type, provider: account.provider, display: account.display };
    }
    return {
      type: this.get(this.KEYS.payoutType) || 'ewallet',
      provider: this.get(this.KEYS.payoutProvider) || 'GCash',
      display: this.getPayoutDisplay()
    };
  },

  addPayoutAccount({ type, provider, accountNo, holder }, { select = true } = {}) {
    const digits = String(accountNo || '').replace(/\D/g, '');
    if (!digits || !provider) return null;
    const accounts = this.getPayoutAccounts();
    const account = {
      id: `p_${Date.now()}`,
      type,
      provider,
      accountNo: digits,
      holder: holder || '',
      display: this.formatPayoutDisplay({ provider, accountNo: digits })
    };
    accounts.push(account);
    this.set(this.KEYS.payoutAccounts, accounts);
    if (select) this.setSelectedPayoutId(account.id);
    else this.syncLegacyPayoutKeys(this.getSelectedPayoutAccount() || account);
    return account;
  },

  setPayoutAccount(payload) {
    return this.addPayoutAccount(payload, { select: true });
  },

  setPayoutDisplay(text) {
    const selected = this.getSelectedPayoutAccount();
    if (selected) {
      selected.display = text;
      const accounts = this.getPayoutAccounts().map(a => a.id === selected.id ? selected : a);
      this.set(this.KEYS.payoutAccounts, accounts);
    }
    this.set(this.KEYS.payoutDisplay, text);
  },

  goPayoutManage(from = 'home') {
    if (!this.isPayoutBound()) {
      this.goPayoutBind(from);
      return;
    }
    this.go(`payout-accounts.html?from=${encodeURIComponent(from)}`);
  },

  goPayoutAdd(fromOrOpts = 'home') {
    const opts = typeof fromOrOpts === 'string' ? { from: fromOrOpts, dest: fromOrOpts } : fromOrOpts;
    const from = opts.from || 'home';
    const dest = opts.dest || from;
    if (this.needsPayoutLivenessForAdd()) {
      this.clearPayoutAddVerified();
      this.go(`payout-liveness.html?from=${encodeURIComponent(from)}&dest=${encodeURIComponent(dest)}`);
      return;
    }
    this.go(`payout-bind.html?from=${encodeURIComponent(from)}&dest=${encodeURIComponent(dest)}`);
  },

  goPayoutBind(from = 'home') {
    this.go(`payout-bind.html?from=${encodeURIComponent(from)}`);
  },

  returnFromPayoutAccounts(from = 'home') {
    if (from === 'order-premium') {
      this.go('order-premium.html');
      return;
    }
    if (from === 'order') {
      this.go('order.html');
      return;
    }
    if (from === 'review') {
      this.go('review.html');
      return;
    }
    this.go('home.html');
  },

  returnFromPayoutBind(from = 'home') {
    const params = new URLSearchParams(location.search);
    const returnTo = params.get('return') || from;
    if (from === 'payout-accounts') {
      this.go(`payout-accounts.html?from=${encodeURIComponent(returnTo)}`);
      return;
    }
    if (from === 'order-premium') {
      this.go('order-premium.html');
      return;
    }
    if (from === 'order') {
      this.go('order.html');
      return;
    }
    if (from === 'review') {
      this.go('review.html');
      return;
    }
    if (from === 'payout-bind') {
      this.go('payout-bind.html' + (location.search || ''));
      return;
    }
    if (this.isPayoutBound() && from !== 'home') {
      this.returnFromPayoutAccounts(from);
      return;
    }
    this.go('home.html');
  },

  goPayoutLiveness(from = 'payout-bind') {
    this.go(`payout-liveness.html?from=${encodeURIComponent(from)}`);
  },

  renderPayoutPickerList({ selectedId } = {}) {
    const accounts = this.getPayoutAccounts();
    const activeId = selectedId || this.getSelectedPayoutId();
    return accounts.map(acc => {
      const subtitle = acc.type === 'bank' ? 'Bank account' : 'E-wallet';
      const selected = acc.id === activeId;
      return `<button type="button" class="payout-account-option${selected ? ' selected' : ''}" data-payout-id="${acc.id}">
        <span class="payout-account-option__main">
          <span class="payout-account-option__title">${acc.display}</span>
          <span class="payout-account-option__sub">${subtitle}</span>
        </span>
        ${selected ? '<span class="payout-account-option__check" aria-hidden="true">✓</span>' : ''}
      </button>`;
    }).join('');
  },

  setLoanAppliedAt(ts = Date.now()) {
    this.set(this.KEYS.loanAppliedAt, Number(ts));
  },

  getLoanAppliedAt() {
    return Number(this.get(this.KEYS.loanAppliedAt)) || 0;
  },

  getLoanFlowState() {
    return this.get(this.KEYS.loanFlowState) || null;
  },

  setLoanFlowState(state) {
    if (state) this.set(this.KEYS.loanFlowState, state);
    else localStorage.removeItem(this.KEYS.loanFlowState);
  },

  clearLoanFlowState() {
    this.setLoanFlowState(null);
  },

  markListingRejected(cooldownDays = this.DEFAULT_LISTING_REJECT_COOLDOWN_DAYS) {
    if (!this.get(this.KEYS.listingRejectedAt)) {
      this.set(this.KEYS.listingRejectedAt, Date.now());
    }
    this.set(this.KEYS.listingRejectCooldownDays, Number(cooldownDays) || this.DEFAULT_LISTING_REJECT_COOLDOWN_DAYS);
    this.setLoanFlowState('listing-rejected');
  },

  clearListingRejected() {
    localStorage.removeItem(this.KEYS.listingRejectedAt);
    localStorage.removeItem(this.KEYS.listingRejectCooldownDays);
    this.clearLoanFlowState();
  },

  getListingRejectMeta() {
    const rejectedAt = Number(this.get(this.KEYS.listingRejectedAt)) || Date.now();
    const cooldownDays = Number(this.get(this.KEYS.listingRejectCooldownDays)) || this.DEFAULT_LISTING_REJECT_COOLDOWN_DAYS;
    const reapplyAt = rejectedAt + cooldownDays * 86400000;
    const msLeft = reapplyAt - Date.now();
    const daysRemaining = Math.max(0, Math.ceil(msLeft / 86400000));
    return {
      cooldownDays,
      daysRemaining,
      canRetry: msLeft <= 0,
      rejectedAt,
      reapplyAt
    };
  },

  formatListingReapplyLabel(meta) {
    if (meta.canRetry) return 'You can try again now';
    const days = meta.daysRemaining;
    return days === 1 ? 'You can try again in 1 day' : `You can try again in ${days} days`;
  },

  renderListingRejectReasonsList() {
    return `<ul class="listing-reject-reasons">${this.LISTING_REJECT_REASONS.map(
      reason => `<li>${reason}</li>`
    ).join('')}</ul>`;
  },

  renderHomeListingRejectedPanel() {
    const meta = this.getListingRejectMeta();
    const cooldown = this.formatListingReapplyLabel(meta);
    return `<div class="home-listing-reject-panel">
      <div class="home-listing-reject-panel__body">
        <p class="home-listing-reject-title">We can't offer you a loan right now</p>
        <p class="home-listing-reject-cooldown">${cooldown}</p>
      </div>
      <span class="home-loan-status-cta">View details →</span>
    </div>`;
  },

  getLoanFlowMeta() {
    const state = this.getLoanFlowState();
    if (!state || !this.LOAN_FLOW[state]) return null;
    const meta = { ...this.LOAN_FLOW[state], state };
    if (['listing-review', 'disbursement-review', 'disbursement-failed'].includes(state)) {
      meta.amount = this.formatPHP(this.getLoanAmount());
    }
    return meta;
  },

  /** 首页额度卡底部：新借款简要状态（金额 · 状态 + 查看详情） */
  renderHomeLoanFlowFooter(flowMeta) {
    const amount = flowMeta.amount || '';
    const status = flowMeta.homeStatus || flowMeta.badge;

    // Footer hint: short ETA message
    let hint = 'Tap to view details';
    if (flowMeta.state === 'listing-review') hint = 'ETA: 1–3 minutes for a result';
    else if (flowMeta.state === 'disbursement-review') hint = 'ETA: 1–5 minutes to receive funds';
    else if (flowMeta.state === 'listing-rejected') hint = this.formatListingReapplyLabel(this.getListingRejectMeta());
    else if (flowMeta.state === 'disbursement-failed') hint = 'Result is ready · View next steps';

    const amountPart = amount ? `<strong>${amount}</strong> · ` : '';
    return `<div class="home-loan-status-panel">
      <div class="home-loan-status-left">
        <p class="home-loan-status-text">${amountPart}${status}</p>
        <p class="home-loan-status-sub">${hint}</p>
      </div>
      <span class="home-loan-status-cta">View details →</span>
    </div>`;
  },

  renderFlowDemoNav() {
    return `<div class="flow-demo-nav" id="flow-demo-nav">
      <p class="flow-demo-label">Demo · switch flow</p>
      <div class="flow-demo-btns">
        <button type="button" class="flow-demo-btn" data-flow="listing-ok">发标成功</button>
        <button type="button" class="flow-demo-btn" data-flow="listing-fail">发标失败</button>
        <button type="button" class="flow-demo-btn" data-flow="disb-ok">放款成功</button>
        <button type="button" class="flow-demo-btn" data-flow="disb-fail">放款失败</button>
      </div>
    </div>`;
  },

  renderLoanFlowProgress(active) {
    const steps = [
      { id: 'listing', title: 'Listing review', descActive: 'Reviewing your application…', descDone: 'Approved', descPending: 'Pending' },
      { id: 'disbursement', title: 'Disbursement review', descActive: 'Transferring to your account…', descDone: 'Completed', descPending: 'Up next' }
    ];
    const order = ['listing', 'disbursement'];
    const activeIdx = order.indexOf(active);

    return `<div class="loan-flow-progress">${steps.map((step, i) => {
      let state = 'pending';
      if (i < activeIdx) state = 'done';
      else if (i === activeIdx) state = 'active';
      const desc = state === 'active' ? step.descActive : state === 'done' ? step.descDone : step.descPending;
      const isLast = i === steps.length - 1;
      const node = state === 'done'
        ? '<span class="loan-flow-check">✓</span>'
        : state === 'active'
          ? '<span class="loan-flow-spinner"></span>'
          : '<span class="loan-flow-dot"></span>';
      return `<div class="loan-flow-step loan-flow-step--${state}">
        <div class="loan-flow-track">
          ${node}
          ${isLast ? '' : `<span class="loan-flow-line loan-flow-line--${state}"></span>`}
        </div>
        <div class="loan-flow-body">
          <p class="loan-flow-title">${step.title}</p>
          <p class="loan-flow-desc">${desc}</p>
        </div>
      </div>`;
    }).join('')}</div>`;
  },

  initFlowDemoNav() {
    const nav = document.getElementById('flow-demo-nav');
    if (!nav) return;
    nav.querySelectorAll('[data-flow]').forEach(btn => {
      btn.addEventListener('click', () => {
        const amount = this.getLoanAmount();
        switch (btn.dataset.flow) {
          case 'listing-ok':
            this.setLoanFlowState('disbursement-review');
            this.go(`disbursement-review.html?amount=${amount}`);
            break;
          case 'listing-fail':
            this.markListingRejected();
            this.go('listing-rejected.html');
            break;
          case 'disb-ok':
            this.clearLoanFlowState();
            this.set(this.KEYS.hasLoan, true);
            this.go(`disbursement.html?amount=${amount}`);
            break;
          case 'disb-fail':
            this.setLoanFlowState('disbursement-failed');
            this.go(`disbursement-failed.html?amount=${amount}`);
            break;
        }
      });
    });
  },

  HOME_STATE_PAGES: [
    { id: 'guest', label: '游客', href: 'home-guest.html' },
    { id: 'kyc', label: '未完成 KYC', href: 'home.html?prototype=kyc' },
    { id: 'reviewing', label: '戳额审核', href: 'home.html?prototype=reviewing' },
    { id: 'credit-rejected', label: '戳额被拒', href: 'home.html?prototype=credit-rejected' },
    { id: 'credit-expired', label: '额度失效', href: 'home.html?prototype=credit-expired' },
    { id: 'approved', label: '有额度', href: 'home.html?prototype=approved' },
    { id: 'listing-review', label: '发标审核', href: 'home.html?prototype=listing-review' },
    { id: 'disbursement-review', label: '放款审核', href: 'home.html?prototype=disbursement-review' },
    { id: 'listing-rejected', label: '发标失败', href: 'home.html?prototype=listing-rejected' },
    { id: 'disbursement-failed', label: '放款失败', href: 'home.html?prototype=disbursement-failed' }
  ],

  renderHomeStateSwitcher(activeId) {
    return `<div class="home-state-switcher" role="navigation" aria-label="Home state prototypes">
      <p class="home-state-switcher-label">首页状态 · Prototype</p>
      <div class="home-state-switcher-track">${this.HOME_STATE_PAGES.map(p =>
        `<a href="${p.href}" class="home-state-pill${p.id === activeId ? ' active' : ''}">${p.label}</a>`
      ).join('')}</div>
    </div>`;
  },

  initHomeStateSwitcher(activeId) {
    const el = document.getElementById('home-state-switcher');
    if (el) el.innerHTML = this.renderHomeStateSwitcher(activeId);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-back]').forEach(btn => {
    btn.addEventListener('click', () => AppState.back());
  });
});

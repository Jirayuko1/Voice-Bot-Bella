/**
 * ============================================================================
 * [PERSON 1: CORE ORCHESTRATOR & SYSTEM FRAMEWORK]
 * ============================================================================
 * ผู้รับผิดชอบ: คนที่ 1 (Core Framework & Host Orchestrator Lead)
 * ขอบเขต:
 *   1. การเชื่อมต่อ WebAvatar SDK (chat-widget.js)
 *   2. การจัดการ Session State กลาง (ตาม SESSION_STATE_SCHEMA.json)
 *   3. ตัวรับ-ส่งสัญญาณ Event (webavatar:mounted, onConnect, onDisconnect)
 *   4. การทำ In-App Soft Navigation (webavatar-navigate) & SPA Multi-Page Router
 *   5. หน้าต่างตั้งค่า Widget ID (Modal Settings Dialog) & Sidebar Collapse
 *   6. ระบบแจ้งเตือน Toast Message กลาง
 * ============================================================================
 */

const STORAGE_KEY_WIDGET_ID = 'bella_webavatar_widget_id';

// Shared State Store กลางตามสัญญาข้อมูล STATE_CONTRACT.md
export const stateStore = {
  sessionId: 'sess_' + Math.random().toString(36).substring(2, 9),
  displayName: 'คุณลูกค้า',
  sourceAgent: 'AI_Greeting',
  targetAgent: '',
  activeFlow: {
    currentStep: 'STEP_1',
    currentPage: 'welcome',
    pendingQuestion: null
  },
  financialData: {}
};

// แผนที่จับคู่ ID ย่อยของการ์ด/ฟอร์ม และ Path ต่างๆ ไปยังหน้าหลัก (.page-view)
const ELEMENT_TO_PAGE_MAP = {
  // หน้าออมเงิน & บัญชีเงินฝาก
  'deposits': 'deposits',
  'deposit': 'deposits',
  'savings': 'deposits',
  'saving': 'deposits',
  'savings-simulator-box': 'deposits',
  'saving-plan': 'deposits',
  'deposit-esavings': 'deposits',
  'deposit-taxfree': 'deposits',
  'deposit-stepup': 'deposits',

  // หน้าวางแผนเกษียณ
  'retirement': 'retirement',
  'retire': 'retirement',
  'retirement-calculator': 'retirement',

  // หน้าประเมินสุขภาพการเงิน
  'quiz': 'quiz',
  'health': 'quiz',
  'health-check': 'quiz',
  'financial-health': 'quiz',

  // หน้าสินเชื่อ & วางแผนการลงทุน
  'loans': 'loans',
  'loan': 'loans',
  'investment': 'loans',
  'invest': 'loans',
  'funds': 'loans',
  'fund': 'loans',
  'product-home-loan': 'loans',
  'product-auto-loan': 'loans',
  'product-personal-loan': 'loans',
  'product-sme-loan': 'loans',

  // หน้าคำนวณค่างวด
  'calculator': 'calculator',
  'calc': 'calculator',

  // หน้าคำถามที่พบบ่อย
  'faq': 'faq',
  'help': 'faq',

  // หน้าแรก
  'welcome': 'welcome',
  'home': 'welcome',
};

function parseTarget(rawId) {
  if (!rawId) return { pathPart: 'welcome', hashPart: '', candidate: 'welcome' };

  let str = String(rawId).trim();
  try {
    if (str.startsWith('http://') || str.startsWith('https://')) {
      const parsedUrl = new URL(str);
      str = parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;
    }
  } catch (err) {}

  str = str.split('?')[0];

  let hashPart = '';
  if (str.includes('#')) {
    const parts = str.split('#');
    str = parts[0];
    hashPart = (parts[1] || '').trim();
  }

  const pathPart = str.replace(/^\/+|\/+$/g, '').trim();
  const candidate = (hashPart || pathPart || 'welcome').toLowerCase();
  return { pathPart, hashPart, candidate };
}

function resolvePageId(rawId) {
  const { hashPart, candidate } = parseTarget(rawId);

  if (hashPart) {
    const directSection = document.getElementById(hashPart);
    if (directSection) {
      if (directSection.classList.contains('page-view')) {
        return { pageId: hashPart, scrollTargetId: null };
      }
      const parentPage = directSection.closest('.page-view');
      if (parentPage?.id) {
        return { pageId: parentPage.id, scrollTargetId: hashPart };
      }
    }
    if (ELEMENT_TO_PAGE_MAP[hashPart]) {
      const pId = ELEMENT_TO_PAGE_MAP[hashPart];
      return { pageId: pId, scrollTargetId: hashPart !== pId ? hashPart : null };
    }
  }

  if (ELEMENT_TO_PAGE_MAP[candidate]) {
    const mappedPage = ELEMENT_TO_PAGE_MAP[candidate];
    const isSub = candidate !== mappedPage && document.getElementById(candidate);
    return { pageId: mappedPage, scrollTargetId: isSub ? candidate : null };
  }

  const directEl = document.getElementById(candidate);
  if (directEl) {
    if (directEl.classList.contains('page-view')) {
      return { pageId: candidate, scrollTargetId: null };
    }
    const parentPage = directEl.closest('.page-view');
    if (parentPage?.id) {
      return { pageId: parentPage.id, scrollTargetId: candidate };
    }
  }

  return { pageId: 'welcome', scrollTargetId: null };
}

/**
 * สลับหน้า SPA (.page-view) และอัปเดตสถานะเมนู Sidebar
 */
export function navigateToPage(pageOrHash, updateHistory = true) {
  const { pageId: targetPage, scrollTargetId } = resolvePageId(pageOrHash);
  const pageViews = document.querySelectorAll('.page-view');
  const navLinks = document.querySelectorAll('.sidebar-nav .nav-item');
  const sidebar = document.getElementById('app-sidebar') || document.querySelector('.sidebar');
  const btnMobileMenu = document.getElementById('btn-mobile-menu');

  stateStore.activeFlow.currentPage = targetPage;

  // 1. แสดงเฉพาะ .page-view ที่ตรงกับหน้าปัจจุบัน และซ่อนหน้าอื่นด้วย hidden
  pageViews.forEach((section) => {
    const isMatch = section.id === targetPage;
    section.classList.toggle('active', isMatch);
    if (isMatch) {
      section.removeAttribute('hidden');
      section.hidden = false;
    } else {
      section.setAttribute('hidden', '');
      section.hidden = true;
    }
  });

  // 2. อัปเดตปุ่มเมนูใน Sidebar และ aria-current="page"
  navLinks.forEach((link) => {
    const linkPage = link.getAttribute('data-page') || (link.getAttribute('href') || '').replace(/^#/, '');
    const isMatch = linkPage === targetPage;
    link.classList.toggle('active', isMatch);
    if (isMatch) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  // 3. อัปเดต URL Hash โดยไม่รีโหลดหน้า
  if (updateHistory) {
    const newHash = `#${targetPage}`;
    if (window.location.hash !== newHash) {
      history.pushState({ page: targetPage }, '', newHash);
    }
  }

  // 4. เลื่อนหน้าจอไปบนสุด หรือไปยังการ์ดเป้าหมายภายในหน้านั้น
  if (scrollTargetId) {
    const el = document.getElementById(scrollTargetId);
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
    }
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 5. ปิดเมนูมือถือหากเปิดอยู่
  if (sidebar && sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
    if (btnMobileMenu) btnMobileMenu.setAttribute('aria-expanded', 'false');
  }
}

// ผูกไว้ที่ window เพื่อให้สคริปต์สำรองใน index.html เรียกใช้ร่วมกันได้
window.navigateToPage = navigateToPage;

// อ้างอิง DOM Elements ของส่วนกลาง (คนที่ 1)
const p1Elements = {
  btnCallBella: document.getElementById('btn-call-bella'),
  callBtnText: document.getElementById('call-btn-text'),
  callStatusIndicator: document.getElementById('call-status-indicator'),
  widgetSyncTag: document.getElementById('widget-sync-tag'),
  btnOpenSettings: document.getElementById('btn-open-settings'),
  settingsModal: document.getElementById('settings-modal'),
  btnCloseSettings: document.getElementById('btn-close-settings'),
  btnCancelSettings: document.getElementById('btn-cancel-settings'),
  btnSaveSettings: document.getElementById('btn-save-settings'),
  inputWidgetId: document.getElementById('input-widget-id'),
  modalWidgetStatus: document.getElementById('modal-widget-status'),
  toast: document.getElementById('toast-notification'),
  toastMessage: document.getElementById('toast-message'),
};

/**
 * แสดง Toast แจ้งเตือนสั้นๆ บนหน้าจอ
 */
export function showToast(message, duration = 4000) {
  if (!p1Elements.toast || !p1Elements.toastMessage) return;
  p1Elements.toastMessage.textContent = message;
  p1Elements.toast.hidden = false;
  setTimeout(() => {
    p1Elements.toast.hidden = true;
  }, duration);
}

/**
 * ปรับปรุงสถานะ UI ของปุ่มคุยสายตาม Event
 */
function updateCallUIStatus(isConnected = false) {
  const currentWidgetId = localStorage.getItem(STORAGE_KEY_WIDGET_ID) || '';

  if (isConnected) {
    if (p1Elements.callBtnText) p1Elements.callBtnText.textContent = 'กำลังสนทนากับเบลล่า...';
    if (p1Elements.callStatusIndicator) {
      p1Elements.callStatusIndicator.style.backgroundColor = '#ef4444';
      p1Elements.callStatusIndicator.style.boxShadow = '0 0 10px #ef4444';
    }
    if (p1Elements.widgetSyncTag) {
      p1Elements.widgetSyncTag.innerHTML = '<span class="tag-dot" style="background-color: #10b981;"></span> Voice Connected';
    }
  } else {
    if (p1Elements.callBtnText) p1Elements.callBtnText.textContent = 'คุยเสียงกับเบลล่า';
    if (p1Elements.callStatusIndicator) {
      p1Elements.callStatusIndicator.style.backgroundColor = '#34d399';
      p1Elements.callStatusIndicator.style.boxShadow = '0 0 10px #34d399';
    }
    if (p1Elements.widgetSyncTag) {
      p1Elements.widgetSyncTag.innerHTML = '<span class="tag-dot"></span> ' + (currentWidgetId ? 'Ready to Call' : 'Widget Setup Needed');
    }
  }
}

/**
 * เริ่มต้นการโทรหาเบลล่า (Voice Call)
 */
export function triggerVoiceCall(customPrompt) {
  const currentWidgetId = localStorage.getItem(STORAGE_KEY_WIDGET_ID) || '';
  if (!currentWidgetId) {
    showToast('กรุณากรอก Widget ID ก่อนเริ่มคุยเสียงนะคะ');
    if (p1Elements.settingsModal) {
      p1Elements.inputWidgetId.value = '';
      p1Elements.settingsModal.showModal();
    }
    return;
  }

  // ส่งข้อความกระตุ้นเริ่มต้น (Queued Message) เพื่อให้เบลล่าเริ่มทักทายและถามชื่อลูกค้าตาม STEP 1 ทันทีที่ต่อสายติด
  const initialTrigger = customPrompt || 'สวัสดีครับ เริ่มต้นบทสนทนา กรุณาแนะนำตัวและสอบถามชื่อลูกค้าตาม STEP 1 ได้เลยครับ';
  if (window.ChatWidget?.sendUserMessage) {
    try {
      window.ChatWidget.sendUserMessage(initialTrigger);
    } catch (e) {
      console.warn('[Person 1: WebAvatar] Failed to queue initial trigger:', e);
    }
  }

  if (window.ChatWidget && typeof window.ChatWidget.connect === 'function') {
    window.ChatWidget.connect();
  } else {
    showToast('กำลังโหลดสคริปต์ WebAvatar กรุณารอสักครู่...');
  }
}

/**
 * ส่งข้อความเข้าสู่บทสนทนาของเบลล่า และเริ่มโทร
 */
export function talkToBella(messagePrompt) {
  triggerVoiceCall(messagePrompt);
}

/**
 * เริ่มต้นทำงานโมดูลของคนที่ 1
 */
export function initOrchestrator() {
  console.log('[Person 1: Core Orchestrator] Initializing...');

  // 1. ปุ่มเริ่มโทร
  if (p1Elements.btnCallBella) {
    p1Elements.btnCallBella.addEventListener('click', triggerVoiceCall);
  }

  // 2. ฟัง Lifecycle Events จาก WebAvatar
  document.addEventListener('webavatar:mounted', (evt) => {
    console.log('[Person 1: WebAvatar] Widget Mounted:', evt.detail);
    updateCallUIStatus(false);
    showToast('✨ ผู้ช่วย AI เบลล่าพร้อมให้บริการคุยด้วยเสียงแล้วค่ะ!');
  });

  window.addEventListener('onConnect', () => {
    console.log('[Person 1: WebAvatar] Call Connected');
    updateCallUIStatus(true);
    showToast('📞 กำลังเชื่อมต่อสายกับน้องเบลล่า...');
  });

  window.addEventListener('onDisconnect', () => {
    console.log('[Person 1: WebAvatar] Call Disconnected');
    updateCallUIStatus(false);
    showToast('วางสายแล้ว ขอบคุณที่ปรึกษาน้องเบลล่านะคะ');
  });

  // 3. In-App Soft Navigation (SPA Routing & Collapsible Sidebar)
  window.addEventListener('webavatar-navigate', (event) => {
    const target = event.detail?.target || event.detail?.url;
    console.log('[Person 1: WebAvatar] Navigation requested to:', target, event.detail);
    if (!target) return;

    // ต้องเรียก preventDefault() เสมอ เพื่อบอก WebAvatar ว่า Single Page App รับหน้าที่เปลี่ยนหน้าเอง
    // ป้องกัน WebAvatar ทำ Full-page reload จนหลุดสาย Voice Call
    event.preventDefault();
    navigateToPage(target, true);
  });

  document.addEventListener('click', (event) => {
    const pageLink = event.target.closest('[data-page], .sidebar-nav .nav-item');
    if (pageLink) {
      const targetPage = pageLink.getAttribute('data-page') || (pageLink.getAttribute('href') || '').replace(/^#/, '');
      if (targetPage) {
        event.preventDefault();
        navigateToPage(targetPage, true);
      }
    }
  });

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace(/^#/, '');
    if (hash) navigateToPage(hash, false);
  });

  window.addEventListener('popstate', () => {
    const hash = window.location.hash.replace(/^#/, '');
    navigateToPage(hash || 'welcome', false);
  });

  const sidebar = document.getElementById('app-sidebar') || document.querySelector('.sidebar');
  const btnSidebarCollapse = document.getElementById('btn-sidebar-collapse');
  const btnMobileMenu = document.getElementById('btn-mobile-menu');

  if (btnSidebarCollapse && sidebar && !btnSidebarCollapse.dataset.boundCollapse) {
    btnSidebarCollapse.dataset.boundCollapse = 'true';
    btnSidebarCollapse.addEventListener('click', (event) => {
      event.preventDefault();
      const isCollapsed = sidebar.classList.toggle('collapsed');
      btnSidebarCollapse.setAttribute('aria-expanded', String(!isCollapsed));
    });
  }

  if (btnMobileMenu && sidebar && !btnMobileMenu.dataset.boundMobile) {
    btnMobileMenu.dataset.boundMobile = 'true';
    btnMobileMenu.addEventListener('click', () => {
      const isOpen = sidebar.classList.toggle('open');
      btnMobileMenu.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // 4. Modal Settings Dialog Logic
  function closeModal() {
    if (p1Elements.settingsModal && p1Elements.settingsModal.open) {
      p1Elements.settingsModal.close();
    }
  }

  if (p1Elements.btnOpenSettings) {
    p1Elements.btnOpenSettings.addEventListener('click', () => {
      const savedId = localStorage.getItem(STORAGE_KEY_WIDGET_ID) || '';
      if (p1Elements.inputWidgetId) p1Elements.inputWidgetId.value = savedId;
      if (p1Elements.modalWidgetStatus) {
        p1Elements.modalWidgetStatus.textContent = savedId ? `ตั้งค่าแล้ว (${savedId})` : 'ยังไม่ได้ตั้งค่า Widget ID';
        p1Elements.modalWidgetStatus.className = savedId ? 'val text-success' : 'val text-warning';
      }
      p1Elements.settingsModal.showModal();
    });
  }

  if (p1Elements.btnCloseSettings) p1Elements.btnCloseSettings.addEventListener('click', closeModal);
  if (p1Elements.btnCancelSettings) p1Elements.btnCancelSettings.addEventListener('click', closeModal);

  if (p1Elements.btnSaveSettings) {
    p1Elements.btnSaveSettings.addEventListener('click', () => {
      const newId = (p1Elements.inputWidgetId.value || '').trim();
      if (!newId) {
        localStorage.removeItem(STORAGE_KEY_WIDGET_ID);
        showToast('ลบการตั้งค่า Widget ID แล้ว');
      } else {
        localStorage.setItem(STORAGE_KEY_WIDGET_ID, newId);
        showToast(`บันทึก Widget ID: ${newId} เรียบร้อยแล้ว กำลังโหลดใหม่...`);
        setTimeout(() => window.location.reload(), 1200);
      }
      closeModal();
    });
  }

  // 5. ปุ่ม "ถามเบลล่า" ตามการ์ดผลิตภัณฑ์ต่างๆ
  document.querySelectorAll('.btn-ask-bella').forEach((btn) => {
    btn.addEventListener('click', () => {
      const topic = btn.getAttribute('data-topic') || 'ผลิตภัณฑ์ธนาคาร';
      talkToBella(`คุณลูกค้าสนใจสอบถามข้อมูลเรื่อง "${topic}" ช่วยแนะนำรายละเอียดและเงื่อนไขเบื้องต้นให้หน่อยค่ะ`);
    });
  });

  // 6. Accessible FAQ Accordions
  document.querySelectorAll('.faq-question').forEach((button) => {
    button.addEventListener('click', () => {
      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!isExpanded));
    });
  });

  updateCallUIStatus(false);

  // ตั้งค่าหน้าเริ่มต้นตาม URL Hash
  const initialHash = window.location.hash.replace(/^#/, '');
  navigateToPage(initialHash || 'welcome', false);
}

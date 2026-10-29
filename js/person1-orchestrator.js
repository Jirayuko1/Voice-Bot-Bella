/**
 * ============================================================================
 * [PERSON 1: CORE ORCHESTRATOR & SYSTEM FRAMEWORK]
 * ============================================================================
 * ผู้รับผิดชอบ: คนที่ 1 (Core Framework & Host Orchestrator Lead)
 * ขอบเขต:
 *   1. การเชื่อมต่อ WebAvatar SDK (chat-widget.js)
 *   2. การจัดการ Session State กลาง (ตาม SESSION_STATE_SCHEMA.json)
 *   3. ตัวรับ-ส่งสัญญาณ Event (webavatar:mounted, onConnect, onDisconnect)
 *   4. การทำ In-App Soft Navigation (webavatar-navigate)
 *   5. หน้าต่างตั้งค่า Widget ID (Modal Settings Dialog)
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
    pendingQuestion: null
  },
  financialData: {}
};

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
export function triggerVoiceCall() {
  const currentWidgetId = localStorage.getItem(STORAGE_KEY_WIDGET_ID) || '';
  if (!currentWidgetId) {
    showToast('กรุณากรอก Widget ID ก่อนเริ่มคุยเสียงนะคะ');
    if (p1Elements.settingsModal) {
      p1Elements.inputWidgetId.value = '';
      p1Elements.settingsModal.showModal();
    }
    return;
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
  const currentWidgetId = localStorage.getItem(STORAGE_KEY_WIDGET_ID) || '';
  if (!currentWidgetId) {
    showToast('กรุณาตั้งค่า Widget ID เพื่อคุยกับเบลล่านะคะ');
    if (p1Elements.settingsModal) p1Elements.settingsModal.showModal();
    return;
  }

  if (window.ChatWidget?.sendUserMessage) {
    window.ChatWidget.sendUserMessage(messagePrompt);
  }
  triggerVoiceCall();
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

  // 3. In-App Soft Navigation (SPA Routing)
  window.addEventListener('webavatar-navigate', (event) => {
    const target = event.detail?.target;
    console.log('[Person 1: WebAvatar] Navigation requested to:', target);
    if (!target) return;

    const hashIndex = target.indexOf('#');
    if (hashIndex !== -1) {
      const targetHash = target.substring(hashIndex);
      const targetElem = document.querySelector(targetHash);
      if (targetElem) {
        event.preventDefault();
        targetElem.scrollIntoView({ behavior: 'smooth' });
        history.pushState(null, '', targetHash);
      }
    }
  });

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
}

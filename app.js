/**
 * Bella Digital Bank - Interactive Core Logic, SPA Multi-Page Router & WebAvatar Integration
 */

(function () {
  'use strict';

  // ==========================================================================
  // 0. SPA Multi-Page Navigation & Collapsible Sidebar
  // ==========================================================================

  // Map internal section/element IDs or legacy aliases to their parent page ID
  const ELEMENT_TO_PAGE_MAP = {
    'product-home-loan': 'loans',
    'product-auto-loan': 'loans',
    'product-personal-loan': 'loans',
    'product-sme-loan': 'loans',
    'deposit-esavings': 'deposits',
    'deposit-taxfree': 'deposits',
    'deposit-stepup': 'deposits',
    'savings-simulator-box': 'deposits',
    'savings': 'deposits',
    'investment': 'loans',
    'health': 'quiz',
  };

  function resolvePageId(rawId) {
    const cleanId = (rawId || '').replace(/^#/, '').trim();
    if (!cleanId) return { pageId: 'welcome', scrollTargetId: null };

    const directSection = document.getElementById(cleanId);
    if (directSection && directSection.classList.contains('page-view')) {
      return { pageId: cleanId, scrollTargetId: null };
    }

    if (ELEMENT_TO_PAGE_MAP[cleanId]) {
      const mappedPage = ELEMENT_TO_PAGE_MAP[cleanId];
      const isSubElement = directSection && !directSection.classList.contains('page-view');
      return { pageId: mappedPage, scrollTargetId: isSubElement ? cleanId : null };
    }

    // Check if cleanId is inside a .page-view parent
    if (directSection) {
      const parentPage = directSection.closest('.page-view');
      if (parentPage && parentPage.id) {
        return { pageId: parentPage.id, scrollTargetId: cleanId };
      }
    }

    return { pageId: 'welcome', scrollTargetId: null };
  }

  function navigateToPage(pageOrHash, updateHistory = true) {
    const { pageId: targetPage, scrollTargetId } = resolvePageId(pageOrHash);
    const pageViews = document.querySelectorAll('.page-view');
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-item');
    const sidebar = document.getElementById('app-sidebar') || document.querySelector('.sidebar');
    const btnMobileMenu = document.getElementById('btn-mobile-menu');

    // 1. Show only the active page view, hide others with `hidden`
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

    // 2. Update sidebar menu state and aria-current="page"
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

    // 3. Update URL hash without full page reload
    if (updateHistory) {
      const newHash = `#${targetPage}`;
      if (window.location.hash !== newHash) {
        history.pushState({ page: targetPage }, '', newHash);
      }
    }

    // 4. Scroll to top or specific card inside that page
    if (scrollTargetId) {
      const el = document.getElementById(scrollTargetId);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 5. Close mobile drawer if open
    if (sidebar && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
      if (btnMobileMenu) btnMobileMenu.setAttribute('aria-expanded', 'false');
    }
  }

  window.navigateToPage = navigateToPage;
  window.__bellaRouterReady = true;

  // Delegate clicks on any [data-page] or sidebar nav link
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

  // Sidebar Collapse Toggle
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

  // Mobile Sidebar Toggle
  if (btnMobileMenu && sidebar && !btnMobileMenu.dataset.boundMobile) {
    btnMobileMenu.dataset.boundMobile = 'true';
    btnMobileMenu.addEventListener('click', () => {
      const isOpen = sidebar.classList.toggle('open');
      btnMobileMenu.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // ==========================================================================
  // 1. WebAvatar Widget Config & Host Integration
  // ==========================================================================

  const STORAGE_KEY_WIDGET_ID = 'bella_webavatar_widget_id';
  let currentWidgetId = localStorage.getItem(STORAGE_KEY_WIDGET_ID) || '';

  const elements = {
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

  function showToast(msg, duration = 4000) {
    if (!elements.toast || !elements.toastMessage) return;
    elements.toastMessage.textContent = msg;
    elements.toast.hidden = false;
    setTimeout(() => {
      elements.toast.hidden = true;
    }, duration);
  }

  function updateWidgetUIStatus(isConnected = false) {
    if (isConnected) {
      if (elements.callBtnText) elements.callBtnText.textContent = 'กำลังสนทนากับเบลล่า...';
      if (elements.callStatusIndicator) {
        elements.callStatusIndicator.style.backgroundColor = '#ef4444';
        elements.callStatusIndicator.style.boxShadow = '0 0 10px #ef4444';
      }
      if (elements.widgetSyncTag) {
        elements.widgetSyncTag.innerHTML = '<span class="tag-dot" style="background-color: #10b981;"></span> Voice Connected';
      }
    } else {
      if (elements.callBtnText) elements.callBtnText.textContent = 'คุยเสียงกับเบลล่า';
      if (elements.callStatusIndicator) {
        elements.callStatusIndicator.style.backgroundColor = '#34d399';
        elements.callStatusIndicator.style.boxShadow = '0 0 10px #34d399';
      }
      if (elements.widgetSyncTag) {
        elements.widgetSyncTag.innerHTML = '<span class="tag-dot"></span> ' + (currentWidgetId ? 'Ready to Call' : 'Widget Setup Needed');
      }
    }
  }

  // Listen for WebAvatar Lifecycle Events
  document.addEventListener('webavatar:mounted', (evt) => {
    console.log('[WebAvatar] Widget Mounted:', evt.detail);
    updateWidgetUIStatus(false);
    showToast('✨ ผู้ช่วย AI เบลล่าพร้อมให้บริการคุยด้วยเสียงแล้วค่ะ!');
  });

  window.addEventListener('onConnect', () => {
    console.log('[WebAvatar] Call Connected');
    updateWidgetUIStatus(true);
    showToast('📞 กำลังเชื่อมต่อสายกับน้องเบลล่า...');
  });

  window.addEventListener('onDisconnect', () => {
    console.log('[WebAvatar] Call Disconnected');
    updateWidgetUIStatus(false);
    showToast('วางสายแล้ว ขอบคุณที่ปรึกษาน้องเบลล่านะคะ');
  });

  // Handle in-app soft navigation from WebAvatar (SPA routing)
  window.addEventListener('webavatar-navigate', (event) => {
    const target = event.detail?.target;
    console.log('[WebAvatar] In-app navigation requested to:', target);
    if (!target) return;

    const hashIndex = target.indexOf('#');
    if (hashIndex !== -1) {
      const targetId = target.substring(hashIndex + 1);
      if (targetId) {
        event.preventDefault();
        navigateToPage(targetId, true);
      }
    }
  });

  // Trigger Voice Call
  function handleCallBella() {
    if (!currentWidgetId) {
      showToast('กรุณากรอก Widget ID ก่อนเริ่มคุยเสียงนะคะ');
      if (elements.settingsModal) {
        elements.inputWidgetId.value = '';
        elements.settingsModal.showModal();
      }
      return;
    }

    if (window.ChatWidget && typeof window.ChatWidget.connect === 'function') {
      window.ChatWidget.connect();
    } else {
      showToast('กำลังโหลดสคริปต์ WebAvatar กรุณารอสักครู่...');
    }
  }

  if (elements.btnCallBella) {
    elements.btnCallBella.addEventListener('click', handleCallBella);
  }

  // Settings Modal Handlers
  if (elements.btnOpenSettings) {
    elements.btnOpenSettings.addEventListener('click', () => {
      if (elements.inputWidgetId) {
        elements.inputWidgetId.value = currentWidgetId;
      }
      if (elements.modalWidgetStatus) {
        elements.modalWidgetStatus.textContent = currentWidgetId
          ? `ตั้งค่าแล้ว (${currentWidgetId})`
          : 'ยังไม่ได้ตั้งค่า Widget ID';
        elements.modalWidgetStatus.className = currentWidgetId ? 'val text-success' : 'val text-warning';
      }
      elements.settingsModal.showModal();
    });
  }

  function closeModal() {
    if (elements.settingsModal && elements.settingsModal.open) {
      elements.settingsModal.close();
    }
  }

  if (elements.btnCloseSettings) elements.btnCloseSettings.addEventListener('click', closeModal);
  if (elements.btnCancelSettings) elements.btnCancelSettings.addEventListener('click', closeModal);

  if (elements.btnSaveSettings) {
    elements.btnSaveSettings.addEventListener('click', () => {
      const newId = (elements.inputWidgetId.value || '').trim();
      if (!newId) {
        localStorage.removeItem(STORAGE_KEY_WIDGET_ID);
        currentWidgetId = '';
        showToast('ลบการตั้งค่า Widget ID แล้ว');
      } else {
        localStorage.setItem(STORAGE_KEY_WIDGET_ID, newId);
        currentWidgetId = newId;
        showToast(`บันทึก Widget ID: ${newId} เรียบร้อยแล้ว กำลังโหลดใหม่...`);
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      }
      closeModal();
    });
  }

  // Send contextual prompts to Bella from anywhere on the page
  function talkToBellaAbout(topicText) {
    if (!currentWidgetId) {
      showToast('กรุณาตั้งค่า Widget ID เพื่อคุยกับเบลล่านะคะ');
      elements.settingsModal.showModal();
      return;
    }

    const message = `คุณลูกค้าสนใจสอบถามข้อมูลเรื่อง "${topicText}" ช่วยแนะนำรายละเอียดและเงื่อนไขเบื้องต้นให้หน่อยค่ะ`;
    if (window.ChatWidget?.sendUserMessage) {
      window.ChatWidget.sendUserMessage(message);
    }
    handleCallBella();
  }

  document.querySelectorAll('.btn-ask-bella').forEach((btn) => {
    btn.addEventListener('click', () => {
      const topic = btn.getAttribute('data-topic') || 'ผลิตภัณฑ์ธนาคาร';
      talkToBellaAbout(topic);
    });
  });

  // ==========================================================================
  // 2. Financial Health & Product Recommendation Quiz
  // ==========================================================================

  const quizState = {
    currentStep: 1,
    goal: 'loan',
    income: 0,
    expense: 0,
    debt: 0,
    savings: 0,
    surplusAmount: 0,
    surplusRatio: 0,
    debtRatio: 0,
    emergencyMonths: 0,
    healthLevel: 'good',
  };

  const quizElements = {
    progressbar: document.getElementById('quiz-progressbar'),
    steps: [
      document.getElementById('quiz-step-1'),
      document.getElementById('quiz-step-2'),
      document.getElementById('quiz-step-3'),
      document.getElementById('quiz-step-4'),
    ],
    nodes: [
      document.getElementById('step-node-1'),
      document.getElementById('step-node-2'),
      document.getElementById('step-node-3'),
      document.getElementById('step-node-4'),
    ],
    btnNext1: document.getElementById('btn-quiz-next-1'),
    btnPrev2: document.getElementById('btn-quiz-prev-2'),
    btnNext2: document.getElementById('btn-quiz-next-2'),
    btnPrev3: document.getElementById('btn-quiz-prev-3'),
    btnCalculate: document.getElementById('btn-quiz-calculate'),
    btnReset: document.getElementById('btn-quiz-reset'),
    btnSyncToBella: document.getElementById('btn-sync-to-bella'),
    inputIncome: document.getElementById('quiz-income'),
    inputExpense: document.getElementById('quiz-expense'),
    inputDebt: document.getElementById('quiz-debt'),
    inputSavings: document.getElementById('quiz-savings'),

    // Result elements
    healthBadge: document.getElementById('result-health-badge'),
    healthIcon: document.getElementById('result-health-icon'),
    healthTitle: document.getElementById('result-health-title'),
    surplusAmount: document.getElementById('result-surplus-amount'),
    surplusRatio: document.getElementById('result-surplus-ratio'),
    debtRatio: document.getElementById('result-debt-ratio'),
    debtStatus: document.getElementById('result-debt-status'),
    emergencyMonths: document.getElementById('result-emergency-months'),
    emergencyStatus: document.getElementById('result-emergency-status'),
    aiAdviceText: document.getElementById('result-ai-advice-text'),
    recProductsContainer: document.getElementById('recommended-products-container'),
  };

  function setQuizStep(stepNumber) {
    quizState.currentStep = stepNumber;
    if (quizElements.progressbar) {
      quizElements.progressbar.setAttribute('aria-valuenow', String(stepNumber));
    }
    quizElements.steps.forEach((step, idx) => {
      if (step) {
        step.classList.toggle('active', idx + 1 === stepNumber);
      }
    });

    quizElements.nodes.forEach((node, idx) => {
      if (!node) return;
      node.classList.remove('active', 'completed');
      node.removeAttribute('aria-current');
      if (idx + 1 === stepNumber) {
        node.classList.add('active');
        node.setAttribute('aria-current', 'step');
      } else if (idx + 1 < stepNumber) {
        node.classList.add('completed');
      }
    });
  }

  // Quiz Step 1 -> 2
  if (quizElements.btnNext1) {
    quizElements.btnNext1.addEventListener('click', () => {
      const selectedGoal = document.querySelector('input[name="quiz_goal"]:checked');
      if (selectedGoal) quizState.goal = selectedGoal.value;
      setQuizStep(2);
    });
  }

  // Quiz Step 2 -> 1
  if (quizElements.btnPrev2) {
    quizElements.btnPrev2.addEventListener('click', () => setQuizStep(1));
  }

  // Quiz Step 2 -> 3
  if (quizElements.btnNext2) {
    quizElements.btnNext2.addEventListener('click', () => {
      const income = parseFloat(quizElements.inputIncome.value) || 0;
      const expense = parseFloat(quizElements.inputExpense.value) || 0;

      if (income <= 0) {
        showToast('กรุณาระบุรายรับต่อเดือนที่มากกว่า 0 บาท');
        quizElements.inputIncome.focus();
        return;
      }
      quizState.income = income;
      quizState.expense = expense;
      setQuizStep(3);
    });
  }

  // Quiz Step 3 -> 2
  if (quizElements.btnPrev3) {
    quizElements.btnPrev3.addEventListener('click', () => setQuizStep(2));
  }

  // Quiz Step 3 -> 4 (Calculate results based on doc specifications)
  if (quizElements.btnCalculate) {
    quizElements.btnCalculate.addEventListener('click', () => {
      const debt = parseFloat(quizElements.inputDebt.value) || 0;
      const savings = parseFloat(quizElements.inputSavings.value) || 0;

      quizState.debt = debt;
      quizState.savings = savings;

      // 1. Surplus calculation
      const surplus = quizState.income - quizState.expense - quizState.debt;
      const surplusRatio = quizState.income > 0 ? (surplus / quizState.income) * 100 : 0;

      // 2. Debt to Income Ratio (DSR)
      const debtRatio = quizState.income > 0 ? (quizState.debt / quizState.income) * 100 : 0;

      // 3. Emergency fund support months
      const emergencyMonths = quizState.expense > 0 ? (quizState.savings / quizState.expense) : 0;

      quizState.surplusAmount = surplus;
      quizState.surplusRatio = surplusRatio;
      quizState.debtRatio = debtRatio;
      quizState.emergencyMonths = emergencyMonths;

      // 4. Assessment logic from AI_ตรวจสุขภาพการเงินเบื้องต้น:
      let level = 'improve';
      if (surplusRatio >= 20 && debtRatio <= 35 && emergencyMonths >= 6) {
        level = 'good';
      } else if (surplusRatio >= 10 && debtRatio <= 45 && emergencyMonths >= 3) {
        level = 'moderate';
      }
      quizState.healthLevel = level;

      renderQuizResults();
      setQuizStep(4);
    });
  }

  function renderQuizResults() {
    const nf = new Intl.NumberFormat('th-TH');

    if (quizState.healthLevel === 'good') {
      quizElements.healthIcon.textContent = '🌟';
      quizElements.healthTitle.textContent = 'สุขภาพการเงินดีเยี่ยม (Good)';
      quizElements.healthTitle.style.color = '#34d399';
    } else if (quizState.healthLevel === 'moderate') {
      quizElements.healthIcon.textContent = '⚖️';
      quizElements.healthTitle.textContent = 'สุขภาพการเงินปานกลาง (Moderate)';
      quizElements.healthTitle.style.color = '#fbbf24';
    } else {
      quizElements.healthIcon.textContent = '⚠️';
      quizElements.healthTitle.textContent = 'สุขภาพการเงินควรปรับปรุง (Improve)';
      quizElements.healthTitle.style.color = '#f87171';
    }

    quizElements.surplusAmount.textContent = `฿${nf.format(Math.round(quizState.surplusAmount))}`;
    quizElements.surplusRatio.textContent = `คิดเป็น ${quizState.surplusRatio.toFixed(1)}% ของรายรับ`;

    quizElements.debtRatio.textContent = `${quizState.debtRatio.toFixed(1)}%`;
    if (quizState.debtRatio <= 35) {
      quizElements.debtStatus.textContent = 'เกณฑ์ปลอดภัย (≤ 35%)';
      quizElements.debtStatus.className = 'metric-sub text-success';
    } else if (quizState.debtRatio <= 45) {
      quizElements.debtStatus.textContent = 'เกณฑ์เฝ้าระวัง (36-45%)';
      quizElements.debtStatus.className = 'metric-sub text-warning';
    } else {
      quizElements.debtStatus.textContent = 'เกณฑ์เสี่ยงสูง (> 45%)';
      quizElements.debtStatus.className = 'metric-sub text-danger';
    }

    quizElements.emergencyMonths.textContent = `${quizState.emergencyMonths.toFixed(1)} เดือน`;
    if (quizState.emergencyMonths >= 6) {
      quizElements.emergencyStatus.textContent = 'สำรองฉุกเฉินเพียงพอมาก (≥ 6 เดือน)';
      quizElements.emergencyStatus.className = 'metric-sub text-success';
    } else if (quizState.emergencyMonths >= 3) {
      quizElements.emergencyStatus.textContent = 'สำรองปานกลาง (3-6 เดือน)';
      quizElements.emergencyStatus.className = 'metric-sub text-warning';
    } else {
      quizElements.emergencyStatus.textContent = 'สำรองน้อย (< 3 เดือน)';
      quizElements.emergencyStatus.className = 'metric-sub text-danger';
    }

    let advice = '';
    if (quizState.healthLevel === 'good') {
      advice = `ยอดเยี่ยมมากค่ะ! คุณมีเงินเหลือเก็บเดือนละ ฿${nf.format(Math.round(quizState.surplusAmount))} และมีเงินสำรองครอบคลุมถึง ${quizState.emergencyMonths.toFixed(1)} เดือน สามารถต่อยอดไปสู่การเปิดบัญชี e-Savings ดอกเบี้ยสูง หรือหากต้องการขอสินเชื่อบ้าน/รถ คุณมีศักยภาพในการผ่อนชำระในเกณฑ์ดีมากค่ะ`;
    } else if (quizState.healthLevel === 'moderate') {
      advice = `สถานะการเงินอยู่ในระดับที่ควบคุมได้ค่ะ สัดส่วนภาระหนี้สินอยู่ที่ ${quizState.debtRatio.toFixed(1)}% เบลล่าขอแนะนำให้วางแผนเพิ่มเงินสำรองฉุกเฉินให้แตะ 6 เดือน โดยเลือกออมผ่านเงินฝากประจำปลอดภาษี 24 เดือน หรือหากจะกู้เงิน ควรเลือกสินเชื่อที่ดอกเบี้ยต่ำเพื่อลดภาระต่องวดค่ะ`;
    } else {
      advice = `สุขภาพการเงินยังมีจุดที่ต้องระมัดระวังค่ะ เนื่องจากเงินเหลือต่อเดือนหรือเงินสำรองยังไม่สูงนัก เบลล่าแนะนำให้เริ่มจากการจัดทำงบรายรับรายจ่าย ลดภาระหนี้ดอกเบี้ยสูงด้วยการรวมหนี้ (Refinance) และสร้างเงินสำรองฉุกเฉินก้อนแรกให้ได้ก่อนค่ะ`;
    }
    quizElements.aiAdviceText.textContent = advice;

    let products = [];
    if (quizState.goal === 'loan' || quizState.debtRatio <= 40) {
      products.push({
        title: 'สินเชื่อบ้านดอกเบี้ยพิเศษ (Home Loan)',
        rate: 'ดอกเบี้ยเฉลี่ย 3.25% ต่อปี',
        desc: `ประเมินวงเงินกู้ที่ผ่อนสบายตามรายได้ของคุณ: สูงสุดประมาณ ฿${nf.format(Math.round(quizState.income * 60))}`,
        targetId: 'product-home-loan',
      });
      products.push({
        title: 'สินเชื่อส่วนบุคคล Bella Speedy (รวมหนี้)',
        rate: 'ดอกเบี้ยเริ่มต้น 9.99% ต่อปี',
        desc: 'รวมหนี้หลายทางเป็นก้อนเดียว ผ่อนจ่ายที่เดียว ค่างวดลดลง ดอกเบี้ยลดต้นลดดอก',
        targetId: 'product-personal-loan',
      });
    }

    if (quizState.emergencyMonths < 6) {
      products.push({
        title: 'เงินฝากประจำปลอดภาษี 24 เดือน',
        rate: 'ดอกเบี้ย 2.65% ต่อปี (ไม่เสียภาษี)',
        desc: 'สร้างเงินสำรองฉุกเฉินก้อนโต ฝากสม่ำเสมอทุกเดือน ได้รับดอกเบี้ยเต็มเม็ดเต็มหน่วย',
        targetId: 'deposit-taxfree',
      });
    } else {
      products.push({
        title: 'Bella e-Savings ดิจิทัล',
        rate: 'ดอกเบี้ยสูง 2.20% ต่อปี',
        desc: 'พักเงินสำรองพร้อมใช้ รับผลตอบแทนสูง จ่ายดอกเบี้ยทุกเดือน ถอนคล่องตัว 24 ชม.',
        targetId: 'deposit-esavings',
      });
    }

    quizElements.recProductsContainer.innerHTML = products.map(p => `
      <div class="rec-product-card">
        <div>
          <h5>${p.title}</h5>
          <div class="rec-rate">${p.rate}</div>
          <p>${p.desc}</p>
        </div>
        <a href="#${p.targetId}" class="btn btn-outline btn-jump-product" data-target="${p.targetId}" style="align-self: flex-start; padding: 6px 14px; font-size: 0.8125rem;">
          ดูรายละเอียดผลิตภัณฑ์ &rarr;
        </a>
      </div>
    `).join('');

    quizElements.recProductsContainer.querySelectorAll('.btn-jump-product').forEach((link) => {
      link.addEventListener('click', (evt) => {
        evt.preventDefault();
        const targetId = link.getAttribute('data-target');
        navigateToPage(targetId, true);
      });
    });
  }

  if (quizElements.btnReset) {
    quizElements.btnReset.addEventListener('click', () => {
      setQuizStep(1);
    });
  }

  if (quizElements.btnSyncToBella) {
    quizElements.btnSyncToBella.addEventListener('click', () => {
      const summaryMsg = `ผลการตรวจสุขภาพการเงิน: รายรับ ฿${quizState.income}, ภาระหนี้ ${quizState.debtRatio.toFixed(1)}%, เงินสำรอง ${quizState.emergencyMonths.toFixed(1)} เดือน, ระดับสุขภาพคือ ${quizState.healthLevel}, เป้าหมายคือ ${quizState.goal}. ช่วยวิเคราะห์และแนะนำเพิ่มเติมให้หน่อยค่ะ`;

      if (window.ChatWidget?.sendUserMessage) {
        window.ChatWidget.sendUserMessage(summaryMsg);
      }
      handleCallBella();
    });
  }

  // ==========================================================================
  // 3. Dynamic Loan Calculator Logic
  // ==========================================================================

  const calcElements = {
    form: document.getElementById('loan-calculator-form'),
    loanType: document.getElementById('calc-loan-type'),
    amountInput: document.getElementById('calc-amount-input'),
    amountRange: document.getElementById('calc-amount-range'),
    amountDisplay: document.getElementById('calc-amount-display'),
    termInput: document.getElementById('calc-term-input'),
    termRange: document.getElementById('calc-term-range'),
    termDisplay: document.getElementById('calc-term-display'),
    rateInput: document.getElementById('calc-rate-input'),
    monthlyPayment: document.getElementById('calc-monthly-payment'),
    breakdownPrincipal: document.getElementById('calc-breakdown-principal'),
    breakdownInterest: document.getElementById('calc-breakdown-interest'),
    breakdownTotal: document.getElementById('calc-breakdown-total'),
    recommendedIncome: document.getElementById('calc-recommended-income'),
    btnAskBella: document.getElementById('btn-calc-ask-bella'),
  };

  function updateLoanCalculation() {
    if (!calcElements.amountInput || !calcElements.termInput || !calcElements.rateInput) return;

    const principal = parseFloat(calcElements.amountInput.value) || 0;
    const years = parseFloat(calcElements.termInput.value) || 1;
    const annualRate = parseFloat(calcElements.rateInput.value) || 0;
    const loanType = calcElements.loanType.value;

    const nf = new Intl.NumberFormat('th-TH');

    calcElements.amountDisplay.textContent = `฿${nf.format(principal)}`;
    const months = Math.round(years * 12);
    calcElements.termDisplay.textContent = `${years} ปี (${months} งวด)`;

    let monthly = 0;
    let totalPaid = 0;
    let totalInterest = 0;

    if (loanType === 'auto') {
      totalInterest = principal * (annualRate / 100) * years;
      totalPaid = principal + totalInterest;
      monthly = months > 0 ? totalPaid / months : 0;
    } else {
      const monthlyRate = (annualRate / 100) / 12;
      if (monthlyRate > 0 && months > 0) {
        monthly = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
        totalPaid = monthly * months;
        totalInterest = totalPaid - principal;
      } else {
        monthly = months > 0 ? principal / months : 0;
        totalPaid = principal;
        totalInterest = 0;
      }
    }

    const roundedMonthly = Math.round(monthly);
    const roundedInterest = Math.round(totalInterest);
    const roundedTotal = Math.round(totalPaid);
    const recIncome = roundedMonthly > 0 ? Math.round(roundedMonthly / 0.35) : 0;

    calcElements.monthlyPayment.textContent = `฿${nf.format(roundedMonthly)}`;
    calcElements.breakdownPrincipal.textContent = `฿${nf.format(principal)}`;
    calcElements.breakdownInterest.textContent = `฿${nf.format(roundedInterest)}`;
    calcElements.breakdownTotal.textContent = `฿${nf.format(roundedTotal)}`;
    calcElements.recommendedIncome.textContent = `฿${nf.format(recIncome)} / เดือน`;
  }

  if (calcElements.loanType) {
    calcElements.loanType.addEventListener('change', () => {
      const selectedOption = calcElements.loanType.selectedOptions[0];
      if (selectedOption) {
        const defaultRate = selectedOption.getAttribute('data-rate');
        const defaultYears = selectedOption.getAttribute('data-years');
        if (defaultRate) calcElements.rateInput.value = defaultRate;
        if (defaultYears) {
          calcElements.termInput.value = defaultYears;
          calcElements.termRange.value = defaultYears;
        }
      }
      updateLoanCalculation();
    });
  }

  if (calcElements.amountInput && calcElements.amountRange) {
    calcElements.amountInput.addEventListener('input', () => {
      calcElements.amountRange.value = calcElements.amountInput.value;
      updateLoanCalculation();
    });
    calcElements.amountRange.addEventListener('input', () => {
      calcElements.amountInput.value = calcElements.amountRange.value;
      updateLoanCalculation();
    });
  }

  if (calcElements.termInput && calcElements.termRange) {
    calcElements.termInput.addEventListener('input', () => {
      calcElements.termRange.value = calcElements.termInput.value;
      updateLoanCalculation();
    });
    calcElements.termRange.addEventListener('input', () => {
      calcElements.termInput.value = calcElements.termRange.value;
      updateLoanCalculation();
    });
  }

  if (calcElements.rateInput) {
    calcElements.rateInput.addEventListener('input', updateLoanCalculation);
  }

  if (calcElements.btnAskBella) {
    calcElements.btnAskBella.addEventListener('click', () => {
      const p = calcElements.amountInput.value;
      const t = calcElements.termInput.value;
      const typeText = calcElements.loanType.selectedOptions[0]?.text || 'สินเชื่อ';
      const monthly = calcElements.monthlyPayment.textContent;
      const msg = `ผู้ใช้ต้องการคำนวณ ${typeText} วงเงิน ${p} บาท ผ่อน ${t} ปี ค่างวดประมาณ ${monthly} ช่วยแนะนำการเตรียมตัวและเงื่อนไขการสมัครหน่อยค่ะ`;

      if (window.ChatWidget?.sendUserMessage) {
        window.ChatWidget.sendUserMessage(msg);
      }
      handleCallBella();
    });
  }

  // Click on "คำนวณค่างวด..." from Product Cards -> Switch to #calculator page
  document.querySelectorAll('.btn-calc-loan').forEach((btn) => {
    btn.addEventListener('click', () => {
      const loanType = btn.getAttribute('data-loan-type');
      if (calcElements.loanType) {
        calcElements.loanType.value = loanType;
        calcElements.loanType.dispatchEvent(new Event('change'));
      }
      navigateToPage('calculator', true);
    });
  });

  // Click on "สนใจเปิดบัญชี" from Deposit Cards -> Scroll to Savings Simulator
  document.querySelectorAll('.btn-apply-deposit').forEach((btn) => {
    btn.addEventListener('click', () => {
      const simBox = document.getElementById('savings-simulator-box');
      if (simBox) {
        simBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });

  // ==========================================================================
  // 4. Savings Goal Simulator (AI_วางแผนการออม)
  // ==========================================================================

  const savingElements = {
    targetInput: document.getElementById('saving-target-input'),
    currentInput: document.getElementById('saving-current-input'),
    monthlyInput: document.getElementById('saving-monthly-input'),
    goalSelect: document.getElementById('saving-goal-select'),
    resRemaining: document.getElementById('saving-res-remaining'),
    resMonths: document.getElementById('saving-res-months'),
    resYears: document.getElementById('saving-res-years'),
    btnAskBella: document.getElementById('btn-saving-ask-bella'),
  };

  function updateSavingsPlan() {
    if (!savingElements.targetInput || !savingElements.currentInput || !savingElements.monthlyInput) return;

    const target = parseFloat(savingElements.targetInput.value) || 0;
    const current = parseFloat(savingElements.currentInput.value) || 0;
    const monthly = parseFloat(savingElements.monthlyInput.value) || 0;

    const remaining = Math.max(0, target - current);
    const months = (monthly > 0 && remaining > 0) ? Math.ceil(remaining / monthly) : 0;

    const nf = new Intl.NumberFormat('th-TH');
    savingElements.resRemaining.textContent = `฿${nf.format(remaining)}`;

    if (remaining === 0) {
      savingElements.resMonths.textContent = 'ถึงเป้าหมายแล้ว!';
      savingElements.resYears.textContent = 'ยินดีด้วยค่ะ คุณมีเงินออมครบแล้ว';
    } else {
      savingElements.resMonths.textContent = `${months} เดือน`;
      const y = Math.floor(months / 12);
      const m = months % 12;
      let yrText = '';
      if (y > 0 && m > 0) yrText = `(ประมาณ ${y} ปี ${m} เดือน)`;
      else if (y > 0) yrText = `(ประมาณ ${y} ปี)`;
      else yrText = `(ไม่ถึง 1 ปี)`;
      savingElements.resYears.textContent = yrText;
    }
  }

  [savingElements.targetInput, savingElements.currentInput, savingElements.monthlyInput].forEach(inp => {
    if (inp) inp.addEventListener('input', updateSavingsPlan);
  });

  if (savingElements.btnAskBella) {
    savingElements.btnAskBella.addEventListener('click', () => {
      const goal = savingElements.goalSelect.value;
      const target = savingElements.targetInput.value;
      const current = savingElements.currentInput.value;
      const monthly = savingElements.monthlyInput.value;
      const months = savingElements.resMonths.textContent;
      const msg = `ผู้ใช้กำลังวางแผนการออมเพื่อ "${goal}" เป้าหมาย ฿${target} ปัจจุบันมี ฿${current} ออมเดือนละ ฿${monthly} ใช้เวลาประมาณ ${months}. ช่วยแนะนำผลิตภัณฑ์หรือเคล็ดลับการออมให้ถึงเป้าหมายหน่อยค่ะ`;

      if (window.ChatWidget?.sendUserMessage) {
        window.ChatWidget.sendUserMessage(msg);
      }
      handleCallBella();
    });
  }

  // ==========================================================================
  // 5. Retirement Planning Logic (AI_วางแผนการเกษียณ)
  // ==========================================================================

  const retireElements = {
    currentAge: document.getElementById('retire-current-age'),
    targetAge: document.getElementById('retire-target-age'),
    monthlyExpense: document.getElementById('retire-monthly-expense'),
    currentSavings: document.getElementById('retire-current-savings'),
    resYearsLeft: document.getElementById('retire-res-years-left'),
    resFundNeeded: document.getElementById('retire-res-fund-needed'),
    resMonthlyTarget: document.getElementById('retire-res-monthly-target'),
    btnAskBella: document.getElementById('btn-retire-ask-bella'),
  };

  function updateRetirementPlan() {
    if (!retireElements.currentAge || !retireElements.targetAge) return;

    const curAge = parseInt(retireElements.currentAge.value) || 30;
    const tarAge = parseInt(retireElements.targetAge.value) || 60;
    const monthlyExp = parseFloat(retireElements.monthlyExpense.value) || 20000;
    const curSavings = parseFloat(retireElements.currentSavings.value) || 0;

    const yearsLeft = Math.max(1, tarAge - curAge);
    const fundNeeded = monthlyExp * 12 * 20;
    const remainingToSave = Math.max(0, fundNeeded - curSavings);
    const monthsLeft = yearsLeft * 12;
    const monthlyTarget = monthsLeft > 0 ? Math.round(remainingToSave / monthsLeft) : 0;

    const nf = new Intl.NumberFormat('th-TH');
    retireElements.resYearsLeft.textContent = `${yearsLeft} ปี`;
    retireElements.resFundNeeded.textContent = `฿${nf.format(Math.round(fundNeeded))}`;
    retireElements.resMonthlyTarget.textContent = `฿${nf.format(monthlyTarget)} / เดือน`;
  }

  [retireElements.currentAge, retireElements.targetAge, retireElements.monthlyExpense, retireElements.currentSavings].forEach(inp => {
    if (inp) inp.addEventListener('input', updateRetirementPlan);
  });

  if (retireElements.btnAskBella) {
    retireElements.btnAskBella.addEventListener('click', () => {
      const curAge = retireElements.currentAge.value;
      const tarAge = retireElements.targetAge.value;
      const yearsLeft = retireElements.resYearsLeft.textContent;
      const fund = retireElements.resFundNeeded.textContent;
      const msg = `ผู้ใช้กำลังวางแผนเกษียณ: อายุปัจจุบัน ${curAge} ปี ต้องการเกษียณที่อายุ ${tarAge} ปี (เหลือเวลา ${yearsLeft}) ต้องเตรียมเงินกองทุนเกษียณประมาณ ${fund}. ช่วยประเมินแผนเกษียณและแนะนำทางเลือกการออม/ลงทุนให้หน่อยค่ะ`;

      if (window.ChatWidget?.sendUserMessage) {
        window.ChatWidget.sendUserMessage(msg);
      }
      handleCallBella();
    });
  }

  // ==========================================================================
  // 6. Accessible FAQ Accordions
  // ==========================================================================

  document.querySelectorAll('.faq-question').forEach((button) => {
    button.addEventListener('click', () => {
      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!isExpanded));
    });
  });

  // Initial runs
  updateLoanCalculation();
  updateSavingsPlan();
  updateRetirementPlan();

  if (!currentWidgetId) {
    updateWidgetUIStatus(false);
  }

  // Initialize active page from URL hash
  const initialHash = window.location.hash.replace('#', '');
  navigateToPage(initialHash || 'welcome', false);

})();

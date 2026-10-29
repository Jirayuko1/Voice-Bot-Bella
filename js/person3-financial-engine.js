/**
 * ============================================================================
 * [PERSON 3: FINANCIAL ENGINE & ADVISORY LEAD]
 * ============================================================================
 * ผู้รับผิดชอบ: คนที่ 3 (สูตรคำนวณสุขภาพการเงิน & การลงทุน/สินเชื่อ)
 * ขอบเขต:
 *   1. โมดูล AI_ตรวจสุขภาพการเงินเบื้องต้น (Financial Health Quiz)
 *      - คำนวณคณิตศาสตร์ 4 สูตร: Surplus, Surplus Ratio, Debt Ratio (DSR), Emergency Months
 *      - ระบบตัดเกรด 3 ระดับ (3-Tier Diagnostic: Good, Moderate, Improve)
 *      - ระบบจับคู่แนะนำผลิตภัณฑ์สินเชื่อและเงินฝากอัตโนมัติ
 *   2. เครื่องคำนวณค่างวดสินเชื่อและเงินกู้ (Loan & Credit Calculator)
 *      - คำนวณดอกเบี้ยแบบลดต้นลดดอก (Amortization PMT) และ Flat Rate
 *   3. การซิงก์ผลลัพธ์เพื่อส่งต่อ (Cross-Sell Handoff) ให้คนที่ 2 (ออม/เกษียณ)
 * ============================================================================
 */

export function initFinancialEngine({ talkToBella, showToast, stateStore, navigateToPage }) {
  console.log('[Person 3: Financial Engine] Initializing...');

  // --------------------------------------------------------------------------
  // 1. โมดูล AI_ตรวจสุขภาพการเงินเบื้องต้น (Financial Health Quiz)
  // --------------------------------------------------------------------------
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

    // Result UI
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

  let localGoal = 'loan';

  function setQuizStep(stepNumber) {
    if (quizElements.progressbar) {
      quizElements.progressbar.setAttribute('aria-valuenow', String(stepNumber));
    }
    quizElements.steps.forEach((step, idx) => {
      if (step) step.classList.toggle('active', idx + 1 === stepNumber);
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

  // Quiz Navigation
  if (quizElements.btnNext1) {
    quizElements.btnNext1.addEventListener('click', () => {
      const selected = document.querySelector('input[name="quiz_goal"]:checked');
      if (selected) localGoal = selected.value;
      setQuizStep(2);
    });
  }

  if (quizElements.btnPrev2) {
    quizElements.btnPrev2.addEventListener('click', () => setQuizStep(1));
  }

  if (quizElements.btnNext2) {
    quizElements.btnNext2.addEventListener('click', () => {
      const income = parseFloat(quizElements.inputIncome.value) || 0;
      if (income <= 0) {
        showToast('กรุณาระบุรายรับต่อเดือนที่มากกว่า 0 บาท');
        quizElements.inputIncome.focus();
        return;
      }
      setQuizStep(3);
    });
  }

  if (quizElements.btnPrev3) {
    quizElements.btnPrev3.addEventListener('click', () => setQuizStep(2));
  }

  // คำนวณผลตามสูตรคณิตศาสตร์ 4 ข้อในสัญญา STATE_CONTRACT.md (คนที่ 3)
  if (quizElements.btnCalculate) {
    quizElements.btnCalculate.addEventListener('click', () => {
      const income = parseFloat(quizElements.inputIncome.value) || 0;
      const expense = parseFloat(quizElements.inputExpense.value) || 0;
      const debt = parseFloat(quizElements.inputDebt.value) || 0;
      const savings = parseFloat(quizElements.inputSavings.value) || 0;

      // 1. Surplus Amount
      const surplus = income - expense - debt;

      // 2. Surplus Ratio (%)
      const surplusRatio = income > 0 ? (surplus / income) * 100 : 0;

      // 3. Debt Ratio / DSR (%)
      const debtRatio = income > 0 ? (debt / income) * 100 : 0;

      // 4. Emergency Fund (Months)
      const emergencyMonths = expense > 0 ? (savings / expense) : 0;

      // 3-Tier Diagnostic Logic (ตาม Blueprint ของคนที่ 3)
      let level = 'improve';
      if (surplusRatio >= 20 && debtRatio <= 35 && emergencyMonths >= 6) {
        level = 'good';
      } else if (surplusRatio >= 10 && debtRatio <= 45 && emergencyMonths >= 3) {
        level = 'moderate';
      }

      // บันทึกลง State Store กลาง
      stateStore.financialData.financial_monthly_income = income;
      stateStore.financialData.financial_monthly_expense = expense;
      stateStore.financialData.financial_monthly_debt_payment = debt;
      stateStore.financialData.financial_current_savings = savings;
      stateStore.financialData.financial_surplus_amount = surplus;
      stateStore.financialData.financial_surplus_ratio = surplusRatio;
      stateStore.financialData.financial_debt_ratio = debtRatio;
      stateStore.financialData.financial_emergency_months = emergencyMonths;
      stateStore.financialData.financial_health_level = level;

      renderHealthResults(level, surplus, surplusRatio, debtRatio, emergencyMonths, income);
      setQuizStep(4);
    });
  }

  function renderHealthResults(level, surplus, surplusRatio, debtRatio, emergencyMonths, income) {
    const nf = new Intl.NumberFormat('th-TH');

    // Badge
    if (level === 'good') {
      quizElements.healthIcon.textContent = '🌟';
      quizElements.healthTitle.textContent = 'สุขภาพการเงินดีเยี่ยม (Good)';
      quizElements.healthTitle.style.color = '#34d399';
    } else if (level === 'moderate') {
      quizElements.healthIcon.textContent = '⚖️';
      quizElements.healthTitle.textContent = 'สุขภาพการเงินปานกลาง (Moderate)';
      quizElements.healthTitle.style.color = '#fbbf24';
    } else {
      quizElements.healthIcon.textContent = '⚠️';
      quizElements.healthTitle.textContent = 'สุขภาพการเงินควรปรับปรุง (Improve)';
      quizElements.healthTitle.style.color = '#f87171';
    }

    quizElements.surplusAmount.textContent = `฿${nf.format(Math.round(surplus))}`;
    quizElements.surplusRatio.textContent = `คิดเป็น ${surplusRatio.toFixed(1)}% ของรายรับ`;

    quizElements.debtRatio.textContent = `${debtRatio.toFixed(1)}%`;
    if (debtRatio <= 35) {
      quizElements.debtStatus.textContent = 'เกณฑ์ปลอดภัย (≤ 35%)';
      quizElements.debtStatus.className = 'metric-sub text-success';
    } else if (debtRatio <= 45) {
      quizElements.debtStatus.textContent = 'เกณฑ์เฝ้าระวัง (36-45%)';
      quizElements.debtStatus.className = 'metric-sub text-warning';
    } else {
      quizElements.debtStatus.textContent = 'เกณฑ์เสี่ยงสูง (> 45%)';
      quizElements.debtStatus.className = 'metric-sub text-danger';
    }

    quizElements.emergencyMonths.textContent = `${emergencyMonths.toFixed(1)} เดือน`;
    if (emergencyMonths >= 6) {
      quizElements.emergencyStatus.textContent = 'สำรองฉุกเฉินเพียงพอมาก (≥ 6 เดือน)';
      quizElements.emergencyStatus.className = 'metric-sub text-success';
    } else if (emergencyMonths >= 3) {
      quizElements.emergencyStatus.textContent = 'สำรองปานกลาง (3-6 เดือน)';
      quizElements.emergencyStatus.className = 'metric-sub text-warning';
    } else {
      quizElements.emergencyStatus.textContent = 'สำรองน้อย (< 3 เดือน)';
      quizElements.emergencyStatus.className = 'metric-sub text-danger';
    }

    // AI Advice
    if (level === 'good') {
      quizElements.aiAdviceText.textContent = `ยอดเยี่ยมมากค่ะ! คุณมีเงินเหลือเก็บเดือนละ ฿${nf.format(Math.round(surplus))} และมีเงินสำรอง ${emergencyMonths.toFixed(1)} เดือน สามารถต่อยอดไปสู่การเปิดบัญชี e-Savings ดอกเบี้ยสูง หรือหากต้องการขอสินเชื่อ คุณมีศักยภาพในการผ่อนชำระในเกณฑ์ดีมากค่ะ`;
    } else if (level === 'moderate') {
      quizElements.aiAdviceText.textContent = `สถานะการเงินอยู่ในระดับที่ควบคุมได้ค่ะ สัดส่วนภาระหนี้สินอยู่ที่ ${debtRatio.toFixed(1)}% เบลล่าขอแนะนำให้วางแผนเพิ่มเงินสำรองฉุกเฉินให้แตะ 6 เดือน โดยฝากประจำปลอดภาษี 24 เดือน หรือหากจะกู้เงิน ควรเลือกสินเชื่อดอกเบี้ยต่ำเพื่อลดภาระต่องวดค่ะ`;
    } else {
      quizElements.aiAdviceText.textContent = `สุขภาพการเงินยังมีจุดที่ต้องระมัดระวังค่ะ เนื่องจากเงินเหลือต่อเดือนหรือเงินสำรองยังไม่สูงนัก แนะนำให้เริ่มจากการจัดทำงบรายรับรายจ่าย ลดหนี้ดอกเบี้ยสูงด้วยการรวมหนี้ และสร้างเงินสำรองฉุกเฉินก้อนแรกให้ได้ก่อนค่ะ`;
    }

    // Recommended Products
    const products = [];
    if (localGoal === 'loan' || debtRatio <= 40) {
      products.push({
        title: 'สินเชื่อบ้านดอกเบี้ยพิเศษ (Home Loan)',
        rate: 'ดอกเบี้ยเฉลี่ย 3.25% ต่อปี',
        desc: `ประเมินวงเงินกู้ที่ผ่อนสบายตามรายได้: สูงสุดประมาณ ฿${nf.format(Math.round(income * 60))}`,
        targetId: 'product-home-loan',
      });
      products.push({
        title: 'สินเชื่อส่วนบุคคล Bella Speedy (รวมหนี้)',
        rate: 'ดอกเบี้ยเริ่มต้น 9.99% ต่อปี',
        desc: 'รวมหนี้หลายทางเป็นก้อนเดียว ผ่อนจ่ายที่เดียว ค่างวดลดลง ดอกเบี้ยลดต้นลดดอก',
        targetId: 'product-personal-loan',
      });
    }

    if (emergencyMonths < 6) {
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

    quizElements.recProductsContainer.innerHTML = products.map((p) => `
      <div class="rec-product-card">
        <div>
          <h5>${p.title}</h5>
          <div class="rec-rate">${p.rate}</div>
          <p>${p.desc}</p>
        </div>
        <a href="#${p.targetId}" class="btn btn-outline btn-jump-product" data-page="${p.targetId}" style="align-self: flex-start; padding: 6px 14px; font-size: 0.8125rem;">
          ดูรายละเอียดผลิตภัณฑ์ &rarr;
        </a>
      </div>
    `).join('');
  }

  if (quizElements.btnReset) {
    quizElements.btnReset.addEventListener('click', () => setQuizStep(1));
  }

  // ซิงก์ผลเข้า Voice Bot
  if (quizElements.btnSyncToBella) {
    quizElements.btnSyncToBella.addEventListener('click', () => {
      const { financial_monthly_income, financial_debt_ratio, financial_emergency_months, financial_health_level } = stateStore.financialData;
      const msg = `ผลการตรวจสุขภาพการเงิน: รายรับ ฿${financial_monthly_income}, ภาระหนี้ ${financial_debt_ratio.toFixed(1)}%, เงินสำรอง ${financial_emergency_months.toFixed(1)} เดือน, ระดับสุขภาพคือ ${financial_health_level}, วัตถุประสงค์คือ ${localGoal}. ช่วยวิเคราะห์และแนะนำสินเชื่อ/เงินฝากเพิ่มเติมให้หน่อยค่ะ`;
      talkToBella(msg);
    });
  }

  // --------------------------------------------------------------------------
  // 2. เครื่องคำนวณค่างวดสินเชื่อและเงินกู้ (Loan & Credit Calculator)
  // --------------------------------------------------------------------------
  const calcElements = {
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
      // Flat Rate Calculation
      totalInterest = principal * (annualRate / 100) * years;
      totalPaid = principal + totalInterest;
      monthly = months > 0 ? totalPaid / months : 0;
    } else {
      // Reducing Balance PMT Amortization
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
      const selected = calcElements.loanType.selectedOptions[0];
      if (selected) {
        const rate = selected.getAttribute('data-rate');
        const yrs = selected.getAttribute('data-years');
        if (rate) calcElements.rateInput.value = rate;
        if (yrs) {
          calcElements.termInput.value = yrs;
          calcElements.termRange.value = yrs;
        }
      }
      updateLoanCalculation();
    });
  }

  // Sliders sync
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
      talkToBella(msg);
    });
  }

  // ปุ่มคำนวณค่างวดจากการ์ดผลิตภัณฑ์ -> สลับไปหน้า #calculator พร้อมเลือกประเภทสินเชื่อ
  document.querySelectorAll('.btn-calc-loan').forEach((btn) => {
    btn.addEventListener('click', () => {
      const loanType = btn.getAttribute('data-loan-type');
      if (calcElements.loanType) {
        calcElements.loanType.value = loanType;
        calcElements.loanType.dispatchEvent(new Event('change'));
      }
      if (typeof navigateToPage === 'function') {
        navigateToPage('calculator', true);
      } else if (typeof window.navigateToPage === 'function') {
        window.navigateToPage('calculator', true);
      } else {
        const calcSection = document.getElementById('calculator');
        if (calcSection) calcSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // เรียกคำนวณตั้งต้นทันที
  updateLoanCalculation();
}

/**
 * ============================================================================
 * [PERSON 3: FINANCIAL ENGINE & ADVISORY LEAD]
 * ============================================================================
 * ผู้รับผิดชอบ: คนที่ 3 (Financial Engine & Advisory Lead)
 * อ้างอิง: GUIDE_PERSON_3_FINANCIAL_ENGINE.md, STATE_CONTRACT.md, SESSION_STATE_SCHEMA.json
 * ขอบเขต:
 *   1. โมดูล AI_ตรวจสุขภาพการเงินเบื้องต้น (#quiz)
 *      - คำนวณคณิตศาสตร์ 4 สูตร: Surplus, Surplus Ratio, Debt Ratio (DSR), Emergency Months
 *      - ระบบตัดเกรด 3 ระดับ (3-Tier Diagnostic: good, moderate, improve)
 *      - ซิงก์ข้อมูลข้ามโมดูลไปให้คนที่ 2 (AI_วางแผนการออม & AI_วางแผนการเกษียณ) อัตโนมัติ
 *   2. โมดูล AI_วางแผนการลงทุน (#investment ในหน้า #loans)
 *      - ภายใต้กฎเหล็ก Compliance Guardrails (Zero Hallucination, ห้ามรับประกันผลตอบแทน,
 *        ห้ามฟันธงความเหมาะสมโดยไม่ประเมินความเสี่ยง)
 *      - หมวดที่ 1: เรื่องน่ารู้การลงทุน (Tools_การลงทุนน่ารู้)
 *      - หมวดที่ 2: ตัวอย่างกองทุนแนะนำ (Tools_กองทุนแนะนำ) พร้อมแสดงประโยคปฏิเสธมาตรฐานทันทีเมื่อไม่พบข้อมูล
 *      - หมวดที่ 3: ปรึกษาที่ปรึกษาการเงิน (transfer_to_human_agent)
 *      - อัปเดตตัวแปร investment_topic, investment_question, investment_answer,
 *        investment_interest_status ใน stateStore.financialData
 *   3. เครื่องคำนวณค่างวดสินเชื่อและเงินกู้ (#calculator)
 * ============================================================================
 */

// ฐานข้อมูลความรู้ที่ได้รับการยืนยันจาก Tools_การลงทุนน่ารู้ (Zero Hallucination Source)
const TOOLS_INVESTMENT_KNOWLEDGE = {
  start: {
    title: 'เริ่มต้นลงทุนอย่างไรดีสำหรับมือใหม่?',
    question: 'วิธีเริ่มต้นลงทุนสำหรับมือใหม่ต้องเตรียมตัวอย่างไรบ้าง?',
    answer:
      'ก่อนเริ่มลงทุน ควรสำรวจสุขภาพการเงินและกันเงินสำรองฉุกเฉินอย่างน้อย 3–6 เท่าของค่าใช้จ่ายรายเดือนไว้ในสินทรัพย์สภาพคล่องสูง จากนั้นจึงกำหนดเป้าหมายการลงทุน ทำแบบประเมินความเสี่ยง (Suitability Test) และเลือกลงทุนในสินทรัพย์ที่เข้าใจนโยบายอย่างชัดเจน โดยไม่ใช้เงินกู้ยืมมาลงทุน',
    highlights: [
      'กันเงินสำรองฉุกเฉิน 3–6 เดือนของค่าใช้จ่ายจำเป็นก่อนเริ่มลงทุน',
      'กำหนดเป้าหมายและระยะเวลาการลงทุน (สั้น กลาง ยาว) ให้ชัดเจน',
      'ทำแบบประเมินความเสี่ยง (Suitability Test) เพื่อทราบระดับความเสี่ยงที่ยอมรับได้'
    ]
  },
  risk: {
    title: 'ความเสี่ยงในการลงทุนคืออะไร และมีกี่ระดับ?',
    question: 'ความเสี่ยงในการลงทุนคืออะไร และเกี่ยวข้องกับผลตอบแทนอย่างไร?',
    answer:
      'ความเสี่ยงในการลงทุน คือโอกาสที่ผลตอบแทนจริงจะคลาดเคลื่อนไปจากที่คาดหวัง หรือเกิดการขาดทุนของเงินต้น โดยทั่วไปสินทรัพย์ที่มีโอกาสให้ผลตอบแทนสูงจะมีความผันผวนสูงตามไปด้วย กองทุนรวมในไทยแบ่งระดับความเสี่ยงเป็น 8 ระดับ ตั้งแต่ระดับ 1 (กองทุนรวมตลาดเงินในประเทศ) ไปจนถึงระดับ 8 (กองทุนรวมสินทรัพย์ทางเลือก)',
    highlights: [
      'ความเสี่ยงต่ำ (ระดับ 1–4): กองทุนรวมตลาดเงินและตราสารหนี้ ความผันผวนต่ำ',
      'ความเสี่ยงปานกลาง (ระดับ 5): กองทุนรวมผสม กระจายลงทุนทั้งตราสารหนี้และหุ้น',
      'ความเสี่ยงสูง (ระดับ 6–8): กองทุนรวมตราสารทุน หมวดอุตสาหกรรม และสินทรัพย์ทางเลือก'
    ]
  },
  dca: {
    title: 'DCA (Dollar-Cost Averaging) ถัวเฉลี่ยต้นทุนคืออะไร?',
    question: 'การลงทุนแบบ DCA (Dollar-Cost Averaging) คืออะไร และมีข้อดีอย่างไร?',
    answer:
      'DCA (Dollar-Cost Averaging) คือกลยุทธ์การทยอยลงทุนด้วยจำนวนเงินที่เท่ากันอย่างสม่ำเสมอในทุกงวด (เช่น ทุกเดือน) โดยไม่คำนึงถึงราคาสินทรัพย์ในขณะนั้น ช่วยสร้างวินัยการออมและการลงทุนระยะยาว ลดความกังวลในการจับจังหวะตลาด (Market Timing) และช่วยถัวเฉลี่ยต้นทุนในระยะยาว ทั้งนี้ DCA ไม่ได้เป็นการรับประกันผลกำไรหรือป้องกันการขาดทุนในตลาดขาลง',
    highlights: [
      'ลงทุนด้วยจำนวนเงินเท่ากันทุกเดือนอย่างมีวินัย (เช่น เดือนละ 2,000–5,000 บาท)',
      'ลดอารมณ์ความกลัวและความโลภในการจับจังหวะซื้อขายระยะสั้น',
      'เหมาะสำหรับผู้มีรายได้ประจำที่ต้องการสะสมความมั่งคั่งระยะยาว'
    ]
  },
  portfolio: {
    title: 'การจัดพอร์ต (Asset Allocation) และการปรับสมดุลพอร์ต (Rebalancing)',
    question: 'การจัดพอร์ตกระจายความเสี่ยงและการทำ Rebalancing คืออะไร?',
    answer:
      'การจัดพอร์ต (Asset Allocation) คือการกระจายเงินลงทุนไปยังสินทรัพย์หลายประเภทที่มีความสัมพันธ์กันต่ำ เช่น เงินฝาก ตราสารหนี้ และตราสารทุน เพื่อลดความผันผวนของพอร์ตโดยรวม ส่วนการปรับสมดุลพอร์ต (Rebalancing) คือการทบทวนและปรับสัดส่วนสินทรัพย์ให้กลับมาอยู่ในระดับความเสี่ยงที่ตั้งใจไว้เป็นระยะ เช่น ทุก 6 เดือน หรือ 1 ปี',
    highlights: [
      'ไม่ใส่ไข่ทุกฟองไว้ในตะกร้าใบเดียว (กระจายสินทรัพย์ตามระดับความเสี่ยง)',
      'ทบทวนพอร์ตทุก 6–12 เดือนเพื่อปรับสัดส่วน (Rebalancing) ให้ตรงเป้าหมาย',
      'ปรับลดสัดส่วนสินทรัพย์เสี่ยงลงเมื่อเข้าใกล้อายุเกษียณหรือเป้าหมายการใช้เงิน'
    ]
  }
};

// ฐานข้อมูลกองทุนที่ได้รับการยืนยันจาก Tools_กองทุนแนะนำ (Zero Hallucination Source)
const TOOLS_RECOMMENDED_FUNDS = [
  {
    code: 'BELLA-MMF',
    name: 'กองทุนเปิด เบลล่า ตลาดเงินมั่นคง (BELLA-MMF)',
    riskCategory: 'low',
    riskLevel: 'ความเสี่ยงระดับ 1 (ต่ำ)',
    assetClass: 'กองทุนรวมตลาดเงินในประเทศ',
    minAmount: '1,000 บาท',
    dividendPolicy: 'ไม่จ่ายเงินปันผล (สะสมมูลค่า)',
    summary:
      'เน้นลงทุนในเงินฝากและตราสารหนี้ภาครัฐระยะสั้นที่มีสภาพคล่องสูง เหมาะสำหรับพักเงินระยะสั้นหรือสำรองสภาพคล่อง',
    perks: [
      'สภาพคล่องสูง ซื้อขายได้รับเงินคืนภายใน T+1 วันทำการ',
      'ความผันผวนต่ำมาก เน้นรักษาเงินต้นและสภาพคล่อง',
      'ไม่มีค่าธรรมเนียมการขายและรับซื้อคืนหน่วยลงทุน'
    ]
  },
  {
    code: 'BELLA-FIXED',
    name: 'กองทุนเปิด เบลล่า ตราสารหนี้คุณภาพ (BELLA-FIXED)',
    riskCategory: 'low',
    riskLevel: 'ความเสี่ยงระดับ 4 (ปานกลางค่อนข้างต่ำ)',
    assetClass: 'กองทุนรวมตราสารหนี้',
    minAmount: '1,000 บาท',
    dividendPolicy: 'ไม่จ่ายเงินปันผล',
    summary:
      'ลงทุนในพันธบัตรรัฐบาลและหุ้นกู้เอกชนชั้นดีในประเทศที่มีอันดับความน่าเชื่อถือ Investment Grade ขึ้นไป',
    perks: [
      'โอกาสรับผลตอบแทนสม่ำเสมอภายใต้ความเสี่ยงระดับต่ำ–ปานกลาง',
      'กระจายการลงทุนในตราสารหนี้ภาครัฐและเอกชนคุณภาพสูง',
      'เหมาะสำหรับการลงทุนระยะเวลา 1 ปีขึ้นไป'
    ]
  },
  {
    code: 'BELLA-BALANCE',
    name: 'กองทุนเปิด เบลล่า ผสมสมดุลมั่งคั่ง (BELLA-BALANCE)',
    riskCategory: 'medium',
    riskLevel: 'ความเสี่ยงระดับ 5 (ปานกลางค่อนข้างสูง)',
    assetClass: 'กองทุนรวมผสม (Balanced Fund)',
    minAmount: '1,000 บาท',
    dividendPolicy: 'จ่ายเงินปันผลไม่เกินปีละ 2 ครั้ง',
    summary:
      'กระจายการลงทุนในตราสารหนี้คุณภาพดีและตราสารทุนในสัดส่วนที่ยืดหยุ่น เพื่อสร้างสมดุลระหว่างความมั่นคงและโอกาสเติบโต',
    perks: [
      'ผู้จัดการกองทุนปรับสัดส่วนหุ้นและตราสารหนี้ตามสภาวะตลาด',
      'ลดความผันผวนเมื่อเทียบกับการลงทุนในหุ้นเพียงอย่างเดียว',
      'รองรับการวางแผนลงทุนรายเดือนแบบ DCA'
    ]
  },
  {
    code: 'BELLA-SET50',
    name: 'กองทุนเปิด เบลล่า ดัชนีหุ้นไทย SET50 (BELLA-SET50)',
    riskCategory: 'high',
    riskLevel: 'ความเสี่ยงระดับ 6 (สูง)',
    assetClass: 'กองทุนรวมดัชนีตราสารทุน (Index Fund)',
    minAmount: '500 บาท',
    dividendPolicy: 'มีทั้งชนิดสะสมมูลค่าและจ่ายปันผล',
    summary:
      'ลงทุนในหุ้นสามัญของบริษัทขนาดใหญ่ 50 อันดับแรกในตลาดหลักทรัพย์แห่งประเทศไทย เพื่อสร้างผลตอบแทนใกล้เคียงดัชนี SET50',
    perks: [
      'ค่าธรรมเนียมการจัดการต่ำตามสไตล์กองทุนดัชนี (Passive Fund)',
      'กระจายลงทุนในหุ้นขนาดใหญ่ 50 บริษัทชั้นนำของไทย',
      'เหมาะสำหรับการสะสมความมั่งคั่งระยะยาวด้วยวิธี DCA'
    ]
  },
  {
    code: 'BELLA-GLOBAL-EQ',
    name: 'กองทุนเปิด เบลล่า หุ้นโลกยั่งยืน (BELLA-GLOBAL-EQ)',
    riskCategory: 'high',
    riskLevel: 'ความเสี่ยงระดับ 6 (สูง)',
    assetClass: 'กองทุนรวมตราสารทุนต่างประเทศ (Feeder Fund)',
    minAmount: '1,000 บาท',
    dividendPolicy: 'ไม่จ่ายเงินปันผล (สะสมมูลค่า)',
    summary:
      'กระจายการลงทุนในหุ้นบริษัทชั้นนำทั่วโลกที่มีปัจจัยพื้นฐานแข็งแกร่งและเติบโตอย่างยั่งยืน มีนโยบายป้องกันความเสี่ยงอัตราแลกเปลี่ยนตามดุลยพินิจ',
    perks: [
      'เปิดโอกาสกระจายพอร์ตสู่ตลาดหุ้นคุณภาพทั่วโลก',
      'บริหารโดยทีมผู้เชี่ยวชาญระดับสากล',
      'ต้องทำแบบประเมินความเสี่ยงและรับทราบความเสี่ยงด้านอัตราแลกเปลี่ยนก่อนลงทุน'
    ]
  }
];

// ประโยคปฏิเสธมาตรฐานตาม GUIDE_PERSON_3_FINANCIAL_ENGINE.md ข้อ 4.2
const UNVERIFIED_FUND_FALLBACK_TEXT =
  'ขออภัยค่ะ ตอนนี้เบลล่ายังไม่มีรายละเอียดกองทุนที่สามารถยืนยันได้ คุณลูกค้าสนใจนัดหมายที่ปรึกษาทางการเงินเพิ่มเติมไหมคะ?';

export function initFinancialEngine({ talkToBella, showToast, stateStore, navigateToPage }) {
  console.log('[Person 3: Financial Engine] Initializing...');

  // กำหนดค่าเริ่มต้นใน stateStore.financialData ตาม SESSION_STATE_SCHEMA.json
  Object.assign(stateStore.financialData, {
    financial_monthly_income: stateStore.financialData.financial_monthly_income ?? null,
    financial_monthly_expense: stateStore.financialData.financial_monthly_expense ?? null,
    financial_monthly_debt_payment: stateStore.financialData.financial_monthly_debt_payment ?? null,
    financial_current_savings: stateStore.financialData.financial_current_savings ?? null,
    financial_surplus_amount: stateStore.financialData.financial_surplus_amount ?? null,
    financial_surplus_ratio: stateStore.financialData.financial_surplus_ratio ?? null,
    financial_debt_ratio: stateStore.financialData.financial_debt_ratio ?? null,
    financial_emergency_months: stateStore.financialData.financial_emergency_months ?? null,
    financial_health_level: stateStore.financialData.financial_health_level ?? null,
    financial_next_action: stateStore.financialData.financial_next_action ?? null,
    investment_topic: stateStore.financialData.investment_topic ?? 'เรื่องน่ารู้การลงทุน',
    investment_question:
      stateStore.financialData.investment_question ?? TOOLS_INVESTMENT_KNOWLEDGE.start.question,
    investment_answer:
      stateStore.financialData.investment_answer ?? TOOLS_INVESTMENT_KNOWLEDGE.start.answer,
    investment_interest_status: stateStore.financialData.investment_interest_status ?? false
  });

  // --------------------------------------------------------------------------
  // 1. โมดูล AI_ตรวจสุขภาพการเงินเบื้องต้น (Financial Health Assessment - 3 Steps)
  // --------------------------------------------------------------------------
  const quizElements = {
    progressbar: document.getElementById('quiz-progressbar'),
    steps: [
      document.getElementById('quiz-step-1'),
      document.getElementById('quiz-step-2'),
      document.getElementById('quiz-step-3')
    ],
    nodes: [
      document.getElementById('step-node-1'),
      document.getElementById('step-node-2'),
      document.getElementById('step-node-3')
    ],
    btnNext1: document.getElementById('btn-quiz-next-1'),
    btnPrev2: document.getElementById('btn-quiz-prev-2'),
    btnCalculate: document.getElementById('btn-quiz-calculate'),
    btnReset: document.getElementById('btn-quiz-reset'),
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
    recProductsContainer: document.getElementById('recommended-products-container')
  };

  function setQuizStep(stepNumber) {
    if (quizElements.progressbar) {
      quizElements.progressbar.setAttribute('aria-valuenow', String(stepNumber));
    }
    quizElements.steps.forEach((step, idx) => {
      if (!step) return;
      const isActive = idx + 1 === stepNumber;
      step.classList.toggle('active', isActive);
      if (isActive) {
        step.removeAttribute('hidden');
        step.hidden = false;
      } else {
        step.setAttribute('hidden', '');
        step.hidden = true;
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

  /**
   * คำนวณสูตรคณิตศาสตร์ทั้ง 4 ข้อตาม GUIDE_PERSON_3_FINANCIAL_ENGINE.md ข้อ 3.2 และ 3.3
   */
  function evaluateFinancialHealth() {
    const income = parseFloat(quizElements.inputIncome?.value) || 0;
    const expense = parseFloat(quizElements.inputExpense?.value) || 0;
    const debt = parseFloat(quizElements.inputDebt?.value) || 0;
    const savings = parseFloat(quizElements.inputSavings?.value) || 0;

    // 1. <<financial_surplus_amount>>
    const surplus = income - expense - debt;

    // 2. <<financial_surplus_ratio>>
    const surplusRatio = income > 0 ? (surplus / income) * 100 : 0;

    // 3. <<financial_debt_ratio>>
    const debtRatio = income > 0 ? (debt / income) * 100 : 0;

    // 4. <<financial_emergency_months>>
    const emergencyMonths = expense > 0 ? savings / expense : 0;

    // 3-Tier Diagnostic Logic (ข้อ 3.3)
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
    stateStore.financialData.financial_surplus_amount = Number(surplus.toFixed(2));
    stateStore.financialData.financial_surplus_ratio = Number(surplusRatio.toFixed(1));
    stateStore.financialData.financial_debt_ratio = Number(debtRatio.toFixed(1));
    stateStore.financialData.financial_emergency_months = Number(emergencyMonths.toFixed(1));
    stateStore.financialData.financial_health_level = level;

    // ซิงก์ค่าเงินออมปัจจุบันไปให้ฟอร์มของคนที่ 2 อัตโนมัติ (Pre-filling Slots)
    const savingCurrentInput = document.getElementById('saving-current-input');
    if (savingCurrentInput && savings >= 0) {
      savingCurrentInput.value = String(Math.round(savings));
      savingCurrentInput.dispatchEvent(new Event('input'));
    }
    const retireSavingsInput = document.getElementById('retire-current-savings');
    if (retireSavingsInput && savings >= 0) {
      retireSavingsInput.value = String(Math.round(savings));
      retireSavingsInput.dispatchEvent(new Event('input'));
    }
    const retireExpenseInput = document.getElementById('retire-monthly-expense');
    if (retireExpenseInput && expense > 0) {
      retireExpenseInput.value = String(Math.round(expense));
      retireExpenseInput.dispatchEvent(new Event('input'));
    }

    renderHealthResults(level, surplus, surplusRatio, debtRatio, emergencyMonths, income);
    return { level, surplus, surplusRatio, debtRatio, emergencyMonths, income };
  }

  function renderHealthResults(level, surplus, surplusRatio, debtRatio, emergencyMonths, income) {
    if (!quizElements.healthTitle) return;
    const nf = new Intl.NumberFormat('th-TH');

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
      quizElements.debtStatus.textContent = 'เกณฑ์เฝ้าระวัง (36–45%)';
      quizElements.debtStatus.className = 'metric-sub text-warning';
    } else {
      quizElements.debtStatus.textContent = 'เกณฑ์ภาระหนี้สูง (> 45%)';
      quizElements.debtStatus.className = 'metric-sub text-danger';
    }

    quizElements.emergencyMonths.textContent = `${emergencyMonths.toFixed(1)} เดือน`;
    if (emergencyMonths >= 6) {
      quizElements.emergencyStatus.textContent = 'สำรองฉุกเฉินเพียงพอ (≥ 6 เดือน)';
      quizElements.emergencyStatus.className = 'metric-sub text-success';
    } else if (emergencyMonths >= 3) {
      quizElements.emergencyStatus.textContent = 'สำรองปานกลาง (3–6 เดือน)';
      quizElements.emergencyStatus.className = 'metric-sub text-warning';
    } else {
      quizElements.emergencyStatus.textContent = 'สำรองน้อย (< 3 เดือน)';
      quizElements.emergencyStatus.className = 'metric-sub text-danger';
    }

    const customerName = stateStore.displayName || 'คุณลูกค้า';
    if (level === 'good') {
      quizElements.aiAdviceText.textContent = `${customerName}มีสุขภาพการเงินในระดับดีเยี่ยมค่ะ มีเงินคงเหลือสุทธิเดือนละ ฿${nf.format(Math.round(surplus))} (${surplusRatio.toFixed(1)}%) ภาระหนี้อยู่ในเกณฑ์ปลอดภัย (${debtRatio.toFixed(1)}%) และมีเงินสำรองฉุกเฉินพร้อมรับมือวิกฤตถึง ${emergencyMonths.toFixed(1)} เดือน แนะนำให้ต่อยอดความมั่งคั่งด้วยการออมดอกเบี้ยสูง วางแผนเกษียณ หรือศึกษาการลงทุนในกองทุนรวมค่ะ`;
    } else if (level === 'moderate') {
      quizElements.aiAdviceText.textContent = `${customerName}มีสุขภาพการเงินในระดับปานกลางค่ะ เริ่มมีเงินคงเหลือเดือนละ ฿${nf.format(Math.round(surplus))} (${surplusRatio.toFixed(1)}%) และมีเงินสำรองฉุกเฉิน ${emergencyMonths.toFixed(1)} เดือน แนะนำให้ทยอยสะสมเงินสำรองฉุกเฉินให้ครบ 6 เดือน และควบคุมสัดส่วนภาระหนี้ไม่ให้เกิน 35% ของรายรับค่ะ`;
    } else {
      quizElements.aiAdviceText.textContent = `${customerName}มีจุดที่ควรปรับปรุงเรื่องสภาพคล่องค่ะ เนื่องจากเงินคงเหลือสุทธิอยู่ที่ ฿${nf.format(Math.round(surplus))} (${surplusRatio.toFixed(1)}%) ภาระหนี้ ${debtRatio.toFixed(1)}% และเงินสำรองฉุกเฉินรองรับได้ ${emergencyMonths.toFixed(1)} เดือน แนะนำให้ทำบัญชีรายรับ-รายจ่าย ลดรายจ่ายที่ไม่จำเป็น หรือพิจารณาปรับโครงสร้างหนี้ดอกเบี้ยสูงก่อนเริ่มลงทุนค่ะ`;
    }

    const products = [];
    if (emergencyMonths < 6) {
      products.push({
        title: 'เงินฝากประจำปลอดภาษี 24 เดือน',
        rate: 'ดอกเบี้ย 2.65% ต่อปี (ปลอดภาษี)',
        desc: 'เหมาะสำหรับทยอยสะสมเงินสำรองฉุกเฉินให้ครบ 6 เดือนอย่างมีวินัย',
        targetId: 'deposit-taxfree'
      });
    } else {
      products.push({
        title: 'วางแผนการลงทุน & กองทุนรวมแนะนำ',
        rate: 'กระจายพอร์ตตามระดับความเสี่ยง',
        desc: 'เงินสำรองฉุกเฉินครบ 6 เดือนแล้ว สามารถศึกษาการลงทุนและกองทุนรวมตามความเสี่ยงที่รับได้',
        targetId: 'loans'
      });
    }

    if (debtRatio > 35) {
      products.push({
        title: 'สินเชื่อส่วนบุคคล Bella Speedy (รวมหนี้ลดภาระ)',
        rate: 'ดอกเบี้ยเริ่มต้น 9.99% ต่อปี',
        desc: 'รวมหนี้ดอกเบี้ยสูงไว้ที่เดียวเพื่อลดค่างวดต่อเดือนและเพิ่มสภาพคล่อง',
        targetId: 'product-personal-loan'
      });
    } else {
      products.push({
        title: 'สินเชื่อบ้านใหม่ & รีไฟแนนซ์',
        rate: 'ดอกเบี้ยเฉลี่ย 3.25% ต่อปี',
        desc: `ภาระหนี้อยู่ในเกณฑ์ดี วงเงินกู้เบื้องต้นที่เหมาะสมประมาณ ฿${nf.format(Math.round(income * 55))}`,
        targetId: 'product-home-loan'
      });
    }

    if (quizElements.recProductsContainer) {
      quizElements.recProductsContainer.innerHTML = products
        .map(
          (p) => `
        <div class="rec-product-card">
          <div>
            <h5>${p.title}</h5>
            <div class="rec-rate">${p.rate}</div>
            <p>${p.desc}</p>
          </div>
          <a href="#${p.targetId}" class="btn btn-outline btn-jump-product" data-page="${p.targetId}" style="align-self: flex-start; padding: 6px 14px; font-size: 0.8125rem;">
            ดูรายละเอียด &rarr;
          </a>
        </div>
      `
        )
        .join('');
    }
  }

  [
    quizElements.inputIncome,
    quizElements.inputExpense,
    quizElements.inputDebt,
    quizElements.inputSavings
  ].forEach((inputEl) => {
    if (!inputEl) return;
    inputEl.addEventListener('input', evaluateFinancialHealth);
    inputEl.addEventListener('change', evaluateFinancialHealth);
  });

  if (quizElements.btnNext1) {
    quizElements.btnNext1.addEventListener('click', () => {
      const income = parseFloat(quizElements.inputIncome?.value) || 0;
      if (income <= 0) {
        showToast('กรุณาระบุรายรับเฉลี่ยต่อเดือนที่มากกว่า 0 บาท');
        quizElements.inputIncome?.focus();
        return;
      }
      stateStore.activeFlow.currentStep = 'STEP_4';
      evaluateFinancialHealth();
      setQuizStep(2);
    });
  }

  if (quizElements.btnPrev2) {
    quizElements.btnPrev2.addEventListener('click', () => {
      stateStore.activeFlow.currentStep = 'STEP_2';
      setQuizStep(1);
    });
  }

  if (quizElements.btnCalculate) {
    quizElements.btnCalculate.addEventListener('click', () => {
      const income = parseFloat(quizElements.inputIncome?.value) || 0;
      if (income <= 0) {
        showToast('กรุณาระบุรายรับเฉลี่ยต่อเดือนที่มากกว่า 0 บาท');
        setQuizStep(1);
        quizElements.inputIncome?.focus();
        return;
      }
      stateStore.sourceAgent = 'AI_ตรวจสุขภาพการเงินเบื้องต้น';
      stateStore.activeFlow.currentStep = 'STEP_9';
      evaluateFinancialHealth();
      setQuizStep(3);
    });
  }

  if (quizElements.btnReset) {
    quizElements.btnReset.addEventListener('click', () => {
      stateStore.activeFlow.currentStep = 'STEP_2';
      setQuizStep(1);
    });
  }

  // --------------------------------------------------------------------------
  // 2. โมดูล AI_วางแผนการลงทุน (#investment ในหน้า #loans - Section 4 ของ GUIDE_PERSON_3)
  // --------------------------------------------------------------------------
  const investElements = {
    topicTabs: document.querySelectorAll('.p3-knowledge-tab'),
    kdTitle: document.getElementById('kd-title'),
    kdBody: document.getElementById('kd-body'),
    kdHighlights: document.getElementById('kd-highlights'),
    btnAskBellaKnowledge: document.getElementById('btn-ask-bella-knowledge'),

    searchForm: document.getElementById('investment-fund-search-form'),
    searchInput: document.getElementById('investment-fund-search-input'),
    riskFilter: document.getElementById('investment-risk-filter'),
    btnSearchReset: document.getElementById('btn-investment-fund-reset'),
    unverifiedAlert: document.getElementById('investment-unverified-alert'),
    unverifiedMessage: document.getElementById('investment-unverified-message'),
    btnUnverifiedBookAdvisor: document.getElementById('btn-unverified-book-advisor'),
    fundsGrid: document.getElementById('investment-funds-grid'),

    btnRequestAdvisor: document.getElementById('btn-request-advisor'),
    advisorStatusPill: document.getElementById('investment-advisor-status'),
    advisorStatusText: document.getElementById('investment-advisor-status-text')
  };

  let currentKnowledgeKey = 'start';

  // หัวข้อที่ 1: จัดการสลับหัวข้อความรู้จาก Tools_การลงทุนน่ารู้
  function selectKnowledgeTopic(key) {
    const item = TOOLS_INVESTMENT_KNOWLEDGE[key] || TOOLS_INVESTMENT_KNOWLEDGE.start;
    currentKnowledgeKey = key;

    investElements.topicTabs.forEach((tab) => {
      const isMatch = tab.getAttribute('data-knowledge-key') === key;
      tab.classList.toggle('active', isMatch);
      tab.setAttribute('aria-selected', String(isMatch));
    });

    if (investElements.kdTitle) investElements.kdTitle.textContent = item.title;
    if (investElements.kdBody) investElements.kdBody.textContent = item.answer;
    if (investElements.kdHighlights) {
      investElements.kdHighlights.innerHTML = item.highlights
        .map((hl) => `<li>${hl}</li>`)
        .join('');
    }

    // อัปเดตตัวแปรใน stateStore.financialData ตาม SESSION_STATE_SCHEMA.json
    stateStore.sourceAgent = 'AI_วางแผนการลงทุน';
    stateStore.financialData.investment_topic = 'เรื่องน่ารู้การลงทุน';
    stateStore.financialData.investment_question = item.question;
    stateStore.financialData.investment_answer = item.answer;
  }

  investElements.topicTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const key = tab.getAttribute('data-knowledge-key') || 'start';
      selectKnowledgeTopic(key);
    });
  });

  if (investElements.btnAskBellaKnowledge) {
    investElements.btnAskBellaKnowledge.addEventListener('click', () => {
      const item = TOOLS_INVESTMENT_KNOWLEDGE[currentKnowledgeKey] || TOOLS_INVESTMENT_KNOWLEDGE.start;
      stateStore.sourceAgent = 'AI_วางแผนการลงทุน';
      stateStore.financialData.investment_topic = 'เรื่องน่ารู้การลงทุน';
      stateStore.financialData.investment_question = item.question;
      stateStore.financialData.investment_answer = item.answer;
      talkToBella(`ขอความรู้เรื่องการลงทุน: ${item.question}`);
    });
  }

  // หัวข้อที่ 2: ระบบค้นหาและกรองกองทุนจาก Tools_กองทุนแนะนำ
  function renderVerifiedFunds(queryText = '', riskCategory = 'all') {
    if (!investElements.fundsGrid) return;

    const cleanQuery = (queryText || '').trim().toLowerCase();
    const matchedFunds = TOOLS_RECOMMENDED_FUNDS.filter((fund) => {
      const matchesRisk = riskCategory === 'all' || fund.riskCategory === riskCategory;
      if (!matchesRisk) return false;
      if (!cleanQuery) return true;
      const searchable = `${fund.code} ${fund.name} ${fund.assetClass} ${fund.riskLevel} ${fund.summary}`.toLowerCase();
      return searchable.includes(cleanQuery);
    });

    if (cleanQuery || riskCategory !== 'all') {
      stateStore.sourceAgent = 'AI_วางแผนการลงทุน';
      stateStore.financialData.investment_topic = 'ตัวอย่างกองทุนแนะนำ';
      stateStore.financialData.investment_question =
        cleanQuery || `กรองกองทุนตามระดับความเสี่ยง: ${riskCategory}`;
    }

    // หากไม่พบชื่อกองทุนในฐานข้อมูล Tools_กองทุนแนะนำ -> แสดงประโยคปฏิเสธมาตรฐานทันทีตามข้อ 4.2
    if (matchedFunds.length === 0) {
      if (investElements.unverifiedAlert) {
        investElements.unverifiedAlert.removeAttribute('hidden');
        investElements.unverifiedAlert.hidden = false;
      }
      if (investElements.unverifiedMessage) {
        investElements.unverifiedMessage.textContent = `"${UNVERIFIED_FUND_FALLBACK_TEXT}"`;
      }
      stateStore.financialData.investment_answer = UNVERIFIED_FUND_FALLBACK_TEXT;
      investElements.fundsGrid.innerHTML = '';
      return;
    }

    if (investElements.unverifiedAlert) {
      investElements.unverifiedAlert.setAttribute('hidden', '');
      investElements.unverifiedAlert.hidden = true;
    }

    if (cleanQuery || riskCategory !== 'all') {
      stateStore.financialData.investment_answer = matchedFunds
        .map((f) => `${f.code} (${f.riskLevel})`)
        .join(', ');
    }

    investElements.fundsGrid.innerHTML = matchedFunds
      .map((fund) => {
        const tagClass =
          fund.riskCategory === 'low'
            ? 'risk-low-tag'
            : fund.riskCategory === 'medium'
              ? 'popular-tag'
              : 'risk-high-tag';
        return `
        <article class="product-card glass-panel" data-fund-code="${fund.code}">
          <div class="product-tag ${tagClass}">${fund.riskLevel}</div>
          <div class="product-icon-wrap">📊</div>
          <h3 class="product-name">${fund.name}</h3>
          <p class="product-summary">${fund.summary}</p>
          <div class="product-highlights">
            <div class="highlight-item">
              <span class="hl-label">ประเภทกองทุน</span>
              <span class="hl-value" style="font-size: 0.9rem;">${fund.assetClass}</span>
              <span class="hl-note">${fund.dividendPolicy}</span>
            </div>
            <div class="highlight-item">
              <span class="hl-label">ลงทุนขั้นต่ำ</span>
              <span class="hl-value text-gradient">${fund.minAmount}</span>
              <span class="hl-note">ซื้อขายผ่านแอปได้ทุกวันทำการ</span>
            </div>
          </div>
          <ul class="product-perks">
            ${fund.perks.map((p) => `<li>${p}</li>`).join('')}
          </ul>
          <div class="product-card-actions">
            <button type="button" class="btn btn-outline btn-ask-fund" data-fund-code="${fund.code}" data-fund-name="${fund.name}">
              ถามเบลล่า
            </button>
            <button type="button" class="btn btn-primary btn-book-fund-advisor" data-fund-code="${fund.code}">
              นัดที่ปรึกษาการเงิน
            </button>
          </div>
        </article>
      `;
      })
      .join('');

    investElements.fundsGrid.querySelectorAll('.btn-ask-fund').forEach((btn) => {
      btn.addEventListener('click', () => {
        const fundName = btn.getAttribute('data-fund-name') || 'กองทุนรวม';
        const fundCode = btn.getAttribute('data-fund-code') || '';
        const found = TOOLS_RECOMMENDED_FUNDS.find((f) => f.code === fundCode);
        stateStore.sourceAgent = 'AI_วางแผนการลงทุน';
        stateStore.financialData.investment_topic = 'ตัวอย่างกองทุนแนะนำ';
        stateStore.financialData.investment_question = `ขอทราบข้อมูลกองทุน ${fundName}`;
        stateStore.financialData.investment_answer = found ? found.summary : '';
        talkToBella(`ขอทราบรายละเอียดนโยบายและความเสี่ยงของ ${fundName} ค่ะ`);
      });
    });

    investElements.fundsGrid.querySelectorAll('.btn-book-fund-advisor').forEach((btn) => {
      btn.addEventListener('click', () => {
        const fundCode = btn.getAttribute('data-fund-code') || '';
        requestFinancialAdvisor(`สนใจปรึกษาที่ปรึกษาทางการเงินเกี่ยวกับกองทุน ${fundCode}`);
      });
    });
  }

  if (investElements.searchForm) {
    investElements.searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      renderVerifiedFunds(
        investElements.searchInput?.value || '',
        investElements.riskFilter?.value || 'all'
      );
    });
  }

  if (investElements.searchInput) {
    investElements.searchInput.addEventListener('input', () => {
      renderVerifiedFunds(
        investElements.searchInput.value,
        investElements.riskFilter?.value || 'all'
      );
    });
  }

  if (investElements.riskFilter) {
    investElements.riskFilter.addEventListener('change', () => {
      renderVerifiedFunds(
        investElements.searchInput?.value || '',
        investElements.riskFilter.value
      );
    });
  }

  if (investElements.btnSearchReset) {
    investElements.btnSearchReset.addEventListener('click', () => {
      if (investElements.searchInput) investElements.searchInput.value = '';
      if (investElements.riskFilter) investElements.riskFilter.value = 'all';
      renderVerifiedFunds('', 'all');
    });
  }

  // หัวข้อที่ 3: ปุ่มนัดหมายที่ปรึกษาทางการเงิน (transfer_to_human_agent)
  function requestFinancialAdvisor(customNote) {
    stateStore.sourceAgent = 'AI_วางแผนการลงทุน';
    stateStore.targetAgent = 'transfer_to_human_agent';
    stateStore.financialData.investment_topic = 'ปรึกษาที่ปรึกษาการเงิน';
    stateStore.financialData.investment_interest_status = true;
    if (customNote) {
      stateStore.financialData.investment_question = customNote;
    }
    stateStore.financialData.investment_answer =
      'ดำเนินการโอนสายหรือนัดหมายที่ปรึกษาทางการเงิน (transfer_to_human_agent)';

    if (investElements.advisorStatusPill) {
      investElements.advisorStatusPill.removeAttribute('hidden');
      investElements.advisorStatusPill.hidden = false;
    }
    if (investElements.advisorStatusText) {
      investElements.advisorStatusText.textContent =
        'บันทึกความสนใจนัดหมายที่ปรึกษาทางการเงินเรียบร้อยแล้วค่ะ';
    }

    showToast('บันทึกคำขอนัดหมายที่ปรึกษาทางการเงินเรียบร้อยแล้วค่ะ');
    talkToBella(
      customNote ||
        'ต้องการนัดหมายปรึกษาที่ปรึกษาทางการเงินเพื่อประเมินความเสี่ยงและวางแผนการลงทุนค่ะ'
    );
  }

  if (investElements.btnRequestAdvisor) {
    investElements.btnRequestAdvisor.addEventListener('click', () => {
      requestFinancialAdvisor();
    });
  }

  if (investElements.btnUnverifiedBookAdvisor) {
    investElements.btnUnverifiedBookAdvisor.addEventListener('click', () => {
      const queried = investElements.searchInput?.value?.trim() || 'กองทุนที่สอบถาม';
      requestFinancialAdvisor(
        `ต้องการนัดหมายที่ปรึกษาทางการเงินเพื่อสอบถามข้อมูลเพิ่มเติมเกี่ยวกับ ${queried} ค่ะ`
      );
    });
  }

  // --------------------------------------------------------------------------
  // 3. เครื่องคำนวณค่างวดสินเชื่อและเงินกู้ (Loan & Credit Calculator)
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
    btnAskBella: document.getElementById('btn-calc-ask-bella')
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
      const monthlyRate = annualRate / 100 / 12;
      if (monthlyRate > 0 && months > 0) {
        monthly =
          (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
          (Math.pow(1 + monthlyRate, months) - 1);
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

  // ปุ่มคำนวณค่างวดจากการ์ดผลิตภัณฑ์สินเชื่อ -> สลับไปหน้า #calculator พร้อมเลือกประเภทสินเชื่อ
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

  // เรียกแสดงผลตั้งต้นเฉพาะส่วนคลังความรู้ กองทุน และเครื่องคำนวณสินเชื่อ
  selectKnowledgeTopic('start');
  renderVerifiedFunds('', 'all');
  updateLoanCalculation();
}

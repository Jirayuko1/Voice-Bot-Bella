/**
 * ============================================================================
 * [PERSON 2: GOAL-ORIENTED PLANNING LEAD]
 * ============================================================================
 * ผู้รับผิดชอบ: คนที่ 2 (การออม & การเกษียณ)
 * ขอบเขต:
 *   1. โมดูล AI_วางแผนการออม (Savings Goal Simulator)
 *      - คำนวณ saving_remaining_amount และ saving_estimated_months
 *   2. โมดูล AI_วางแผนการเกษียณ (Retirement Assessment Engine)
 *      - คำนวณ retirement_years_remaining, กองทุนที่ต้องเตรียม, และเป้าออมรายเดือน
 *   3. การซิงก์ข้อมูลกลับเข้า stateStore เพื่อส่งต่อ (Cross-Sell Handoff) ให้คนที่ 3
 * ============================================================================
 */

export function initGoalPlanning({ talkToBella, stateStore, navigateToPage }) {
  console.log('[Person 2: Goal Planning] Initializing...');

  // --------------------------------------------------------------------------
  // 1. โมดูล AI_วางแผนการออม (Savings Goal Logic)
  // --------------------------------------------------------------------------
  const savingElements = {
    goalSelect: document.getElementById('saving-goal-select'),
    targetInput: document.getElementById('saving-target-input'),
    currentInput: document.getElementById('saving-current-input'),
    monthlyInput: document.getElementById('saving-monthly-input'),
    resRemaining: document.getElementById('saving-res-remaining'),
    resMonths: document.getElementById('saving-res-months'),
    resYears: document.getElementById('saving-res-years'),
    btnAskBella: document.getElementById('btn-saving-ask-bella'),
  };

  function updateSavingsPlan() {
    if (!savingElements.targetInput || !savingElements.currentInput || !savingElements.monthlyInput) return;

    const goal = savingElements.goalSelect.value;
    const target = parseFloat(savingElements.targetInput.value) || 0;
    const current = parseFloat(savingElements.currentInput.value) || 0;
    const monthly = parseFloat(savingElements.monthlyInput.value) || 0;

    // คำนวณตามสูตรในสัญญาข้อมูล STATE_CONTRACT.md (คนที่ 2)
    const remaining = Math.max(0, target - current);
    const months = (monthly > 0 && remaining > 0) ? Math.ceil(remaining / monthly) : 0;

    // อัปเดตลง State Store กลาง
    stateStore.financialData.saving_goal = goal;
    stateStore.financialData.saving_target_amount = target;
    stateStore.financialData.saving_current_amount = current;
    stateStore.financialData.saving_monthly_amount = monthly;
    stateStore.financialData.saving_remaining_amount = remaining;
    stateStore.financialData.saving_estimated_months = months;

    const nf = new Intl.NumberFormat('th-TH');
    savingElements.resRemaining.textContent = `฿${nf.format(remaining)}`;

    if (remaining === 0) {
      savingElements.resMonths.textContent = 'ถึงเป้าหมายแล้ว!';
      savingElements.resYears.textContent = 'ยินดีด้วยค่ะ คุณมีเงินออมครบตามเป้าหมายแล้ว';
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

  [savingElements.targetInput, savingElements.currentInput, savingElements.monthlyInput, savingElements.goalSelect].forEach((el) => {
    if (el) el.addEventListener('input', updateSavingsPlan);
  });

  if (savingElements.btnAskBella) {
    savingElements.btnAskBella.addEventListener('click', () => {
      const { saving_goal, saving_target_amount, saving_current_amount, saving_monthly_amount, saving_estimated_months } = stateStore.financialData;
      const msg = `ผู้ใช้กำลังวางแผนการออมเพื่อ "${saving_goal}" เป้าหมาย ฿${saving_target_amount} ปัจจุบันมี ฿${saving_current_amount} ออมเดือนละ ฿${saving_monthly_amount} ใช้เวลาประมาณ ${saving_estimated_months} เดือน. ช่วยแนะนำเคล็ดลับหรือผลิตภัณฑ์การออม/ลงทุนให้หน่อยค่ะ`;
      talkToBella(msg);
    });
  }

  // ปุ่ม "สนใจเปิดบัญชี" จากการ์ดเงินฝาก -> เลื่อนลงมาที่เครื่องจำลองการออม
  document.querySelectorAll('.btn-apply-deposit').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (typeof navigateToPage === 'function') {
        navigateToPage('savings-simulator-box', true);
      } else {
        const simBox = document.getElementById('savings-simulator-box');
        if (simBox) simBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });

  // --------------------------------------------------------------------------
  // 2. โมดูล AI_วางแผนการเกษียณ (Retirement Planning Logic)
  // --------------------------------------------------------------------------
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

    // คำนวณตามสูตรในสัญญาข้อมูล STATE_CONTRACT.md (คนที่ 2)
    const yearsLeft = Math.max(1, tarAge - curAge);
    const fundNeeded = monthlyExp * 12 * 20; // สมมติฐาน 20 ปีหลังเกษียณ
    const remainingToSave = Math.max(0, fundNeeded - curSavings);
    const monthsLeft = yearsLeft * 12;
    const monthlyTarget = monthsLeft > 0 ? Math.round(remainingToSave / monthsLeft) : 0;

    // อัปเดตลง State Store กลาง
    stateStore.financialData.retirement_current_age = curAge;
    stateStore.financialData.retirement_target_age = tarAge;
    stateStore.financialData.retirement_monthly_expense = monthlyExp;
    stateStore.financialData.retirement_current_savings = curSavings;
    stateStore.financialData.retirement_years_remaining = yearsLeft;

    const nf = new Intl.NumberFormat('th-TH');
    retireElements.resYearsLeft.textContent = `${yearsLeft} ปี`;
    retireElements.resFundNeeded.textContent = `฿${nf.format(Math.round(fundNeeded))}`;
    retireElements.resMonthlyTarget.textContent = `฿${nf.format(monthlyTarget)} / เดือน`;
  }

  [retireElements.currentAge, retireElements.targetAge, retireElements.monthlyExpense, retireElements.currentSavings].forEach((el) => {
    if (el) el.addEventListener('input', updateRetirementPlan);
  });

  if (retireElements.btnAskBella) {
    retireElements.btnAskBella.addEventListener('click', () => {
      const { retirement_current_age, retirement_target_age, retirement_years_remaining } = stateStore.financialData;
      const fund = retireElements.resFundNeeded.textContent;
      const msg = `ผู้ใช้กำลังวางแผนเกษียณ: อายุปัจจุบัน ${retirement_current_age} ปี ต้องการเกษียณตอนอายุ ${retirement_target_age} ปี (เหลือเวลาเตรียมตัว ${retirement_years_remaining} ปี) กองทุนเกษียณที่ต้องเตรียมประมาณ ${fund}. ช่วยประเมินแผนเกษียณและแนะนำทางเลือกการออม/ลงทุนให้หน่อยค่ะ`;
      talkToBella(msg);
    });
  }

  // เรียกคำนวณตั้งต้นทันที
  updateSavingsPlan();
  updateRetirementPlan();
}

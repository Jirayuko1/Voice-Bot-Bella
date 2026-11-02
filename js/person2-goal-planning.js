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

export function initGoalPlanning({ talkToBella, showToast, stateStore, navigateToPage }) {
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

    const goal = savingElements.goalSelect ? savingElements.goalSelect.value : 'เงินสำรองฉุกเฉิน';
    const target = Math.max(0, parseFloat(savingElements.targetInput.value) || 0);
    const current = Math.max(0, parseFloat(savingElements.currentInput.value) || 0);
    const monthly = Math.max(0, parseFloat(savingElements.monthlyInput.value) || 0);

    // คำนวณตามสูตรในสัญญาข้อมูล STATE_CONTRACT.md (คนที่ 2)
    const remaining = Math.max(0, target - current);
    const months = (monthly > 0 && remaining > 0) ? Math.ceil(remaining / monthly) : 0;

    // อัปเดตลง State Store กลาง
    if (stateStore && stateStore.financialData) {
      stateStore.financialData.saving_goal = goal;
      stateStore.financialData.saving_target_amount = target;
      stateStore.financialData.saving_current_amount = current;
      stateStore.financialData.saving_monthly_amount = monthly;
      stateStore.financialData.saving_remaining_amount = remaining;
      stateStore.financialData.saving_estimated_months = months;
    }

    const nf = new Intl.NumberFormat('th-TH');
    if (savingElements.resRemaining) {
      savingElements.resRemaining.textContent = `฿${nf.format(remaining)}`;
    }

    if (!savingElements.resMonths || !savingElements.resYears) return;

    if (target === 0) {
      savingElements.resMonths.textContent = 'ระบุเป้าหมาย';
      savingElements.resYears.textContent = '(กรุณาระบุจำนวนเงินเป้าหมายที่ต้องการ)';
    } else if (remaining === 0) {
      savingElements.resMonths.textContent = 'ถึงเป้าหมายแล้ว!';
      savingElements.resYears.textContent = 'ยินดีด้วยค่ะ คุณมีเงินออมครบตามเป้าหมายแล้ว';
    } else if (monthly === 0) {
      savingElements.resMonths.textContent = 'ระบุยอดออม';
      savingElements.resYears.textContent = '(กรุณาระบุเงินออมต่อเดือนมากกว่า 0 บาท)';
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

  // Window Helper สำหรับให้ WebAvatar หรือ Script ภายนอกอัปเดตค่าฟอร์มอัตโนมัติ
  window.updateBellaSavingsSimulator = function(goal, target, current, monthly) {
    if (goal && savingElements.goalSelect) {
      savingElements.goalSelect.value = goal;
    }
    if (target !== undefined && savingElements.targetInput) {
      savingElements.targetInput.value = target;
    }
    if (current !== undefined && savingElements.currentInput) {
      savingElements.currentInput.value = current;
    }
    if (monthly !== undefined && savingElements.monthlyInput) {
      savingElements.monthlyInput.value = monthly;
    }
    updateSavingsPlan();
  };


  if (savingElements.btnAskBella) {
    savingElements.btnAskBella.addEventListener('click', () => {
      const { 
        saving_goal, 
        saving_target_amount, 
        saving_current_amount, 
        saving_monthly_amount, 
        saving_remaining_amount, 
        saving_estimated_months 
      } = (stateStore && stateStore.financialData) || {};

      let msg = '';
      if (saving_remaining_amount === 0 && (saving_target_amount || 0) > 0) {
        msg = `ผู้ใช้มีเงินออมครบตามเป้าหมาย "${saving_goal}" จำนวน ฿${saving_target_amount} แล้ว (มีเงินออม ฿${saving_current_amount}). ช่วยแนะนำทางเลือกการลงทุนหรือต่อยอดเงินออมให้หน่อยค่ะ`;
      } else {
        msg = `ผู้ใช้กำลังวางแผนการออมเพื่อ "${saving_goal}" เป้าหมาย ฿${saving_target_amount} ปัจจุบันมี ฿${saving_current_amount} ออมเดือนละ ฿${saving_monthly_amount} ใช้เวลาประมาณ ${saving_estimated_months} เดือน. ช่วยแนะนำเคล็ดลับหรือผลิตภัณฑ์การออม/ลงทุนให้หน่อยค่ะ`;
      }
      
      if (typeof talkToBella === 'function') {
        talkToBella(msg);
      }
    });
  }

  // รองรับปุ่มสนใจเปิดบัญชีเงินฝากแต่ละประเภทใน Section 4
  const depositAccountNames = {
    esavings: 'Bella e-Savings ดอกเบี้ยสูง 1.80%',
    taxfree: 'เงินฝากประจำปลอดภาษี 24 เดือน',
    stepup: 'เงินฝากประจำ Step-Up 36 เดือน',
  };

  document.querySelectorAll('.btn-apply-deposit').forEach((btn) => {
    btn.addEventListener('click', () => {
      const accKey = btn.getAttribute('data-account');
      const accTitle = depositAccountNames[accKey] || 'บัญชีเงินฝาก';
      if (typeof showToast === 'function') {
        showToast(`บันทึกความสนใจ: ${accTitle}`);
      }
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

    const curAge = parseInt(retireElements.currentAge.value) || 0;
    const tarAge = parseInt(retireElements.targetAge.value) || 0;
    const monthlyExp = Math.max(0, parseFloat(retireElements.monthlyExpense.value) || 0);
    const curSavings = Math.max(0, parseFloat(retireElements.currentSavings.value) || 0);

    const nf = new Intl.NumberFormat('th-TH');

    // กฎเหล็ก: อายุเกษียณต้องมากกว่าอายุปัจจุบัน (Rule 1: target_age > current_age)
    if (tarAge <= curAge) {
      if (retireElements.resYearsLeft) {
        retireElements.resYearsLeft.textContent = 'ระบุอายุใหม่';
      }
      const subYears = retireElements.resYearsLeft?.nextElementSibling;
      if (subYears) {
        subYears.textContent = '(อายุเกษียณต้องมากกว่าอายุปัจจุบัน)';
      }
      if (retireElements.resFundNeeded) {
        retireElements.resFundNeeded.textContent = '฿0';
      }
      if (retireElements.resMonthlyTarget) {
        retireElements.resMonthlyTarget.textContent = 'กรุณาระบุอายุให้ถูกต้อง';
      }
      return;
    }

    // คำนวณตามสูตรในสัญญาข้อมูล STATE_CONTRACT.md (คนที่ 2)
    const yearsLeft = tarAge - curAge;
    const fundNeeded = monthlyExp * 12 * 20; // สมมติฐานใช้ชีวิต 20 ปีหลังเกษียณ
    const remainingToSave = Math.max(0, fundNeeded - curSavings);
    const monthsLeft = yearsLeft * 12;
    const monthlyTarget = monthsLeft > 0 ? Math.round(remainingToSave / monthsLeft) : 0;

    // อัปเดตลง State Store กลาง
    if (stateStore && stateStore.financialData) {
      stateStore.financialData.retirement_current_age = curAge;
      stateStore.financialData.retirement_target_age = tarAge;
      stateStore.financialData.retirement_monthly_expense = monthlyExp;
      stateStore.financialData.retirement_current_savings = curSavings;
      stateStore.financialData.retirement_years_remaining = yearsLeft;
    }

    if (retireElements.resYearsLeft) {
      retireElements.resYearsLeft.textContent = `${yearsLeft} ปี`;
      const subYears = retireElements.resYearsLeft.nextElementSibling;
      if (subYears) {
        subYears.textContent = `(ก่อนถึงอายุเกษียณ ${tarAge} ปี)`;
      }
    }

    if (retireElements.resFundNeeded) {
      retireElements.resFundNeeded.textContent = `฿${nf.format(Math.round(fundNeeded))}`;
    }

    if (retireElements.resMonthlyTarget) {
      if (remainingToSave === 0 && fundNeeded > 0) {
        retireElements.resMonthlyTarget.textContent = 'กองทุนเกษียณพร้อมแล้ว!';
      } else {
        retireElements.resMonthlyTarget.textContent = `฿${nf.format(monthlyTarget)} / เดือน`;
      }
    }
  }

  [retireElements.currentAge, retireElements.targetAge, retireElements.monthlyExpense, retireElements.currentSavings].forEach((el) => {
    if (el) {
      el.addEventListener('input', updateRetirementPlan);
      el.addEventListener('change', updateRetirementPlan);
    }
  });

  // Window Helper สำหรับให้ WebAvatar หรือ Script ภายนอกอัปเดตค่าฟอร์มเกษียณอัตโนมัติ
  window.updateBellaRetirementSimulator = function(curAge, tarAge, monthlyExp, curSavings) {
    if (curAge !== undefined && retireElements.currentAge) {
      retireElements.currentAge.value = curAge;
    }
    if (tarAge !== undefined && retireElements.targetAge) {
      retireElements.targetAge.value = tarAge;
    }
    if (monthlyExp !== undefined && retireElements.monthlyExpense) {
      retireElements.monthlyExpense.value = monthlyExp;
    }
    if (curSavings !== undefined && retireElements.currentSavings) {
      retireElements.currentSavings.value = curSavings;
    }
    updateRetirementPlan();
  };

  if (retireElements.btnAskBella) {
    retireElements.btnAskBella.addEventListener('click', () => {
      const { 
        retirement_current_age, 
        retirement_target_age, 
        retirement_years_remaining, 
        retirement_monthly_expense,
        retirement_current_savings 
      } = (stateStore && stateStore.financialData) || {};

      // ป้องกันกรณีป้อนอายุไม่ถูกต้อง
      if (!retirement_target_age || !retirement_current_age || retirement_target_age <= retirement_current_age) {
        if (typeof showToast === 'function') {
          showToast('กรุณาระบุอายุเกษียณให้มากกว่าอายุปัจจุบันก่อนปรึกษาเบลล่าค่ะ');
        }
        return;
      }

      const fund = retireElements.resFundNeeded?.textContent || '';
      const monthlyTarget = retireElements.resMonthlyTarget?.textContent || '';

      let msg = '';
      if (monthlyTarget.includes('พร้อมแล้ว')) {
        msg = `ผู้ใช้เตรียมเงินเกษียณพร้อมแล้ว: ปัจจุบันอายุ ${retirement_current_age} ปี เกษียณตอนอายุ ${retirement_target_age} ปี (มีเงินเก็บเกษียณ ฿${retirement_current_savings} สำหรับกองทุน ${fund}). ช่วยแนะนำการบริหารความมั่งคั่งหรือการลงทุนความเสี่ยงต่ำเพื่อรักษาเงินต้นให้หน่อยค่ะ`;
      } else {
        msg = `ผู้ใช้กำลังวางแผนเกษียณ: อายุปัจจุบัน ${retirement_current_age} ปี ต้องการเกษียณตอนอายุ ${retirement_target_age} ปี (เหลือเวลาเตรียมตัว ${retirement_years_remaining} ปี) คาดใช้จ่ายเดือนละ ฿${retirement_monthly_expense} กองทุนที่ต้องเตรียมประมาณ ${fund} (เป้าหมายออม ${monthlyTarget}). ช่วยประเมินแผนเกษียณและแนะนำทางเลือกการออม/ลงทุนให้หน่อยค่ะ`;
      }

      if (typeof talkToBella === 'function') {
        talkToBella(msg);
      }
    });
  }

  // เรียกคำนวณตั้งต้นทันที
  updateSavingsPlan();
  updateRetirementPlan();
}

/**
 * ============================================================================
 * BELLA DIGITAL BANK - APPLICATION ROOT ENTRY POINT
 * ============================================================================
 * โครงการ: พัฒนาระบบ Voice Bot น้องเบลล่า (Bella Voice Bot)
 * สถาปัตยกรรม: Decoupled Multi-Lead Modules (แบ่งงาน 3 คน)
 *
 * การแบ่งความรับผิดชอบของโค้ด:
 * ----------------------------------------------------------------------------
 * 1. คนที่ 1: Core Framework & Host Orchestrator Lead (./js/person1-orchestrator.js)
 *    - รับผิดชอบ: WebAvatar SDK, State Store กลาง, Soft Routing, Settings Modal, Toast
 *
 * 2. คนที่ 2: Goal-Oriented Planning Lead (./js/person2-goal-planning.js)
 *    - รับผิดชอบ: AI_วางแผนการออม (Savings Simulator), AI_วางแผนการเกษียณ (Retirement Engine)
 *
 * 3. คนที่ 3: Financial Engine & Advisory Lead (./js/person3-financial-engine.js)
 *    - รับผิดชอบ: AI_ตรวจสุขภาพการเงินเบื้องต้น (Quiz 4 Steps, DSR), เครื่องคำนวณค่างวดสินเชื่อ
 * ----------------------------------------------------------------------------
 */

// 1. นำเข้าโมดูลของคนที่ 1 (แกนกลาง & Handoff)
import { 
  initOrchestrator, 
  showToast, 
  talkToBella, 
  stateStore 
} from './js/person1-orchestrator.js';

// 2. นำเข้าโมดูลของคนที่ 2 (การออม & เกษียณ)
import { 
  initGoalPlanning 
} from './js/person2-goal-planning.js';

// 3. นำเข้าโมดูลของคนที่ 3 (ตรวจสุขภาพ & สินเชื่อ/ลงทุน)
import { 
  initFinancialEngine 
} from './js/person3-financial-engine.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 [Bella Bank] Bootstrapping application modules...');

  // [PERSON 1] เริ่มต้นระบบแกนกลาง, WebAvatar และ State Store
  initOrchestrator();

  // [PERSON 2] เริ่มต้นโมดูลการออมและวางแผนเกษียณ
  initGoalPlanning({ 
    talkToBella, 
    showToast, 
    stateStore 
  });

  // [PERSON 3] เริ่มต้นโมดูลตรวจสุขภาพการเงินและเครื่องคำนวณสินเชื่อ
  initFinancialEngine({ 
    talkToBella, 
    showToast, 
    stateStore 
  });

  console.log('✅ [Bella Bank] All modules initialized successfully!');
});

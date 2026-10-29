/**
 * ============================================================================
 * Bella Digital Bank - Main Application Entry Point (3-Lead Modular Architecture)
 * ============================================================================
 * โครงสร้างการแบ่งงานตามเอกสาร ARCHITECTURE.md และ STATE_CONTRACT.md:
 *
 * 1. คนที่ 1 (Core Framework & Host Orchestrator Lead):
 *    - ไฟล์: ./js/person1-orchestrator.js
 *    - รับผิดชอบ: WebAvatar SDK, Session State Store กลาง, In-App SPA Router,
 *      Sidebar Collapse, Settings Modal, Toast & FAQ
 *
 * 2. คนที่ 2 (Goal-Oriented Planning Lead):
 *    - ไฟล์: ./js/person2-goal-planning.js
 *    - รับผิดชอบ: AI_วางแผนการออม (Savings Simulator) และ AI_วางแผนการเกษียณ (Retirement)
 *
 * 3. คนที่ 3 (Financial Engine & Advisory Lead):
 *    - ไฟล์: ./js/person3-financial-engine.js
 *    - รับผิดชอบ: AI_ตรวจสุขภาพการเงินเบื้องต้น (Quiz 4 Steps, DSR) และเครื่องคำนวณค่างวดสินเชื่อ
 * ============================================================================
 */

// 1. นำเข้าโมดูลของคนที่ 1 (แกนกลาง & Handoff)
import {
  initOrchestrator,
  showToast,
  talkToBella,
  stateStore,
  navigateToPage
} from './js/person1-orchestrator.js';

// 2. นำเข้าโมดูลของคนที่ 2 (การออม & เกษียณ)
import {
  initGoalPlanning
} from './js/person2-goal-planning.js';

// 3. นำเข้าโมดูลของคนที่ 3 (ตรวจสุขภาพ & สินเชื่อ/ลงทุน)
import {
  initFinancialEngine
} from './js/person3-financial-engine.js';

// เริ่มต้นระบบเมื่อ DOM พร้อมทำงาน
function bootstrapBellaApp() {
  console.log('[Bella Digital Bank] Bootstrapping 3-Lead Modular Architecture...');

  // เริ่มต้นส่วนกลาง (คนที่ 1)
  initOrchestrator();

  // เริ่มต้นระบบวางแผนการออมและเกษียณ (คนที่ 2) พร้อมส่ง Shared Dependencies
  initGoalPlanning({
    talkToBella,
    stateStore,
    navigateToPage
  });

  // เริ่มต้นระบบตรวจสุขภาพการเงินและคำนวณสินเชื่อ (คนที่ 3) พร้อมส่ง Shared Dependencies
  initFinancialEngine({
    talkToBella,
    showToast,
    stateStore,
    navigateToPage
  });

  // เปิดให้ตรวจสอบ State กลางผ่าน Console สำหรับการ Debug Handoff ระหว่างทีม
  window.__BELLA_STATE__ = stateStore;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapBellaApp);
} else {
  bootstrapBellaApp();
}

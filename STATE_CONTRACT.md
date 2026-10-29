# เอกสารสัญญาข้อมูลกลางและมาตรฐานระบบ (State & Parameter Contract)
**โครงการ:** พัฒนาระบบ Voice Bot น้องเบลล่า (Bella Voice Bot)  
**ตำแหน่งผู้รับผิดชอบ:** คนที่ 1: Core Orchestrator & System Framework Lead  
**ผู้เกี่ยวข้อง:** คนที่ 2 (Goal Planning Lead) และ คนที่ 3 (Financial Engine & Advisory Lead)  
**เวอร์ชัน:** 1.0.0 (Production Blueprint)

---

## 1. วัตถุประสงค์ (Objective)
เอกสารฉบับนี้จัดทำขึ้นเพื่อเป็น **"สัญญาข้อมูลกลาง (Data Contract)"** ตามแผนงาน WBS Phase 1 เพื่อ:
1. **ป้องกันภาวะข้อมูลสูญหายระหว่างส่งต่อสาย (Handoff State Loss)**
2. **ขจัดปัญหาการถามข้อมูลซ้ำซ้อน** (ห้ามถามข้อมูลเดิมที่ลูกค้าระบุแล้ว เช่น ชื่อ รายได้ เป้าหมาย)
3. **กำหนดโครงสร้าง Payload มาตรฐาน** ในการโอนย้ายสถานะระหว่าง Agent ทั้ง 5 โมดูล
4. **กำหนด Session Memory & Recovery** เมื่อมีการพูดแทรกด้วยคำถาม FAQ หรือสัญญาณขาดหาย

---

## 2. แผนผังการส่งต่อข้อมูลระหว่างโมดูล (Handoff Architecture)

```mermaid
flowchart TD
    User([ลูกค้า / Caller]) --> Greeting[คนที่ 1: AI_Greeting\n(Master Router & Intent Classifier)]
    
    Greeting -->|Handoff Payload| P2_Savings[คนที่ 2: AI_วางแผนการออม]
    Greeting -->|Handoff Payload| P2_Retire[คนที่ 2: AI_วางแผนการเกษียณ]
    Greeting -->|Handoff Payload| P3_Health[คนที่ 3: AI_ตรวจสุขภาพการเงิน]
    Greeting -->|Handoff Payload| P3_Invest[คนที่ 3: AI_วางแผนการลงทุน]
    Greeting -->|FAQ Query| Tool_FAQ[(Tool: SaaS-FAQ)]
    Greeting -->|Escalate| Tool_Human[(Tool: Human Agent Transfer)]
    
    P3_Health -.->|Cross-Sell Handoff| P2_Savings
    P3_Health -.->|Cross-Sell Handoff| P2_Retire
    P3_Health -.->|Cross-Sell Handoff| P3_Invest
    P2_Savings -.->|Next Step Handoff| P3_Invest
    P2_Retire -.->|Next Step Handoff| P3_Invest
```

---

## 3. โครงสร้าง Session State กลาง (Master Session State Schema)

ทุก Agent ต้องส่งและรับ State ในรูปแบบ JSON Object ตามโครงสร้างนี้เสมอ:

```json
{
  "session_id": "string (UUID)",
  "p_display_name": "string (ชื่อลูกค้า)",
  "source_agent": "AI_Greeting | AI_วางแผนการออม | AI_วางแผนการเกษียณ | AI_ตรวจสุขภาพการเงิน | AI_วางแผนการลงทุน",
  "target_agent": "string",
  "handoff_timestamp": "ISO8601 string",
  "active_flow": {
    "current_step": "string (เช่น STEP_2, STEP_6)",
    "pending_question": "string (คำถามล่าสุดที่ถามลูกค้าไว้ หากมี)",
    "fallback_counter": {
      "gibberish_count": 0,
      "unclear_count": 0,
      "silence_minutes": 0
    }
  },
  "customer_profile": {
    "age": "number | null",
    "occupation": "string | null",
    "risk_profile": "string | null"
  },
  "financial_data": {
    "savings_goal": "string | null",
    "saving_target_amount": "number | null",
    "saving_current_amount": "number | null",
    "saving_monthly_amount": "number | null",
    "saving_investment_style": "ช้าแต่ชัวร์ | แล้วแต่จังหวะ | กล้าได้กล้าเสีย | null",
    "saving_remaining_amount": "number | null",
    "saving_estimated_months": "number | null",

    "retirement_current_age": "number | null",
    "retirement_target_age": "number | null",
    "retirement_monthly_expense": "number | null",
    "retirement_current_savings": "number | null",
    "retirement_years_remaining": "number | null",

    "financial_monthly_income": "number | null",
    "financial_monthly_expense": "number | null",
    "financial_monthly_debt_payment": "number | null",
    "financial_current_savings": "number | null",
    "financial_surplus_amount": "number | null",
    "financial_surplus_ratio": "number | null",
    "financial_debt_ratio": "number | null",
    "financial_emergency_months": "number | null",
    "financial_health_level": "good | moderate | improve | null",
    "financial_next_action": "string | null",

    "investment_topic": "string | null",
    "investment_question": "string | null",
    "investment_answer": "string | null",
    "investment_interest_status": "boolean | null"
  }
}
```

---

## 4. สัญญาพารามิเตอร์แยกตามผู้รับผิดชอบ (Role Specifications)

### 📌 คนที่ 1: Core Framework (ผู้ส่งตั้งต้น)
ต้องเตรียมค่าเริ่มต้นและส่งมอบให้คนที่ 2 หรือ 3 เสมอ:
* `p_display_name`: ชื่อลูกค้าที่ได้จากการยืนยันตัวตนตอนต้นสาย
* `intent`: ประเภทบริการที่ลูกค้าเลือก
* `active_flow.current_step`: "STEP_1" สำหรับ Agent ปลายทาง

---

### 📌 คนที่ 2: Goal-Oriented Planning Lead (การออม & เกษียณ)
เมื่อได้รับ Payload จากคนที่ 1 หรือ 3:
1. **ตรวจสอบ `p_display_name` ก่อนเสมอ:** ห้ามถามชื่อลูกค้าซ้ำ ให้ใช้ชื่อลูกค้าในการทักทายต่อทันที
2. **โมดูลการออม (`AI_วางแผนการออม`):**
   * บันทึกค่า: `<<saving_goal>>`, `<<saving_target_amount>>`, `<<saving_current_amount>>`, `<<saving_monthly_amount>>`, `<<saving_investment_style>>`
   * คำนวณส่งกลับ: `<<saving_remaining_amount>>`, `<<saving_estimated_months>>`
   * **Cross-Sell Handoff:** หากลูกค้าใน Step 10 ตอบ "สนใจ" รับฟังข้อมูลเพิ่ม ให้เรียก `handoff` ส่งต่อไปยัง `AI_วางแผนการลงทุน` พร้อมแนบ State ทั้งหมดไปด้วย
3. **โมดูลเกษียณ (`AI_วางแผนการเกษียณ`):**
   * บันทึกค่า: `<<retirement_current_age>>`, `<<retirement_target_age>>`, `<<retirement_monthly_expense>>`, `<<retirement_current_savings>>`
   * คำนวณส่งกลับ: `<<retirement_years_remaining>> = target_age - current_age`
   * **Cross-Sell Handoff:** หากลูกค้าใน Step 8 ตอบ "สนใจ" ให้ Handoff ไปยัง `AI_วางแผนการลงทุน` หรือ `AI_วางแผนการออม`

---

### 📌 คนที่ 3: Financial Engine & Advisory Lead (ตรวจสุขภาพ & ลงทุน)
เมื่อได้รับ Payload จากคนที่ 1 หรือ 2:
1. **โมดูลตรวจสุขภาพการเงิน (`AI_ตรวจสุขภาพการเงินเบื้องต้น`):**
   * ห้ามคำนวณก่อนข้อมูลครบ 4 ตัว (`income`, `expense`, `debt`, `savings`)
   * คำนวณและบันทึกค่า:
     * `<<financial_surplus_amount>> = income - expense - debt`
     * `<<financial_surplus_ratio>> = (surplus / income) * 100`
     * `<<financial_debt_ratio>> = (debt / income) * 100`
     * `<<financial_emergency_months>> = savings / expense`
     * `<<financial_health_level>>` = `good` | `moderate` | `improve`
   * **Cross-Sell Handoff ใน Step 10:**
     * เลือก "วางแผนเงินออม" $\rightarrow$ ส่งต่อคนที่ 2 (`AI_วางแผนการออม`) พร้อมส่งค่า `financial_current_savings` และ `financial_surplus_amount` ไปให้ คนที่ 2 ไม่ต้องถามซ้ำ
     * เลือก "วางแผนเกษียณ" $\rightarrow$ ส่งต่อคนที่ 2 (`AI_วางแผนการเกษียณ`)
     * เลือก "การลงทุน" $\rightarrow$ ส่งต่อ `AI_วางแผนการลงทุน`
2. **โมดูลการลงทุน (`AI_วางแผนการลงทุน`):**
   * Compliance: ห้ามสร้างชื่อกองทุนเอง ต้องเรียกข้อมูลจาก `Tools_กองทุนแนะนำ` และ `Tools_การลงทุนน่ารู้` เท่านั้น
   * หากลูกค้าต้องการนัดหมาย ให้บันทึกสถานะ `investment_interest_status = true` แล้วใช้ Tool โอนสายเจ้าหน้าที่

---

## 5. มาตรฐานการใช้งาน Tools (Global Tools Specification)

### 5.1 Tool: `handoff`
ใช้สำหรับโอนถ่ายสายสนทนาข้ามโมดูล
```json
{
  "tool_name": "handoff",
  "description": "โอนสายไปยัง AI Agent เฉพาะทาง พร้อมส่งต่อข้อมูลบริบท",
  "parameters": {
    "target_agent": {
      "type": "string",
      "enum": [
        "AI_Greeting",
        "AI_วางแผนการออม",
        "AI_วางแผนการเกษียณ",
        "AI_ตรวจสุขภาพการเงินเบื้องต้น",
        "AI_วางแผนการลงทุน"
      ],
      "required": true
    },
    "session_payload": {
      "type": "object",
      "description": "Master Session State Schema",
      "required": true
    }
  }
}
```

### 5.2 Tool: `saas_faq_search`
ใช้สำหรับค้นหาคำตอบคำถามทั่วไป (เวลาเปิดปิด สาขา ดอกเบี้ยพื้นฐาน)
```json
{
  "tool_name": "saas_faq_search",
  "description": "ค้นหาคำตอบคำถามทั่วไปจากฐานความรู้ของธนาคาร",
  "parameters": {
    "query": {
      "type": "string",
      "description": "ข้อความคำถามของลูกค้า เช่น สาขาเปิดกี่โมง",
      "required": true
    }
  }
}
```

### 5.3 Tool: `transfer_to_human_agent`
ใช้สำหรับส่งต่อให้เจ้าหน้าที่ธนาคารจริง
```json
{
  "tool_name": "transfer_to_human_agent",
  "description": "โอนสายไปยังเจ้าหน้าที่ผู้เชี่ยวชาญเมื่อบอทไม่สามารถตอบได้ หรือลูกค้าร้องขอ",
  "parameters": {
    "reason": {
      "type": "string",
      "enum": ["customer_requested", "unclear_intent_limit", "faq_not_found", "investment_consultation", "gibberish_limit"]
    },
    "case_summary": {
      "type": "string",
      "description": "สรุปสั้นๆ ถึงปัญหาและความต้องการของลูกค้า"
    }
  }
}
```

---

## 6. กฎเหล็กกลางที่ทุก Agent ต้องปฏิบัติตาม (Universal Strict Rules)
1. **Rule of Persistence:** ทุกครั้งที่ได้รับ State มา ให้ดึง `p_display_name` มาใช้ในคำทักทาย ห้ามถามชื่อซ้ำเด็ดขาด
2. **Rule of Slot Pre-filling:** หากใน State มีตัวเลขใดๆ บันทึกมาแล้วจากการสนทนาก่อนหน้า (เช่น เงินออม หรือรายได้) ให้ Agent ถือว่าได้ค่านั้นแล้ว และข้ามไปถามคำถามใน Step ถัดไปได้ทันที
3. **Session Recovery Memory:** เมื่อถูกขัดจังหวะด้วย FAQ หลังตอบคำถาม FAQ จบ ให้พูดว่า:
   > *"จากที่เราคุยเรื่อง [ชื่อเรื่องที่ค้างไว้] ต่อในขั้นตอน [STEP ที่ค้างไว้] นะคะ..."* แล้วทวนคำถามเดิมทันที

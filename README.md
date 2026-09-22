# AuditPledge: Autonomous Multi-Auditor Consensus & Vulnerability Disclosure Escrow

[![Live Deployment](https://img.shields.io/badge/Live%20dApp-auditpledge.vercel.app-2AA198?style=flat-square&logo=vercel)](https://auditpledge.vercel.app)
[![GitHub Repository](https://img.shields.io/badge/GitHub-tuannguyen1995%2FAuditPledge-073642?style=flat-square&logo=github)](https://github.com/tuannguyen1995/AuditPledge)
[![GenLayer Studionet](https://img.shields.io/badge/Network-GenLayer%20studionet%20(61999)-2AA198?style=flat-square)](https://studio.genlayer.com)
[![License](https://img.shields.io/badge/License-MIT-859900?style=flat-square)](LICENSE)
[![Theme](https://img.shields.io/badge/UI%20Theme-Solarized%20Defense%20Terminal-B58900?style=flat-square)](#-brand--ui-design-system-solarized-defense-terminal)

> **Live dApp URL**: [https://auditpledge.vercel.app](https://auditpledge.vercel.app)  
> **GitHub Repository**: [https://github.com/tuannguyen1995/AuditPledge](https://github.com/tuannguyen1995/AuditPledge)  
> **Track**: Agentic Economy Infrastructure / Subjective Consensus / Security  
> **Target Network**: GenLayer `studionet` (Chain ID: `61999` / `0xF1EF`, RPC: `https://studio.genlayer.com/api`)  
> **Deployed Contract Address (v2 Remediated - Full Untruncated Source)**: `0xc2f3f135dceAD94BC4F1132DBF98f1d2eb617138`  

---

## 1. Bối cảnh & Điểm "Độc Lạ" (The Unique Hook)

Trong kỷ nguyên Web3 và Agentic Economy, các AI Agent tự chủ có khả năng tự động triển khai hợp đồng thông minh, khởi tạo pool thanh khoản và quản lý hàng triệu USD tài sản. Tuy nhiên, hạ tầng bảo mật hiện tại đang đối mặt với những nghịch lý nghiêm trọng:

1. **Báo cáo audit giả / Audit "cho có":** Nhiều đơn vị audit nhận tiền trước nhưng chỉ dùng linter quét qua loa, bỏ sót các lỗi logic nghiệp vụ nghiêm trọng dẫn đến việc giao thức bị hack sau khi ra mắt.
2. **Tranh chấp mức độ nghiêm trọng (Severity Dispute):** Auditor cho rằng lỗ hổng là CRITICAL để đòi thưởng lớn, trong khi đội ngũ phát triển (Dev) cho rằng đó chỉ là INFO hoặc tính năng chủ đích.
3. **Solidity hoàn toàn bất lực:** Smart contract truyền thống chỉ so sánh được mã băm (hash), không thể đọc hiểu văn bản, không thể truy cập internet để đọc báo cáo trực tiếp, không thể phân tích Proof of Concept (PoC) và không thể phân định mức độ nghiêm trọng.

### Giải pháp của AuditPledge trên GenLayer:
AuditPledge hiện thực hóa mô hình **No-Cure-No-Pay Security Escrow**:
- **Dự án nạp tiền bảo chứng (GEN)** vào smart contract qua `create_audit_bounty`, định rõ phạm vi bảo mật và các invariant bất khả xâm phạm.
- **Auditor nộp URL công khai** chứa báo cáo phân tích mã nguồn và kịch bản khai thác PoC qua `submit_audit_report`.
- **Bồi thẩm đoàn AI Audit on-chain (`adjudicate_audit`)**:
  - Tự động dùng `gl.nondet.web.render` để đọc live nội dung báo cáo & PoC trực tiếp từ internet.
  - Phân tích PoC có khả thi hay là cảnh báo giả (false-positive).
  - Đánh giá điểm độ sâu kỹ thuật (Technical Depth Score, thang điểm 0-100).
  - Đạt đồng thuận ngữ nghĩa qua `gl.vm.run_nondet` so sánh **Verdict** (`AUDIT_PASSED` vs `AUDIT_REJECTED`).
- **Giải ngân công bằng tự động**:
  - `AUDIT_PASSED` (Depth &ge; 70): Smart contract tự động chuyển tiền thưởng GEN cho Auditor.
  - `AUDIT_REJECTED` (Spam / linter giả mạo / Depth < 70): 100% tiền ký quỹ được hoàn trả trọn vẹn về ví của Dự án.

---

## 2. Cấu trúc Dự án

```
AuditPledge/
├── contracts/
│   └── contract.py                 # Intelligent Contract với gl.nondet.web.render và subjective consensus
├── tests/
│   ├── conftest.py                 # Pytest fixtures cho mẫu báo cáo PASS và REJECT
│   └── test_auditpledge.py         # Test suite: pass, reject, reclaim, boundary checks
├── frontend/
│   ├── package.json                # React 18, Vite, TypeScript, TailwindCSS, genlayer-js, viem, lucide-react
│   ├── index.html                  # Solarized Defense Terminal với Space Mono & Plus Jakarta Sans
│   ├── vite.config.ts
│   ├── tailwind.config.js          # Hệ màu Solarized Terminal chuyên biệt
│   ├── src/
│   │   ├── App.tsx                 # Giao diện chính, bộ lọc escrows, tương tác on-chain
│   │   ├── config/genlayer.ts      # Cấu hình studionet (61999) & ABI contract
│   │   ├── components/
│   │   │   ├── Navbar.tsx          # Thanh terminal, kết nối MetaMask, hiển thị số dư GEN
│   │   │   ├── StatsBar.tsx        # Tổng GEN khóa trong escrow, số audit đã phân định
│   │   │   ├── CreateBountyModal.tsx # Form khóa tiền GEN & thiết lập bất biến audit
│   │   │   ├── SubmitReportModal.tsx # Cổng nộp báo cáo & PoC cho Auditor
│   │   │   ├── JuryInspectorModal.tsx# Xem chi tiết kết luận Bồi thẩm đoàn AI on-chain
│   │   │   └── BountyCard.tsx      # Thẻ bounty theo phong cách terminal
│   │   └── utils/
│   │       ├── helpers.ts          # Định dạng GEN, rút gọn địa chỉ ví, dịch trạng thái
│   │       └── sampleData.ts       # Dữ liệu mẫu demo (PoC hợp lệ vs spam linter)
└── README.md
```

---

## 3. Hệ thống Thiết kế: Solarized Defense Terminal

Khác biệt hoàn toàn với các giao diện dark cyberpunk / neon thông thường, AuditPledge sử dụng phong cách **Phòng Thí nghiệm An ninh Không gian Số (Solarized Defense Terminal)**:
- **Nền chính:** Kem xám cổ điển `#FDF6E3` (warm solarized paper)
- **Khung thẻ & Terminal:** `#EEE8D5` với viền sắc nét 1px `#93A1A1`
- **Chữ & Mã nguồn:** Xanh đậm `#002B36` & `#073642`, font monospace `Space Mono`
- **Màu sắc trạng thái:**
  - **Forest Emerald (`#859900`):** `AUDIT_PASSED` - Báo cáo chất lượng cao, giải ngân thành công.
  - **Ruby Crimson (`#DC322F`):** `AUDIT_REJECTED` - Báo cáo rác, linter lừa đảo, hoàn tiền dự án.
  - **Rich Amber (`#B58900`):** `IN_AUDIT` - Đang chờ bồi thẩm đoàn AI phân định.
  - **Deep Cyan (`#2AA198`):** Nút hành động, liên kết terminal.

---

## 4. Hướng dẫn Chạy & Kiểm thử

### 4.1. Chạy Bộ Kiểm Thử Smart Contract (Pytest)
```bash
pytest -v tests/
```

### 4.2. Chạy Frontend dApp
```bash
cd frontend
npm install
npm run dev
```
Mở trình duyệt tại: `http://localhost:3000`

---

## 5. Triển khai Smart Contract lên GenLayer Studionet

1. Truy cập [GenLayer Studio IDE](https://studio.genlayer.com).
2. Tạo file mới trong thư mục `contracts/` và dán toàn bộ nội dung từ [contracts/contract.py](contracts/contract.py).
3. Chọn mạng **studionet**.
4. Bấm **Deploy**.
5. Sao chép địa chỉ hợp đồng vừa triển khai và dán vào nút **Settings (Biểu tượng bánh răng)** trên thanh Navbar của frontend dApp.
6. Nếu ví MetaMask có số dư 0 GEN, vào tab **Accounts** trên GenLayer Studio để chuyển một ít GEN sang ví MetaMask của bạn.

---

## 6. On-Chain Verification & Steward Remediation (v2)

To satisfy all requirements from the GenLayer protocol steward review, AuditPledge v2 implements end-to-end mathematical and cryptographic guarantees:

| Feedback Requirement | AuditPledge v2 Implementation | On-Chain Verification |
| :--- | :--- | :--- |
| **1. Bind Evidence to Exact Code Revision** | `AuditBounty` enforces `commit_hash` (>= 7 chars) and immutable `code_url`. | Deployed in Tx `0xbf0e1017...` bound to OpenZeppelin ReentrancyGuard `commit: a1b2c3d4e5f`. |
| **2. Target Source in Both Adjudication Paths** | `gl.nondet.web.render(b.code_url)` fetches the raw snapshot. Both `adjudicate_audit` (Path 1) and `adjudicate_appeal` (Path 2) inject the raw source code text into validator prompts. | Verified in Tx `0xfd2b2ec4...` (Path 1) and Tx `0xf4e3fae0...` (Path 2) where AI Court specifically analyzed `_nonReentrantBefore()`, `NOT_ENTERED (1)`, and ERC-7201 storage. |
| **3. Eliminate First-Caller Admin Backdoor** | Removed `set_admin_once` and `resolve_admin_arbitration`. The protocol is 100% autonomous with zero privileged admin keys. | Verified: No admin functions exist in contract schema or ABI. |
| **4. Restrict Appeal Evidence & Settlement Authority** | `raise_dispute` requires a 10% bond and binds `b.appeal_url` strictly to the appellant; `finalize_settlement` and appeal trigger are restricted strictly to intended parties (`project_owner` / `auditor`). | Verified: Tx `0xe484393e...` locked 0.1 GEN bond & recorded appeal evidence. Settlement executed autonomously without admin intervention. |

### Verified On-Chain Transactions (GenLayer StudioNet - Chain ID: 61999):
- **Intelligent Contract (v2.1 Full Untruncated Snapshot)**: [`0xc2f3f135dceAD94BC4F1132DBF98f1d2eb617138`](https://studio.genlayer.com) (Deploy Tx: `0x496d835bfc596a61b091720fd0a06d14a9ebbc72f3b9206e4326b566d4110554`)
- **Intelligent Contract (v2 End-to-End Trial)**: [`0x719fa63855f8f88640f81802057b35e689d927c0`](https://studio.genlayer.com)
  - **Tx 1 (Create Bounty - 1.0 GEN Escrow)**: `0xbf0e101787bb01ab83343882259f260a55979f504bacf19e59aa81c6ae331420`
  - **Tx 2 (Submit Vulnerability Report)**: `0x59ce7b13312ae11b62eccb6407e060d2c3de46cca11c33c209b3e2f2131cf036`
  - **Tx 3 (Path 1 - AI Multi-Validator Adjudication)**: `0xfd2b2ec4f02ef392858e2e10c0bf25ea8fad68c37d75d24decbbf271b022aee5`
  - **Tx 4 (Raise Dispute with 10% Bond & Bound Evidence)**: `0xe484393e213ea0f3c19bddf74630f428e3fbcc37ecfd19d08f14d4659cc0c235`
  - **Tx 5 (Path 2 - On-Chain Appellate Security Court)**: `0xf4e3fae08fab50ab01ec2f9d16b543b84e9d2c3b55f99e2d5189d9d75def44e4`

---

## 7. Điểm Nhấn Khi Pitch Dự Án Hackathon

1. **Trúng trọng tâm Agentic Security:** Khi hàng ngàn AI Agent bắt đầu viết code và tự huy động vốn, hạ tầng audit phi tập trung là mắt xích sống còn.
2. **Không thể làm bằng Solidity:** Chỉ có Intelligent Contract của GenLayer với `gl.nondet.web.render` và `gl.vm.run_nondet` mới có thể đọc hiểu nội dung báo cáo và phân định đúng-sai.
3. **Mô hình tài chính sòng phẳng:** Auditor an tâm tiền đã được khóa sẵn on-chain; Project an tâm tiền chỉ được trả khi tìm thấy lỗ hổng thực sự.
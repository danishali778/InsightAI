# Export System: Verification & Quality Guide

This document tracks the verification requirements and future improvements for the InsightAI Export System (CSV and PNG).

## 1. CSV Data Export (Widget Level)
*Status: Implemented*

### Verification Checklist
- [ ] **Structural Integrity**: Ensure rows and columns align perfectly in Excel/Sheets.
- [ ] **RFC 4180 Compliance**: Verify that fields containing commas (`,`), quotes (`"`), or newlines (`\n`) are correctly escaped and wrapped in double-quotes.
- [ ] **Data Precision**:
    - [ ] Big numbers (Revenue/ID) should be treated as strings to avoid scientific notation.
    - [ ] Decimals should match the database precision.
    - [ ] `NULL` values should render as empty strings, not the word "null".
- [ ] **Filename Safety**: Ensure special characters in widget titles (like `/`, `\`, `*`) are replaced with underscores to prevent OS file saving errors.

### Continuous Improvement Ideas
- [ ] **Type Castings**: Add a toggle to export dates in ISO format vs. User-friendly format.
- [ ] **Excel Styling**: Support `.xlsx` format with basic cell styling (bold headers, alternating row colors).

---

## 2. PNG Dashboard Capture (Global Level)
*Status: Implemented via html2canvas*

### Verification Checklist
- [ ] **Visual Fidelity**:
    - [ ] **Resolution**: Ensure the output is high-DPI (2x scale) so it stays sharp on Retina displays.
    - [ ] **CSS Support**: Verify that `backdrop-filter` (glassmorphism) and `box-shadow` are captured. If they look flat, consider a fallback "Screenshot Mode" CSS class.
- [ ] **Dynamic Elements**:
    - [ ] **Charts**: Verify that Recharts/SVG elements are fully painted before capture.
    - [ ] **Legends**: Ensure chart legends don't get cut off at the bottom.
- [ ] **Privacy**: Ensure sensitive user info (like API keys in the settings sidebar) is excluded if the sidebar was open during capture.

### Continuous Improvement Ideas
- [ ] **PDF Export**: Implement multi-page PDF generation (one widget per page).
- [ ] **Branded Overlay**: Add an "InsightAI" watermark or "Generated on [Date]" footer to exported images.
- [ ] **Selective Capture**: Allow users to drag a selection box or choose specific widgets to include in a single PNG.

---

## 3. UX & Functional Flow
- [ ] **Download State**: Add a "Generating..." spinner to the button for long PNG captures.
- [ ] **Error Handling**: Show a toast notification if an export fails (e.g., if the browser blocks the download).
- [ ] **Mobile Support**: Test if "Download PNG" works on iOS/Android browsers (often requires different blob handling).

---

## Maintenance Notes
This file should be updated after every deployment (Launch) to reflect new edge cases found by users.

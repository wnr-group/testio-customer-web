# Task 3: Manual QA & Regression Verification Checklist

**Prerequisite:** Task 1 (Supabase RPC deployment) must be complete and verified in the SQL Editor before starting QA.

**Context:** Task 2 code is implemented and committed. You'll now test the feature in a running browser to verify:
1. The three-state button renders correctly (loading → success → failure)
2. Phone data displays correctly for different order states
3. Responsive layout works on all widths
4. No console errors or regressions
5. Unrelated features still work (Rate Order, Status Stepper, etc.)

---

## Pre-QA Setup

- [ ] Task 1 (Supabase RPC) is deployed and verified in SQL Editor
- [ ] Task 2 is committed (commit `9571554`)
- [ ] `npm run dev` is started and listening on `localhost:3000`
- [ ] Browser DevTools console is open for error monitoring
- [ ] You are logged in as a test customer account

---

## Test Cases (10 manual tests)

### Test 1: Pending Order with Valid Phone
**Scenario:** Load an order in `pending` status where the cook has a `users.phone` set.

- [ ] Page loads without errors, and the page's own loading skeleton clears without waiting on the phone RPC
- [ ] "Call Cook" button starts disabled/grey (loading state), independently of the rest of the page
- [ ] Within 1-2 seconds, button becomes active red with phone number on second line
- [ ] Phone number displayed matches the cook's actual phone (verify in Supabase or from order details)
- [ ] Clicking button initiates a call (tel: link works)

**Expected:** ✓ Pass  
**Observed:** ___________

---

### Test 2: Ready Order with Valid Phone (Different Cook)
**Scenario:** Load a different order in `ready` status with a different cook who has a phone.

- [ ] Phone shown is NOT the same as Test 1 (different cook)
- [ ] Phone shown matches THIS order's cook (verify in Supabase)
- [ ] No stale data from previous page view
- [ ] Button render and functionality same as Test 1

**Expected:** ✓ Pass  
**Observed:** ___________

---

### Test 3: Completed Order
**Scenario:** Load an order in `completed` status.

- [ ] Phone still displays correctly
- [ ] "Rate your order" button is present and functional (regression check)
- [ ] Status Stepper shows "Completed" correctly
- [ ] No new console errors

**Expected:** ✓ Pass  
**Observed:** ___________

---

### Test 4: Empty Phone on Cook's User Row
**Scenario:** Use an order whose cook's `users.phone` is NULL, empty string, or whitespace only.

- [ ] Button renders in "Phone unavailable" disabled state
- [ ] No crash, no blank phone displayed
- [ ] No console errors

**Expected:** ✓ Pass  
**Observed:** ___________

---

### Test 5a: Unauthorized Order (Redirect, No Disclosure)
**Scenario:** Access an order that doesn't belong to the logged-in customer.

- [ ] Page redirects to `/orders` with an "Order not found" toast
- [ ] Redirect happens before the phone RPC ever runs — no order, item, or phone data is disclosed

**Expected:** ✓ Pass  
**Observed:** ___________

---

### Test 5b: Authorized Order, RPC Returns No Phone
**Scenario:** Access an order that *does* belong to the logged-in customer, where `get_order_cook_phone` resolves to `null`.

- [ ] Order page loads normally (order, items, status all render)
- [ ] Button renders "Phone unavailable" state
- [ ] No crash or expose of sensitive data

**Expected:** ✓ Pass  
**Observed:** ___________

---

### Test 6: Network / RPC Error
**Scenario:** In DevTools, throttle to "Offline" right as the page loads, or use request blocking to block Supabase RPC calls.

- [ ] `phoneError` is logged to console (check console)
- [ ] `cookPhoneLoading` still resolves to false (button doesn't hang)
- [ ] Button shows "Phone unavailable" fallback
- [ ] Page does not crash or hang in loading state

**Expected:** ✓ Pass  
**Observed:** ___________

---

### Test 7: Responsive Layout — Desktop (≥1024px)
**Scenario:** Open Order Detail page at desktop width in DevTools device emulation.

- [ ] Call Cook button renders correctly inside Cook Info card
- [ ] Phone number on second line doesn't wrap awkwardly
- [ ] Spacing and alignment match the "Rate your order" button's style
- [ ] No horizontal overflow

**Expected:** ✓ Pass  
**Observed:** ___________

---

### Test 8: Responsive Layout — Tablet (~768px)
**Scenario:** Resize to tablet width.

- [ ] Call Cook button and phone fit without truncation
- [ ] Layout matches desktop proportions
- [ ] No gaps or misalignment

**Expected:** ✓ Pass  
**Observed:** ___________

---

### Test 9: Responsive Layout — Mobile (~375px)
**Scenario:** Resize to mobile width.

- [ ] Call Cook button and phone fit within Cook Info card bounds
- [ ] Text may wrap to two lines naturally (acceptable)
- [ ] Phone number is readable
- [ ] No overlap or layout break

**Expected:** ✓ Pass  
**Observed:** ___________

---

### Test 10: Console Errors & React Warnings
**Scenario:** Reload Order Detail page with DevTools console open. Load pending, ready, and completed orders.

- [ ] No new JavaScript errors introduced by this change
- [ ] No React warnings (key warnings, hydration mismatches, etc.)
- [ ] Only pre-existing console issues (if any) are visible
- [ ] No "Fetch cook phone error" unless intentionally triggered

**Expected:** ✓ Pass  
**Observed:** ___________

---

## Regression Tests (Verify Unrelated Features Still Work)

| Feature | Action | Expected | Status |
|---------|--------|----------|--------|
| Orders List | Navigate to `/orders` | List loads, orders render | [ ] |
| Realtime Order Status | Load order, status changes in Supabase | Status updates live (useRealtimeOrder hook) | [ ] |
| Status Stepper | View status progression | Shows current step correctly | [ ] |
| Review Order Flow | Load completed order, click "Rate your order" | Review modal/page opens, can submit rating | [ ] |
| Cancel Order Dialog | Load pending order, click "Cancel Order" | Dialog opens, can cancel | [ ] |
| Totals/Items Rendering | View order items | Items list and prices render correctly | [ ] |
| Cart | Navigate to `/checkout` | Cart loads and shows items | [ ] |
| Top-level Navigation | Use navbar buttons | Navigation works (breadcrumbs, back button) | [ ] |
| Login/Auth Redirect | Try to access protected route unsigned | Redirects to login correctly | [ ] |

---

## Summary

**Total Tests:** 10 manual + 9 regression  
**All Passed?** ___________  
**Any Failures?** ___________  

**Sign-off:** Feature ready for production? [ ] YES [ ] NO

**Notes:**
(Record any unexpected findings, device-specific issues, or edge cases observed)


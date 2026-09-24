#!/bin/bash
BASE=http://localhost:5000/api

echo "=== 1. Login as student ==="
STU=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | jq -r .token)
echo "student token: ${STU:0:20}..."

echo "=== 2. Student submits application ==="
APP=$(curl -s -X POST $BASE/applications/submit -H "Authorization: Bearer $STU")
echo "$APP" | jq '{_id, status, applicationNumber}'
APP_ID=$(echo "$APP" | jq -r ._id)

echo "=== 3. Login as admissions ==="
ADM=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"andrewarcada@gmail.com","password":"password123"}' | jq -r .token)

echo "=== 4. Admissions: submitted → pending_approval ==="
curl -s -X PATCH $BASE/applications/$APP_ID/status -H "Authorization: Bearer $ADM" \
  -H "Content-Type: application/json" -d '{"status":"pending_approval"}' | jq '.status'

echo "=== 5. Admissions: pending_approval → approved ==="
curl -s -X PATCH $BASE/applications/$APP_ID/status -H "Authorization: Bearer $ADM" \
  -H "Content-Type: application/json" -d '{"status":"approved"}' | jq '.status'

echo "=== 6. Login as finance ==="
FIN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"docstrange411@gmail.com","password":"password123"}' | jq -r .token)

echo "=== 7. Finance: approved → finance_review ==="
curl -s -X PATCH $BASE/applications/$APP_ID/status -H "Authorization: Bearer $FIN" \
  -H "Content-Type: application/json" -d '{"status":"finance_review"}' | jq '.status'

echo "=== 8. Finance: finance_review → payment_validated ==="
curl -s -X PATCH $BASE/applications/$APP_ID/status -H "Authorization: Bearer $FIN" \
  -H "Content-Type: application/json" -d '{"status":"payment_validated"}' | jq '.status'

echo "=== 9. Admissions: payment_validated → admitted ==="
curl -s -X PATCH $BASE/applications/$APP_ID/status -H "Authorization: Bearer $ADM" \
  -H "Content-Type: application/json" -d '{"status":"admitted"}' | jq '{status, studentNumber, applicationNumber}'

echo "=== 10. Finance: admitted → enrolled ==="
curl -s -X PATCH $BASE/applications/$APP_ID/status -H "Authorization: Bearer $FIN" \
  -H "Content-Type: application/json" -d '{"status":"enrolled"}' | jq '{status, studentNumber}'

echo "=== Done. Application ID: $APP_ID ==="

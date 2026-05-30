#!/usr/bin/env bash
# HANCR — اختبار تدفق الرحلة الكامل عبر API الإنتاج
set -u
API="https://api.hancr.com"
RIDER_PHONE="+966500000001"
DRIVER_PHONE="+966500000010"
SVC=7        # Economy — Saudi (region 3)
REGION=3
# Riyadh coords
P_LAT=24.7136; P_LNG=46.6753       # pickup
D_LAT=24.7500; D_LNG=46.7000       # dropoff

jqv() { python3 -c "import sys,json; d=json.load(sys.stdin); print(d$1)" 2>/dev/null; }

echo "════════════ 1) RIDER LOGIN ════════════"
curl -s -X POST $API/rider/graphql -H "Content-Type: application/json" \
  -d "{\"query\":\"mutation{sendOtp(input:{phone:\\\"$RIDER_PHONE\\\"}){success devOtp}}\"}" >/dev/null
RJSON=$(curl -s -X POST $API/rider/graphql -H "Content-Type: application/json" \
  -d "{\"query\":\"mutation{verifyOtp(input:{phone:\\\"$RIDER_PHONE\\\",code:\\\"123456\\\"}){accessToken rider{id}}}\"}")
RTOKEN=$(echo "$RJSON" | jqv "['data']['verifyOtp']['accessToken']")
echo "Rider token: ${RTOKEN:0:25}... (len ${#RTOKEN})"

echo "════════════ 2) DRIVER LOGIN ════════════"
curl -s -X POST $API/driver/graphql -H "Content-Type: application/json" \
  -d "{\"query\":\"mutation{driverSendOtp(phone:\\\"$DRIVER_PHONE\\\"){success}}\"}" >/dev/null
DJSON=$(curl -s -X POST $API/driver/graphql -H "Content-Type: application/json" \
  -d "{\"query\":\"mutation{driverVerifyOtp(phone:\\\"$DRIVER_PHONE\\\",code:\\\"123456\\\"){accessToken driver{id}}}\"}")
DTOKEN=$(echo "$DJSON" | jqv "['data']['driverVerifyOtp']['accessToken']")
echo "Driver token: ${DTOKEN:0:25}... (len ${#DTOKEN})"

echo "════════════ 3) DRIVER updateLocation (near pickup, service $SVC) ════════════"
curl -s -X POST $API/driver/graphql -H "Content-Type: application/json" -H "Authorization: Bearer $DTOKEN" \
  -d "{\"query\":\"mutation{updateLocation(input:{lat:$P_LAT,lng:$P_LNG,heading:90,serviceIds:[$SVC]}){driverId lat lng}}\"}"
echo ""

echo "════════════ 4) DRIVER goOnline ════════════"
curl -s -X POST $API/driver/graphql -H "Content-Type: application/json" -H "Authorization: Bearer $DTOKEN" \
  -d "{\"query\":\"mutation{goOnline}\"}"
echo ""

echo "════════════ 5) RIDER createOrder ════════════"
OJSON=$(curl -s -X POST $API/rider/graphql -H "Content-Type: application/json" -H "Authorization: Bearer $RTOKEN" \
  -d "{\"query\":\"mutation{createOrder(input:{points:[{lat:$P_LAT,lng:$P_LNG},{lat:$D_LAT,lng:$D_LNG}],addresses:[\\\"Riyadh Center\\\",\\\"Riyadh North\\\"],serviceId:$SVC,regionId:$REGION,paymentMode:\\\"Cash\\\"}){id status costBest currency distanceBest etaPickup}}\"}")
echo "$OJSON"
ORDER_ID=$(echo "$OJSON" | jqv "['data']['createOrder']['id']")
echo ">>> ORDER_ID=$ORDER_ID"

if [ -z "$ORDER_ID" ] || [ "$ORDER_ID" = "None" ]; then
  echo "!!! createOrder FAILED — aborting"; exit 1
fi

echo "════════════ 6) DRIVER acceptOrder #$ORDER_ID ════════════"
curl -s -X POST $API/driver/graphql -H "Content-Type: application/json" -H "Authorization: Bearer $DTOKEN" \
  -d "{\"query\":\"mutation{acceptOrder(orderId:$ORDER_ID){id status riderName costBest currency}}\"}"
echo ""

echo "════════════ 7) DRIVER arrivedAtPickup ════════════"
curl -s -X POST $API/driver/graphql -H "Content-Type: application/json" -H "Authorization: Bearer $DTOKEN" \
  -d "{\"query\":\"mutation{arrivedAtPickup(orderId:$ORDER_ID){id status}}\"}"
echo ""

echo "════════════ 8) DRIVER startRide ════════════"
curl -s -X POST $API/driver/graphql -H "Content-Type: application/json" -H "Authorization: Bearer $DTOKEN" \
  -d "{\"query\":\"mutation{startRide(orderId:$ORDER_ID){id status startTimestamp}}\"}"
echo ""

echo "════════════ 9) DRIVER finishRide ════════════"
curl -s -X POST $API/driver/graphql -H "Content-Type: application/json" -H "Authorization: Bearer $DTOKEN" \
  -d "{\"query\":\"mutation{finishRide(orderId:$ORDER_ID){id status finishTimestamp costBest}}\"}"
echo ""

echo "════════════ 10) RIDER activeOrder (final state) ════════════"
curl -s -X POST $API/rider/graphql -H "Content-Type: application/json" -H "Authorization: Bearer $RTOKEN" \
  -d "{\"query\":\"{activeOrder{id status driverName costBest currency}}\"}"
echo ""
echo "════════════ DONE ════════════"

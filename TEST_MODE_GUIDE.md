# Testing Guide - GeekSafe Testable Version

## 🎯 Overview

Your app now supports **complete offline testing** with mock payloads and automatic Gemini API fallbacks. This means you can test the entire app without running the backend, and the backend will gracefully handle API failures.

## Quick Start - Enable Test Mode

### Option 1: Edit testConfig.ts (Permanent)

Edit `geeksafe-mobile/api/testConfig.ts`:

```typescript
export const TEST_CONFIG = {
    ENABLED: true,  // ← Change to true
    VERBOSE_LOGGING: true,
    NETWORK_DELAY_MS: 500,
};
```

### Option 2: Use TestModeToggle Component (Runtime)

Add the debug component to your app:

```tsx
// geeksafe-mobile/app/(tabs)/index.tsx (or anywhere you want)
import TestModeToggle from '@/components/TestModeToggle';

export default function Index() {
    return (
        <View>
            <TestModeToggle />  {/* Add this for easy toggling */}
            {/* Rest of component */}
        </View>
    );
}
```

### Option 3: Programmatically Toggle (Runtime)

```tsx
import { useTestMode } from '@/api/apiService';

const testMode = useTestMode();
testMode.toggle();           // Toggle on/off
testMode.setEnabled(true);   // Enable
testMode.setEnabled(false);  // Disable
console.log(testMode.isEnabled()); // Check status
```

## ✅ What You Can Test

### Tab 1: Medication Scanner
**Test these medications:**
- `ibuprofen` → Moderate risk with alcohol
- `xanax` → Critical risk with alcohol
- `acetaminophen` → Moderate risk with alcohol
- `aspirin` → Safe with cannabis
- Any other input → 50/50 random (high or safe)

**Steps to test:**
1. Enable test mode
2. Type medication name
3. Select a substance (alcohol, cannabis, both)
4. Click "Check Risk"
5. Verify RiskOverlay shows:
   - Warning/Stable title
   - Medication + substance subtitle
   - AI analysis message
   - Reason/drug class info

### Tab 2: Safety Monitor
**Test vitals assessment:**
- Opens camera → simulates vital signs (via presageService)
- Generates risk level: DANGER, CAUTION, or STABLE
- Displays AI safety analysis

**Mock vitals:**
- DANGER: HR 145, BR 8, Stress 92 → Red overlay with critical warning
- CAUTION: HR 135, BR 14, Stress 78 → Yellow overlay with warning
- STABLE: HR 72, BR 16, Stress 35 → Green overlay with approval

## 🛠️ How It Works

### Frontend (Test Mode ON)
When `TEST_CONFIG.ENABLED = true`:
```
User Input → apiService → Mock Response (500ms delay) → RiskOverlay
```
- No network calls
- No backend required
- No camera access needed (uses presage simulation)
- Instant testing

### Frontend (Test Mode OFF)
When `TEST_CONFIG.ENABLED = false`:
```
User Input → apiService → Real Backend (ngrok) → RiskOverlay
```

### Backend (Gemini API Fallback)
When Gemini API fails or hits rate limit:
```
Backend receives request → Try Gemini API → If fails, use TEST_PAYLOADS → Response with test data
```

**Test payloads used:**
- `TEST_MEDICATION_ANALYSES` - AI explanations for drug interactions
- `TEST_VITALS_ANALYSES` - AI explanations for vital signs

## 📦 Files Modified

### Frontend
- `geeksafe-mobile/api/apiService.ts` - Added mock responses, test mode logic
- `geeksafe-mobile/api/testConfig.ts` - ✨ NEW centralized test configuration
- `geeksafe-mobile/components/TestModeToggle.tsx` - ✨ NEW debug toggle component

### Backend
- `main.py` - Added test payload fallbacks, improved AI generation functions

## 🎨 Test Payloads Reference

### Medication Risk Response
```json
{
  "found": true,
  "medication": "Xanax",
  "brand": "Alprazolam",
  "drug_class": "Benzodiazepine",
  "substance": "alcohol",
  "conflict": true,
  "risk": "critical",
  "reason": "Benzodiazepines with alcohol cause severe CNS depression...",
  "ai_analysis": "Combining Xanax with alcohol dramatically increases CNS depression...",
  "message": "Danger - critical conflict detected"
}
```

### Vitals Risk Response
```json
{
  "risk": "DANGER",
  "score": 9,
  "risk_score": 9,
  "color": "#FF3B30",
  "safety_analysis": "CRITICAL: Your vital signs indicate dangerous physiological stress...",
  "status": "CRITICAL: Vital signs show severe respiratory depression and high stress.",
  "vitals_confirmed": {
    "hr": 145,
    "br": 8,
    "stress": 92
  }
}
```

## 🧪 Testing Checklist

### Basic Functionality
- [ ] Enable test mode in testConfig.ts
- [ ] Reload app
- [ ] Navigation works to both tabs

### Medication Tab
- [ ] Search "ibuprofen"
- [ ] Select "alcohol"
- [ ] Click "Check Risk"
- [ ] RiskOverlay appears with RED background
- [ ] Title shows "WARNING MESSAGE"
- [ ] Contains AI analysis text
- [ ] Click "Back to Scan" - overlay closes
- [ ] Input form reappears

### Safety Tab
- [ ] Navigate to safety tab
- [ ] Camera permission requested (grant if available)
- [ ] After ~7 seconds, RiskOverlay appears
- [ ] Verify vitals display (HR, BR, Stress)
- [ ] Verify color matches risk level
- [ ] Click "Back to Scan" - overlay closes
- [ ] Scanning restarts

### Safe Interactions
- [ ] Search "aspirin"
- [ ] Select "cannabis"
- [ ] Check risk
- [ ] RiskOverlay appears with GREEN background
- [ ] Title shows "STATUS: STABLE"
- [ ] Contains safe message

### Error Handling (Turn ngrok off and disable test mode)
- [ ] Check medication
- [ ] Error message appears: "Failed to connect to backend..."
- [ ] Can still retry
- [ ] Backend uses fallback test payloads if available

## 🚀 Switching Between Modes

### For Development
```typescript
// testConfig.ts
TEST_CONFIG.ENABLED = true;   // ✅ Offline, instant feedback
TEST_CONFIG.VERBOSE_LOGGING = true;  // See all logs
```

### For Backend Testing
```typescript
// testConfig.ts
TEST_CONFIG.ENABLED = false;  // Uses real ngrok backend
// Ensure ngrok is running:
// python -m uvicorn main:app --host 0.0.0.0 --port 8001
```

### For Production
```typescript
// testConfig.ts
TEST_CONFIG.ENABLED = false;  // Use real API
TEST_CONFIG.VERBOSE_LOGGING = false;  // Disable debug logs
```

## 🔧 Console Logs to Look For

When test mode is enabled:
```
🧪 TEST MODE: Returning mock medication payload
```

When test mode is disabled but mock payloads are used (API fallback):
```
⚠️ AI LIMIT HIT: [error message]
```

Toggle test mode:
```
🧪 Test mode ENABLED ✅
🧪 Test mode DISABLED ❌
🧪 Test mode toggled to: ON
```

## ❓ Troubleshooting

| Issue | Solution |
|-------|----------|
| Getting "Cannot reach backend" | Set `TEST_CONFIG.ENABLED = true` in testConfig.ts |
| Getting generic AI error messages | Backend now uses test payloads automatically |
| Vitals not appearing | Make sure to grant camera permission |
| Overlay not showing after checking | Check console for API errors, try test mode |
| Want to test with real backend | Set `TEST_CONFIG.ENABLED = false` and ensure ngrok runs |
| Backend failing | Backend will use test payloads for Gemini API failures |

## 📝 Next Steps

1. **Enable test mode**: Update `testConfig.ts` with `ENABLED: true`
2. **Run the app**: `npx expo start --tunnel`
3. **Test Tab 1**: 
   - Search "ibuprofen" + "alcohol"
   - Verify red overlay with risk details
4. **Test Tab 2**: 
   - Grant camera access
   - Wait for vitals scan
   - Verify overlay appears with safety score
5. **Switch modes**: Toggle `TEST_CONFIG.ENABLED` to try real backend



# 🔧 RENDER NODE VERSION FIX - COMPLETE SOLUTION

**Problem**: Render is using Node 25 instead of Node 18  
**Solution**: Multiple methods to force Node 18

---

## ✅ **METHOD 1: Verify package.json (PRIMARY)**

**File**: `server/package.json`

**Current Status**: ✅ CORRECT

```json
{
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  }
}
```

**✅ This is correct!** The file is properly configured.

---

## ✅ **METHOD 2: Add .nvmrc File (BACKUP)**

**File**: `server/.nvmrc` (CREATED)

```
18.19.0
```

**Why**: Render checks for `.nvmrc` file as a fallback.

---

## ✅ **METHOD 3: Add render.yaml (EXPLICIT)**

**File**: `render.yaml` (CREATED in root)

```yaml
services:
  - type: web
    name: zubahouse-api
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_VERSION
        value: 18.19.0
    plan: free
```

**Note**: Only use this if you're using Render's Blueprint feature. Otherwise, ignore this file.

---

## 🚨 **CRITICAL: VERIFY THESE STEPS**

### **STEP 1: Confirm File Location**

The file MUST be at:
```
zuba-web2.0/server/package.json
```

**NOT**:
- ❌ `package.json` (root)
- ❌ `client/package.json`
- ❌ `admin/package.json`

### **STEP 2: Verify Content**

Open `server/package.json` and confirm you see:

```json
"engines": {
  "node": "18.x",
  "npm": "9.x"
}
```

**NOT**:
- ❌ `"node": ">=18.0.0"` (WRONG - allows 25)
- ❌ `"node": "20.x"` (WRONG - too new)
- ❌ `"node": "18"` (WRONG - needs .x)

### **STEP 3: Commit to GitHub**

```bash
# Navigate to project root
cd "C:\Users\ZeroX\OneDrive - Algonquin College\Desktop\0x\First Real Pj i\zuba2.0 web\zuba clone\zuba-web2.0"

# Check git status
git status

# Add the file
git add server/package.json
git add server/.nvmrc

# Commit
git commit -m "Force Node 18.x for Render deployment"

# Push to GitHub
git push origin main
# OR if your branch is master:
git push origin master
```

### **STEP 4: Verify on GitHub**

1. Go to your GitHub repository
2. Navigate to: `server/package.json`
3. Click "Raw" to see the file
4. Search for: `"node": "18.x"`
5. **MUST SEE**: `"node": "18.x"` (not 25, not >=18.0.0)

### **STEP 5: Force Redeploy on Render**

**Option A: Manual Redeploy**
1. Go to Render Dashboard
2. Click your service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Watch build logs

**Option B: Clear Cache (if needed)**
1. Render Dashboard → Your Service
2. Settings → Clear Build Cache
3. Then redeploy

### **STEP 6: Check Build Logs**

After redeploy, check the FIRST line of build logs:

**✅ CORRECT:**
```
==> Using Node.js version 18.19.0 via /opt/render/project/src/server/package.json
```

**❌ WRONG:**
```
==> Using Node.js version 25.2.0 via /opt/render/project/src/server/package.json
```

---

## 🔍 **TROUBLESHOOTING**

### **Issue: Still shows Node 25**

**Possible Causes:**

1. **File not committed to GitHub**
   - Solution: Check GitHub → server/package.json
   - If it shows old version → commit and push again

2. **Render reading wrong file**
   - Solution: Check Render settings → Root Directory = `server`
   - If wrong, update it

3. **Render cache**
   - Solution: Clear build cache in Render settings
   - Then redeploy

4. **Wrong branch**
   - Solution: Check Render → Settings → Branch
   - Make sure it's `main` or `master` (whichever you use)

### **Issue: Build fails after switching to Node 18**

**Possible Causes:**

1. **Dependencies incompatible with Node 18**
   - Solution: Run `npm install` locally with Node 18
   - Fix any errors before deploying

2. **Native modules need rebuild**
   - Solution: This is normal - first build after Node version change
   - Let it complete

---

## ✅ **VERIFICATION CHECKLIST**

Before deploying, verify:

- [ ] `server/package.json` has `"node": "18.x"` (not >=18.0.0)
- [ ] `server/.nvmrc` exists with `18.19.0`
- [ ] File is committed to GitHub
- [ ] GitHub shows correct version in `server/package.json`
- [ ] Render Root Directory is set to `server`
- [ ] Render Branch matches your GitHub branch
- [ ] Build cache cleared (if previous deploy failed)

---

## 🚀 **FINAL STEPS**

1. **Commit all changes:**
   ```bash
   git add server/package.json server/.nvmrc
   git commit -m "Force Node 18.x for Render - fix deployment"
   git push
   ```

2. **In Render Dashboard:**
   - Go to your service
   - Click "Manual Deploy"
   - Select "Deploy latest commit"
   - Watch build logs

3. **Verify in logs:**
   - First line should show: `Using Node.js version 18.19.0`
   - If it shows 25.x → the file wasn't updated on GitHub

4. **If still wrong:**
   - Double-check GitHub → server/package.json
   - Make sure you're editing the RIGHT file
   - Clear Render cache
   - Redeploy

---

## 📝 **QUICK REFERENCE**

**Correct engines field:**
```json
"engines": {
  "node": "18.x",
  "npm": "9.x"
}
```

**Files created:**
- ✅ `server/.nvmrc` → `18.19.0`
- ✅ `render.yaml` → Optional (for Blueprint)

**Render Settings:**
- Root Directory: `server`
- Build Command: `npm install` (or leave empty)
- Start Command: `npm start`

---

**After following these steps, Render WILL use Node 18! 🎯**


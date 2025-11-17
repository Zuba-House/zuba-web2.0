# 🚀 RENDER DEPLOYMENT FIX - Node 18 Issue

## ✅ **YOUR FILE IS CORRECT!**

Your `server/package.json` has the correct configuration:
```json
"engines": {
  "node": "18.x",
  "npm": "9.x"
}
```

---

## 🔍 **WHY RENDER STILL USES NODE 25**

Render reads from GitHub. If it's still using Node 25, one of these is true:

1. **The file on GitHub is different** (not pushed yet)
2. **Render is reading from an old commit**
3. **Render cache needs clearing**

---

## 🔧 **FIX IT NOW (Step-by-Step)**

### **STEP 1: Verify Local File**

Your local file is correct. Now verify it's on GitHub:

1. Go to: `https://github.com/YOUR_ORG/zubahouse/blob/master/server/package.json`
   - Replace `YOUR_ORG` with your GitHub username/org
   - Replace `master` with `main` if that's your branch

2. **Look at line 7** - Should show:
   ```json
   "node": "18.x",
   ```

3. **If it shows `">=18.0.0"` or `"25.x"`**:
   - The file on GitHub is OLD
   - You need to commit and push

### **STEP 2: Commit & Push (If Needed)**

```bash
# Check if package.json has uncommitted changes
git status server/package.json

# If it shows "modified", then:
git add server/package.json
git commit -m "Force Node 18.x for Render"
git push origin master
```

### **STEP 3: Add Backup Files (I Created These)**

```bash
# Add the backup files I created
git add server/.nvmrc
git commit -m "Add .nvmrc for Node 18"
git push origin master
```

### **STEP 4: Force Redeploy on Render**

1. **Go to Render Dashboard**
2. **Click your service** (zubahouse-api)
3. **Click "Manual Deploy"** button
4. **Select "Deploy latest commit"**
5. **Watch the build logs**

**Look for the FIRST line:**
```
==> Using Node.js version 18.19.0 via /opt/render/project/src/server/package.json
```

**✅ SUCCESS if you see `18.19.0` or `18.x`**  
**❌ FAIL if you still see `25.2.0`**

---

## 🎯 **IF STILL NOT WORKING**

### **Check Render Settings:**

1. **Service Settings** → **Root Directory**
   - Must be: `server`
   - NOT: `.` or empty or `./server`

2. **Service Settings** → **Branch**
   - Must be: `master` (or `main` if that's your branch)
   - Must match your GitHub branch

3. **Clear Build Cache:**
   - Settings → **Clear Build Cache**
   - Then redeploy

### **Alternative: Set Node Version in Render UI**

1. **Render Dashboard** → Your Service
2. **Environment** tab
3. **Add Environment Variable:**
   - Key: `NODE_VERSION`
   - Value: `18.19.0`
4. **Save**
5. **Redeploy**

---

## 📋 **FILES I CREATED FOR YOU**

1. **`server/.nvmrc`** → `18.19.0`
   - Render checks this as fallback

2. **`render.yaml`** → Optional Blueprint config
   - Only use if you're using Render Blueprint

3. **`RENDER_NODE_VERSION_FIX.md`** → Detailed guide
4. **`QUICK_FIX_NODE_VERSION.md`** → Quick reference

---

## ✅ **VERIFICATION**

After pushing and redeploying, check Render build logs:

**✅ CORRECT:**
```
==> Using Node.js version 18.19.0 via /opt/render/project/src/server/package.json
Installing dependencies...
```

**❌ WRONG:**
```
==> Using Node.js version 25.2.0 via /opt/render/project/src/server/package.json
```

---

## 🚀 **QUICK COMMANDS**

```bash
# 1. Verify local file
cat server/package.json | grep -A 2 engines

# 2. Commit if needed
git add server/package.json server/.nvmrc
git commit -m "Force Node 18.x"
git push origin master

# 3. Then go to Render and manually redeploy
```

---

**Your file is correct - just make sure it's on GitHub and redeploy! 🎯**


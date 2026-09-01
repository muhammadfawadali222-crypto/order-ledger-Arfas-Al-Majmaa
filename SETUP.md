# Afras Order Ledger — Setup Guide (Roman Urdu)

Ye app ab standalone hai — koi bhi device (mobile/computer) is par install ho sakta
hai aur data sab jagah automatically sync hoga. Isko live karne ke liye 2 kaam
karne hain: **(A) Firebase set up karna** (free), aur **(B) app ko host karna**
(free). Dono milakar 15-20 minute lagenge.

---

## A. Firebase set up karna (data ka ghar)

1. **[console.firebase.google.com](https://console.firebase.google.com)** kholein, Google account se login karein.
2. **"Add project"** click karein. Naam dein — jaise `afras-order-ledger`. Google
   Analytics ka sawal aaye to "Disable" kar dein (zaroorat nahi).
3. Project ban jaye to left sidebar mein **"Build" → "Authentication"** kholein.
   - **"Get started"** click karein.
   - **"Sign-in method"** tab mein **"Anonymous"** provider dhoondh kar **Enable**
     kar dein, phir Save.
   - *(Ye sirf security ke liye hai — har device khud-ba-khud silently sign in ho
     jayega, koi extra step user ko nahi karna hoga.)*
4. **"Build" → "Firestore Database"** kholein.
   - **"Create database"** click karein.
   - Location choose karein (koi bhi qareeb wali, jaise `me-central1` agar
     available ho, warna default rehne dein).
   - **"Start in production mode"** choose karein → Create.
   - Database ban jaye to **"Rules"** tab kholein, jo likha hai usay hata kar ye
     paste kar dein:
     ```
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /{document=**} {
           allow read, write: if request.auth != null;
         }
       }
     }
     ```
     **Publish** karein.
5. Firestore ka kaam mukammal.
   *(Storage ki zaroorat nahi — bills ki PDF bhi Firestore mein hi save hoti
   hain, taake poori app free "Spark" plan par rahe, koi card/billing
   zaroori nahi. Isi wajah se har bill ka size 700KB tak mahdood hai.)*
6. Left sidebar mein **⚙ (Project settings)** click karein → neeche scroll karein
   "Your apps" tak → **`</>`** (Web) icon click karein.
   - App ka koi bhi naam dein (jaise "Order Ledger") → **Register app**.
   - Ek code block dikhega jisme `const firebaseConfig = {...}` likha hoga.
   - **Ye poora object copy karein.**
7. Is folder mein `app-settings.js` file kholein, aur jo already likha hai
   usay apne copy kiye hue values se replace kar dein. Sirf values change
   karni hain, structure waisa hi rehne dein.

Firebase ka kaam mukammal.

---

## B. App ko host karna (free)

Do aasan options hain — koi bhi ek choose karein:

### Option 1: Netlify (sabse aasan, drag-and-drop)
1. [netlify.com](https://www.netlify.com) par jayein, free account banayein.
2. Login ke baad "Add new site" → **"Deploy manually"**.
3. Is poore folder (`order-ledger-pwa`) ko seedha browser mein drag-and-drop kar
   dein us box mein jahan likha hai "Drag and drop your site output folder".
4. 30 second mein ek link mil jayega jaisa `https://kuch-naam.netlify.app` —
   yehi aapki app ka address hai.

### Option 2: GitHub Pages
1. [github.com](https://github.com) par account banayein (agar nahi hai).
2. Naya repository banayein (jaise `order-ledger`), public rakhein.
3. Is folder ki saari files usmein upload kar dein ("Add file" → "Upload
   files").
4. Repository ki **Settings → Pages** mein jayein → "Branch: main" select
   karke Save karein.
5. 1-2 minute baad link mil jayega jaisa
   `https://aapka-username.github.io/order-ledger`.

---

## C. App install karna (mobile/computer par)

1. Upar wala link (Netlify ya GitHub Pages) apne mobile/computer ke browser
   mein kholein.
2. **Android (Chrome):** address bar ke paas ya menu (⋮) mein "Install app" /
   "Add to Home screen" ka option aayega — click karein.
3. **iPhone (Safari):** Share button (⬆) → "Add to Home Screen".
4. **Computer (Chrome/Edge):** address bar ke right side ek install icon (⊕ ya
   computer icon) aayega — click karein.
5. Ab app aapki home screen/app list mein normal app ki tarah dikhegi, apna
   icon aur naam ("Order Ledger") ke sath.
6. Jis bhi device par pehli baar kholenge, wahan **PIN set** karne ka mauqa
   milega. Wahi PIN har doosre device par bhi daalna hoga.

---

## Zaroori baatein

- **Data ab cloud mein hai** — jo bhi ye link aur PIN jaanta hai wo data
  dekh/badal sakta hai. Link aur PIN kisi ke sath share na karein jab tak
  zaroori na ho.
- **Bills ka size limit** — har PDF 700KB tak honi chahiye (ye Firestore ke
  free plan ki document-size limit se aata hai). Bari file ho to pehle kisi
  free tool (iLovePDF, SmallPDF) se compress kar lein, ya sirf zaroori pages
  rakhein.
- **Storage ki zaroorat nahi** — ye app jaan-boojh kar Firebase Storage use
  nahi karti (jise paid "Blaze" plan chahiye hota), taake sab kuch free
  "Spark" plan par chal sake.
- **Firebase free plan** normal personal/small-business use ke liye kaafi hai
  (roz ke hazaron reads/writes free hain) — jab tak bohot bara scale na ho,
  koi bill nahi aayega.
- Agar kabhi PIN bhool jayein, Firebase console mein **Firestore Database →
  `config` collection → `app` document** kholkar `pinHash` field delete kar
  dein — agli baar app khulte hi naya PIN set karne ka mauqa milega.

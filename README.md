```markdown
# 🏃‍♂️ UORC Run Club – Digital Sign-In & Raffle System

This repository contains the UORC Run Club digital sign-in system, including:

- Mobile-friendly sign-in page
- Waiver acceptance flow
- Raffle system integration

This replaces paper sign-ins and automates raffle drawings for each run.

---

## 🚀 How It Works

1. Participants scan a QR code  
2. Complete waiver + sign-in  
3. Data is stored in Google Sheets  
4. Raffle tool selects winners from that day’s participants  
5. Winners are logged automatically  

---

## 📁 Repository Structure

/
├── signin.html        # Sign-in launcher page
├── raffle.html        # Raffle launcher page
├── waiver.html        # Waiver page (if used)
├── assets/            # Icons, images, logos
└── README.md

---

## 🔗 Important Links

### Sign-In Page (QR Code Target)
https://uorcrunclub.github.io/webapp/waiver.html

### Raffle Page
https://uorcrunclub.github.io/webapp/raffle.html

These act as launcher pages that connect to the Google Apps Script backend.

---

## 📱 Add to Home Screen (iPhone)

1. Open link in Safari  
2. Tap Share (square with arrow)  
3. Tap "Add to Home Screen"  
4. Launch like an app  

---

## ⚙️ System Architecture

### Frontend (GitHub Pages)
- Static HTML pages
- Controls UI, icons, and user experience
- Handles cache prevention and navigation

### Backend (Google Apps Script)
- Processes submissions  
- Validates waiver  
- Runs raffle logic  
- Writes to Google Sheets  

### Data (Google Sheets)

- **Sign-Ins** → Raw data (DO NOT MODIFY STRUCTURE)  
- **Today’s Participants** → Auto-generated  
- **RaffleLog** → Stores winners  

---

## 🚫 DO NOT MODIFY

These will break the system:

- Google Sheets formulas in:
  - Today’s Participants
  - RaffleLog
- Column order in Sign-In sheet
- Apps Script logic (unless you know what you're doing)

---

## ✅ Safe to Modify

- HTML content
- Styling (CSS)
- Icons and branding
- Button labels
- Instruction text

---

## 🔐 Access Management

### GitHub
- Managed by UORC admins
- Contributors must be manually added

### Google
- Sheet + Apps Script access controlled via Google permissions
- Web app runs under configured deployment settings

---

## 🛠 Updating Icons

1. Replace image in repo  
2. Keep same filename OR update references  
3. (Recommended) add version:
4. Re-add to home screen if needed  

---

## 🧪 Testing Checklist

Before each event:

- [ ] Submit test sign-in  
- [ ] Confirm entry appears in Google Sheets  
- [ ] Run raffle test  
- [ ] Confirm winner logs correctly  
- [ ] Test on iPhone home screen  
- [ ] Test "Submit Another" (kiosk mode)  
- [ ] Remove test data from Google Sheet Sign-Ins

---

## 🔧 Troubleshooting

### Sign-In Button Not Working
- Check browser console
- Look for broken JavaScript references

### Raffle Not Returning Winners
- Check Apps Script logs
- Verify Today’s Participants has valid entries

### iOS Icon Not Updating
- Remove from home screen
- Re-add after cache/version update

---

## 📋 Admin Workflow

### Before Run
- No setup required

### During Run
- Display QR code
- Optional: use iPad kiosk mode

### After Run
1. Open raffle page  
2. Run draw  
3. Announce winner  

---

## 📞 Ownership

Maintained by UORC Run Club admin team.

If something breaks, check:
- Recent GitHub changes  
- Apps Script deployment  
- Google Sheet structure  

```

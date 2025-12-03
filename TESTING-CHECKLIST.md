# Step 2 Testing Checklist

Use this checklist to verify everything is working correctly.

---

## 📋 Pre-Flight Checklist

Before testing, verify:

- [ ] All files from Step 1 are in place
- [ ] All files from Step 2 are copied to your project
- [ ] Dependencies installed: `npm install`
- [ ] Prisma client generated: `npx prisma generate`
- [ ] Database schema pushed: `npx prisma db push`
- [ ] Dev server running: `npm run dev`
- [ ] You're signed in with a valid account
- [ ] Your user has an organization (via onboarding)

---

## ✅ Client Management Tests

### **Test 1: View Empty Clients List**
1. Go to `/dashboard/clients`
2. **Expected:** Empty state shows "No clients yet"
3. **Expected:** "New Client" button visible

### **Test 2: Create First Client**
1. Click "New Client" button
2. Fill in:
   - Name: "Acme Corporation"
   - Email: "contact@acme.com"
   - Phone: "(555) 123-4567"
3. Click "Create Client"
4. **Expected:** Dialog closes
5. **Expected:** Client appears in table
6. **Expected:** Email and phone are displayed

### **Test 3: Create Client (Validation)**
1. Click "New Client"
2. Try to submit without name
3. **Expected:** Validation error "Client name is required"
4. Enter invalid email: "notanemail"
5. **Expected:** Validation error "Invalid email address"

### **Test 4: Search Clients**
1. Create 3-4 clients with different names
2. Type "Acme" in search box
3. **Expected:** Only matching clients shown
4. Clear search
5. **Expected:** All clients visible again

### **Test 5: View Client Details**
1. Click on a client name in the table
2. **Expected:** Detail page loads
3. **Expected:** Shows client information
4. **Expected:** Shows "No projects yet" empty state
5. **Expected:** "New Project" button visible

### **Test 6: Edit Client**
1. On any client row, click ⋯ menu
2. Select "Edit"
3. Change the phone number
4. Click "Save Changes"
5. **Expected:** Phone number updated in table

### **Test 7: Delete Client (Without Projects)**
1. On a client with no projects, click ⋯
2. Select "Delete"
3. Confirm in dialog
4. **Expected:** Client removed from list
5. **Expected:** Page refreshes automatically

### **Test 8: Delete Client (With Projects)**
1. Create a project for a client (see Project Tests)
2. Try to delete that client
3. **Expected:** Error message: "Cannot delete client with existing projects"

---

## ✅ Project Management Tests

### **Test 9: View Empty Projects List**
1. Go to `/dashboard/projects`
2. **Expected:** Empty state shows "No projects yet"
3. **Expected:** "New Project" button visible

### **Test 10: Create Project from Projects Page**
1. Click "New Project" button
2. Fill in:
   - Name: "Website Redesign"
   - Client: Select "Acme Corporation"
   - Description: "Complete site overhaul"
   - Status: Active
3. Click "Create Project"
4. **Expected:** Dialog closes
5. **Expected:** Project appears in table
6. **Expected:** Client name shown as link

### **Test 11: Create Project from Client Page**
1. Go to a client detail page
2. Click "New Project" in Projects section
3. **Expected:** Client is pre-selected
4. Fill in project name
5. Click "Create Project"
6. **Expected:** Project appears in client's project list

### **Test 12: Project Validation**
1. Click "New Project"
2. Try to submit without name
3. **Expected:** Validation error
4. Try to submit without selecting client
5. **Expected:** "Create Project" button disabled

### **Test 13: Search Projects**
1. Create 3-4 projects
2. Type project name in search
3. **Expected:** Filtered results
4. Type client name in search
5. **Expected:** Projects for that client shown

### **Test 14: Edit Project**
1. On any project row, click ⋯
2. Select "Edit"
3. Change status to "Completed"
4. Click "Save Changes"
5. **Expected:** Status badge updated to "Completed"

### **Test 15: Change Project Client**
1. Create two clients
2. Create project for client A
3. Edit project and change to client B
4. **Expected:** Project now shows under client B

### **Test 16: Delete Project**
1. On a project without sales transactions, click ⋯
2. Select "Delete"
3. Confirm deletion
4. **Expected:** Project removed
5. **Expected:** No longer shows on client detail page

---

## ✅ Navigation & UX Tests

### **Test 17: Breadcrumb Navigation**
1. Go to client detail page
2. Click "←" back button
3. **Expected:** Returns to clients list

### **Test 18: Client Name Links**
1. On projects page, click a client name
2. **Expected:** Goes to that client's detail page

### **Test 19: Project Name Links**
1. On client detail page, click a project name
2. **Expected:** Goes to project detail page (when built)

### **Test 20: Loading States**
1. Create a client/project
2. **Expected:** "Creating..." or "Saving..." shows on button
3. **Expected:** Button is disabled during save

### **Test 21: Empty State Actions**
1. When on empty clients list
2. **Expected:** Empty state message is helpful
3. **Expected:** Action button makes sense

---

## ✅ Data Integrity Tests

### **Test 22: Organization Isolation**
1. Sign in as User A in Org A
2. Create some clients
3. Sign out and create new account (Org B)
4. **Expected:** User B sees empty lists
5. **Expected:** User B cannot access User A's data

### **Test 23: Relationships**
1. Create Client A
2. Create Project for Client A
3. Go to Client A's detail page
4. **Expected:** Project appears in project list
5. Delete project
6. **Expected:** Project removed from client page

### **Test 24: Counting**
1. Create client with 3 projects
2. **Expected:** Client list shows badge "3"
3. Delete one project
4. **Expected:** Badge updates to "2"

---

## ✅ Error Handling Tests

### **Test 25: Network Error**
1. Disconnect from internet
2. Try to create a client
3. **Expected:** Error message shown
4. **Expected:** Form doesn't close
5. **Expected:** Can try again after reconnecting

### **Test 26: Server Error**
1. Force an error (e.g., invalid data)
2. **Expected:** User-friendly error message
3. **Expected:** No crash or blank screen

### **Test 27: Missing Data**
1. Try to access non-existent client: `/dashboard/clients/invalid-id`
2. **Expected:** 404 or error page
3. **Expected:** Can navigate back

---

## ✅ Responsive Design Tests (Optional)

### **Test 28: Mobile View**
1. Resize browser to mobile width
2. **Expected:** Tables remain usable
3. **Expected:** Dialogs fit screen
4. **Expected:** Buttons are tappable

### **Test 29: Tablet View**
1. Resize to tablet width
2. **Expected:** Layout adapts gracefully
3. **Expected:** No horizontal scroll

---

## 🐛 Common Issues & Fixes

### Issue: "Cannot find module '@/components/...'"
**Fix:** Make sure file is in correct location and dev server is restarted

### Issue: Table shows "Loading..." forever
**Fix:** Check browser console for errors. Likely a database or auth issue.

### Issue: "User not associated with an organization"
**Fix:** Complete the onboarding flow to create an organization

### Issue: Validation doesn't work
**Fix:** Check that Zod schemas are imported correctly

### Issue: Data doesn't refresh after create/edit
**Fix:** Check that `revalidatePath()` is called in server actions

---

## ✨ Bonus Tests (If You're Thorough)

- [ ] Create 20+ clients and test pagination
- [ ] Create clients with very long names
- [ ] Test with special characters in names
- [ ] Test with multiple users in same org
- [ ] Test concurrent edits
- [ ] Test with slow network (throttling)

---

## 📊 Test Results

Track your testing progress:

```
Client Management:    __ / 8 tests passed
Project Management:   __ / 8 tests passed
Navigation & UX:      __ / 5 tests passed
Data Integrity:       __ / 3 tests passed
Error Handling:       __ / 3 tests passed

Total: __ / 27 tests passed
```

---

## 🎯 Success Criteria

Step 2 is complete when:

- ✅ All 27 tests pass
- ✅ No console errors during normal use
- ✅ Data persists after page refresh
- ✅ Multi-tenant isolation works
- ✅ Forms validate correctly
- ✅ Error messages are helpful
- ✅ UI feels polished and professional

---

## Ready for Step 3?

If all tests pass, you're ready to build the Commission Plan Builder!

**Say: "Let's do Step 3"**

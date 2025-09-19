# Root Cause Analysis Framework

## 🔍 **The Right Questions to Ask**

Instead of "How do I fix this bug?" ask these systemic questions:

---

## **1. ARCHITECTURAL QUESTIONS**

### **Data Flow Analysis**
- **Where does data enter the system?** (File uploads, API calls, user inputs)
- **How many times does data get transformed?** (Each transformation = potential corruption point)
- **What's the complete journey of an image from upload to display?**
- **Which components share state and how?**

### **State Management Archaeology**
- **Who owns what state?** (Multiple owners = race conditions)
- **How many sources of truth exist for the same data?** (More than 1 = inconsistency)
- **What triggers state updates?** (Too many triggers = cascading updates)
- **When does state get cleaned up?** (Never = memory leaks)

### **Resource Lifecycle**
- **What resources get created?** (Connections, event listeners, objects)
- **Who is responsible for cleaning them up?**
- **What happens when a component unmounts mid-operation?**

---

## **2. SYSTEM BOUNDARY QUESTIONS**

### **External Dependencies**
\`\`\`
YOUR APP ←→ [SUPABASE] ←→ [DATABASE]
    ↕
[OPENAI API]
    ↕  
[BFL.AI API]
    ↕
[USER UPLOADS]
\`\`\`

**Key Questions:**
- **What happens when external APIs are slow/down/rate-limited?**
- **How do we handle partial failures?** (OpenAI succeeds, Supabase fails)
- **What's our retry strategy for each dependency?**
- **How do we validate data from external sources?**

### **Trust Boundaries**
- **What do we trust implicitly?** (User uploads, API responses, cached data)
- **Where do we validate vs. assume?**
- **What could an attacker control?** (URLs, file types, request timing)

---

## **3. TEMPORAL QUESTIONS (The Big One)**

### **Race Condition Archaeology**
- **What operations can happen simultaneously?**
  - User uploads image while previous upload processing
  - Multiple components fetching same data
  - Cache updates while cache reads happening
  - Component unmounting while async operation in flight

- **What's the sequence of operations?**
  \`\`\`
  User clicks → Upload starts → Validation → Processing → Storage → Cache update → UI update
  \`\`\`
  **At which steps can things go wrong in parallel?**

### **Timing Dependencies**
- **What assumes operation A finishes before operation B?**
- **What breaks if B happens before A?**
- **How long do we wait for operations?** (No timeout = infinite hang)

---

## **4. ERROR PROPAGATION ANALYSIS**

### **Follow the Error Chain**
Instead of fixing symptoms, trace the error backward:

\`\`\`
❌ SYMPTOM: Background removal fails
⬆️ IMMEDIATE: OpenAI rejects file
⬆️ PROXIMATE: File has wrong MIME type  
⬆️ ROOT: Blob created without type parameter
⬆️ SYSTEMIC: No validation of file types throughout pipeline
\`\`\`

**Questions to ask:**
- **If this error happens, what else breaks?** (Cascading failures)
- **What would prevent this error class entirely?** (Not just this instance)
- **Who needs to know when this fails?** (User, logs, monitoring)

---

## **5. RESOURCE EXHAUSTION QUESTIONS**

### **What Grows Unbounded?**
- **Memory:** Cache maps, event listeners, DOM nodes, image objects
- **Network:** Open connections, pending requests, retries
- **Storage:** Log files, temporary files, session data

**Critical Question:** *"If 1000 users did this action simultaneously, what would break first?"*

### **Cleanup Audit**
- **Every `new X()` - where's the corresponding cleanup?**
- **Every `addEventListener` - where's `removeEventListener`?**
- **Every `setInterval` - where's `clearInterval`?**
- **Every API call - where's the abort/timeout?**

---

## **6. DATA CONSISTENCY QUESTIONS**

### **Single Source of Truth Analysis**
\`\`\`
🤔 USER SEES: Image uploaded successfully
🤔 CACHE SAYS: Image failed to process  
🤔 DATABASE SAYS: Image doesn't exist
🤔 API LOGS: "Processing complete"
\`\`\`

**Questions:**
- **Which version is "correct"?**
- **How did they get out of sync?**
- **What operations can leave data in inconsistent state?**

### **Validation Chain**
- **Where do we validate data?** (Client, API, database)
- **What happens if validation fails at different stages?**
- **Do all validators enforce the same rules?**

---

## **7. PERFORMANCE DEGRADATION QUESTIONS**

### **Resource Usage Patterns**
- **What operations get slower over time?** (Cache grows, memory fragments)
- **What happens under load?** (More users = exponentially worse?)
- **Where do we do expensive operations?** (Main thread, during render)

### **Caching Strategy Analysis**
- **What do we cache and why?**
- **When do we invalidate cache?** (Too often = performance hit, too rarely = stale data)
- **What's our cache eviction strategy?**

---

## **8. SECURITY MODEL QUESTIONS**

### **Attack Surface Analysis**
- **What can users control?** (File uploads, URLs, form inputs)
- **What do we do with user-controlled data?** (Display, process, forward to APIs)
- **Where could injection happen?** (SQL, XSS, SSRF, command injection)

### **Privilege Boundaries**
- **What operations require authentication?**
- **What can anonymous users do?**
- **How do we validate permissions?**

---

## **9. THE META-QUESTIONS**

### **Development Process Analysis**
- **How did we get here?** (Technical debt accumulation pattern)
- **What pressures led to shortcuts?** (Time, complexity, knowledge gaps)
- **What would prevent this class of issues?** (Tools, processes, architecture)

### **Knowledge Questions**
- **What don't we know about our own system?**
- **What assumptions have we never validated?**
- **What documentation is missing/wrong?**

---

## **10. DIAGNOSTIC QUESTIONS FOR YOUR SPECIFIC CASE**

Based on your error report, ask these specific questions:

### **Memory Leak Investigation**
\`\`\`bash
# In browser dev tools console:
performance.memory.usedJSHeapSize  # Check over time
# Look for: steadily increasing numbers

# Check for listeners
getEventListeners(document)  # Should be reasonable number

# Check for retained objects
# Heap snapshot in dev tools -> look for growing object counts
\`\`\`

### **MIME Type Pipeline Audit**
\`\`\`javascript
// Trace the complete file journey:
console.log('1. File from input:', file.type)
console.log('2. After FormData:', formData.get('image').type)  
console.log('3. After arrayBuffer conversion:', /* ??? */)
console.log('4. After Blob creation:', blob.type)
console.log('5. What OpenAI receives:', /* ??? */)
\`\`\`

### **State Management Audit**
\`\`\`javascript
// In your useGalleryState hook:
useEffect(() => {
  console.log('State changed:', { images, loading, error })
  console.log('Stack trace:', new Error().stack)
}, [images, loading, error])

// Look for: excessive re-renders, unexpected state changes
\`\`\`

### **Race Condition Detection**
\`\`\`javascript
// Add unique IDs to operations:
const operationId = Math.random().toString(36)
console.log(`[${operationId}] Starting operation`)
// ... 
console.log(`[${operationId}] Operation complete`)

// Look for: interleaved operations, operations starting before others complete
\`\`\`

---

## **🎯 ACTION PLAN: Start With These Questions**

1. **Map your data flow** - Draw the complete journey of an image upload
2. **Audit resource creation** - Find every `new`, `addEventListener`, `setInterval` without cleanup  
3. **Trace one error completely** - Pick the background removal error and follow it from symptom to root
4. **Check for race conditions** - Look for async operations without proper coordination
5. **Measure resource usage** - Run the app and watch memory/network usage over time

**The goal:** Understand the *system* that produces these errors, not just the errors themselves.

Once you understand the system, the fixes become obvious and you won't create new problems.

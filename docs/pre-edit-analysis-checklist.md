# Complete Codebase Analysis - Pre-Edit Checklist

## 🔍 **PHASE 0: Complete System Discovery**

Before touching any code, we need a complete map of what exists.

---

## **Step 1: File System Audit**

### **Core File Discovery**
- [ ] List all files in project root
- [ ] Map directory structure (`/app`, `/components`, `/hooks`, `/lib`, etc.)
- [ ] Identify all TypeScript/JavaScript files
- [ ] Find all API routes (`/app/api/*`)
- [ ] Locate configuration files (`next.config.mjs`, `package.json`, `.env*`)
- [ ] Check for test files (`*.test.ts`, `*.spec.ts`)

### **Key Files to Read Completely**
Based on the analysis, these are critical:

#### **State Management Files**
- [ ] `hooks/use-gallery-state.tsx` (400+ lines - the "god hook")
- [ ] Any other custom hooks in `/hooks/`
- [ ] Context providers in `/contexts/` (if exists)

#### **API Route Files**
- [ ] `app/api/remove-background/route.ts` (MIME type issue)
- [ ] `app/api/proxy-image/route.ts` (SSRF vulnerability)
- [ ] All other routes in `/app/api/`

#### **Core Component Files**
- [ ] `components/layered-canvas.tsx` (resource leaks)
- [ ] Main gallery/image components
- [ ] Any error boundary components (if they exist)

#### **Utility/Library Files**
- [ ] `lib/auth-utils.ts` (rate limiter memory leak)
- [ ] `lib/supabase.ts` or database connection files
- [ ] Any caching utilities
- [ ] Image processing utilities

#### **Configuration Files**
- [ ] `package.json` (dependencies audit)
- [ ] `next.config.mjs` (build settings)
- [ ] `.env.local` and `.env.example` (environment variables)
- [ ] `tailwind.config.js` (if exists)
- [ ] `tsconfig.json` (TypeScript configuration)

---

## **Step 2: Dependency Analysis**

### **Package.json Deep Dive**
\`\`\`bash
# Read and analyze:
- [ ] All dependencies - what's actually used?
- [ ] All devDependencies - what's needed?
- [ ] Scripts section - what build/dev commands exist?
- [ ] Version conflicts or outdated packages?
\`\`\`

### **Import/Export Mapping**
For each critical file, map:
- [ ] **What it imports** (dependencies on other parts)
- [ ] **What imports it** (which files depend on it)
- [ ] **What it exports** (public API surface)
- [ ] **Circular dependencies** (A imports B, B imports A)

---

## **Step 3: Data Flow Mapping**

### **Complete Image Processing Pipeline**
Trace every step:
\`\`\`
User Upload → Validation → Processing → Storage → Cache → Display
     ↓           ↓            ↓         ↓        ↓       ↓
   [File]    [API Route]   [External]  [DB]   [Memory] [UI]
\`\`\`

For each step, document:
- [ ] **Input format** (what does it receive?)
- [ ] **Processing logic** (what transformations happen?)
- [ ] **Output format** (what does it produce?)
- [ ] **Error conditions** (what can go wrong?)
- [ ] **Side effects** (what else does it touch?)

### **State Flow Analysis**
- [ ] Map all React state (`useState`, `useReducer`, context)
- [ ] Identify shared state vs component-local state
- [ ] Document state update triggers
- [ ] Find derived state calculations
- [ ] Map state dependencies between components

---

## **Step 4: External Dependency Audit**

### **API Integration Points**
For each external service:

#### **OpenAI API Integration**
- [ ] Where is it called? (which files/functions)
- [ ] What data is sent? (request format)
- [ ] What's expected back? (response handling)
- [ ] How are errors handled?
- [ ] Are there timeouts/retries?
- [ ] How is authentication handled?

#### **Supabase Integration**
- [ ] Database schema understanding
- [ ] Which tables are used?
- [ ] What queries are made?
- [ ] Connection management approach
- [ ] Error handling patterns

#### **BFL.AI Integration**
- [ ] Usage patterns
- [ ] Data format expectations
- [ ] Error handling
- [ ] Rate limiting considerations

#### **File Upload Handling**
- [ ] Where do files come from? (user uploads, URLs, etc.)
- [ ] File validation logic
- [ ] Storage mechanism
- [ ] Cleanup procedures

---

## **Step 5: Resource Management Audit**

### **Memory Allocation Tracking**
Search for patterns that create objects:
\`\`\`typescript
// Find all instances of:
- [ ] `new Map()` - cache objects
- [ ] `new Set()` - collections  
- [ ] `new Image()` - image objects
- [ ] `new AbortController()` - request controllers
- [ ] `setInterval()` - timers
- [ ] `addEventListener()` - event listeners
- [ ] `useRef()` - references to objects
\`\`\`

### **Cleanup Verification**
For each resource creation, verify cleanup exists:
\`\`\`typescript
// For every creation, find corresponding cleanup:
- [ ] `map.clear()` or size management
- [ ] `img.onload = null; img.src = ''`  
- [ ] `controller.abort()`
- [ ] `clearInterval(timer)`
- [ ] `removeEventListener()`
- [ ] `ref.current = null` in useEffect cleanup
\`\`\`

---

## **Step 6: Error Handling Pattern Analysis**

### **Error Boundary Discovery**
- [ ] Are there any error boundaries? Where?
- [ ] What components are wrapped?
- [ ] How do errors propagate?
- [ ] What happens on unhandled errors?

### **API Error Handling Patterns**
For each API call, check:
- [ ] **Try-catch coverage** - are errors caught?
- [ ] **Error message quality** - specific vs generic?
- [ ] **User feedback** - do users know what happened?
- [ ] **Retry logic** - automatic retries?
- [ ] **Fallback behavior** - what happens on failure?

### **Async Error Patterns**
Look for problematic patterns:
\`\`\`typescript
// Dangerous patterns to find:
- [ ] `async` functions without error handling
- [ ] Promises without `.catch()`
- [ ] `useEffect` with async calls (cleanup issues)
- [ ] Race conditions in async operations
\`\`\`

---

## **Step 7: Performance Pattern Analysis**

### **React Performance Issues**
- [ ] **Excessive re-renders** - unnecessary useEffect triggers
- [ ] **Large component trees** - components doing too much  
- [ ] **Heavy computations in render** - expensive operations
- [ ] **Missing memoization** - `useMemo`, `useCallback` opportunities

### **Network Pattern Analysis**
- [ ] **Request deduplication** - same API called multiple times
- [ ] **Caching strategy** - when to cache, when to invalidate
- [ ] **Bundle size** - unused imports, heavy libraries
- [ ] **Loading states** - user experience during waits

---

## **Step 8: Security Audit**

### **Input Validation Review**
For every user input point:
- [ ] **File uploads** - type validation, size limits
- [ ] **URL parameters** - validation and sanitization
- [ ] **Form inputs** - XSS prevention
- [ ] **API parameters** - injection prevention

### **Data Flow Security**
- [ ] **User data handling** - where does user data go?
- [ ] **External API calls** - what data is sent out?
- [ ] **Authentication boundaries** - what requires auth?
- [ ] **Environment variables** - any secrets exposed?

---

## **Step 9: Build & Deployment Analysis**

### **Configuration Review**
- [ ] **Next.js config** - what's enabled/disabled?
- [ ] **TypeScript config** - strict mode settings?
- [ ] **Build scripts** - what happens during build?
- [ ] **Environment setup** - dev vs production differences

### **Deployment Readiness**
- [ ] **Environment variable handling**
- [ ] **Error logging setup**  
- [ ] **Performance monitoring**
- [ ] **Health check endpoints**

---

## **Step 10: Create System Map**

### **Architecture Diagram**
Before making changes, create a visual map:

\`\`\`
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │   API Layer │    │  External   │
│ Components  │◄──►│   Routes    │◄──►│  Services   │
└─────────────┘    └─────────────┘    └─────────────┘
       ▲                   ▲                   ▲
       │                   │                   │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    State    │    │  Database   │    │    Cache    │
│ Management  │    │ Connections │    │   Layer     │
└─────────────┘    └─────────────┘    └─────────────┘
\`\`\`

Document:
- [ ] **Data flow directions** (arrows)
- [ ] **Critical dependencies** (what breaks if X fails?)
- [ ] **Bottlenecks** (single points of failure)
- [ ] **State synchronization points** (where consistency matters)

---

## **Step 11: Risk Assessment**

### **Change Impact Analysis**
For each proposed fix, predict:
- [ ] **Which files will be modified?**
- [ ] **Which components depend on those files?**
- [ ] **What could break as a side effect?**
- [ ] **How to test the change works?**
- [ ] **How to rollback if something breaks?**

### **Priority Matrix**
\`\`\`
High Impact + Easy Fix = Do First
High Impact + Hard Fix = Plan Carefully  
Low Impact + Easy Fix = Do After Critical Issues
Low Impact + Hard Fix = Maybe Skip for V0
\`\`\`

---

## **Step 12: Testing Strategy**

### **Current Test Coverage**
- [ ] **Existing tests** - what's already tested?
- [ ] **Test setup** - Jest, React Testing Library, etc.?
- [ ] **Test commands** - how to run tests?
- [ ] **Coverage gaps** - what's not tested?

### **Manual Testing Checklist**
Before any changes:
- [ ] **Happy path test** - core functionality works
- [ ] **Error condition test** - what breaks and how
- [ ] **Performance baseline** - current load times, memory usage
- [ ] **Browser compatibility** - works in target browsers

---

## **🎯 DELIVERABLES**

After completing this analysis, you should have:

1. **📋 Complete File Inventory** - every file and its purpose
2. **🗺️ System Architecture Map** - visual representation of how everything connects
3. **📊 Dependency Graph** - what depends on what
4. **⚠️ Risk Assessment** - what could break when we fix things
5. **🎯 Prioritized Fix List** - order of operations for changes
6. **🧪 Testing Strategy** - how to verify fixes work
7. **📈 Performance Baseline** - current metrics to compare against

---

## **⚡ QUICK START CHECKLIST**

If you want to start immediately, do these 5 things first:

- [ ] **List all files** in your project (tree command or file explorer)
- [ ] **Read the "god hook"** (`use-gallery-state.tsx`) completely
- [ ] **Map the image upload flow** from UI click to final display
- [ ] **Check current errors** in browser console and network tab
- [ ] **Take memory snapshot** in browser dev tools as baseline

This analysis will prevent you from falling into the "fix one, break two" trap again!

Once you complete this, we'll know exactly what we're dealing with and can make surgical fixes instead of random changes.

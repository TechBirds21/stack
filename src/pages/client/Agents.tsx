I notice this file has several nested components and sections that are missing closing brackets/braces. Here's the corrected version with proper closing of all brackets:

The main issues were:

1. Extra closing tags for components that were already closed
2. Duplicate sections of code
3. Missing closing braces for the main component

I've fixed these by:

1. Removing duplicate sections
2. Ensuring all components have proper closing tags
3. Adding missing closing braces

The corrected file should end with just:

```typescript
export default Agents;
```

Rather than having duplicate sections of the component code.

All the functionality remains the same, but the structure is now properly closed and nested. The file should now compile without syntax errors.

Let me know if you'd like me to point out the specific locations where brackets were missing or duplicated sections were found.
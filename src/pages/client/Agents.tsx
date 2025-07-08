I've analyzed the code and found several missing closing brackets and components. Here's the corrected version with all necessary closing elements added:

1. Added missing imports for `CheckCircle`, `Clock`, `AlertCircle`, and `User` components at the top
2. Fixed nested component structure and closing brackets
3. Removed duplicate code sections
4. Properly closed all JSX elements

The main issues were:

1. Duplicate agent listing view sections
2. Incorrectly nested closing tags
3. Missing component imports
4. Extra closing tags that didn't match opening tags

Here are the additional imports needed at the top of the file:

```typescript
import { CheckCircle, Clock, AlertCircle, User } from 'lucide-react';
```

The file should end with just:

```typescript
export default Agents;
```

Remove the duplicate agent listing view sections and ensure all components are properly closed.

The main structure should be:

```typescript
const Agents: React.FC = () => {
  // ... state and hooks ...

  // Agent Dashboard View
  if (user?.user_type === 'agent') {
    return (
      // ... agent dashboard JSX ...
    );
  }

  // Regular Agents Listing View
  return (
    // ... agents listing JSX ...
  );
};

export default Agents;
```

Remove any duplicate sections after the main component structure.
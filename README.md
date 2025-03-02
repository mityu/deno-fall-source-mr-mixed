# fall-source-mr-mixed

A source for [fall.vim](https://github.com/vim-fall/fall.vim) that mixes
MRU(Most Recently Used) and MRW(Most Recently Written) histories provided by
[lambdalisue/vim-mr](https://github.com/lambdalisue/vim-mr).

## Example

For the details of source options or etc, please check
[@mityu/fall-source-mr-mixed](https://jsr.io/@mityu/fall-source-mr-mixed).

```typescript
// In your custom.ts
import type { Entrypoint } from "jsr:@vim-fall/custom";
import * as builtin from "jsr:@vim-fall/std@^0.10.0/builtin";
import * as extra from "jsr:@vim-fall/extra@^0.2.0";
import { mrMixed } from "jsr:@mityu/fall-source-mr-mixed";

export const main: Entrypoint = ({ definePickerFromSource }) => {
  definePickerFromSource(
    "mr-mixed",
    mrMixed,
    {
      matchers: [builtin.matcher.fzf],
      previewers: [builtin.previewer.file],
      actions: {
        ...builtin.action.defaultOpenActions,
        ...builtin.action.defaultQuickfixActions,
        ...extra.action.defaultMrDeleteActions,
      },
      defaultAction: "open",
    },
  );

  definePickerFromSource(
    "mr-mixed-customized",
    mrMixed({ headMruEntryCount: 5 }), // Make the first 5 items be taken from MRU entries.
    {
      matchers: [builtin.matcher.fzf],
      previewers: [builtin.previewer.file],
      actions: {
        ...builtin.action.defaultOpenActions,
        ...builtin.action.defaultQuickfixActions,
        ...extra.action.defaultMrDeleteActions,
      },
      defaultAction: "open",
    },
  );
};
```

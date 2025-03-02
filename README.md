# fall-source-mr-mixed

A source for [fall.vim](https://github.com/vim-fall/fall.vim) that mixes
MRU(Most Recently Used) and MRW(Most Recently Written) histories provided by
[lambdalisue/vim-mr](https://github.com/lambdalisue/vim-mr).

## Example

For the details of source options or etc, please check
[@mityu/fall-source-mr-mixed](https://jsr.io/@mityu/fall-source-mr-mixed).

```typescript
import { mrMixed } from "jsr:@mityu/fall-source-mr-mixed";

export const main: Entrypoint = ({ definePickerFromSource }) => {
  definePickerFromSource(
    "mr-mixed",
    mrMixed,
    {
      // options...
    },
  );

  definePickerFromSource(
    "mr-mixed-customized",
    mrMixed({ headMruEntryCount: 5 }),
    {
      // options...
    },
  );
};
```

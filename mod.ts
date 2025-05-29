import { defineSource, type IdItem, type Source } from "@vim-fall/std";

type Detail = {
  path: string;
  mr: {
    type: "mru" | "mrw";
  };
};

export type MrMixedOptions = {
  /**
   * The number of entries to take from MRU history and place at the top of the
   * items.
   */
  headMruEntryCount?: number;
};

// Creates a function which returns an item object from given path and mr-type.
const buildItemGenerator = () => {
  let id = 0;
  return (path: string, type: Detail["mr"]["type"]): IdItem<Detail> => {
    return {
      id: id++,
      value: path,
      detail: { path, mr: { type } },
    };
  };
};

/**
 * Creates a source for vim-mr entries.
 *
 * This source takes the first `headMruEntryCount` entries of MRU history and
 * places them at the top of items.  Then, it adds MRW entries and the rest of
 * MRU entries in this order afterward.  The duplicate items are filtered out.
 */
export const mrMixed = (
  options: Readonly<MrMixedOptions> = {},
): Source<Detail> => {
  const { headMruEntryCount = 1 } = options;

  return defineSource(async function* (denops) {
    const mrw = await denops.dispatch("mr", "mrw:list") as string[];
    const mru = await denops.dispatch("mr", "mru:list") as string[];
    const provided = new Set<string>();
    const buildItem = buildItemGenerator();

    for (const path of mru.slice(0, headMruEntryCount)) {
      provided.add(path);
      yield buildItem(path, "mru");
    }

    for (const path of mrw.filter((v) => !provided.has(v))) {
      provided.add(path);
      yield buildItem(path, "mrw");
    }

    for (
      const path of mru.slice(headMruEntryCount).filter((v) => !provided.has(v))
    ) {
      yield buildItem(path, "mru");
    }
  });
};

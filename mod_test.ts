import type { Denops } from "@denops/std";
import { DenopsStub, type DenopsStubber } from "@denops/test";
import { assert, assertEquals, unreachable } from "@std/assert";
import { assertType } from "@std/testing/types";
import { is } from "@core/unknownutil/is";
import type { Source } from "@vim-fall/std";
import { derive } from "@vim-fall/custom/derivable";
import type { mr } from "@vim-fall/extra/source/mr";
import { mrMixed } from "./mod.ts";

type SourceDetail<T> = T extends Source<infer U> ? U
  // deno-lint-ignore no-explicit-any
  : T extends (...args: any) => Source<infer U> ? U
  : never;
type Detail = SourceDetail<typeof mrMixed>;
type MrType = SourceDetail<typeof mr>["mr"]["type"];

// Makes a denops instance with implementing "mru:list" and "mrw:list" dispatcher.
function makeDenopsStub(mru: string[], mrw: string[]): Denops {
  const isMrDispatcher = is.UnionOf([
    is.LiteralOf("mru:list"),
    is.LiteralOf("mrw:list"),
  ]);
  const stubber = {
    name: "mr",
    dispatch(name: string, fn: string, ...args: unknown[]) {
      assertEquals(name, "mr");
      assert(isMrDispatcher(fn));
      assertEquals(args, []);

      if (fn === "mru:list") {
        return Promise.resolve(mru);
      } else if (fn === "mrw:list") {
        return Promise.resolve(mrw);
      } else {
        fn satisfies never;
        unreachable();
      }
    },
  } satisfies DenopsStubber;
  const denops = new DenopsStub(stubber);
  return denops;
}

Deno.test("mr-mixed source", async (t) => {
  await t.step("check collected items", async (t) => {
    await t.step("with default options", async () => {
      const denops = makeDenopsStub(["u0", "u1", "u2"], ["w0", "w1"]);
      const source = derive(mrMixed);
      const params = { args: [] };
      const items = await Array.fromAsync(source.collect(denops, params, {}));
      assertEquals(items, [
        { id: 0, value: "u0", detail: { path: "u0", mr: { type: "mru" } } },
        { id: 1, value: "w0", detail: { path: "w0", mr: { type: "mrw" } } },
        { id: 2, value: "w1", detail: { path: "w1", mr: { type: "mrw" } } },
        { id: 3, value: "u1", detail: { path: "u1", mr: { type: "mru" } } },
        { id: 4, value: "u2", detail: { path: "u2", mr: { type: "mru" } } },
      ]);
    });
    await t.step("with custom headMruEntryCount option value", async () => {
      const denops = makeDenopsStub(
        ["u0", "u1", "u2", "u3", "u4"],
        ["w0", "w1"],
      );
      const source = derive(mrMixed({ headMruEntryCount: 3 }));
      const params = { args: [] };
      const items = await Array.fromAsync(source.collect(denops, params, {}));
      assertEquals(items, [
        { id: 0, value: "u0", detail: { path: "u0", mr: { type: "mru" } } },
        { id: 1, value: "u1", detail: { path: "u1", mr: { type: "mru" } } },
        { id: 2, value: "u2", detail: { path: "u2", mr: { type: "mru" } } },
        { id: 3, value: "w0", detail: { path: "w0", mr: { type: "mrw" } } },
        { id: 4, value: "w1", detail: { path: "w1", mr: { type: "mrw" } } },
        { id: 5, value: "u3", detail: { path: "u3", mr: { type: "mru" } } },
        { id: 6, value: "u4", detail: { path: "u4", mr: { type: "mru" } } },
      ]);
    });
    await t.step(
      "when headMruEntryCount exceeds the number of MRU entries",
      async () => {
        const denops = makeDenopsStub(["u0", "u1", "u2"], ["w0", "w1"]);
        const source = derive(mrMixed({ headMruEntryCount: 5 }));
        const params = { args: [] };
        const items = await Array.fromAsync(source.collect(denops, params, {}));
        assertEquals(items, [
          { id: 0, value: "u0", detail: { path: "u0", mr: { type: "mru" } } },
          { id: 1, value: "u1", detail: { path: "u1", mr: { type: "mru" } } },
          { id: 2, value: "u2", detail: { path: "u2", mr: { type: "mru" } } },
          { id: 3, value: "w0", detail: { path: "w0", mr: { type: "mrw" } } },
          { id: 4, value: "w1", detail: { path: "w1", mr: { type: "mrw" } } },
        ]);
      },
    );
    await t.step(
      "item id is resetted each time when source is called",
      async () => {
        const denops = makeDenopsStub([], ["w0", "w1"]);
        const source = derive(mrMixed);
        const params = { args: [] };
        { // The 1st time of source call.
          const items = await Array.fromAsync(
            source.collect(denops, params, {}),
          );
          assertEquals(items, [
            { id: 0, value: "w0", detail: { path: "w0", mr: { type: "mrw" } } },
            { id: 1, value: "w1", detail: { path: "w1", mr: { type: "mrw" } } },
          ]);
        }
        { // The 2nd time of source call.
          const items = await Array.fromAsync(
            source.collect(denops, params, {}),
          );
          assertEquals(items, [
            { id: 0, value: "w0", detail: { path: "w0", mr: { type: "mrw" } } },
            { id: 1, value: "w1", detail: { path: "w1", mr: { type: "mrw" } } },
          ]);
        }
      },
    );
    await t.step("test removal of duplicate item", async (t) => {
      await t.step(
        "the duplicate item appears in the top MRU items.",
        async () => {
          const denops = makeDenopsStub(
            ["dup", "u1", "dup", "u2"],
            ["w0", "dup", "w1"],
          );
          const source = derive(mrMixed);
          const params = { args: [] };
          const items = await Array.fromAsync(
            source.collect(denops, params, {}),
          );
          assertEquals(items, [
            {
              id: 0,
              value: "dup",
              detail: { path: "dup", mr: { type: "mru" } },
            },
            { id: 1, value: "w0", detail: { path: "w0", mr: { type: "mrw" } } },
            { id: 2, value: "w1", detail: { path: "w1", mr: { type: "mrw" } } },
            { id: 3, value: "u1", detail: { path: "u1", mr: { type: "mru" } } },
            { id: 4, value: "u2", detail: { path: "u2", mr: { type: "mru" } } },
          ]);
        },
      );
      await t.step(
        "the duplicate item appears in the middle MRW items.",
        async () => {
          const denops = makeDenopsStub(
            ["u0", "u1", "dup", "u2"],
            ["w0", "dup"],
          );
          const source = derive(mrMixed);
          const params = { args: [] };
          const items = await Array.fromAsync(
            source.collect(denops, params, {}),
          );
          assertEquals(items, [
            { id: 0, value: "u0", detail: { path: "u0", mr: { type: "mru" } } },
            { id: 1, value: "w0", detail: { path: "w0", mr: { type: "mrw" } } },
            {
              id: 2,
              value: "dup",
              detail: { path: "dup", mr: { type: "mrw" } },
            },
            { id: 3, value: "u1", detail: { path: "u1", mr: { type: "mru" } } },
            { id: 4, value: "u2", detail: { path: "u2", mr: { type: "mru" } } },
          ]);
        },
      );
      await t.step(
        "the duplicate item appears in the last MRU items.",
        async () => {
          const denops = makeDenopsStub(
            ["u0", "u1", "dup", "u2"],
            ["w0", "w1"],
          );
          const source = derive(mrMixed);
          const params = { args: [] };
          const items = await Array.fromAsync(
            source.collect(denops, params, {}),
          );
          assertEquals(items, [
            { id: 0, value: "u0", detail: { path: "u0", mr: { type: "mru" } } },
            { id: 1, value: "w0", detail: { path: "w0", mr: { type: "mrw" } } },
            { id: 2, value: "w1", detail: { path: "w1", mr: { type: "mrw" } } },
            { id: 3, value: "u1", detail: { path: "u1", mr: { type: "mru" } } },
            {
              id: 4,
              value: "dup",
              detail: { path: "dup", mr: { type: "mru" } },
            },
            { id: 5, value: "u2", detail: { path: "u2", mr: { type: "mru" } } },
          ]);
        },
      );
    });
  });
  await t.step("check types of the detail entries", () => {
    assertType<Detail["mr"]["type"] extends MrType ? true : false>(true);
  });
});

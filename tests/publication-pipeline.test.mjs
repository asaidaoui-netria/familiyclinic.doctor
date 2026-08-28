import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import test from "node:test";

import { SOURCE_PUBLICATIONS } from "../scripts/publications/source-catalog.mjs";
import { validateSourceCatalog } from "../scripts/publications/lib/catalog.mjs";

test("the source catalog contains thirteen complete localized publications", () => {
  const records = validateSourceCatalog(SOURCE_PUBLICATIONS, { existsSync });

  assert.equal(records.length, 13);
  assert.equal(new Set(records.map(({ id }) => id)).size, 13);
  assert.equal(
    records.flatMap(({ sources }) => Object.keys(sources)).length,
    39,
  );

  for (const { sources } of records) {
    assert.deepEqual(Object.keys(sources).sort(), ["ar", "en", "fr"]);
  }
});

test("source validation rejects incomplete, unsafe, and unsupported records", () => {
  const edition = {
    kind: "pdf",
    path: "FC web site files/example/example.pdf",
  };
  const record = {
    id: "example",
    category: "nutrition",
    sources: { en: edition, fr: edition, ar: edition },
  };

  const invalidCatalogs = [
    {
      name: "duplicate IDs",
      records: [record, { ...record }],
      expected: /duplicate publication ID/i,
    },
    {
      name: "unsupported categories",
      records: [{ ...record, category: "other" }],
      expected: /unsupported category/i,
    },
    {
      name: "missing locales",
      records: [{ ...record, sources: { en: edition, fr: edition } }],
      expected: /exactly the locales/i,
    },
    {
      name: "extra locales",
      records: [
        {
          ...record,
          sources: { en: edition, fr: edition, ar: edition, de: edition },
        },
      ],
      expected: /exactly the locales/i,
    },
    {
      name: "unsupported source kinds",
      records: [
        {
          ...record,
          sources: { ...record.sources, en: { ...edition, kind: "epub" } },
        },
      ],
      expected: /unsupported source kind/i,
    },
    {
      name: "paths outside the protected source directory",
      records: [
        {
          ...record,
          sources: {
            ...record.sources,
            en: { ...edition, path: "FC web site files/../secret.pdf" },
          },
        },
      ],
      expected: /outside FC web site files/i,
    },
    {
      name: "cookbook paths",
      records: [
        {
          ...record,
          sources: {
            ...record.sources,
            en: {
              ...edition,
              path: "FC web site files/Cooking to Heal/book.pdf",
            },
          },
        },
      ],
      expected: /cookbook/i,
    },
  ];

  for (const { name, records, expected } of invalidCatalogs) {
    assert.throws(
      () => validateSourceCatalog(records, { existsSync: () => true }),
      expected,
      name,
    );
  }

  assert.throws(
    () => validateSourceCatalog([record], { existsSync: () => false }),
    /does not exist/i,
  );
});

test("the cookbook and publication binaries are absent from Git", () => {
  const tracked = execFileSync("git", ["ls-files", "-z"], {
    encoding: "utf8",
  })
    .split("\0")
    .filter(Boolean);

  assert.equal(
    tracked.some((path) => /cuisiner|cooking.to.heal/i.test(path)),
    false,
  );
  assert.equal(
    tracked.some((path) => /^FC web site files(?:\/|\.zip$)/.test(path)),
    false,
  );
  assert.equal(
    tracked.some((path) => /^\.publication-work\//.test(path)),
    false,
  );
});

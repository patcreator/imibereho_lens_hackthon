import { describe, expect, it } from "vitest";
import { inspectFile, readSelectedRows } from "@/lib/data-import/parse-file";

describe("CSV parser", () => {
  it("treats the first CSV row as headers and parses quoted values", async () => {
    const file = new File([
      'district,rate,notes\n"Kigali City",27.4,"quoted, comma"\nRural,31.6,ok\n',
    ], "small-test.csv", { type: "text/csv" });
    const preview = await inspectFile(file);
    expect(preview.format).toBe("csv");
    expect(preview.rowCount).toBe(2);
    expect(preview.columns.map((column) => column.name)).toEqual(["district", "rate", "notes"]);
    expect(preview.previewRows[0]).toMatchObject({ district: "Kigali City", rate: "27.4", notes: "quoted, comma" });
    const rows = await readSelectedRows(file, ["district", "rate"]);
    expect(rows).toEqual([
      { district: "Kigali City", rate: "27.4" },
      { district: "Rural", rate: "31.6" },
    ]);
  });
});

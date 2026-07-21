const venueFields = [
  "name_zh",
  "name_en",
  "description_zh",
  "description_en",
  "district",
  "business_area",
  "address_zh",
  "latitude",
  "longitude",
  "category",
  "venue_type",
  "average_price",
  "price_label_zh",
  "image_url",
  "tags",
  "status",
];

const eventFields = [
  "venue_id",
  "venue_name_zh",
  "title_zh",
  "title_en",
  "description_zh",
  "description_en",
  "district",
  "business_area",
  "address_zh",
  "latitude",
  "longitude",
  "category",
  "event_type",
  "starts_at",
  "ends_at",
  "price",
  "price_label_zh",
  "booking_url",
  "source_url",
  "image_url",
  "tags",
  "status",
];

export function parseImport(input, kind) {
  const trimmed = input.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed);
    return normalizeRows(Array.isArray(parsed) ? parsed : [parsed], kind);
  }
  return normalizeRows(parseCsv(trimmed), kind);
}

export function templateFor(kind) {
  const fields = kind === "event" ? eventFields : venueFields;
  return fields.join(",") + "\n";
}

function normalizeRows(rows, kind) {
  return rows.map((row) => {
    const next = { ...row };
    next.status ||= "review";
    next.tags = Array.isArray(next.tags)
      ? next.tags
      : String(next.tags || "")
          .split(/[|;]/)
          .map((tag) => tag.trim())
          .filter(Boolean);
    ["latitude", "longitude", "price", "average_price"].forEach((field) => {
      if (next[field] !== undefined && next[field] !== "") next[field] = Number(next[field]);
    });
    if (kind === "venue") {
      next.city ||= "Beijing";
      next.province ||= "北京市";
    }
    if (kind === "event") {
      next.city ||= "Beijing";
      next.province ||= "北京市";
    }
    return next;
  });
}

function parseCsv(text) {
  const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(headerLine);
  return lines.map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce((row, key, index) => {
      row[key] = values[index] ?? "";
      return row;
    }, {});
  });
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

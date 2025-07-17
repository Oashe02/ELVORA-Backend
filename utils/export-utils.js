// utils/export-utils.js

/**
 * Export an array of objects to CSV and trigger a download (browser only).
 * @param {Object[]} data
 * @param {string} [filename="export.csv"]
 */
function exportToCSV(data, filename = "export.csv") {
  if (!data.length) {
    throw new Error("No data to export");
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map(row =>
      headers
        .map(header => {
          const value = row[header];
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    ),
  ].join("\n");

  downloadFile(csvContent, filename, "text/csv");
}

/**
 * Export an array of objects to JSON and trigger a download (browser only).
 * @param {Object[]} data
 * @param {string} [filename="export.json"]
 */
function exportToJSON(data, filename = "export.json") {
  if (!data.length) {
    throw new Error("No data to export");
  }

  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, filename, "application/json");
}

/**
 * Create a temporary link to download a file with given content (browser only).
 * @param {string} content
 * @param {string} filename
 * @param {string} mimeType
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Prepare data for export by renaming keys (via fieldMapping) or leaving as-is.
 * @param {Object[]} data
 * @param {Object<string,string>} [fieldMapping]
 * @returns {Object[]}
 */
function formatDataForExport(data, fieldMapping) {
  return data.map(item => {
    const exportItem = {};

    if (fieldMapping) {
      Object.entries(fieldMapping).forEach(([key, label]) => {
        exportItem[label] = item[key];
      });
    } else {
      Object.assign(exportItem, item);
    }

    return exportItem;
  });
}

module.exports = {
  exportToCSV,
  exportToJSON,
  downloadFile,
  formatDataForExport,
};

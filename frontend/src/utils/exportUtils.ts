import html2canvas from 'html2canvas';

/**
 * Converts an array of JSON objects into a CSV string and triggers a file download.
 * @param data Array of objects representing rows.
 * @param filename Desired filename for the downloaded CSV.
 */
export const exportToCSV = (data: Array<Record<string, unknown>>, filename: string) => {
  if (!data || data.length === 0) {
    console.warn("No data available to export.");
    return;
  }

  const columns = Object.keys(data[0]);
  const headerLine = columns.join(',');

  const lines = data.map(row => 
    columns.map(col => {
      let val = row[col];
      // Escape strings containing commas, quotes, or newlines
      if (typeof val === 'string') {
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
      } else if (val === null || val === undefined) {
        val = '';
      }
      return val;
    }).join(',')
  );

  const csvContent = [headerLine, ...lines].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Captures an HTML element as a high-resolution PNG using html2canvas and triggers a download.
 * @param elementId ID of the element to capture (e.g. the dashboard grid).
 * @param filename Desired filename for the PNG.
 */
export const exportToPNG = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found.`);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution
      useCORS: true, 
      backgroundColor: null // transparent background if needed, or matched to CSS
    });
    
    const image = canvas.toDataURL("image/png", 1.0);
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = image;
    link.click();
  } catch (error) {
    console.error("Error generating PNG export", error);
  }
};

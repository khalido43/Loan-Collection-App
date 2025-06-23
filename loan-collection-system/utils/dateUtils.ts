
// Helper to convert Excel serial date to JavaScript Date object
export const excelSerialDateToJSDate = (serial: number): string | null => {
    // Excel's epoch is Jan 1, 1900. It also has a bug where 1900 is considered a leap year.
    // JavaScript's epoch is Jan 1, 1970.
    // Days between 1900-01-01 and 1970-01-01 is 25569.
    // This accounts for the 1900 leap year bug (which adds 1 day).
    const excelEpoch = new Date(Date.UTC(1899, 11, 30)); // Dec 30, 1899 accounts for the 1900 leap year bug and 1-based serial
    const utcDays = serial - 1; // Subtract 1 because Excel's day 1 is 1900-01-01, not 1899-12-31
    try {
      const date = new Date(excelEpoch.getTime() + (utcDays * 24 * 60 * 60 * 1000));
      if (isNaN(date.getTime())) return null;
      return date.toISOString().split('T')[0]; // Return in YYYY-MM-DD format
    } catch (e) {
      return null;
    }
};


// Helper function to parse various date formats including Excel serial numbers
export const parseDateDDMonYY = (dateString: string | number | undefined | null): string | null => {
    if (dateString === undefined || dateString === null) return null;

    if (typeof dateString === 'number') {
        if (dateString > 0 && dateString < 60000) { // Plausible Excel serial date range
            const parsedExcelDate = excelSerialDateToJSDate(dateString);
            if (parsedExcelDate && !isNaN(new Date(parsedExcelDate).getTime())) {
                return parsedExcelDate;
            }
        }
    }

    const strValue = String(dateString).trim();
    if (!strValue) return null;

    const monthMap: { [key: string]: number } = {
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5, 'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
    };

    // Try DD-Mon-YY / DD-Mon-YYYY format
    const ddMonYYMatch = strValue.match(/^(\d{1,2})-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{2}|\d{4})$/i);
    if (ddMonYYMatch) {
        const day = parseInt(ddMonYYMatch[1], 10);
        const month = monthMap[ddMonYYMatch[2].toLowerCase()];
        let year = parseInt(ddMonYYMatch[3], 10);

        if (ddMonYYMatch[3].length === 2) {
            year = year < 50 ? 2000 + year : 1900 + year;
        }
        
        try {
          const date = new Date(year, month, day);
          if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
              return date.toISOString().split('T')[0];
          }
        } catch (e) { /* fall through */ }
    }

    // Try YYYY-MM-DD or YYYY/MM/DD (common CSV formats)
    const isoDateMatch = strValue.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
    if (isoDateMatch) {
        const year = parseInt(isoDateMatch[1], 10);
        const month = parseInt(isoDateMatch[2], 10) - 1; // Month is 0-indexed
        const day = parseInt(isoDateMatch[3], 10);
        try {
          const date = new Date(year, month, day);
          if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
              return date.toISOString().split('T')[0];
          }
        } catch(e) { /* fall through */ }
    }
    
    // Try MM/DD/YYYY or MM-DD-YYYY
    const mmDDYYYYMatch = strValue.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (mmDDYYYYMatch) {
        const month = parseInt(mmDDYYYYMatch[1], 10) - 1; // Month is 0-indexed
        const day = parseInt(mmDDYYYYMatch[2], 10);
        const year = parseInt(mmDDYYYYMatch[3], 10);
        try {
            const date = new Date(year, month, day);
            if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
                return date.toISOString().split('T')[0];
            }
        } catch(e) { /* fall through */ }
    }


    // Final attempt with Date.parse, this is less reliable for specific formats but can catch some ISO strings
    try {
      const parsedDate = new Date(strValue);
      if (!isNaN(parsedDate.getTime())) {
          // Check if it's a valid date and not just Unix epoch for invalid strings
          if (parsedDate.getFullYear() > 1900) { // Arbitrary sanity check
             return parsedDate.toISOString().split('T')[0];
          }
      }
    } catch(e) { /* fall through */ }

    return null; 
};

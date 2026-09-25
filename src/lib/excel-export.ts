import * as XLSX from 'xlsx';

export function exportToExcel(
  data: Record<string, any>[],
  fileName: string,
  sheetName: string = 'Rapor'
) {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Auto-fit column widths
    const maxProps: Record<string, number> = {};
    data.forEach(row => {
      Object.keys(row).forEach(key => {
        const valStr = String(row[key] ?? '');
        const currentMax = maxProps[key] || key.length;
        maxProps[key] = Math.max(currentMax, valStr.length);
      });
    });
    
    worksheet['!cols'] = Object.keys(maxProps).map(key => ({
      wch: Math.min(Math.max(maxProps[key] + 3, 10), 40)
    }));

    const dateSuffix = new Date().toISOString().split('T')[0];
    const finalFileName = `${fileName}_${dateSuffix}.xlsx`;

    XLSX.writeFile(workbook, finalFileName);
  } catch (error) {
    console.error('Excel dışa aktarma hatası:', error);
    alert('Excel dosyası oluşturulurken bir hata meydana geldi.');
  }
}

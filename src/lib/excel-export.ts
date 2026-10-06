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

/**
 * Downloads a clean Excel template for Personnel import
 * Columns: Ad Soyad, TC Kimlik, Telefon, Şehir, Birim Fiyat
 */
export function downloadPersonnelTemplate() {
  const sampleData = [
    {
      'Ad Soyad': 'Ahmet Yılmaz',
      'TC Kimlik': '12345678901',
      'Telefon': '05321234567',
      'Şehir': 'İstanbul',
      'Birim Fiyat': 180
    },
    {
      'Ad Soyad': 'Ayşe Kaya',
      'TC Kimlik': '98765432109',
      'Telefon': '05439876543',
      'Şehir': 'Ankara',
      'Birim Fiyat': 180
    },
    {
      'Ad Soyad': 'Mehmet Demir',
      'TC Kimlik': '45678912305',
      'Telefon': '05554567890',
      'Şehir': 'İzmir',
      'Birim Fiyat': 200
    }
  ];

  exportToExcel(sampleData, 'Orion_Personel_Sablonu', 'Personel_Sablon');
}

/**
 * Downloads a clean Excel template for Settlement (Hakediş) import
 * Columns: IL, TC, ANKETÖR, TOPLAM, İPTAL, GEÇERLİ, BİRİM FİYAT, NOT
 */
export function downloadSettlementTemplate() {
  const sampleData = [
    {
      'IL': 'Ankara',
      'TC': '68519741234',
      'ANKETÖR': 'HACER KARA',
      'TOPLAM': 7,
      'İPTAL': 0,
      'GEÇERLİ': 7,
      'BİRİM FİYAT': 320,
      'NOT': 'Tam saha'
    },
    {
      'IL': 'Ankara',
      'TC': '37050021234',
      'ANKETÖR': 'ALİ ACAR',
      'TOPLAM': 5,
      'İPTAL': 0,
      'GEÇERLİ': 5,
      'BİRİM FİYAT': 320,
      'NOT': ''
    },
    {
      'IL': 'İstanbul',
      'TC': '11015961234',
      'ANKETÖR': 'DENİZ DERİN',
      'TOPLAM': 6,
      'İPTAL': 1,
      'GEÇERLİ': 5,
      'BİRİM FİYAT': 320,
      'NOT': '1 anket iptal'
    }
  ];

  exportToExcel(sampleData, 'Orion_Hakedis_Sablonu', 'Hakedis_Sablon');
}

import QRCode from 'qrcode';

/**
 * Generates high-resolution Data URL for an asset QR code
 */
export async function generateAssetQRCode(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 320,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}

/**
 * Renders an SVG barcode representation for asset tags
 */
export function generateBarcodeSVG(code: string): string {
  // Generate pseudo-code 128 stripes pattern based on string hash
  const chars = code.toUpperCase().split('');
  const bars: { width: number; isBlack: boolean }[] = [];
  
  // Guard start
  bars.push({ width: 3, isBlack: true });
  bars.push({ width: 2, isBlack: false });
  bars.push({ width: 3, isBlack: true });
  bars.push({ width: 1, isBlack: false });

  for (let i = 0; i < chars.length; i++) {
    const charCode = chars[i].charCodeAt(0);
    const b1 = (charCode % 3) + 1;
    const s1 = ((charCode >> 1) % 2) + 1;
    const b2 = ((charCode >> 2) % 3) + 1;
    const s2 = ((charCode >> 3) % 2) + 1;

    bars.push({ width: b1 * 2, isBlack: true });
    bars.push({ width: s1 * 2, isBlack: false });
    bars.push({ width: b2 * 2, isBlack: true });
    bars.push({ width: s2 * 2, isBlack: false });
  }

  // Guard stop
  bars.push({ width: 3, isBlack: true });
  bars.push({ width: 2, isBlack: false });
  bars.push({ width: 4, isBlack: true });

  let x = 0;
  const rects = bars.map((b) => {
    const rect = b.isBlack
      ? `<rect x="${x}" y="0" width="${b.width}" height="48" fill="#0f172a" />`
      : '';
    x += b.width;
    return rect;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x} 60" width="100%" height="48">
    ${rects.join('')}
  </svg>`;
}

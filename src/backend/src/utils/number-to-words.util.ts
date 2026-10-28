/**
 * Chuyển đổi số tiền thành chữ bằng tiếng Việt chuẩn
 * Ví dụ: 1250000 -> "Một triệu hai trăm năm mươi nghìn đồng chẵn."
 */

const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

function readThreeDigits(threeDigits: number, showZeroHundred: boolean): string {
  const hundreds = Math.floor(threeDigits / 100);
  const tens = Math.floor((threeDigits % 100) / 10);
  const units = threeDigits % 10;
  let result = '';

  if (hundreds > 0 || showZeroHundred) {
    result += `${DIGITS[hundreds]} trăm `;
  }

  if (tens > 1) {
    result += `${DIGITS[tens]} mươi `;
    if (units === 1) {
      result += 'mốt ';
    } else if (units === 5) {
      result += 'lăm ';
    } else if (units > 0) {
      result += `${DIGITS[units]} `;
    }
  } else if (tens === 1) {
    result += 'mười ';
    if (units === 5) {
      result += 'lăm ';
    } else if (units > 0) {
      result += `${DIGITS[units]} `;
    }
  } else if (tens === 0 && (hundreds > 0 || showZeroHundred)) {
    if (units > 0) {
      result += `lẻ ${DIGITS[units]} `;
    }
  } else if (units > 0) {
    result += `${DIGITS[units]} `;
  }

  return result.trim();
}

export function numberToWordsVietnamese(amount: number): string {
  if (amount === 0) return 'Không đồng chẵn.';

  const scales = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  let numStr = Math.round(Math.abs(amount)).toString();
  const groups: number[] = [];

  while (numStr.length > 0) {
    const chunk = numStr.slice(-3);
    groups.push(parseInt(chunk, 10));
    numStr = numStr.slice(0, -3);
  }

  let words = '';
  for (let i = groups.length - 1; i >= 0; i--) {
    const groupVal = groups[i];
    if (groupVal > 0) {
      const showZeroHundred = i < groups.length - 1;
      const groupText = readThreeDigits(groupVal, showZeroHundred);
      words += `${groupText} ${scales[i]} `;
    }
  }

  words = words.trim().replace(/\s+/g, ' ');
  if (!words) return 'Không đồng chẵn.';

  // Viết hoa chữ cái đầu và thêm đuôi "đồng chẵn."
  const capitalized = words.charAt(0).toUpperCase() + words.slice(1);
  return `${capitalized} đồng chẵn.`;
}

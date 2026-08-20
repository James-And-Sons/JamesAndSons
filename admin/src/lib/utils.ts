import { formatPriceFull, formatDate as sharedFormatDate } from '@james-andsons/utils';

export function formatPrice(amount: number) {
  return formatPriceFull(amount);
}

export function formatDate(date: Date | string) {
  return sharedFormatDate(date);
}

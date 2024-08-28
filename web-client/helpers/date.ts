export const formatDates = (obj: object[]): object[] => {
  obj.forEach(item => {
    item.created_at = formatDate(item.created_at);
    item.updated_at = formatDate(item.updated_at);
  });
  return obj;
};

export const formatDate = (dateString: string): string => {
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  const date = new Date(dateString);
  // @ts-ignore
  return date.toLocaleString('ru-RU', options);
};

export function formatDateTime(dateString: any) {
  const date = new Date(dateString);
  return date.toLocaleString();
}
export function formatDate(timestamp: number): string {
  const dateObject = new Date(timestamp);

  // Define months array for mapping numeric month to string
  const months: string[] = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  // Get individual date components
  const month: string = months[dateObject.getMonth()];
  const day: number = dateObject.getDate();
  const year: number = dateObject.getFullYear();
  const hours: number = dateObject.getHours();
  const minutes: number = dateObject.getMinutes();
  const period: string = hours >= 12 ? 'PM' : 'AM';
  const offset: number = dateObject.getTimezoneOffset() / 60;
  const offsetSign: string = offset > 0 ? '-' : '+';
  const offsetHours: number = Math.abs(offset);
  const offsetMinutes: number = Math.abs(dateObject.getTimezoneOffset() % 60);

  // Format the date string
  const formattedDate: string = `${month} ${day}, ${year}, ${hours % 12}:${
    (minutes < 10 ? '0' : '') + minutes
  } ${period} GMT${offsetSign}${offsetHours}${
    (offsetMinutes < 10 ? '0' : '') + offsetMinutes
  }`;

  return formattedDate;
}

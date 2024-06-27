export function parseRelativeDate(relativeDateString: string) {
  const regex = /(\d+|a|an)\s+(day|days|hour|hours|minute|minutes)\s+ago/;
  const match = relativeDateString.match(regex);

  if (!match) {
    throw new Error('Invalid date format');
  }

  let value = match[1] === 'a' || match[1] === 'an' ? 1 : parseInt(match[1], 10);
  const unit = match[2];

  const today = new Date();
  const targetDate = new Date(today);

  if (unit.startsWith('day')) {
    targetDate.setDate(today.getDate() - value);
  } else if (unit.startsWith('hour')) {
    targetDate.setHours(today.getHours() - value);
  } else if (unit.startsWith('minute')) {
    targetDate.setMinutes(today.getMinutes() - value);
  }

  return targetDate;
}

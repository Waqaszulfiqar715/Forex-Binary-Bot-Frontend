export function isCurrentTradingWeek(dateInput) {
  const date = new Date(dateInput);
  const now = new Date();
  
  // Calculate the Monday of the current week for 'now'
  const day = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const currentMonday = new Date(now);
  currentMonday.setDate(now.getDate() + diffToMonday);
  currentMonday.setHours(0, 0, 0, 0);

  // The trading week ends on Friday 23:59:59
  const currentFriday = new Date(currentMonday);
  currentFriday.setDate(currentMonday.getDate() + 4);
  currentFriday.setHours(23, 59, 59, 999);

  // If we are currently in the weekend (Saturday or Sunday),
  // the "current trading week" is effectively over. 
  if (now > currentFriday) {
    return false; // Weekend! Signal History should be empty.
  }

  // If we are between Mon-Fri, check if the signal date falls in this Mon-Fri window
  if (date >= currentMonday && date <= currentFriday) {
    return true;
  }
  
  return false;
}

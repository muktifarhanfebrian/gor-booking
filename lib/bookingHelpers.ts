export function isWeekend(dateString: string): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  return day === 0 || day === 6;
}

export interface BookingTimeSlot {
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  label: string; // "14:00 - 16:00"
}

export function getTimeSlotsForDate(dateString: string): BookingTimeSlot[] {
  const weekend = isWeekend(dateString);
  
  if (weekend) {
    // Weekend slots: 08.00 - 23.00 (showing 2-hour blocks)
    return [
      { startTime: "08:00", endTime: "10:00", label: "08:00 - 10:00 WIB" },
      { startTime: "10:00", endTime: "12:00", label: "10:00 - 12:00 WIB" },
      { startTime: "12:00", endTime: "14:00", label: "12:00 - 14:00 WIB" },
      { startTime: "14:00", endTime: "16:00", label: "14:00 - 16:00 WIB" },
      { startTime: "16:00", endTime: "18:00", label: "16:00 - 18:00 WIB" },
      { startTime: "18:00", endTime: "20:00", label: "18:00 - 20:00 WIB" },
      { startTime: "20:00", endTime: "22:00", label: "20:00 - 22:00 WIB" },
      // Last hour overlap or single hour to fit work hours 23:00
      { startTime: "21:00", endTime: "23:00", label: "21:00 - 23:00 WIB" },
    ];
  } else {
    // Weekday slots: 12.00 - 23.00 (showing 2-hour blocks)
    return [
      { startTime: "12:00", endTime: "14:00", label: "12:00 - 14:00 WIB" },
      { startTime: "14:00", endTime: "16:00", label: "14:00 - 16:00 WIB" },
      { startTime: "16:00", endTime: "18:00", label: "16:00 - 18:00 WIB" },
      { startTime: "18:00", endTime: "20:00", label: "18:00 - 20:00 WIB" },
      { startTime: "20:00", endTime: "22:00", label: "20:00 - 22:00 WIB" },
      // Last hour overlap to fit work hours 23:00
      { startTime: "21:00", endTime: "23:00", label: "21:00 - 23:00 WIB" },
    ];
  }
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

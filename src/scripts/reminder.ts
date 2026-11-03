// Real reminders without a backend: hands the browser a calendar file (.ics) that
// Google Calendar, Apple Calendar and Outlook all open, with an alert at the set time.
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const escape = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

export function downloadReminder({ title, details, at, file }: { title: string; details: string; at: Date; file: string }) {
  const end = new Date(at.getTime() + 15 * 60 * 1000);
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Inhandy//Reminders//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}-${Math.random().toString(36).slice(2)}@inhandy`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(at)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escape(title)}`,
    `DESCRIPTION:${escape(details)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escape(title)}`,
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = file;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** A day `days` from today at the given local hour, e.g. tomorrow 7 PM */
export function daysFromNow(days: number, hour: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

export function humanize(str): string {
  return str
    .replace(/^[\s_]+|[\s_]+$/g, '')
    .replace(/[-_\s]+/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .replace(/^[a-z]/, function (m) {
      return m.toUpperCase()
    })
}

export const saleStatuses = [
  // { label: 'In-progress', value: 'in-progress' },
  { label: 'Complete', value: 'complete' },
  { label: 'Void', value: 'void' }
]

export function addDays(date: Date, days: number): string {
  if (!date) {
    return ''
  }
  const newDate = new Date(date)

  newDate.setDate(date.getDate() + days)
  return newDate.toISOString()
}

export function csvDownload<T>({
  header,
  data,
  title
}: {
  header: Array<string>
  data: T
  title: string
}): void {
  const content = Array.isArray(data)
    ? data?.map((d) => Object.values(d).join(', ')).join('\n')
    : ''
  const csvString = `${header}\n` + content
  const uri = encodeURI('data:text/csv;charset=utf-8,' + csvString)

  const link = document.createElement('a')
  link.setAttribute('href', uri)
  link.setAttribute('download', `${title}.csv`)
  document.body.appendChild(link)

  link.click()
  document.body.removeChild(link)
}

export const numericFormatLimit =
  (maxValue: number) =>
    (value): boolean => {
      const { floatValue } = value
      if (floatValue === undefined || floatValue <= maxValue) {
        return true
      }
      return false
    }

export function getCurrentQuarterDates(): { start: Date, end: Date, months: string[] } {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const months: string[] = []

  const quarterStartMonth = Math.floor(currentMonth / 3) * 3;

  const startDate = new Date(currentYear, quarterStartMonth, 1);

  for (let i = 1; i <= 3; i++) {
    months.push(new Date(currentYear, quarterStartMonth + i, 0).toLocaleString('default', { month: 'long' }))
  }

  const endDate = new Date(currentYear, quarterStartMonth + 3, 0);

  return {
    start: startDate,
    end: endDate,
    months,
  };
}


export function downloadblePDF({ res, invoiceNumber }: { res: ArrayBuffer, invoiceNumber: string }) {

  const pdf = new Blob([res], { type: "application/pdf" });

  console.log(pdf);

  const url = URL.createObjectURL(pdf);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${invoiceNumber}`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

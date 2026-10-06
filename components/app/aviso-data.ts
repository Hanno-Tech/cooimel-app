import { formatDataHora } from "@/lib/format";

/** "28/09/2026 - 08h" — data do evento (ou publicação) como no mockup. */
export function dataAviso(dataEvento: Date | null, publicadoEm: Date | null) {
  const d = dataEvento ?? publicadoEm;
  if (!d) return "";
  const [data, hora] = formatDataHora(d).split(" - ");
  if (!dataEvento || hora === "00:00") return data;
  const [h, m] = hora.split(":");
  return `${data} - ${h}h${m === "00" ? "" : m}`;
}

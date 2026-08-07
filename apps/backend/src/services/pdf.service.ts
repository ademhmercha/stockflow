import puppeteer from "puppeteer";
import { FactureDoc } from "../models/Facture";
import { EntrepriseDoc } from "../models/Entreprise";
import { ClientDoc } from "../models/Client";

function formatMontant(valeur: number): string {
  return `${valeur.toFixed(3)} DT`;
}

function buildFactureHtml(
  facture: FactureDoc,
  entreprise: EntrepriseDoc,
  client: ClientDoc
): string {
  const lignesHtml = facture.lignes
    .map((ligne) => {
      const totalHT = ligne.quantite * ligne.prixUnitaire;
      return `
        <tr>
          <td>${ligne.nomProduit}</td>
          <td class="num">${ligne.quantite}</td>
          <td class="num">${formatMontant(ligne.prixUnitaire)}</td>
          <td class="num">${ligne.tauxTVA}%</td>
          <td class="num">${formatMontant(totalHT)}</td>
        </tr>`;
    })
    .join("");

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Facture ${facture.numero}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Helvetica, Arial, sans-serif; color: #1a1a1a; padding: 40px; font-size: 13px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
  .entreprise h1 { margin: 0 0 4px; font-size: 20px; }
  .entreprise p { margin: 0; color: #555; }
  .facture-meta { text-align: right; }
  .facture-meta h2 { margin: 0 0 4px; font-size: 18px; }
  .client-box { margin-bottom: 24px; padding: 12px 16px; background: #f5f5f5; border-radius: 6px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th, td { padding: 8px 10px; border-bottom: 1px solid #e0e0e0; text-align: left; }
  th { background: #fafafa; font-size: 12px; text-transform: uppercase; color: #666; }
  .num { text-align: right; }
  .totaux { width: 280px; margin-left: auto; }
  .totaux div { display: flex; justify-content: space-between; padding: 4px 0; }
  .totaux .ttc { font-weight: bold; font-size: 15px; border-top: 2px solid #1a1a1a; margin-top: 6px; padding-top: 8px; }
  .footer { margin-top: 48px; font-size: 11px; color: #888; text-align: center; }
</style>
</head>
<body>
  <div class="header">
    <div class="entreprise">
      <h1>${entreprise.nom}</h1>
      <p>MF: ${entreprise.matriculeFiscal}</p>
      <p>${entreprise.adresse ?? ""}</p>
    </div>
    <div class="facture-meta">
      <h2>Facture ${facture.numero}</h2>
      <p>Date : ${new Date(facture.dateEmission).toLocaleDateString("fr-TN")}</p>
      <p>Statut : ${facture.statut}</p>
    </div>
  </div>

  <div class="client-box">
    <strong>Client :</strong> ${client.nom}<br/>
    ${client.matriculeFiscal ? `MF: ${client.matriculeFiscal}<br/>` : ""}
    ${client.adresse ?? ""}
  </div>

  <table>
    <thead>
      <tr>
        <th>Désignation</th>
        <th class="num">Qté</th>
        <th class="num">P.U. HT</th>
        <th class="num">TVA</th>
        <th class="num">Total HT</th>
      </tr>
    </thead>
    <tbody>
      ${lignesHtml}
    </tbody>
  </table>

  <div class="totaux">
    <div><span>Total HT</span><span>${formatMontant(facture.montantHT)}</span></div>
    <div><span>Total TVA</span><span>${formatMontant(facture.montantTVA)}</span></div>
    <div><span>Timbre fiscal</span><span>${formatMontant(facture.timbreFiscal)}</span></div>
    <div class="ttc"><span>Total TTC</span><span>${formatMontant(facture.montantTTC)}</span></div>
  </div>

  <div class="footer">Document généré par StockFlow — ${entreprise.nom}</div>
</body>
</html>`;
}

let browserPromise: ReturnType<typeof puppeteer.launch> | null = null;

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browserPromise;
}

export async function genererFacturePdf(
  facture: FactureDoc,
  entreprise: EntrepriseDoc,
  client: ClientDoc
): Promise<Buffer> {
  const html = buildFactureHtml(facture, entreprise, client);
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

export async function closePdfBrowser(): Promise<void> {
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
    browserPromise = null;
  }
}

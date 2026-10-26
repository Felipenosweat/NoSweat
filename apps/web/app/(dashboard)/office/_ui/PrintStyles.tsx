// Folha de impressão do painel: na hora de imprimir / salvar em PDF, só o documento (o elemento
// com a classe `office-print`) aparece; menu, barras e vidro somem. Quem contém o documento perde
// fundo, margens e efeitos para o papel começar no topo da página. Sem "use client".

const PRINT_CSS = `
@media print {
  @page { margin: 0.5in; }
  html, body { background: #fff !important; }
  body *:not(:has(.office-print)):not(.office-print):not(.office-print *) { display: none !important; }
  body *:has(.office-print) {
    display: block !important;
    position: static !important;
    margin: 0 !important;
    padding: 0 !important;
    border: 0 !important;
    width: auto !important;
    max-width: none !important;
    min-height: 0 !important;
    background: none !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    transform: none !important;
    overflow: visible !important;
  }
  body *:has(.office-print)::before, body *:has(.office-print)::after { display: none !important; }
  .office-print { display: block !important; }
}
`;

export function PrintStyles() {
  return <style>{PRINT_CSS}</style>;
}

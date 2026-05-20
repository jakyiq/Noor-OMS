const fs = require('fs');

let lenses = fs.readFileSync('src/components/NewVisitModal.tsx', 'utf8');

lenses = lenses.replace(/const defaultData = {/g, `const isContact = (t: string) => (t || "").toLowerCase().includes("contact");
  const isPlano = (t: string) => (t || "").toLowerCase().includes("plano");

  const defaultData = {`);

lenses = lenses.replace(/data\.lensType === "Plano"/g, 'isPlano(data.lensType)');
lenses = lenses.replace(/data\.lensType === "Contact Lenses"/g, 'isContact(data.lensType)');

fs.writeFileSync('src/components/NewVisitModal.tsx', lenses);

let lenses2 = fs.readFileSync('src/components/Prescriptions.tsx', 'utf8');
// any plano or contact lenses in Prescriptions? not really, it's just a raw uncontrolled text field!

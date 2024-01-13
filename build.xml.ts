import { JSDOM } from 'jsdom';

export function translateXml(input: string) {
  return input;
  
  const xmlDom = new JSDOM(input, { contentType: "text/xml" });
  const xml = xmlDom.window.document;

  const macros = xml.querySelectorAll('mapper macros > *')
  const classes = xml.querySelectorAll('mapper classes > *')

  console.info(`Found ${macros.length} macros.`)
  console.info(`Found ${classes.length} classes.`)

  // Replace all macros.
  xml.querySelectorAll('mapper properties macro').forEach(destinationNode => {
    console.info(`Found a macro. ${destinationNode.outerHTML}`)

    const sourceNode = macros[0]
    destinationNode.outerHTML = sourceNode.innerHTML
  })

  // Replace all classes.
  xml.querySelectorAll('mapper properties class').forEach(destinationNode => {
    console.info(`Found a class. ${destinationNode.outerHTML}`)

    const sourceNode = classes[0]
    destinationNode.innerHTML = sourceNode.innerHTML
  })

  return new xmlDom.window.XMLSerializer().serializeToString(xml);
}
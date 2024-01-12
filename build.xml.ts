export function translateXml(input: string) {
    let xml = input

    input.replace(/<macro type="([^"]*)"\/>/g, (match, type) => {
      // Find the XML node under <macros> that matches the variable match's first capture.
      // Take the contents of that node and replace the match with it.
    });

    return xml
}
import { PDFDocument, StandardFonts } from 'pdf-lib'

import { Ownership } from 'archive-client-ts/archive.cda'
import { fetchOrSetTempCDA, fetchOrSetUser } from "./cookies"


const TITLE_SIZE = 24
const SUBTITLE_SIZE = 16
const BODY_SIZE = 12

/**
 * Generates the template PDF document used for assignment of rights contracts.
 * @param ownersLength the number of owners to generate for on the contract
 * @returns base64 encoded pdf document
 */
async function generatePDF(ownersLength: number) {
  const doc = await PDFDocument.create()
  const timesRoman = await doc.embedFont(StandardFonts.TimesRoman)

  const page1 = doc.addPage()
  const { height, width } = page1.getSize()
  page1.setFont(timesRoman)
  console.log("page1 height", page1.getHeight())

  let leftMargin = 25
  let currHeight = height - 25

  // Generate the title
  page1.drawText("CDA Type-1", {
    x: leftMargin,
    y: currHeight - 2 * TITLE_SIZE,
    size: TITLE_SIZE,
    lineHeight: TITLE_SIZE,
  })
  currHeight = currHeight - 2 * TITLE_SIZE

  page1.drawText("ADDENDUM I - ASSIGNMENT AGREEMENT", {
    x: leftMargin,
    y: currHeight - 2 * SUBTITLE_SIZE,
    size: SUBTITLE_SIZE,
    lineHeight: SUBTITLE_SIZE,
  })
  currHeight = currHeight - 2 * SUBTITLE_SIZE

  page1.drawText("Between", {
    x: leftMargin,
    y: currHeight - 2 * BODY_SIZE,
    size: BODY_SIZE,
    lineHeight: BODY_SIZE,
  })
  currHeight -= 2 * BODY_SIZE

  /**
  * 
  * ARTIST IDENTIFICATION SECTION
  * 
  */

  const form = doc.getForm()
  let indentMargin = leftMargin + 50
  for (let i = 0; i < ownersLength; i++) {
    page1.drawText(`ARTIST ${i+1}`, {
      x: indentMargin,
      y: currHeight - 2 * BODY_SIZE,
      size: BODY_SIZE,
      lineHeight: BODY_SIZE,
    })
    currHeight -= 2 * BODY_SIZE

    page1.drawText("Wallet address:", {
      x: indentMargin,
      y: currHeight - 2 * BODY_SIZE,
      size: BODY_SIZE,
      lineHeight: BODY_SIZE,
    })
    const artistWalletField = form.createTextField(`artist${i}.wallet`)
    artistWalletField.addToPage(page1, {
      x: indentMargin + 90,
      y: currHeight - 2 * BODY_SIZE - 5,
      height: BODY_SIZE + 10,
      width: 200,
    })
    currHeight -= 2 * BODY_SIZE + 5

    const artistNameField = form.createTextField(`artist${i}.name`)
    artistNameField.addToPage(page1, {
      x: indentMargin,
      y: currHeight - 2 * BODY_SIZE - 5,
      height: BODY_SIZE + 10,
      width: 200,
    })
    currHeight -= 2 * BODY_SIZE + 5

    // const artistAddressField = form.createTextField(`artist${i}.address`)
    // artistAddressField.addToPage(page1, {
    //   x: indentMargin,
    //   y: currHeight - 2 * BODY_SIZE - 5,
    //   height: BODY_SIZE + 10,
    //   width: 200,
    // })
    // currHeight -= 2 * BODY_SIZE + 5


    if (i < ownersLength) {
      page1.drawText("and", {
        x: leftMargin,
        y: currHeight - 2 * BODY_SIZE,
        size: BODY_SIZE,
        lineHeight: BODY_SIZE,
      })
      currHeight -= 2 * BODY_SIZE
    }
  }

  /**
  * 
  * CDA IDENTIFICATION SECTION
  * 
  */
  page1.drawText("COPYRIGHT DIGITAL ASSET (CDA)", {
    x: indentMargin,
    y: currHeight - 2 * BODY_SIZE,
    size: BODY_SIZE,
    lineHeight: BODY_SIZE,
  })
  currHeight -= 2 * BODY_SIZE

  page1.drawText("ID (filled after creation):", {
    x: indentMargin,
    y: currHeight - 2 * BODY_SIZE,
    size: BODY_SIZE,
    lineHeight: BODY_SIZE,
  })
  const cdaIdField = form.createTextField('cda.id')
  cdaIdField.addToPage(page1, {
    x: indentMargin + 135,
    y: currHeight - 2 * BODY_SIZE - 5,
    height: BODY_SIZE + 10,
    width: 200,
  })
  currHeight -= 2 * BODY_SIZE + 5

  /**
  * 
  * INTELLECTUAL PROPERTY SECTION
  * 
  */

  // IPFS CID

  page1.drawText("Intellectual Property IPFS CID", {
    x: leftMargin,
    y: currHeight - 2 * BODY_SIZE,
    size: BODY_SIZE,
    lineHeight: BODY_SIZE,
  })
  currHeight -= 2 * BODY_SIZE

  const propertyCidField = form.createTextField('property.cid')
  propertyCidField.addToPage(page1, {
    x: indentMargin,
    y: currHeight - 2 * BODY_SIZE - 5,
    height: BODY_SIZE + 10,
    width: 200,
  })
  currHeight -= 2 * BODY_SIZE + 5

  // CDA Ownership %

  page1.drawText("CDA Ownership Percentage", {
    x: leftMargin,
    y: currHeight - 2 * BODY_SIZE,
    size: BODY_SIZE, 
    lineHeight: BODY_SIZE,
  })
  currHeight -= 2 * BODY_SIZE

  const cdaOwnershipField = form.createTextField('cda.ownership')
  cdaOwnershipField.addToPage(page1, {
    x: indentMargin,
    y: currHeight - 2 * BODY_SIZE - 5,
    height: BODY_SIZE + 10,
    width: 40,
  })
  currHeight -= 2 * BODY_SIZE

  /**
  * 
  * Signature section
  * 
  */

  const sigPage = doc.addPage()
  sigPage.setFont(timesRoman)
  currHeight = sigPage.getHeight() - 25 // margin

  sigPage.drawText("SIGNATURES", {
    x: leftMargin,
    y: currHeight - 2 * SUBTITLE_SIZE,
    size: SUBTITLE_SIZE,
    lineHeight: SUBTITLE_SIZE,
  })
  currHeight = currHeight - 2 * SUBTITLE_SIZE

  for (let i = 0; i < ownersLength; i++) {
    // Artist Identification
    sigPage.drawText(`ARTIST ${i+1}`, {
      x: leftMargin,
      y: currHeight - 2 * BODY_SIZE,
      size: BODY_SIZE,
      lineHeight: BODY_SIZE,
    })
    currHeight -= 2 * BODY_SIZE

    sigPage.drawText(`Name:`, {
      x: indentMargin,
      y: currHeight - 2 * BODY_SIZE,
      size: BODY_SIZE,
      lineHeight: BODY_SIZE,
    })
    currHeight -= 2 * BODY_SIZE

    const artistNameField = form.createTextField(`signature.artist${i}.name`)
    artistNameField.addToPage(sigPage, {
      x: indentMargin,
      y: currHeight - 2 * BODY_SIZE - 5,
      height: BODY_SIZE + 10,
      width: 200,
    })
    currHeight -= 2 * BODY_SIZE

    sigPage.drawText(`Transaction Hash:`, {
      x: indentMargin,
      y: currHeight - 2 * BODY_SIZE,
      size: BODY_SIZE,
      lineHeight: BODY_SIZE,
    })
    currHeight -= 2 * BODY_SIZE

    const artistHashField = form.createTextField(`signature.artist${i}.hash`)
    artistHashField.addToPage(sigPage, {
      x: indentMargin,
      y: currHeight - 2 * BODY_SIZE - 5,
      height: BODY_SIZE + 10,
      width: 200,
    })
    currHeight -= 2 * BODY_SIZE
  }

  // Return as base64 encoded pdf doc
  return await doc.saveAsBase64()
}

/**
 * Popoulates the template legal contract with relevant metadata from `user` and `cda` cookies.
 * @returns the updated PDF document as a base64 encoded string
 */
const fillContract = async () => {
  const cda = fetchOrSetTempCDA()
  const user = fetchOrSetUser()

  // Validate fields are correctly set
  if (!validateWalletAddress(cda.creatorWalletAddress)) { console.log(1); return }
  if (!validateOwners(cda.owners)) { console.log(2); return }
  if (!validateCid(cda.propertyCid)) { console.log(3); return }

  // Set necessary fields
  cda.status = 'pending'
  
  // Generate the PDF doc
  const pdfStr = await generatePDF(cda.owners.length)
  const pdfDoc = await PDFDocument.load(pdfStr)
  const form = pdfDoc.getForm()

  // Fill the fields for each owner
  for (let i = 0; i < cda.owners.length; i++) {
    const artistWalletField = form.getTextField(`artist${i}.wallet`)
    const artistNameField = form.getTextField(`artist${i}.name`)
    
    // Set the text for each field
    artistWalletField.setText(cda.owners[i].owner)
    artistNameField.setText("TODO") // artistNameField.setText(cda.owners[i].legal_name)
    if (cda.owners[i].owner === user.wallet_address) {
      artistNameField.setText(user.legal_name)
    }
  }
  
  // Fill remaining contract fields
  const propertyCidField = form.getTextField('property.cid')
  const cdaOwnershipField = form.getTextField('cda.ownership')
  propertyCidField.setText(cda.propertyCid)
  cdaOwnershipField.setText("100%")

  return pdfDoc.saveAsBase64()
}

/**
 * Popoulates the legal contract with the CDA's ID
 * @returns the updated PDF document as a base64 encoded string
 */
const fillContractCdaId = async (cdaId: string, pdf: string) => {
  const pdfDoc = await PDFDocument.load(pdf)
  pdfDoc
    .getForm()
    .getTextField('cda.id')
    .setText(cdaId)
  
  return pdfDoc.saveAsBase64()
}

const validateWalletAddress = (address: string | undefined) => {
  // Ensure address exists
  if (!address) { return false }
  // Ensure address starts with "archive"
  if (!address.startsWith("archive")) { return false}
  // Ensure address is of valid length
  if (address.length > 50 || address.length < 40) { return false }

  return true
}

const validateOwners = (owners: Ownership[] | undefined) => {
  // Ensure owners exists
  if (!owners) { return false }

  let ownerWalletSet = new Set<string>()
  let totalPerc = 0

  for (const owner of owners) {
    ownerWalletSet.add(owner.owner)
    totalPerc += owner.ownership
  }

  // Ensure the total ownership % is 100
  if (totalPerc != 100) { return false }
  // Ensure we do not have repeated wallet addresses
  if (ownerWalletSet.size != owners.length) { return false }

  return true
}

const validateCid = (cid: string | undefined) => {
  // Ensure cid exists
  if (!cid) { return false }
  
  return true
}

export { fillContract, fillContractCdaId }
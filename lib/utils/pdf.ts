import { PDFDocument } from 'pdf-lib'

import { Ownership } from 'archive-client-ts/archive.cda'
import { fetchOrSetTempCDA, fetchOrSetUser } from "./cookies"

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
  
  // Load template PDF from local storage
  const res = await fetch('/contract-template.pdf')
  const pdfBytes = await res.arrayBuffer()
  
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const form = pdfDoc.getForm()

  // Grab each text field
  const artistWalletField = form.getTextField('artist.wallet')
  const artistNameField = form.getTextField('artist.name')
  const artistAddressField = form.getTextField('artist.address')
  const propertyCidField = form.getTextField('property.cid')
  const cdaOwnershipField = form.getTextField('cda.ownership')

  // Set the text for each field
  artistWalletField.setText(user.wallet_address)
  artistNameField.setText(user.legal_name)
  artistAddressField.setText(user.street_address)
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
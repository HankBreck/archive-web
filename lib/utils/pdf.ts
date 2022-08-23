import { Ownership } from "../../models/helpers"
import { fetchOrSetTempCDA, fetchOrSetUser } from "./cookies"

import { PDFDocument } from 'pdf-lib'

const fillContract = async () => {
  const cda = fetchOrSetTempCDA()
  const user = fetchOrSetUser()

  // TODO: Validate user fields are correctly set

  // Validate fields are correctly set
  if (user.walletAddress !== cda.creatorWalletAddress) { return }
  if (!validateCdaOwnership(cda.copyrightOwnership)) { return }
  if (!validateWalletAddress(cda.creatorWalletAddress)) { return }
  if (!validateOwners(cda.owners)) { return }
  if (!validateCid(cda.propertyCid)) { return }

  // Set necessary fields
  cda.status = 'pending'
  cda.createdAt = new Date().toISOString()
  
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
  artistWalletField.setText(cda.creatorWalletAddress)
  artistNameField.setText(user.legalName)
  artistAddressField.setText(user.address)
  propertyCidField.setText(cda.propertyCid)
  cdaOwnershipField.setText(cda.copyrightOwnership!.toString()) // can force unwrap because of the validateCdaOwnership call before

  return pdfDoc.save()
}

const validateCdaOwnership = (ownership: number | undefined) => {
  // Ensure ownership exists
  if (!ownership) { return false}
  // Ensure ownership is a valid amount
  if (ownership > 100 || ownership <= 0) { return false }

  // TODO: Ensure ownership is a reasonable decimal

  return true
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
    ownerWalletSet.add(owner.walletAddress)
    totalPerc += owner.ownershipPerc
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

export { fillContract }
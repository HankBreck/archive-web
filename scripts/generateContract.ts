#!/usr/bin/env ts-node

const { PDFDocument, StandardFonts } = require('pdf-lib')
const fs = require('fs')

// import { PDFDocument, StandardFonts } from 'pdf-lib'
// import * as fs from 'fs'

const TITLE_SIZE = 24
const SUBTITLE_SIZE = 16
const BODY_SIZE = 12

/**
 * TO EMBED:
 *    Artist info:
 *      Name, address, wallet address
 *    Each other party's info:
 *      wallet address, ownership %
 */

async function generatePDF() {
  const doc = await PDFDocument.create()
  const timesRoman = await doc.embedFont(StandardFonts.TimesRoman)

  const page1 = doc.addPage()
  const { height, width } = page1.getSize()
  page1.setFont(timesRoman)

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

  let indentMargin = leftMargin + 50
  page1.drawText("ARTIST", {
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
  const form = doc.getForm()
  const artistWalletField = form.createTextField('artist.wallet')
  artistWalletField.addToPage(page1, {
    x: indentMargin + 90,
    y: currHeight - 2 * BODY_SIZE - 5,
    height: BODY_SIZE + 10,
    width: 200,
  })
  currHeight -= 2 * BODY_SIZE + 5

  const artistNameField = form.createTextField('artist.name')
  artistNameField.addToPage(page1, {
    x: indentMargin,
    y: currHeight - 2 * BODY_SIZE - 5,
    height: BODY_SIZE + 10,
    width: 200,
  })
  currHeight -= 2 * BODY_SIZE + 5

  const artistAddressField = form.createTextField('artist.address')
  artistAddressField.addToPage(page1, {
    x: indentMargin,
    y: currHeight - 2 * BODY_SIZE - 5,
    height: BODY_SIZE + 10,
    width: 200,
  })
  currHeight -= 2 * BODY_SIZE + 5


  page1.drawText("and", {
    x: leftMargin,
    y: currHeight - 2 * BODY_SIZE,
    size: BODY_SIZE,
    lineHeight: BODY_SIZE,
  })
  currHeight -= 2 * BODY_SIZE

  /**
   * 
   * OTHER IDENTIFICATION SECTION
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

  // TODO: Add ability to assign rights to multiple parties

  // Save the file to local FS

  const pdfBytes = await doc.save()
  const bufOut = Buffer.from(pdfBytes)
  const outDir = './public/'
  if (!fs.existsSync(outDir)) { fs.mkdirSync(outDir) }

  const ws = fs.writeFile(outDir + "contract-template.pdf", bufOut, 'binary', (err: any) => {
    if (err) { 
      console.error(err)
    } else {
      console.log("Saved file to", outDir + "contract-template.pdf")
    }
  })
}

generatePDF()